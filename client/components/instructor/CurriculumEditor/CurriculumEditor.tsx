'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ModuleList } from './ModuleList';
import { LessonDrawer } from './LessonDrawer';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { apiClient } from '@/lib/api-client';
import {
  useCurriculumModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useReorderModules,
} from '@/hooks/useCurriculum';
import type { ILesson, ApiResponse } from '@/types';

interface Props {
  courseId: string;
}

/**
 * Root curriculum editor: drag-and-drop modules and lessons,
 * plus a slide-over drawer for editing individual lessons.
 * Lesson CRUD uses apiClient directly so the moduleId can be dynamic at runtime
 * without violating React's rules of hooks.
 */
export function CurriculumEditor({ courseId }: Props): JSX.Element {
  const [activeLesson, setActiveLesson] = useState<ILesson | null>(null);
  const qc = useQueryClient();
  const invalidate = (): void => { void qc.invalidateQueries({ queryKey: ['curriculum', courseId] }); };

  const { data: modules, isLoading, isError, refetch } = useCurriculumModules(courseId);
  const createModule = useCreateModule(courseId);
  const updateModule = useUpdateModule(courseId);
  const deleteModule = useDeleteModule(courseId);
  const reorderModules = useReorderModules(courseId);

  const handleAddModule = async (): Promise<void> => {
    const title = window.prompt('Module title:');
    if (!title?.trim()) return;
    await createModule.mutateAsync({ title: title.trim() });
  };

  const handleDeleteModule = async (moduleId: string): Promise<void> => {
    if (!window.confirm('Delete this module and all its unpublished lessons?')) return;
    await deleteModule.mutateAsync(moduleId).catch((err: { message?: string }) => {
      toast.error(err.message ?? 'Failed to delete module');
    });
  };

  const handleCreateLesson = async (moduleId: string): Promise<void> => {
    const title = window.prompt('Lesson title:');
    if (!title?.trim()) return;
    try {
      const { data } = await apiClient.post<ApiResponse<ILesson>>(
        `/courses/${courseId}/modules/${moduleId}/lessons`,
        { title: title.trim(), type: 'video' },
      );
      invalidate();
      setActiveLesson(data.data);
    } catch {
      toast.error('Failed to create lesson');
    }
  };

  const handleSaveLesson = async (lessonId: string, updates: Partial<ILesson>): Promise<void> => {
    const mod = modules?.find((m) => m.lessons.some((l) => l._id === lessonId));
    if (!mod) return;
    await apiClient.put(
      `/courses/${courseId}/modules/${mod._id}/lessons/${lessonId}`,
      updates,
    );
    invalidate();
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
    invalidate();
    if (activeLesson?._id === lessonId) setActiveLesson(null);
  };

  const handleReorderLessons = async (moduleId: string, orderedIds: string[]): Promise<void> => {
    await apiClient.patch(
      `/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
      { orderedIds },
    );
    invalidate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }
  if (isError) return <ErrorState title="Couldn't load curriculum" onRetry={() => void refetch()} />;

  return (
    <div className="space-y-4">
      {!modules || modules.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No modules yet"
          description="Add your first module to start building your curriculum."
          action={
            <Button variant="brand" onClick={() => void handleAddModule()}>
              <Plus className="size-4 mr-2" /> Add Module
            </Button>
          }
        />
      ) : (
        <>
          <ModuleList
            courseId={courseId}
            modules={modules}
            onReorderModules={(ids) => reorderModules.mutateAsync(ids).then(() => undefined)}
            onUpdateModuleTitle={(id, title) =>
              updateModule.mutateAsync({ id, body: { title } }).then(() => undefined)
            }
            onDeleteModule={handleDeleteModule}
            onReorderLessons={handleReorderLessons}
            onCreateLesson={(mid) => void handleCreateLesson(mid)}
            onEditLesson={setActiveLesson}
            onDeleteLesson={handleDeleteLesson}
          />
          <Button variant="outline" onClick={() => void handleAddModule()} className="w-full">
            <Plus className="size-4 mr-2" /> Add Module
          </Button>
        </>
      )}

      {activeLesson && (
        <LessonDrawer
          lesson={activeLesson}
          courseId={courseId}
          onSave={handleSaveLesson}
          onClose={() => setActiveLesson(null)}
        />
      )}
    </div>
  );
}
