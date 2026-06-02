'use client';

import { motion } from 'framer-motion';
import { Award, BookOpen, Search } from 'lucide-react';

const STEPS = [
  { icon: Search, title: 'Find your course', body: 'Browse the catalog and pick a course that matches your goals.' },
  { icon: BookOpen, title: 'Learn at your pace', body: 'Watch lessons, take quizzes, and track your progress as you go.' },
  { icon: Award, title: 'Earn a certificate', body: 'Complete the course and get a verifiable certificate to share.' },
];

/** Three-step "how it works" with a connecting line + scroll-triggered animations. */
export function HowItWorks(): JSX.Element {
  return (
    <section className="bg-muted/30 py-16">
      <div className="container">
        <h2 className="text-center font-heading text-3xl font-bold">How it works</h2>
        <div className="relative mt-12 grid gap-10 md:grid-cols-3">
          {/* Connecting line across the three steps (desktop only). */}
          <div
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-7 hidden border-t-2 border-dashed border-border md:block"
          />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Decorative step number behind the content. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 font-heading text-8xl font-bold text-foreground/[0.06]"
              >
                {i + 1}
              </span>
              <span className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground">
                <step.icon className="size-7" />
              </span>
              <h3 className="relative mt-4 font-heading text-lg font-semibold">
                {i + 1}. {step.title}
              </h3>
              <p className="relative mt-2 text-sm text-muted-foreground">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
