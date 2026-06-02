'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { StarRating } from '@/components/course/StarRating';
import { getInitials } from '@/lib/utils';

export interface Testimonial {
  _id: string;
  rating: number;
  comment?: string;
  user?: { name: string; avatar?: string };
  course?: { title: string };
}

/** Homepage testimonials sourced from real top reviews. */
export function Testimonials({ reviews }: { reviews: Testimonial[] }): JSX.Element | null {
  if (reviews.length === 0) return null;

  return (
    <section className="container py-16">
      <h2 className="text-center font-heading text-3xl font-bold">Loved by learners</h2>
      {/* Mobile: snap carousel. Desktop: 3-column grid. */}
      <div className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        {reviews.slice(0, 3).map((review, i) => (
          <motion.figure
            key={review._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.15 }}
            className="flex min-w-[85%] shrink-0 snap-center flex-col rounded-xl border bg-card p-6 sm:min-w-[60%] md:min-w-0"
          >
            <StarRating value={review.rating} />
            <blockquote className="mt-3 flex-1 text-sm">{review.comment}</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary">
                {review.user?.avatar ? (
                  <Image src={review.user.avatar} alt={review.user.name} width={40} height={40} className="object-cover" />
                ) : (
                  getInitials(review.user?.name ?? 'NL')
                )}
              </span>
              <div>
                <p className="flex items-center gap-1 text-sm font-medium">
                  {review.user?.name}
                  <BadgeCheck className="size-4 text-brand-primary" aria-label="Verified learner" />
                </p>
                <p className="text-xs text-muted-foreground">{review.course?.title}</p>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
