'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { QuizSettings } from './QuizSettings';
import { QuestionEditor } from './QuestionEditor';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { useCreateQuiz, useUpdateQuiz } from '@/hooks/useQuizBuilder';
import type { IQuiz, IQuizQuestion, QuizQuestionType } from '@/types';

const DEFAULT_QUESTION: IQuizQuestion = {
  text: '',
  type: 'single',
  options: ['', '', '', ''],
  correctAnswer: [0],
  points: 1,
};

interface Props {
  lessonId: string;
  initialQuiz?: IQuiz | null;
}

/**
 * Quiz builder root: settings panel + sortable question list.
 * Auto-saves after 1500ms of inactivity.
 */
export function QuizBuilder({ lessonId, initialQuiz }: Props): JSX.Element {
  const [quiz, setQuiz] = useState<Partial<IQuiz> | null>(initialQuiz ?? null);
  // initialQuiz.questions are IQuizQuestionPublic (no correctAnswer on public shape)
  // but the instructor view returns full questions with correctAnswer.
  const [questions, setQuestions] = useState<IQuizQuestion[]>(
    (initialQuiz?.questions as IQuizQuestion[] | undefined) ?? [],
  );
  const [settings, setSettings] = useState({
    passingScore: initialQuiz?.passingScore ?? 70,
    timeLimit: initialQuiz?.timeLimit ?? 0,
    shuffleQuestions: initialQuiz?.shuffleQuestions ?? false,
    shuffleOptions: initialQuiz?.shuffleOptions ?? false,
    allowRetry: initialQuiz?.allowRetry ?? true,
    maxAttempts: initialQuiz?.maxAttempts ?? 3,
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz(quiz?._id ?? '');

  const save = useCallback(async (): Promise<void> => {
    setSaveStatus('saving');
    try {
      const body = { lessonId, questions, ...settings };
      if (!quiz?._id) {
        const created = await createQuiz.mutateAsync(body);
        setQuiz(created);
      } else {
        await updateQuiz.mutateAsync(body);
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
      toast.error('Failed to save quiz');
    }
  }, [quiz, lessonId, questions, settings, createQuiz, updateQuiz]);

  // Auto-save debounce
  useEffect(() => {
    setSaveStatus('unsaved');
    const timer = setTimeout(() => { void save(); }, 1500);
    return () => clearTimeout(timer);
  }, [questions, settings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void save(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const addQuestion = (type: QuizQuestionType = 'single'): void => {
    const q: IQuizQuestion = {
      ...DEFAULT_QUESTION,
      type,
      options: type === 'boolean' ? ['True', 'False'] : ['', '', '', ''],
    };
    setQuestions((prev) => [...prev, q]);
  };

  const updateQuestion = (index: number, q: IQuizQuestion): void => {
    setQuestions((prev) => prev.map((old, i) => (i === index ? q : old)));
  };

  const deleteQuestion = (index: number): void => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateQuestion = (index: number): void => {
    const copy = { ...questions[index] };
    setQuestions((prev) => [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down'): void => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const arr = [...questions];
    [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
    setQuestions(arr);
  };

  return (
    <div className="space-y-6">
      {/* Save indicator */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Quiz Builder</h2>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${saveStatus === 'unsaved' ? 'text-orange-500' : saveStatus === 'saving' ? 'text-muted-foreground' : 'text-green-600'}`}>
            {saveStatus === 'saving' ? <Loader2 className="inline size-3.5 animate-spin" /> : null}
            {' '}{saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving…' : '● Unsaved'}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void save()}>
            <Save className="size-3.5 mr-1.5" /> Save
          </Button>
        </div>
      </div>

      {/* Settings */}
      <section className="rounded-xl border p-4">
        <h3 className="mb-3 text-sm font-semibold">Settings</h3>
        <QuizSettings settings={settings} onChange={(u) => setSettings((s) => ({ ...s, ...u }))} />
      </section>

      {/* Questions */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Questions ({questions.length})</h3>
        {questions.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No questions yet"
            description="Add your first question to get started."
          />
        ) : (
          questions.map((q, i) => (
            <QuestionEditor
              key={i}
              question={q}
              index={i}
              total={questions.length}
              onChange={(updated) => updateQuestion(i, updated)}
              onDelete={() => deleteQuestion(i)}
              onDuplicate={() => duplicateQuestion(i)}
              onMoveUp={() => moveQuestion(i, 'up')}
              onMoveDown={() => moveQuestion(i, 'down')}
            />
          ))
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('single')}>
            <Plus className="size-3.5 mr-1" /> Single choice
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('multiple')}>
            <Plus className="size-3.5 mr-1" /> Multi-select
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('boolean')}>
            <Plus className="size-3.5 mr-1" /> True/False
          </Button>
        </div>
      </section>
    </div>
  );
}
