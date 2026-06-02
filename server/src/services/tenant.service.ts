import crypto from 'node:crypto';
import { Types } from 'mongoose';
import { Tenant, ITenant, TenantPlan } from '../models/Tenant.model';
import { TenantSettings } from '../models/TenantSettings.model';
import { WhiteLabel } from '../models/WhiteLabel.model';
import { User } from '../models/User.model';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { Payment } from '../models/Payment.model';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, getPagination } from '../utils/pagination';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { EmailService } from './email.service';

export interface CreateTenantBody {
  name: string;
  slug: string;
  adminEmail: string;
  adminName: string;
  plan?: TenantPlan;
  planExpiresAt?: string;
}

interface TenantKpis {
  userCount: number;
  courseCount: number;
  enrollmentCount: number;
  monthlyRevenue: number;
}

// ── Tiny in-memory tenant cache for subdomain/domain resolution (60s TTL) ────
const RESOLVE_TTL = 60 * 1000;
const resolveCache = new Map<string, { value: ITenant | null; exp: number }>();
function cacheGet(key: string): ITenant | null | undefined {
  const hit = resolveCache.get(key);
  if (!hit) return undefined;
  if (hit.exp < Date.now()) {
    resolveCache.delete(key);
    return undefined;
  }
  return hit.value;
}
function cacheSet(key: string, value: ITenant | null): void {
  resolveCache.set(key, { value, exp: Date.now() + RESOLVE_TTL });
}

/** Aggregates per-tenant KPIs for a set of tenant ids. */
async function kpisForTenants(ids: Types.ObjectId[]): Promise<Map<string, TenantKpis>> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [users, courses, enrollments, revenue] = await Promise.all([
    User.aggregate<{ _id: Types.ObjectId; c: number }>([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: '$tenantId', c: { $sum: 1 } } },
    ]),
    Course.aggregate<{ _id: Types.ObjectId; c: number }>([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: '$tenantId', c: { $sum: 1 } } },
    ]),
    Enrollment.aggregate<{ _id: Types.ObjectId; c: number }>([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: '$tenantId', c: { $sum: 1 } } },
    ]),
    Payment.aggregate<{ _id: Types.ObjectId; total: number }>([
      { $match: { tenantId: { $in: ids }, status: 'completed', createdAt: { $gte: monthStart } } },
      { $group: { _id: '$tenantId', total: { $sum: '$amount' } } },
    ]),
  ]);
  const map = new Map<string, TenantKpis>();
  for (const id of ids) {
    map.set(id.toString(), { userCount: 0, courseCount: 0, enrollmentCount: 0, monthlyRevenue: 0 });
  }
  for (const r of users) map.get(r._id.toString())!.userCount = r.c;
  for (const r of courses) map.get(r._id.toString())!.courseCount = r.c;
  for (const r of enrollments) map.get(r._id.toString())!.enrollmentCount = r.c;
  for (const r of revenue) map.get(r._id.toString())!.monthlyRevenue = Math.round(r.total) / 100;
  return map;
}

