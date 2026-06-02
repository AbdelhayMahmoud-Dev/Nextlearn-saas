'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, ISocialLinks, PaginatedResponse, PaginationMeta } from '@/types';

export interface MarketplaceCourse {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  category: string;
  level: string;
  price: number;
  salePrice?: number;
  currency: string;
  rating: { average: number; count: number };
  totalLessons: number;
  totalDuration: number;
  enrolledCount: number;
  instructor?: { _id: string; name: string; avatar?: string; bio?: string };
}

export interface MarketplaceStats {
  courses: number;
  instructors: number;
  students: number;
  averageRating: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface InstructorListItem {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  courses: number;
  students: number;
  avgRating: number;
}

export interface InstructorProfile {
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
    socialLinks: ISocialLinks | null;
    memberSince: string;
  };
  stats: { courses: number; students: number; avgRating: number; reviews: number };
  courses: MarketplaceCourse[];
}

const get = async <T,>(path: string): Promise<T> =>
  (await apiClient.get<ApiResponse<T>>(path)).data.data;

export const useMarketplaceStats = () =>
  useQuery({ queryKey: ['mkt-stats'], queryFn: () => get<MarketplaceStats>('/marketplace/stats') });

export const useFeaturedCourses = () =>
  useQuery({
    queryKey: ['mkt-featured'],
    queryFn: () => get<MarketplaceCourse[]>('/marketplace/featured'),
  });

export const useTrendingCourses = () =>
  useQuery({
    queryKey: ['mkt-trending'],
    queryFn: () => get<MarketplaceCourse[]>('/marketplace/trending'),
  });

export const useTopRatedCourses = () =>
  useQuery({
    queryKey: ['mkt-top-rated'],
    queryFn: () => get<MarketplaceCourse[]>('/marketplace/top-rated'),
  });

export const useMarketplaceCategories = () =>
  useQuery({
    queryKey: ['mkt-categories'],
    queryFn: () => get<CategoryCount[]>('/marketplace/categories'),
  });

export function useInstructors(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page), limit: '12' });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: ['mkt-instructors', page, search],
    queryFn: async (): Promise<{ items: InstructorListItem[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<InstructorListItem>>(
        `/marketplace/instructors?${params.toString()}`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useInstructorProfile(id: string) {
  return useQuery({
    queryKey: ['mkt-instructor', id],
    queryFn: () => get<InstructorProfile>(`/marketplace/instructors/${id}`),
    enabled: Boolean(id),
  });
}
