'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X, Save, Loader2, Video, FileText, HelpCircle, ClipboardList, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoLessonForm } from './VideoLessonForm';
import type { ILesson, LessonType } from '@/types';

// ArticleEditor uses Tiptap — client only
const ArticleEditor = dynamic(
  () => import('./ArticleEditor').then((m) => m.ArticleEditor),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" /> },
);

const TABS: { type: LessonType; label: string; icon: React.ReactNode }[] = [
  { type: 'video', label: 'Video', icon: <Video className="size-3.5" /> },
  { type: 'article', label: 'Article', icon: <FileText className="size-3.5" /> },
  { type: 'quiz', label: 'Quiz', icon: <HelpCircle className="size-3.5" /> },
  { type: 'assignment', label: 'Assignment', icon: <ClipboardList className="size-3.5" /> },
  { type: 'live', label: 'Live', icon: <Radio className="size-3.5" /> },
];

interface Props {
  lesson: ILesson | null;
  courseId: string;
  onSave: (lessonId: string, updates: Partial<ILesson>) => Promise<void>;
  onClose: () => void;
}

/**
 * Slide-over drawer for editing a lesson.
 * Handles all lesson types: video, article, quiz, assignment, live.
 */
export function LessonDrawer({ lesson, courseId, onSave, onClose }: Props): JSX.Element {
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [type, setType] = useState<LessonType>(lesson?.type ?? 'video');
  const [isFree, setIsFree] = useState(lesson?.isFree ?? false);
  const [isPublished, setIsPublished] = useState(lesson?.isPublished ?? false);
  const [articleContent, setArticleContent] = useState(lesson?.content?.article ?? '');
  const [videoContent, setVideoContent] = useState(lesson?.content ?? { attachments: [] });
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setType(lesson.type);
      setIsFree(lesson.isFree);
      setIsPublished(lesson.isPublished);
      setArticleContent(lesson.content?.article ?? '');
      setVideoContent(lesson.content ?? { attachments: [] });
      setIsDirty(false);
    }
  }, [lesson]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const handleSave = async (): Promise<void> => {
    if (!lesson) return;
    setSaving(true);
    try {
      const updates: Partial<ILesson> = {
        title,
        type,
        isFree,
        isPublished,
        content: type === 'article'
          ? { ...lesson.content, article: articleContent }
          : type === 'video'
          ? videoContent
          : lesson.content,
      };
      await onSave(lesson._id, updates);
      setIsDirty(false);
      toast.success('Lesson saved');
    } catch {
      toast.error('Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut: Ctrl/Cmd + S
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!lesson) return <></>;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Edit lesson">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            className="flex-1 border-0 bg-transparent p-0 text-base font-semibold focus-visible:ring-0"
            aria-label="Lesson title"
          />
          <span className={`text-xs ${isDirty ? 'text-orange-500' : 'text-green-600'}`}>
            {isDirty ? '● Unsaved' : '✓ Saved'}
          </span>
          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span className="ml-1 hidden sm:inline">Save</span>
          </Button>
          <button type="button" onClick={onClose} aria-label="Close drawer" className="rounded-md p-1 hover:bg-accent">
            <X className="size-5" />
          </button>
        </div>

        {/* Lesson type tabs */}
        <div className="flex gap-0 border-b px-4">
          {TABS.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => { setType(tab.type); markDirty(); }}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors ${
                type === tab.type
                  ? 'border-brand-primary font-medium text-brand-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {type === 'video' && (
            <VideoLessonForm
              content={videoContent}
              onChange={(c) => { setVideoContent((prev) => ({ ...prev, ...c })); markDirty(); }}
            />
          )}
          {type === 'article' && (
            <ArticleEditor
              content={articleContent}
              onChange={(html) => { setArticleContent(html); markDirty(); }}
            />
          )}
          {type === 'quiz' && (
            <div className="rounded-lg border p-6 text-center">
              <HelpCircle className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Quiz questions are edited in the Quiz Builder.
              </p>
              <a
                href={`/instructor/courses/${courseId}/quiz/${lesson._id}`}
                className="mt-3 inline-block text-sm text-brand-primary hover:underline"
              >
                Open Quiz Builder →
              </a>
            </div>
          )}
          {(type === 'assignment' || type === 'live') && (
            <div className="rounded-lg border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {type === 'assignment' ? 'Assignment settings are managed from the Assignments page.' : 'Live session link is managed from the Live Sessions page.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer: free preview + published toggles */}
        <div className="flex items-center gap-6 border-t px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => { setIsFree(e.target.checked); markDirty(); }}
              className="rounded"
            />
            <span>Free Preview</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => { setIsPublished(e.target.checked); markDirty(); }}
              className="rounded"
            />
            <span>Published</span>
          </label>
          <p className="ml-auto text-xs text-muted-foreground">Ctrl+S to save</p>
        </div>
      </div>
    </div>
  );
}