export const TenantService = {
  /** Creates a tenant + settings + branding + admin user, and emails credentials. */
  async createTenant(data: CreateTenantBody) {
    const slug = data.slug.trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(slug)) {
      throw ApiError.badRequest('Slug must be 3–30 lowercase letters, numbers, or hyphens');
    }
    const exists = await Tenant.findOne({ slug }).lean();
    if (exists) throw ApiError.conflict('This subdomain is already taken');

    const tenant = await Tenant.create({
      slug,
      name: data.name.trim(),
      plan: data.plan ?? 'free',
      planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : undefined,
      branding: {},
    });

    const temporaryPassword = crypto.randomBytes(15).toString('base64url').slice(0, 20);
    const [adminUser] = await Promise.all([
      User.create({
        tenantId: tenant._id,
        name: data.adminName.trim(),
        email: data.adminEmail.trim().toLowerCase(),
        password: temporaryPassword, // hashed by the model pre-save hook
        role: 'admin',
        isVerified: true,
      }),
      TenantSettings.create({ tenantId: tenant._id, platformName: data.name.trim() }),
      WhiteLabel.create({ tenantId: tenant._id, name: data.name.trim() }),
    ]);

    await EmailService.sendTenantWelcomeEmail(
      adminUser.email,
      adminUser.name,
      tenant.name,
      temporaryPassword,
      `${env.CLIENT_URL}/login`,
    );

    return {
      tenant: tenant.toObject(),
      adminUser: { email: adminUser.email, temporaryPassword },
    };
  },

  /** Paginated tenant list with per-tenant KPIs (SuperAdmin). */
  async listTenants(filters: { page?: unknown; limit?: unknown; search?: string; plan?: string; isActive?: string }) {
    const { page, limit, skip } = getPagination(filters, 100);
    const query: Record<string, unknown> = {};
    if (filters.plan) query.plan = filters.plan;
    if (filters.isActive === 'true') query.isActive = true;
    if (filters.isActive === 'false') query.isActive = false;
    if (filters.search) {
      const rx = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: rx }, { slug: rx }];
    }

    const [tenants, total] = await Promise.all([
      Tenant.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Tenant.countDocuments(query),
    ]);
    const kpis = await kpisForTenants(tenants.map((t) => t._id));
    const items = tenants.map((t) => ({ ...t, kpis: kpis.get(t._id.toString())! }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Single tenant with KPIs (SuperAdmin). */
  async getTenant(tenantId: string) {
    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant) throw ApiError.notFound('Tenant not found');
    const kpis = await kpisForTenants([tenant._id]);
    return { ...tenant, kpis: kpis.get(tenant._id.toString())! };
  },

  /** Suspends/reactivates a tenant (SuperAdmin). */
  async toggleTenantStatus(tenantId: string, isActive: boolean) {
    const tenant = await Tenant.findByIdAndUpdate(tenantId, { $set: { isActive } }, { new: true }).lean();
    if (!tenant) throw ApiError.notFound('Tenant not found');
    resolveCache.delete(`slug:${tenant.slug}`);
    return tenant;
  },

  /** Updates a tenant's plan (SuperAdmin). */
  async updateTenantPlan(tenantId: string, plan: TenantPlan, planExpiresAt?: string) {
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: { plan, planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : undefined } },
      { new: true },
    ).lean();
    if (!tenant) throw ApiError.notFound('Tenant not found');
    return tenant;
  },

  /** Hard-deletes a tenant and all its data (SuperAdmin). */
  async deleteTenant(tenantId: string, confirmSlug: string): Promise<void> {
    const tenant = await Tenant.findById(tenantId).select('slug').lean();
    if (!tenant) throw ApiError.notFound('Tenant not found');
    if (confirmSlug !== tenant.slug) throw ApiError.badRequest('Slug confirmation does not match');

    const tid = tenant._id;
    await Promise.all([
      User.deleteMany({ tenantId: tid }),
      Course.deleteMany({ tenantId: tid }),
      Enrollment.deleteMany({ tenantId: tid }),
      Payment.deleteMany({ tenantId: tid }),
      TenantSettings.deleteMany({ tenantId: tid }),
      WhiteLabel.deleteMany({ tenantId: tid }),
    ]);
    await Tenant.deleteOne({ _id: tid });
    resolveCache.delete(`slug:${tenant.slug}`);
    logger.warn({ action: 'superadmin.tenant.delete', tenantId, slug: tenant.slug }, 'Tenant hard-deleted');
  },

  /** Cross-tenant analytics (SuperAdmin). */
  async getGlobalAnalytics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [tenantStats, totalUsers, totalEnrollments, totalCourses, revenueRows, newThisMonth, monthlyRows, settings] =
      await Promise.all([
        Tenant.aggregate<{ _id: null; total: number; active: number }>([
          { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
        ]),
        User.countDocuments({}),
        Enrollment.countDocuments({}),
        Course.countDocuments({}),
        Payment.aggregate<{ _id: Types.ObjectId; revenue: number }>([
          { $match: { status: 'completed' } },
          { $group: { _id: '$tenantId', revenue: { $sum: '$amount' } } },
          { $sort: { revenue: -1 } },
        ]),
        Tenant.countDocuments({ createdAt: { $gte: monthStart } }),
        Tenant.aggregate<{ _id: string; count: number }>([
          { $match: { createdAt: { $gte: yearStart } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        ]),
        TenantSettings.find({}).select('tenantId commissionRate').lean(),
      ]);

    const commissionMap = new Map(settings.map((s) => [s.tenantId.toString(), s.commissionRate]));
    const totalRevenue = revenueRows.reduce((sum, r) => sum + r.revenue, 0) / 100;
    const platformFeeRevenue =
      revenueRows.reduce((sum, r) => {
        const rate = commissionMap.get(r._id.toString()) ?? 20;
        return sum + r.revenue * (rate / 100);
      }, 0) / 100;

    // Names for the top-10 revenue tenants.
    const topIds = revenueRows.slice(0, 10).map((r) => r._id);
    const topTenants = await Tenant.find({ _id: { $in: topIds } }).select('name').lean();
    const nameMap = new Map(topTenants.map((t) => [t._id.toString(), t.name]));
    const userCounts = await User.aggregate<{ _id: Types.ObjectId; c: number }>([
      { $match: { tenantId: { $in: topIds } } },
      { $group: { _id: '$tenantId', c: { $sum: 1 } } },
    ]);
    const userMap = new Map(userCounts.map((u) => [u._id.toString(), u.c]));

    const monthMap = new Map(monthlyRows.map((m) => [m._id, m.count]));
    const monthlyNewTenants: Array<{ month: string; count: number }> = [];
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(yearStart.getFullYear(), yearStart.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyNewTenants.push({
        month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        count: monthMap.get(key) ?? 0,
      });
    }

    return {
      totalTenants: tenantStats[0]?.total ?? 0,
      activeTenants: tenantStats[0]?.active ?? 0,
      totalUsers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      platformFeeRevenue: Math.round(platformFeeRevenue * 100) / 100,
      totalEnrollments,
      totalCourses,
      newTenantsThisMonth: newThisMonth,
      revenueByTenant: revenueRows.slice(0, 10).map((r) => ({
        tenantId: r._id.toString(),
        tenantName: nameMap.get(r._id.toString()) ?? 'Unknown',
        revenue: Math.round(r.revenue) / 100,
        userCount: userMap.get(r._id.toString()) ?? 0,
      })),
      monthlyNewTenants,
    };
  },

  /** Resolves a tenant by id (cached 60s). */
  async resolveById(id: string): Promise<ITenant | null> {
    const key = `id:${id}`;
    const cached = cacheGet(key);
    if (cached !== undefined) return cached;
    const tenant = await Tenant.findById(id).lean<ITenant | null>();
    cacheSet(key, tenant);
    return tenant;
  },

  /** Resolves a tenant by slug (cached 60s) — for subdomain routing. */
  async resolveBySlug(slug: string): Promise<ITenant | null> {
    const key = `slug:${slug}`;
    const cached = cacheGet(key);
    if (cached !== undefined) return cached;
    const tenant = await Tenant.findOne({ slug }).lean<ITenant | null>();
    cacheSet(key, tenant);
    return tenant;
  },

  /** Resolves a tenant by custom domain (cached 60s). */
  async resolveByDomain(domain: string): Promise<ITenant | null> {
    const key = `domain:${domain}`;
    const cached = cacheGet(key);
    if (cached !== undefined) return cached;
    const tenant = await Tenant.findOne({ domain }).lean<ITenant | null>();
    cacheSet(key, tenant);
    return tenant;
  },

  /** Invalidates the resolver cache for a slug (call after branding changes). */
  invalidate(slug: string): void {
    resolveCache.delete(`slug:${slug}`);
  },
};
