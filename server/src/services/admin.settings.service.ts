import { Types } from 'mongoose';
import { TenantSettings } from '../models/TenantSettings.model';
import { WhiteLabel } from '../models/WhiteLabel.model';

export interface BrandingUpdate {
  logo?: string;
  primaryColor?: string;
  accentColor?: string;
  platformName?: string;
  supportEmail?: string;
  defaultLanguage?: string;
}

export type GeneralUpdate = Partial<{
  platformName: string;
  supportEmail: string;
  defaultLanguage: string;
  timezone: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: string;
  passwordMinLength: number;
  maxCoursesPerInstructor: number;
  commissionRate: number;
}>;

export const AdminSettingsService = {
  /** Returns (creating defaults if absent) the tenant's settings. */
  async getSettings(tenantId: string) {
    return TenantSettings.findOneAndUpdate(
      { tenantId: new Types.ObjectId(tenantId) },
      { $setOnInsert: { tenantId: new Types.ObjectId(tenantId) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
  },

  /** Returns (creating defaults if absent) the tenant's branding. */
  async getBranding(tenantId: string) {
    return WhiteLabel.findOneAndUpdate(
      { tenantId: new Types.ObjectId(tenantId) },
      { $setOnInsert: { tenantId: new Types.ObjectId(tenantId), name: 'NextLearn' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
  },

  /** Updates branding (WhiteLabel) + the related TenantSettings fields. */
  async updateBranding(tenantId: string, data: BrandingUpdate) {
    const tid = new Types.ObjectId(tenantId);
    const wl: Record<string, unknown> = {};
    if (data.logo !== undefined) wl.logo = data.logo;
    if (data.primaryColor !== undefined) wl.primaryColor = data.primaryColor;
    if (data.accentColor !== undefined) wl.accentColor = data.accentColor;
    if (data.platformName !== undefined) wl.name = data.platformName;

    const settings: Record<string, unknown> = {};
    if (data.platformName !== undefined) settings.platformName = data.platformName;
    if (data.supportEmail !== undefined) settings.supportEmail = data.supportEmail;
    if (data.defaultLanguage !== undefined) settings.defaultLanguage = data.defaultLanguage;

    const [branding] = await Promise.all([
      WhiteLabel.findOneAndUpdate(
        { tenantId: tid },
        { $set: wl, $setOnInsert: { name: data.platformName ?? 'NextLearn' } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean(),
      Object.keys(settings).length > 0
        ? TenantSettings.findOneAndUpdate(
            { tenantId: tid },
            { $set: settings, $setOnInsert: { tenantId: tid } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          )
        : Promise.resolve(null),
    ]);
    return branding;
  },

  /** Updates general/security settings (TenantSettings). */
  async updateGeneral(tenantId: string, data: GeneralUpdate) {
    return TenantSettings.findOneAndUpdate(
      { tenantId: new Types.ObjectId(tenantId) },
      { $set: data, $setOnInsert: { tenantId: new Types.ObjectId(tenantId) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
  },
};
