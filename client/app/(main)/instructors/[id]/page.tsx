'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Globe, Star, Users } from 'lucide-react';
import { useInstructorProfile } from '@/hooks/useMarketplace';
import { MarketplaceCourseCard } from '@/components/marketplace/MarketplaceCourseCard';
import { ErrorState } from '@/components/common/ErrorState';
import { getInitials } from '@/lib/utils';

export default function InstructorProfilePage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, isError, refetch } = useInstructorProfile(id);

  if (isLoading) {
    return (
      <div className="container space-y-6 py-10">
        <div className="skeleton h-32 w-full rounded-xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container py-10">
        <ErrorState title="Instructor not found" onRetry={() => void refetch()} />
      </div>
    );
  }

  const { instructor, stats, courses } = data;
  const social = instructor.socialLinks;

  return (
    <div className="container py-10">
      <Link
        href="/instructors"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All instructors
      </Link>

      <div className="mt-4 flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted">
          {instructor.avatar ? (
            <Image src={instructor.avatar} alt={instructor.name} fill className="object-cover" sizes="80px" />
          ) : (
            <span className="flex size-full items-center justify-center text-xl font-medium">
              {getInitials(instructor.name)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold">{instructor.name}</h1>
          {instructor.bio && <p className="mt-1 max-w-2xl text-muted-foreground">{instructor.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-4" /> {stats.courses} courses
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-4" /> {stats.students.toLocaleString('en-US')} students
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="size-4 fill-amber-400 text-amber-400" /> {stats.avgRating.toFixed(1)} (
              {stats.reviews} reviews)
            </span>
          </div>
          {social && (social.website || social.twitter || social.linkedin) && (
            <div className="mt-3 flex gap-3 text-sm">
              {social.website && (
                <a
                  href={social.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-primary hover:underline"
                >
                  <Globe className="size-4" /> Website
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary hover:underline"
                >
                  Twitter
                </a>
              )}
              {social.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary hover:underline"
                >
                  LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <h2 className="mt-10 font-heading text-xl font-bold">Courses by {instructor.name}</h2>
      {courses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No published courses yet.</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <MarketplaceCourseCard key={c._id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
