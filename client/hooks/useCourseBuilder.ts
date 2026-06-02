'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCreateCourse, useUpdateCourse } from './useInstructorCourses';
import type { ICourse } from '@/types';

export const WIZARD_STEPS = [
  { number: 1, label: 'Course Info' },
  { number: 2, label: 'Curriculum' },
  { number: 3, label: 'Pricing' },
  { number: 4, label: 'Media' },
  { number: 5, label: 'Publish' },
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number]['number'];

interface UseCourseBuilderOptions {
  initialCourseId?: string;
  initialStep?: WizardStep;
}

/**
 * Manages wizard state: current step, course id persistence across steps,
 * and save-draft logic. The course is created on first Step 1 save; subsequent
 * steps PATCH the same course.
 */
export function useCourseBuilder({ initialCourseId, initialStep = 1 }: UseCourseBuilderOptions = {}) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [courseId, setCourseId] = useState<string | undefined>(initialCourseId);

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(courseId ?? '');

  /** Save draft at the current step and optionally advance. */
  const saveDraft = useCallback(
    async (body: Partial<ICourse>, advance = false): Promise<boolean> => {
      try {
        let saved: ICourse;
        if (!courseId) {
          saved = await createCourse.mutateAsync(body);
          setCourseId(saved._id);
        } else {
          saved = await updateCourse.mutateAsync(body);
        }
        if (advance) {
          const next = Math.min(5, step + 1) as WizardStep;
          setStep(next);
          router.replace(`/instructor/courses/${saved._id}/edit?step=${next}`, { scroll: false });
        }
        return true;
      } catch {
        toast.error('Failed to save draft — check your connection and try again.');
        return false;
      }
    },
    [courseId, createCourse, updateCourse, step, router],
  );

  const goBack = useCallback(() => {
    const prev = Math.max(1, step - 1) as WizardStep;
    setStep(prev);
    if (courseId) {
      router.replace(`/instructor/courses/${courseId}/edit?step=${prev}`, { scroll: false });
    }
  }, [step, courseId, router]);

  const isSaving = createCourse.isPending || updateCourse.isPending;

  return { step, setStep, courseId, saveDraft, goBack, isSaving };
}
