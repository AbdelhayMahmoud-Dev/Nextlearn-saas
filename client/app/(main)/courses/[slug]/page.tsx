import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Check, Globe, Signal } from 'lucide-react';
import { serverGet, ServerApiError } from '@/lib/server-api';
import type { ApiResponse, ICourse, IModule } from '@/types';
import { StarRating } from '@/components/course/StarRating';
import { CourseCurriculum } from '@/components/course/CourseCurriculum';
import { CourseSidebar } from '@/components/course/CourseSidebar';
import { getInitials } from '@/lib/utils';

async function getCourse(slug: string): Promise<ICourse | null> {
  try {
    const res = await serverGet<ApiResponse<ICourse>>(`/courses/${slug}`);
    return res.data;
  } catch (error) {
    if (error instanceof ServerApiError && error.statusCode === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await getCourse(params.slug);
  if (!course) return { title: 'Course not found' };
  const images = course.thumbnail ? [course.thumbnail] : [];
  return {
    title: course.title,
    description: course.description,
    openGraph: { title: course.title, description: course.description, images, type: 'website' },
    twitter: { card: 'summary_large_image', title: course.title, description: course.description, images },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}): Promise<JSX.Element> {
  const course = await getCourse(params.slug);
  if (!course) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: { '@type': 'Organization', name: 'NextLearn' },
    aggregateRating:
      course.rating.count > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: course.rating.average.toFixed(1),
            ratingCount: course.rating.count,
          }
        : undefined,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="border-b bg-muted/30">
        <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
          <div>
            <span className="text-sm font-medium text-brand-primary">{course.category}</span>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{course.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <StarRating value={course.rating.average} count={course.rating.count} />
              <span>{course.enrolledCount.toLocaleString('en-US')} students</span>
              <span className="inline-flex items-center gap-1 capitalize">
                <Signal className="size-4" /> {course.level}
              </span>
              <span className="inline-flex items-center gap-1 uppercase">
                <Globe className="size-4" /> {course.language}
              </span>
            </div>
            {course.instructor && (
              <p className="mt-4 text-sm">
                Created by <span className="font-medium">{course.instructor.name}</span>
              </p>
            )}
          </div>

          <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted lg:row-span-2">
            {course.thumbnail && (
              <Image src={course.thumbnail} alt={course.title} fill sizes="360px" className="object-cover" priority />
            )}
          </div>
        </div>
      </div>

      <div className="container grid gap-10 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {course.outcomes.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-semibold">What you&apos;ll learn</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-heading text-2xl font-semibold">Curriculum</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              {course.modules.length} modules · {course.totalLessons} lessons
            </p>
            <CourseCurriculum modules={course.modules as IModule[]} />
          </section>

          {course.requirements.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-semibold">Requirements</h2>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
                {course.requirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          {course.instructor && (
            <section>
              <h2 className="font-heading text-2xl font-semibold">Instructor</h2>
              <div className="mt-4 flex items-start gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary/10 font-heading font-semibold text-brand-primary">
                  {course.instructor.avatar ? (
                    <Image src={course.instructor.avatar} alt={course.instructor.name} width={56} height={56} className="object-cover" />
                  ) : (
                    getInitials(course.instructor.name)
                  )}
                </span>
                <div>
                  <p className="font-medium">{course.instructor.name}</p>
                  {course.instructor.bio && (
                    <p className="mt-1 text-sm text-muted-foreground">{course.instructor.bio}</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <CourseSidebar course={course} />
        </aside>
      </div>
    </div>
  );
}
