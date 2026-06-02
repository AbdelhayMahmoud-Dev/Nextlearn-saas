import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { Affiliate } from '../models/Affiliate.model';
import { AffiliateReferral } from '../models/AffiliateReferral.model';
import { AffiliateCommission } from '../models/AffiliateCommission.model';
import { AffiliatePayout } from '../models/AffiliatePayout.model';
import { Payment } from '../models/Payment.model';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, getPagination } from '../utils/pagination';
import { logger } from '../utils/logger';

/** Minimum balance (cents) before an affiliate may request a payout. */
const MIN_PAYOUT_CENTS = 5000;

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/** Generates an unused uppercase referral code. */
async function generateCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomBytes(6).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    if (code.length >= 6) {
      const exists = await Affiliate.exists({ code });
      if (!exists) return code;
    }
  }
  // Extremely unlikely fallback: timestamp-based code.
  return `AF${Date.now().toString(36).toUpperCase()}`;
}

export const AffiliateService = {
  /** Returns the user's affiliate account, creating it on first request. */
  async getOrCreate(tenantId: string, userId: string) {
    const existing = await Affiliate.findOne({ tenantId, userId });
    if (existing) return existing;
    return Affiliate.create({
      tenantId: oid(tenantId),
      userId: oid(userId),
      code: await generateCode(),
    });
  },

  /** The affiliate's dashboard: account, balances, funnel, recent commissions. */
  async dashboard(tenantId: string, userId: string) {
    const account = await this.getOrCreate(tenantId, userId);
    const recentCommissions = await AffiliateCommission.find({ affiliateId: account._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const conversionRate =
      account.totalClicks > 0
        ? Math.round((account.totalConversions / account.totalClicks) * 1000) / 10
        : 0;

    return {
      account: {
        id: account._id.toString(),
        code: account.code,
        status: account.status,
        commissionRate: account.commissionRate,
        payoutEmail: account.payoutEmail ?? null,
        pendingCents: account.pendingCents,
        paidCents: account.paidCents,
        totalClicks: account.totalClicks,
        totalConversions: account.totalConversions,
        conversionRate,
      },
      minPayoutCents: MIN_PAYOUT_CENTS,
      recentCommissions: recentCommissions.map((c) => ({
        id: c._id.toString(),
        amountCents: c.amountCents,
        orderAmountCents: c.orderAmountCents,
        rate: c.rate,
        status: c.status,
        createdAt: c.createdAt,
      })),
    };
  },

  /** Updates the affiliate's payout email. */
  async updatePayoutEmail(tenantId: string, userId: string, email: string) {
    const account = await Affiliate.findOneAndUpdate(
      { tenantId, userId },
      { $set: { payoutEmail: email } },
      { new: true, upsert: false },
    );
    if (!account) throw ApiError.notFound('Affiliate account not found');
    return { payoutEmail: account.payoutEmail ?? null };
  },

  async listMyCommissions(
    tenantId: string,
    userId: string,
    query: { page?: unknown; limit?: unknown },
  ) {
    const account = await this.getOrCreate(tenantId, userId);
    const { page, limit, skip } = getPagination(query, 20);
    const filter = { affiliateId: account._id };
    const [docs, total] = await Promise.all([
      AffiliateCommission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AffiliateCommission.countDocuments(filter),
    ]);
    const items = docs.map((c) => ({
      id: c._id.toString(),
      amountCents: c.amountCents,
      orderAmountCents: c.orderAmountCents,
      rate: c.rate,
      status: c.status,
      courseId: c.courseId?.toString() ?? null,
      createdAt: c.createdAt,
    }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  async listMyPayouts(
    tenantId: string,
    userId: string,
    query: { page?: unknown; limit?: unknown },
  ) {
    const account = await this.getOrCreate(tenantId, userId);
    const { page, limit, skip } = getPagination(query, 20);
    const filter = { affiliateId: account._id };
    const [docs, total] = await Promise.all([
      AffiliatePayout.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AffiliatePayout.countDocuments(filter),
    ]);
    const items = docs.map((p) => ({
      id: p._id.toString(),
      amountCents: p.amountCents,
      method: p.method,
      status: p.status,
      reference: p.reference ?? null,
      createdAt: p.createdAt,
      processedAt: p.processedAt ?? null,
    }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Affiliate requests a payout of their unpaid, unbatched commissions. */
  async requestPayout(tenantId: string, userId: string) {
    const account = await Affiliate.findOne({ tenantId, userId });
    if (!account) throw ApiError.notFound('Affiliate account not found');
    if (!account.payoutEmail) {
      throw ApiError.badRequest('Add a payout email before requesting a payout');
    }

    const eligible = await AffiliateCommission.find({
      affiliateId: account._id,
      status: { $in: ['pending', 'approved'] },
      payoutId: { $exists: false },
    }).select('_id amountCents');

    const amountCents = eligible.reduce((sum, c) => sum + c.amountCents, 0);
    if (amountCents < MIN_PAYOUT_CENTS) {
      throw ApiError.badRequest(
        `Minimum payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}. Current balance is too low.`,
      );
    }

    const payout = await AffiliatePayout.create({
      tenantId: account.tenantId,
      affiliateId: account._id,
      amountCents,
      method: 'paypal',
      status: 'requested',
      commissionIds: eligible.map((c) => c._id),
    });

    await AffiliateCommission.updateMany(
      { _id: { $in: eligible.map((c) => c._id) } },
      { $set: { payoutId: payout._id, status: 'approved' } },
    );

    return { id: payout._id.toString(), amountCents, status: payout.status };
  },

  /* ───────────────────────── Tracking + attribution ───────────────────────── */

  /** Records a referral click. Returns whether the code is valid + active. */
  async trackClick(
    tenantId: string,
    code: string,
    courseId: string | undefined,
    context: { ip?: string; userAgent?: string },
  ) {
    const affiliate = await Affiliate.findOne({ tenantId, code: code.toUpperCase(), status: 'active' });
    if (!affiliate) return { valid: false };

    await Promise.all([
      AffiliateReferral.create({
        tenantId: affiliate.tenantId,
        affiliateId: affiliate._id,
        code: affiliate.code,
        courseId: courseId ? oid(courseId) : undefined,
        ip: context.ip,
        userAgent: context.userAgent,
      }),
      Affiliate.updateOne({ _id: affiliate._id }, { $inc: { totalClicks: 1 } }),
    ]);
    return { valid: true };
  },

  /**
   * Attributes a conversion to a referral code. Best-effort: never throws, so it
   * can be safely awaited inside the enrollment/payment flow. Idempotent per
   * payment via the unique paymentId index on commissions.
   */
  async recordConversion(args: {
    tenantId: string;
    code?: string;
    referredUserId: string;
    courseId?: string;
    paymentId?: string;
  }): Promise<void> {
    const { tenantId, code, referredUserId, courseId, paymentId } = args;
    if (!code) return;

    try {
      const affiliate = await Affiliate.findOne({
        tenantId,
        code: code.toUpperCase(),
        status: 'active',
      });
      if (!affiliate) return;
      // No self-referrals.
      if (affiliate.userId.toString() === referredUserId) return;

      // Resolve the order amount (paid courses only have revenue to share).
      let orderAmountCents = 0;
      if (paymentId) {
        const payment = await Payment.findOne({ _id: paymentId, tenantId }).select('amount').lean();
        orderAmountCents = payment?.amount ?? 0;
      }

      await Affiliate.updateOne({ _id: affiliate._id }, { $inc: { totalConversions: 1 } });
      // Mark the most recent matching click as converted (attribution signal).
      await AffiliateReferral.findOneAndUpdate(
        { affiliateId: affiliate._id, converted: false },
        { $set: { converted: true } },
        { sort: { createdAt: -1 } },
      );

      if (orderAmountCents <= 0) return; // free enrollment: conversion counted, no commission

      const amountCents = Math.round((orderAmountCents * affiliate.commissionRate) / 100);
      await AffiliateCommission.create({
        tenantId: affiliate.tenantId,
        affiliateId: affiliate._id,
        referredUserId: oid(referredUserId),
        courseId: courseId ? oid(courseId) : undefined,
        paymentId: paymentId ? oid(paymentId) : undefined,
        orderAmountCents,
        rate: affiliate.commissionRate,
        amountCents,
        status: 'pending',
      });
      await Affiliate.updateOne({ _id: affiliate._id }, { $inc: { pendingCents: amountCents } });
    } catch (err) {
      // Duplicate-key (idempotent retry) or any failure must not break enrollment.
      logger.warn({ err, code, paymentId }, 'Affiliate conversion attribution skipped');
    }
  },

  /* ───────────────────────── Admin ───────────────────────── */

  async adminOverview(tenantId: string) {
    const tid = oid(tenantId);
    const [affiliates, balances, conversions] = await Promise.all([
      Affiliate.countDocuments({ tenantId: tid }),
      Affiliate.aggregate<{ pending: number; paid: number }>([
        { $match: { tenantId: tid } },
        { $group: { _id: null, pending: { $sum: '$pendingCents' }, paid: { $sum: '$paidCents' } } },
      ]),
      Affiliate.aggregate<{ total: number }>([
        { $match: { tenantId: tid } },
        { $group: { _id: null, total: { $sum: '$totalConversions' } } },
      ]),
    ]);
    return {
      affiliates,
      pendingCents: balances[0]?.pending ?? 0,
      paidCents: balances[0]?.paid ?? 0,
      totalConversions: conversions[0]?.total ?? 0,
    };
  },

  async adminListAffiliates(
    tenantId: string,
    query: { page?: unknown; limit?: unknown },
  ) {
    const tid = oid(tenantId);
    const { page, limit, skip } = getPagination(query, 25);
    const [docs, total] = await Promise.all([
      Affiliate.find({ tenantId: tid }).sort({ pendingCents: -1 }).skip(skip).limit(limit).lean(),
      Affiliate.countDocuments({ tenantId: tid }),
    ]);
    const users = await User.find({ _id: { $in: docs.map((d) => d.userId) } })
      .select('name email')
      .lean<{ _id: Types.ObjectId; name: string; email: string }[]>();
    const byId = new Map(users.map((u) => [u._id.toString(), u]));
    const items = docs.map((d) => ({
      id: d._id.toString(),
      code: d.code,
      status: d.status,
      commissionRate: d.commissionRate,
      pendingCents: d.pendingCents,
      paidCents: d.paidCents,
      totalClicks: d.totalClicks,
      totalConversions: d.totalConversions,
      user: byId.get(d.userId.toString()) ?? null,
    }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  async adminSetStatus(tenantId: string, affiliateId: string, status: 'active' | 'suspended') {
    const affiliate = await Affiliate.findOneAndUpdate(
      { _id: affiliateId, tenantId },
      { $set: { status } },
      { new: true },
    ).lean();
    if (!affiliate) throw ApiError.notFound('Affiliate not found');
    return { id: affiliate._id.toString(), status: affiliate.status };
  },

  async adminSetRate(tenantId: string, affiliateId: string, rate: number) {
    const affiliate = await Affiliate.findOneAndUpdate(
      { _id: affiliateId, tenantId },
      { $set: { commissionRate: rate } },
      { new: true },
    ).lean();
    if (!affiliate) throw ApiError.notFound('Affiliate not found');
    return { id: affiliate._id.toString(), commissionRate: affiliate.commissionRate };
  },

  async adminListPayouts(tenantId: string, query: { page?: unknown; limit?: unknown; status?: string }) {
    const tid = oid(tenantId);
    const { page, limit, skip } = getPagination(query, 25);
    const filter: Record<string, unknown> = { tenantId: tid };
    if (query.status) filter.status = query.status;
    const [docs, total] = await Promise.all([
      AffiliatePayout.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AffiliatePayout.countDocuments(filter),
    ]);
    const affiliates = await Affiliate.find({ _id: { $in: docs.map((d) => d.affiliateId) } })
      .select('code')
      .lean<{ _id: Types.ObjectId; code: string }[]>();
    const byId = new Map(affiliates.map((a) => [a._id.toString(), a.code]));
    const items = docs.map((p) => ({
      id: p._id.toString(),
      affiliateCode: byId.get(p.affiliateId.toString()) ?? null,
      amountCents: p.amountCents,
      method: p.method,
      status: p.status,
      reference: p.reference ?? null,
      createdAt: p.createdAt,
      processedAt: p.processedAt ?? null,
    }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Marks a payout paid: settles its commissions and moves the balance. */
  async adminMarkPayoutPaid(tenantId: string, payoutId: string, reference?: string) {
    const payout = await AffiliatePayout.findOne({ _id: payoutId, tenantId });
    if (!payout) throw ApiError.notFound('Payout not found');
    if (payout.status === 'paid') return { id: payout._id.toString(), status: payout.status };

    payout.status = 'paid';
    payout.processedAt = new Date();
    if (reference) payout.reference = reference;
    await payout.save();

    await AffiliateCommission.updateMany(
      { _id: { $in: payout.commissionIds } },
      { $set: { status: 'paid' } },
    );
    await Affiliate.updateOne(
      { _id: payout.affiliateId },
      { $inc: { pendingCents: -payout.amountCents, paidCents: payout.amountCents } },
    );

    return { id: payout._id.toString(), status: payout.status };
  },
};
