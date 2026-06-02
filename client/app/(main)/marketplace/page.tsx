'use client';

import Link from 'next/link';
import { Flame, Sparkles, Star, Store, Users } from 'lucide-react';
import {
  useFeaturedCourses,
  useMarketplaceCategories,
  useMarketplaceStats,
  useTopRatedCourses,
  useTrendingCourses,
  type MarketplaceCourse,
} from '@/hooks/useMarketplace';
import { MarketplaceCourseCard } from '@/components/marketplace/MarketplaceCourseCard';

function CourseRow({
  title,
  icon,
  courses,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  courses?: MarketplaceCourse[];
  loading: boolean;
}): JSX.Element | null {
  if (!loading && (!courses || courses.length === 0)) return null;
  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 font-heading text-2xl font-bold">
        {icon} {title}
      </h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-xl" />
            ))
          : courses?.map((c) => <MarketplaceCourseCard key={c._id} course={c} />)}
      </div>
    </section>
  );
}

export default function MarketplacePage(): JSX.Element {
  const stats = useMarketplaceStats();
  const featured = useFeaturedCourses();
  const trending = useTrendingCourses();
  const topRated = useTopRatedCourses();
  const categories = useMarketplaceCategories();

  return (
    <div className="container py-10">
      {/* Hero */}
      <div className="rounded-2xl border bg-gradient-to-br from-brand-primary/10 to-transparent p-8">
        <h1 className="flex items-center gap-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          <Store className="size-8 text-brand-primary" /> Course Marketplace
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Discover top-rated courses and expert instructors. Learn something new today.
        </p>
        {stats.data && (
          <div className="mt-6 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Courses', value: stats.data.courses },
              { label: 'Instructors', value: stats.data.instructors },
              { label: 'Students', value: stats.data.students },
              { label: 'Avg rating', value: stats.data.averageRating.toFixed(1) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-4">
                <div className="font-heading text-2xl font-bold">
                  {typeof s.value === 'number' ? s.value.toLocaleString('en-US') : s.value}
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/instructors"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground"
          >
            <Users className="size-4" /> Browse instructors
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
          >
            All courses
          </Link>
        </div>
      </div>

      {/* Categories */}
      {categories.data && categories.data.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.data.map((c) => (
            <Link
              key={c.category}
              href={`/courses?category=${encodeURIComponent(c.category)}`}
              className="rounded-full border px-4 py-1.5 text-sm hover:border-brand-primary"
            >
              {c.category} <span className="text-muted-foreground">({c.count})</span>
            </Link>
          ))}
        </div>
      )}

      <CourseRow
        title="Featured"
        icon={<Sparkles className="size-6 text-brand-primary" />}
        courses={featured.data}
        loading={featured.isLoading}
      />
      <CourseRow
        title="Trending now"
        icon={<Flame className="size-6 text-orange-500" />}
        courses={trending.data}
        loading={trending.isLoading}
      />
      <CourseRow
        title="Top rated"
        icon={<Star className="size-6 fill-amber-400 text-amber-400" />}
        courses={topRated.data}
        loading={topRated.isLoading}
      />
    </div>
  );
}
