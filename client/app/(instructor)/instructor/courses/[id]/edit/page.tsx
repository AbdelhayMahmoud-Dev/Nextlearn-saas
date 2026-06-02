'use client';

import { useSearchParams } from 'next/navigation';
import { CourseWizard } from '@/components/instructor/CourseWizard/CourseWizard';
import { Step1_CourseInfo } from '@/components/instructor/CourseWizard/Step1_CourseInfo';
import { Step2_Curriculum } from '@/components/instructor/CourseWizard/Step2_Curriculum';
import { Step3_Pricing } from '@/components/instructor/CourseWizard/Step3_Pricing';
import { Step4_Media } from '@/components/instructor/CourseWizard/Step4_Media';
import { Step5_Publish } from '@/components/instructor/CourseWizard/Step5_Publish';
import { useCourseBuilder, type WizardStep } from '@/hooks/useCourseBuilder';
import { useCourseForEdit } from '@/hooks/useInstructorCourses';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader2 } from 'lucide-react';

interface Props {
  params: { id: string };
}

/** Edit an existing course — wizard pre-filled with saved data. */
export default function EditCoursePage({ params }: Props): JSX.Element {
  const { id } = params;
  const sp = useSearchParams();
  const initialStep = Math.min(5, Math.max(1, Number(sp.get('step') ?? 1))) as WizardStep;

  const { data: course, isLoading, isError, refetch } = useCourseForEdit(id);
  const { step, courseId, saveDraft, goBack, setStep, isSaving } = useCourseBuilder({
    initialCourseId: id,
    initialStep,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }
  if (isError || !course) {
    return <ErrorState title="Couldn't load course" onRetry={() => void refetch()} />;
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">Edit Course</h1>
      <CourseWizard currentStep={step}>
        {step === 1 && (
          <Step1_CourseInfo initial={course} onSave={saveDraft} isSaving={isSaving} />
        )}
        {step === 2 && (
          <Step2_Curriculum
            courseId={courseId ?? id}
            onBack={goBack}
            onNext={() => void saveDraft({}, true)}
          />
        )}
        {step === 3 && (
          <Step3_Pricing initial={course} onSave={saveDraft} onBack={goBack} isSaving={isSaving} />
        )}
        {step === 4 && (
          <Step4_Media initial={course} onSave={saveDraft} onBack={goBack} isSaving={isSaving} />
        )}
        {step === 5 && (
          <Step5_Publish
            courseId={courseId ?? id}
            onBack={goBack}
            onNavigateToStep={(s) => setStep(s as WizardStep)}
          />
        )}
      </CourseWizard>
    </div>
  );
}
