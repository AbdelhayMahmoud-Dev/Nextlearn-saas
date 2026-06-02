import { promises as dns } from 'dns';
import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { WhiteLabel, IWhiteLabelFeatures } from '../models/WhiteLabel.model';
import { Tenant } from '../models/Tenant.model';
import {
  EmailTemplate,
  EmailTemplateKey,
  EMAIL_TEMPLATE_KEYS,
} from '../models/EmailTemplate.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/* ───────────────────────── Theme presets ───────────────────────── */

export interface ThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  font: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'indigo', name: 'Indigo (default)', primaryColor: '#6366f1', accentColor: '#8b5cf6', font: 'inter' },
  { id: 'emerald', name: 'Emerald', primaryColor: '#10b981', accentColor: '#059669', font: 'inter' },
  { id: 'rose', name: 'Rose', primaryColor: '#f43f5e', accentColor: '#e11d48', font: 'manrope' },
  { id: 'amber', name: 'Sunset', primaryColor: '#f59e0b', accentColor: '#ef4444', font: 'poppins' },
  { id: 'sky', name: 'Ocean', primaryColor: '#0ea5e9', accentColor: '#2563eb', font: 'inter' },
  { id: 'violet', name: 'Royal', primaryColor: '#7c3aed', accentColor: '#a855f7', font: 'manrope' },
  { id: 'slate', name: 'Graphite', primaryColor: '#334155', accentColor: '#0f172a', font: 'inter' },
];

export const FONT_PRESETS = ['inter', 'manrope', 'poppins', 'lora'] as const;

/* ───────────────────────── Default email templates ───────────────────────── */

interface TemplateDefault {
  subject: string;
  heading: string;
  body: string;
  variables: string[];
}

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateKey, TemplateDefault> = {
  welcome: {
    subject: 'Welcome to {{platformName}}',
    heading: 'Welcome aboard, {{name}}!',
    body: 'Your account is ready. Explore courses and start learning today.',
    variables: ['platformName', 'name'],
  },
  verification: {
    subject: 'Verify your {{platformName}} account',
    heading: 'Confirm your email',
    body: 'Hi {{name}}, please verify your email using the button below. The link expires in 24 hours.',
    variables: ['platformName', 'name', 'actionUrl'],
  },
  passwordReset: {
    subject: 'Reset your {{platformName}} password',
    heading: 'Password reset',
    body: 'Hi {{name}}, we received a request to reset your password. The link expires in 1 hour.',
    variables: ['platformName', 'name', 'actionUrl'],
  },
  enrollment: {
    subject: "You're enrolled in {{courseTitle}}",
    heading: 'Enrollment confirmed',
    body: 'Hi {{name}}, you now have access to "{{courseTitle}}". Happy learning!',
    variables: ['platformName', 'name', 'courseTitle'],
  },
};

function tid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/** Substitutes {{var}} placeholders with provided values (missing → blank). */
export function renderTemplateString(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => vars[key] ?? '');
}

