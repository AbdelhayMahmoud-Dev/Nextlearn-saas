'use client';

import { motion } from 'framer-motion';
import type { ICourse } from '@/types';
import { CourseCard } from './CourseCard';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

/** Responsive, staggered grid of course cards. */
export function CourseGrid({ courses }: { courses: ICourse[] }): JSX.Element {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </motion.div>
  );
}
