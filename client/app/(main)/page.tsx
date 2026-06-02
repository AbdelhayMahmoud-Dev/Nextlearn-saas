import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { serverGet } from '@/lib/server-api';
import type { ApiResponse, ICourse } from '@/types';
import { Button } from '@/components/ui/button';
import { HomeHero } from '@/components/home/HomeHero';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials, type Testimonial } from '@/components/home/Testimonials';
import { PricingPreview } from '@/components/home/PricingPreview';
import { CtaBanner } from '@/components/home/CtaBanner';
import { CourseGrid } from '@/components/course/CourseGrid';

type Stats = { courses: number; students: number; instructors: number };
type CategoryCount = { name: string; count: number };

/** Resolves a server fetch to its `data`, falling back gracefully on error. */
async function safe<T>(promise: Promise<ApiResponse<T>>, fallback: T): Promise<T> {
  try {
    return (await promise).data;
  } catch {
    return fallback;
  }
}

export default async function HomePage(): Promise<JSX.Element> {
  const [stats, featured, reviews, categories] = await Promise.all([
    safe(serverGet<ApiResponse<Stats>>('/analytics/dashboard'), { courses: 0, students: 0, instructors: 0 }),
    safe(serverGet<ApiResponse<ICourse[]>>('/courses/featured'), []),
    safe(serverGet<ApiResponse<Testimonial[]>>('/reviews/featured'), []),
    safe(serverGet<ApiResponse<CategoryCount[]>>('/courses/categories'), []),
  ]);

  const categoryCounts = Object.fromEntries(categories.map((c) => [c.name, c.count]));

  return (
    <>
      <HomeHero stats={stats} />

      {featured.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-heading text-3xl font-bold">Featured courses</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/courses">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <CourseGrid courses={featured} />
        </section>
      )}

      <CategoryGrid counts={categoryCounts} />
      <HowItWorks />
      <Testimonials reviews={reviews} />
      <PricingPreview />
      <CtaBanner />
    </>
  );
}
