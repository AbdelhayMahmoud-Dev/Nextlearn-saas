'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Video, FileText, HelpCircle, ClipboardList, Radio, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ILesson, LessonType } from '@/types';

const TYPE_ICONS: Record<LessonType, React.ReactNode> = {
  video: <Video className="size-3.5 text-blue-500" aria-hidden="true" />,
  article: <FileText className="size-3.5 text-green-500" aria-hidden="true" />,
  quiz: <HelpCircle className="size-3.5 text-purple-500" aria-hidden="true" />,
  assignment: <ClipboardList className="size-3.5 text-orange-500" aria-hidden="true" />,
  live: <Radio className="size-3.5 text-red-500" aria-hidden="true" />,
};

interface Props {
  lesson: ILesson;
  onEdit: (lesson: ILesson) => void;
  onDelete: (lessonId: string) => void;
}

/** Sortable lesson row inside a module's lesson list. */
export function LessonItem({ lesson, onEdit, onDelete }: Props): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson._id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm',
        isDragging && 'opacity-50 ring-2 ring-brand-primary',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <span className="shrink-0">{TYPE_ICONS[lesson.type]}</span>

      <span className="flex-1 truncate font-medium">{lesson.title}</span>

      {lesson.isFree && (
        <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Free
        </span>
      )}
      {lesson.isPublished ? (
        <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Live
        </span>
      ) : (
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Draft
        </span>
      )}

      <button
        type="button"
        onClick={() => onEdit(lesson)}
        aria-label={`Edit lesson ${lesson.title}`}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(lesson._id)}
        aria-label={`Delete lesson ${lesson.title}`}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
