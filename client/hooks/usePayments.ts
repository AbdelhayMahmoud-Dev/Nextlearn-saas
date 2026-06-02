'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { IPayment, PaginatedResponse, PaginationMeta } from '@/types';

export { useSubscription } from './useSubscription';

interface PaymentHistoryPage {
  items: IPayment[];
  meta: PaginationMeta;
}

/** Paginated payment history for the billing page (server-side pagination). */
export function usePaymentHistory(page: number, limit = 10) {
  return useQuery({
    queryKey: ['payments', 'history', page, limit],
    queryFn: async (): Promise<PaymentHistoryPage> => {
      const res = await apiClient.get<PaginatedResponse<IPayment>>(
        `/payments/history?page=${page}&limit=${limit}`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
    staleTime: 2 * 60 * 1000,
  });
}
