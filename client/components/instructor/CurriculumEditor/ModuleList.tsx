'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { ModuleItem } from './ModuleItem';
import type { ILesson } from '@/types';
import type { ModuleWithLessons } from '@/hooks/useCurriculum';

interface Props {
  courseId: string;
  modules: ModuleWithLessons[];
  onReorderModules: (orderedIds: string[]) => Promise<void>;
  onUpdateModuleTitle: (moduleId: string, title: string) => Promise<void>;
  onDeleteModule: (moduleId: string) => Promise<void>;
  onReorderLessons: (moduleId: string, orderedIds: string[]) => Promise<void>;
  onCreateLesson: (moduleId: string) => void;
  onEditLesson: (lesson: ILesson) => void;
  onDeleteLesson: (lessonId: string, moduleId: string) => Promise<void>;
}

/** Sortable list of modules for the curriculum editor. */
export function ModuleList({
  courseId,
  modules,
  onReorderModules,
  onUpdateModuleTitle,
  onDeleteModule,
  onReorderLessons,
  onCreateLesson,
  onEditLesson,
  onDeleteLesson,
}: Props): JSX.Element {
  const [items, setItems] = useState(modules);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (modules.length !== items.length || modules.some((m, i) => m._id !== items[i]?._id)) {
    setItems(modules);
  }

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((m) => m._id === active.id);
    const newIdx = items.findIndex((m) => m._id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);
    void onReorderModules(reordered.map((m: { _id: string }) => m._id)).catch(() => {
      setItems(items);
      toast.error('Failed to reorder modules');
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((m) => m._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((module) => (
            <ModuleItem
              key={module._id}
              courseId={courseId}
              module={module}
              onUpdateTitle={onUpdateModuleTitle}
              onDelete={onDeleteModule}
              onReorderLessons={onReorderLessons}
              onCreateLesson={onCreateLesson}
              onEditLesson={onEditLesson}
              onDeleteLesson={onDeleteLesson}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
