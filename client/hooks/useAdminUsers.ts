'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, ICertificate, IEnrollment, IPayment, IUser, PaginatedResponse, PaginationMeta, UserRole } from '@/types';

export interface AdminUserRow extends IUser {
  enrollmentCount: number;
}
export interface AdminUserFilters {
  page: number;
  role?: string;
  search?: string;
  isActive?: string;
}
export interface AdminUserDetail {
  user: IUser;
  enrollments: (IEnrollment & { course: { _id: string; title: string; slug: string; thumbnail?: string } | null })[];
  payments: IPayment[];
  certificates: ICertificate[];
}

export function useAdminUsers(filters: AdminUserFilters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: '20' });
  if (filters.role) params.set('role', filters.role);
  if (filters.search) params.set('search', filters.search);
  if (filters.isActive) params.set('isActive', filters.isActive);
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async (): Promise<{ items: AdminUserRow[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<AdminUserRow>>(`/admin/users?${params.toString()}`);
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: async (): Promise<AdminUserDetail> =>
      (await apiClient.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation<IUser, ApiErrorShape, { id: string; role: UserRole }>({
    mutationFn: async ({ id, role }) => (await apiClient.patch<ApiResponse<IUser>>(`/admin/users/${id}/role`, { role })).data.data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
      void qc.invalidateQueries({ queryKey: ['admin-user'] });
    },
  });
}

export function useToggleStatus() {
  const qc = useQueryClient();
  return useMutation<IUser, ApiErrorShape, { id: string; isActive: boolean }>({
    mutationFn: async ({ id, isActive }) =>
      (await apiClient.patch<ApiResponse<IUser>>(`/admin/users/${id}/status`, { isActive })).data.data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
      void qc.invalidateQueries({ queryKey: ['admin-user'] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

/** Downloads the users CSV export. */
export async function exportUsersCsv(): Promise<void> {
  const res = await apiClient.post('/admin/users/export', {}, { responseType: 'blob' });
  const blob = new Blob([res.data as BlobPart], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users.csv';
  a.click();
  URL.revokeObjectURL(url);
}
