import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getTenantId } from '../utils/requestContext';
import { WhiteLabelService } from '../services/whiteLabel.service';
import type { EmailTemplateKey } from '../models/EmailTemplate.model';

export const WhiteLabelController = {
  // ── Theme presets ──────────────────────────────────────────────────────────
  presets: asyncHandler(async (_req, res) => {
    ApiResponse.success(res, WhiteLabelService.presets(), 'Theme presets');
  }),
  applyPreset: asyncHandler(async (req, res) => {
    const result = await WhiteLabelService.applyThemePreset(getTenantId(req), req.body.presetId);
    ApiResponse.success(res, result, 'Theme applied');
  }),

  // ── Custom domain ────────────────────────────────────────────────────────────
  getDomain: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await WhiteLabelService.getDomain(getTenantId(req)), 'Custom domain');
  }),
  setDomain: asyncHandler(async (req, res) => {
    const result = await WhiteLabelService.setCustomDomain(getTenantId(req), req.body.domain);
    ApiResponse.success(res, result, 'Domain saved — add the DNS record then verify');
  }),
  verifyDomain: asyncHandler(async (req, res) => {
    const result = await WhiteLabelService.verifyDomain(getTenantId(req));
    ApiResponse.success(res, result, result.status === 'verified' ? 'Domain verified' : 'Verification failed');
  }),
  removeDomain: asyncHandler(async (req, res) => {
    const result = await WhiteLabelService.removeCustomDomain(getTenantId(req));
    ApiResponse.success(res, result, 'Custom domain removed');
  }),

  // ── Feature flags ────────────────────────────────────────────────────────────
  getFlags: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await WhiteLabelService.getFeatureFlags(getTenantId(req)), 'Feature flags');
  }),
  setFlags: asyncHandler(async (req, res) => {
    const result = await WhiteLabelService.setFeatureFlags(getTenantId(req), req.body);
    ApiResponse.success(res, result, 'Feature flags updated');
  }),

  // ── Email templates ──────────────────────────────────────────────────────────
  listTemplates: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await WhiteLabelService.listEmailTemplates(getTenantId(req)), 'Email templates');
  }),
  upsertTemplate: asyncHandler(async (req, res) => {
    const key = req.params.key as EmailTemplateKey;
    const result = await WhiteLabelService.upsertEmailTemplate(getTenantId(req), key, req.body);
    ApiResponse.success(res, result, 'Template saved');
  }),
  resetTemplate: asyncHandler(async (req, res) => {
    const key = req.params.key as EmailTemplateKey;
    const result = await WhiteLabelService.resetEmailTemplate(getTenantId(req), key);
    ApiResponse.success(res, result, 'Template reset to default');
  }),
  previewTemplate: asyncHandler(async (req, res) => {
    const sample: Record<string, string> = {
      name: 'Alex Rivera',
      platformName: 'Acme Academy',
      courseTitle: 'Intro to TypeScript',
      actionUrl: 'https://example.com/action',
    };
    const result = WhiteLabelService.previewEmailTemplate(req.body, sample);
    ApiResponse.success(res, result, 'Template preview');
  }),
};
