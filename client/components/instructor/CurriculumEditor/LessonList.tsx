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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { LessonItem } from './LessonItem';
import { Button } from '@/components/ui/button';
import type { ILesson } from '@/types';

interface Props {
  courseId: string;
  moduleId: string;
  lessons: ILesson[];
  onReorder: (orderedIds: string[]) => Promise<void>;
  onCreateLesson: (moduleId: string) => void;
  onEditLesson: (lesson: ILesson) => void;
  onDeleteLesson: (lessonId: string, moduleId: string) => Promise<void>;
}

/** Sortable list of lessons within one module. */
export function LessonList({
  lessons,
  onReorder,
  onCreateLesson,
  onEditLesson,
  onDeleteLesson,
  moduleId,
}: Props): JSX.Element {
  const [items, setItems] = useState(lessons);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Keep local state in sync when parent prop changes
  if (lessons.length !== items.length || lessons.some((l, i) => l._id !== items[i]?._id)) {
    setItems(lessons);
  }

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((l) => l._id === active.id);
    const newIdx = items.findIndex((l) => l._id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);
    void onReorder(reordered.map((l: { _id: string }) => l._id)).catch(() => {
      setItems(items);
      toast.error('Failed to reorder lessons');
    });
  };

  return (
    <div className="ml-6 mt-2 space-y-1.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((l) => l._id)} strategy={verticalListSortingStrategy}>
          {items.map((lesson) => (
            <LessonItem
              key={lesson._id}
              lesson={lesson}
              onEdit={onEditLesson}
              onDelete={(id) => void onDeleteLesson(id, moduleId)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={() => onCreateLesson(moduleId)}
      >
        <Plus className="size-3.5 mr-1.5" /> Add Lesson
      </Button>
    </div>
  );
}
