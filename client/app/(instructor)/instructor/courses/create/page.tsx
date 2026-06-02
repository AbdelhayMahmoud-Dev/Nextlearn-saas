'use client';

import { CourseWizard } from '@/components/instructor/CourseWizard/CourseWizard';
import { Step1_CourseInfo } from '@/components/instructor/CourseWizard/Step1_CourseInfo';
import { Step2_Curriculum } from '@/components/instructor/CourseWizard/Step2_Curriculum';
import { Step3_Pricing } from '@/components/instructor/CourseWizard/Step3_Pricing';
import { Step4_Media } from '@/components/instructor/CourseWizard/Step4_Media';
import { Step5_Publish } from '@/components/instructor/CourseWizard/Step5_Publish';
import { useCourseBuilder } from '@/hooks/useCourseBuilder';
import type { WizardStep } from '@/hooks/useCourseBuilder';

/** Create a new course — 5-step wizard starting fresh. */
export default function CreateCoursePage(): JSX.Element {
  const { step, courseId, saveDraft, goBack, setStep, isSaving } = useCourseBuilder();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold">Create New Course</h1>
      <CourseWizard currentStep={step}>
        {step === 1 && (
          <Step1_CourseInfo onSave={saveDraft} isSaving={isSaving} />
        )}
        {step === 2 && (
          <Step2_Curriculum
            courseId={courseId}
            onBack={goBack}
            onNext={() => void saveDraft({}, true)}
          />
        )}
        {step === 3 && (
          <Step3_Pricing onSave={saveDraft} onBack={goBack} isSaving={isSaving} />
        )}
        {step === 4 && (
          <Step4_Media onSave={saveDraft} onBack={goBack} isSaving={isSaving} />
        )}
        {step === 5 && courseId && (
          <Step5_Publish
            courseId={courseId}
            onBack={goBack}
            onNavigateToStep={(s) => setStep(s as WizardStep)}
          />
        )}
      </CourseWizard>
    </div>
  );
}