export const WhiteLabelService = {
  presets() {
    return { themes: THEME_PRESETS, fonts: FONT_PRESETS };
  },

  /** Applies a theme preset's colors + font to the tenant's branding. */
  async applyThemePreset(tenantId: string, presetId: string) {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) throw ApiError.badRequest('Unknown theme preset');
    const branding = await WhiteLabel.findOneAndUpdate(
      { tenantId: tid(tenantId) },
      {
        $set: {
          primaryColor: preset.primaryColor,
          accentColor: preset.accentColor,
          font: preset.font,
          themePreset: preset.id,
        },
        $setOnInsert: { tenantId: tid(tenantId), name: 'NextLearn' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return branding;
  },

  /* ───────────────────────── Custom domain ───────────────────────── */

  async getDomain(tenantId: string) {
    const wl = await WhiteLabel.findOne({ tenantId: tid(tenantId) })
      .select('customDomain domainStatus domainVerificationToken domainVerifiedAt')
      .lean();
    const domain = wl?.customDomain ?? null;
    return {
      customDomain: domain,
      status: wl?.domainStatus ?? 'none',
      verifiedAt: wl?.domainVerifiedAt ?? null,
      dnsRecord: domain
        ? {
            type: 'TXT',
            host: `_nextlearn.${domain}`,
            value: wl?.domainVerificationToken ?? '',
          }
        : null,
    };
  },

  /** Registers a custom domain and issues a verification token. */
  async setCustomDomain(tenantId: string, domain: string) {
    const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) {
      throw ApiError.badRequest('Enter a valid domain, e.g. learn.yourbrand.com');
    }
    // Domain must be globally unique across tenants.
    const clash = await Tenant.findOne({ domain: normalized, _id: { $ne: tid(tenantId) } })
      .select('_id')
      .lean();
    if (clash) throw ApiError.conflict('That domain is already in use');

    const token = `nextlearn-verify=${randomBytes(16).toString('hex')}`;
    await WhiteLabel.findOneAndUpdate(
      { tenantId: tid(tenantId) },
      {
        $set: {
          customDomain: normalized,
          domainStatus: 'pending',
          domainVerificationToken: token,
          domainVerifiedAt: undefined,
        },
        $setOnInsert: { tenantId: tid(tenantId), name: 'NextLearn' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.getDomain(tenantId);
  },

  /** Verifies the custom domain by checking the expected DNS TXT record. */
  async verifyDomain(tenantId: string) {
    const wl = await WhiteLabel.findOne({ tenantId: tid(tenantId) });
    if (!wl?.customDomain || !wl.domainVerificationToken) {
      throw ApiError.badRequest('No custom domain is pending verification');
    }

    const host = `_nextlearn.${wl.customDomain}`;
    let verified = false;
    try {
      const records = await dns.resolveTxt(host);
      verified = records.some((chunks) => chunks.join('').includes(wl.domainVerificationToken as string));
    } catch (err) {
      logger.info({ err, host }, 'Domain TXT lookup failed during verification');
      verified = false;
    }

    wl.domainStatus = verified ? 'verified' : 'failed';
    if (verified) {
      wl.domainVerifiedAt = new Date();
      wl.features.customDomain = true;
      await wl.save();
      // Wire the verified domain into tenant resolution.
      await Tenant.updateOne({ _id: wl.tenantId }, { $set: { domain: wl.customDomain } });
    } else {
      await wl.save();
    }
    return this.getDomain(tenantId);
  },

  /** Removes the custom domain and detaches it from tenant resolution. */
  async removeCustomDomain(tenantId: string) {
    const wl = await WhiteLabel.findOne({ tenantId: tid(tenantId) });
    if (!wl) throw ApiError.notFound('Branding not found');
    const prev = wl.customDomain;
    wl.customDomain = undefined;
    wl.domainStatus = 'none';
    wl.domainVerificationToken = undefined;
    wl.domainVerifiedAt = undefined;
    wl.features.customDomain = false;
    await wl.save();
    if (prev) await Tenant.updateOne({ _id: wl.tenantId, domain: prev }, { $unset: { domain: '' } });
    return this.getDomain(tenantId);
  },

  /* ───────────────────────── Feature flags ───────────────────────── */

  async getFeatureFlags(tenantId: string): Promise<IWhiteLabelFeatures> {
    const wl = await WhiteLabel.findOneAndUpdate(
      { tenantId: tid(tenantId) },
      { $setOnInsert: { tenantId: tid(tenantId), name: 'NextLearn' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return wl.features;
  },

  async setFeatureFlags(tenantId: string, flags: Partial<IWhiteLabelFeatures>) {
    const set: Record<string, boolean> = {};
    (Object.keys(flags) as (keyof IWhiteLabelFeatures)[]).forEach((k) => {
      const v = flags[k];
      if (typeof v === 'boolean') set[`features.${k}`] = v;
    });
    const wl = await WhiteLabel.findOneAndUpdate(
      { tenantId: tid(tenantId) },
      { $set: set, $setOnInsert: { tenantId: tid(tenantId), name: 'NextLearn' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return wl.features;
  },

  /* ───────────────────────── Email templates ───────────────────────── */

  /** Lists all template keys with the tenant's overrides merged over defaults. */
  async listEmailTemplates(tenantId: string) {
    const overrides = await EmailTemplate.find({ tenantId: tid(tenantId) }).lean();
    const byKey = new Map(overrides.map((o) => [o.key, o]));
    return EMAIL_TEMPLATE_KEYS.map((key) => {
      const def = DEFAULT_EMAIL_TEMPLATES[key];
      const override = byKey.get(key);
      return {
        key,
        variables: def.variables,
        isCustom: Boolean(override),
        enabled: override?.enabled ?? false,
        subject: override?.subject ?? def.subject,
        heading: override?.heading ?? def.heading,
        body: override?.body ?? def.body,
      };
    });
  },

  /** Creates or updates a tenant's override for one template key. */
  async upsertEmailTemplate(
    tenantId: string,
    key: EmailTemplateKey,
    data: { subject: string; heading: string; body: string; enabled: boolean },
  ) {
    if (!EMAIL_TEMPLATE_KEYS.includes(key)) throw ApiError.badRequest('Unknown template');
    const doc = await EmailTemplate.findOneAndUpdate(
      { tenantId: tid(tenantId), key },
      { $set: { ...data }, $setOnInsert: { tenantId: tid(tenantId), key } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return doc;
  },

  /** Reverts a template to the platform default (removes the override). */
  async resetEmailTemplate(tenantId: string, key: EmailTemplateKey) {
    await EmailTemplate.deleteOne({ tenantId: tid(tenantId), key });
    const def = DEFAULT_EMAIL_TEMPLATES[key];
    return { key, ...def, isCustom: false, enabled: false };
  },

  /** Renders a preview of a template with sample variable values. */
  previewEmailTemplate(
    template: { subject: string; heading: string; body: string },
    vars: Record<string, string>,
  ) {
    return {
      subject: renderTemplateString(template.subject, vars),
      heading: renderTemplateString(template.heading, vars),
      body: renderTemplateString(template.body, vars),
    };
  },
};
