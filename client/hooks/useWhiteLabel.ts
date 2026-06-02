'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse } from '@/types';

export interface ThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  font: string;
}

export interface FeatureFlags {
  liveSessions: boolean;
  certificates: boolean;
  coupons: boolean;
  customDomain: boolean;
  affiliates: boolean;
  marketplace: boolean;
  aiAssistant: boolean;
}

export type DomainStatus = 'none' | 'pending' | 'verified' | 'failed';

export interface DomainInfo {
  customDomain: string | null;
  status: DomainStatus;
  verifiedAt: string | null;
  dnsRecord: { type: string; host: string; value: string } | null;
}

export interface EmailTemplate {
  key: 'welcome' | 'verification' | 'passwordReset' | 'enrollment';
  variables: string[];
  isCustom: boolean;
  enabled: boolean;
  subject: string;
  heading: string;
  body: string;
}

const get = async <T,>(path: string): Promise<T> =>
  (await apiClient.get<ApiResponse<T>>(path)).data.data;

export const usePresets = () =>
  useQuery({
    queryKey: ['wl-presets'],
    queryFn: () => get<{ themes: ThemePreset[]; fonts: string[] }>('/admin/white-label/presets'),
  });

export function useApplyPreset() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiErrorShape, string>({
    mutationFn: async (presetId) =>
      (await apiClient.post('/admin/white-label/presets/apply', { presetId })).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-branding'] }),
  });
}

export const useDomainInfo = () =>
  useQuery({ queryKey: ['wl-domain'], queryFn: () => get<DomainInfo>('/admin/white-label/domain') });

export function useSetDomain() {
  const qc = useQueryClient();
  return useMutation<DomainInfo, ApiErrorShape, string>({
    mutationFn: async (domain) =>
      (await apiClient.put<ApiResponse<DomainInfo>>('/admin/white-label/domain', { domain })).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wl-domain'] }),
  });
}

export function useVerifyDomain() {
  const qc = useQueryClient();
  return useMutation<DomainInfo, ApiErrorShape, void>({
    mutationFn: async () =>
      (await apiClient.post<ApiResponse<DomainInfo>>('/admin/white-label/domain/verify', {})).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wl-domain'] }),
  });
}

export function useRemoveDomain() {
  const qc = useQueryClient();
  return useMutation<DomainInfo, ApiErrorShape, void>({
    mutationFn: async () =>
      (await apiClient.delete<ApiResponse<DomainInfo>>('/admin/white-label/domain')).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wl-domain'] }),
  });
}

export const useFeatureFlags = () =>
  useQuery({
    queryKey: ['wl-flags'],
    queryFn: () => get<FeatureFlags>('/admin/white-label/feature-flags'),
  });

export function useSetFeatureFlags() {
  const qc = useQueryClient();
  return useMutation<FeatureFlags, ApiErrorShape, Partial<FeatureFlags>>({
    mutationFn: async (flags) =>
      (await apiClient.patch<ApiResponse<FeatureFlags>>('/admin/white-label/feature-flags', flags)).data
        .data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wl-flags'] }),
  });
}

export const useEmailTemplates = () =>
  useQuery({
    queryKey: ['wl-email-templates'],
    queryFn: () => get<EmailTemplate[]>('/admin/white-label/email-templates'),
  });

export function useUpsertEmailTemplate() {
  const qc = useQueryClient();
  return useMutation<
    unknown,
    ApiErrorShape,
    { key: string; subject: string; heading: string; body: string; enabled: boolean }
  >({
    mutationFn: async ({ key, ...body }) =>
      (await apiClient.put(`/admin/white-label/email-templates/${key}`, body)).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wl-email-templates'] }),
  });
}

export function useResetEmailTemplate() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiErrorShape, string>({
    mutationFn: async (key) =>
      (await apiClient.delete(`/admin/white-label/email-templates/${key}`)).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wl-email-templates'] }),
  });
}

export interface TemplatePreview {
  subject: string;
  heading: string;
  body: string;
}

export function usePreviewEmailTemplate() {
  return useMutation<TemplatePreview, ApiErrorShape, TemplatePreview>({
    mutationFn: async (body) =>
      (await apiClient.post<ApiResponse<TemplatePreview>>(
        '/admin/white-label/email-templates/preview',
        body,
      )).data.data,
  });
}
