'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LessonList } from './LessonList';
import type { ILesson } from '@/types';
import type { ModuleWithLessons } from '@/hooks/useCurriculum';

interface Props {
  courseId: string;
  module: ModuleWithLessons;
  onUpdateTitle: (moduleId: string, title: string) => Promise<void>;
  onDelete: (moduleId: string) => Promise<void>;
  onReorderLessons: (moduleId: string, orderedIds: string[]) => Promise<void>;
  onCreateLesson: (moduleId: string) => void;
  onEditLesson: (lesson: ILesson) => void;
  onDeleteLesson: (lessonId: string, moduleId: string) => Promise<void>;
}

/** Sortable, collapsible module item with inline title editing and lesson list. */
export function ModuleItem({
  courseId,
  module,
  onUpdateTitle,
  onDelete,
  onReorderLessons,
  onCreateLesson,
  onEditLesson,
  onDeleteLesson,
}: Props): JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(module.title);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module._id,
  });

  const saveTitle = async (): Promise<void> => {
    if (titleInput.trim() && titleInput !== module.title) {
      await onUpdateTitle(module._id, titleInput.trim());
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('rounded-xl border bg-card', isDragging && 'opacity-50 ring-2 ring-brand-primary')}
    >
      {/* Module header */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground"
          aria-label="Drag to reorder module"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="text-muted-foreground"
          aria-label={expanded ? 'Collapse module' : 'Expand module'}
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveTitle();
                if (e.key === 'Escape') { setEditing(false); setTitleInput(module.title); }
              }}
              autoFocus
              className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
              aria-label="Module title"
            />
            <button type="button" onClick={() => void saveTitle()} aria-label="Save title" className="text-green-600 hover:text-green-700"><Check className="size-4" /></button>
            <button type="button" onClick={() => { setEditing(false); setTitleInput(module.title); }} aria-label="Cancel edit" className="text-muted-foreground"><X className="size-4" /></button>
          </div>
        ) : (
          <span className="flex-1 font-medium">{module.title}</span>
        )}

        <span className="text-xs text-muted-foreground">{module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}</span>

        <button type="button" onClick={() => setEditing(true)} aria-label="Edit module title" className="rounded p-1 text-muted-foreground hover:bg-accent">
          <Pencil className="size-3.5" />
        </button>
        <button type="button" onClick={() => void onDelete(module._id)} aria-label="Delete module" className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="border-t px-2 pb-3">
          <LessonList
            courseId={courseId}
            moduleId={module._id}
            lessons={module.lessons}
            onReorder={(ids) => onReorderLessons(module._id, ids)}
            onCreateLesson={onCreateLesson}
            onEditLesson={onEditLesson}
            onDeleteLesson={onDeleteLesson}
          />
        </div>
      )}
    </div>
  );
}
