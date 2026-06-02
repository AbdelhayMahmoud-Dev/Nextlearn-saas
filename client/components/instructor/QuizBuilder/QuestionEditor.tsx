'use client';

import { Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { IQuizQuestion, QuizQuestionType } from '@/types';

interface Props {
  question: IQuizQuestion;
  index: number;
  total: number;
  onChange: (q: IQuizQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/** Editor for a single quiz question supporting single, boolean, and multiple types. */
export function QuestionEditor({
  question, index, total, onChange, onDelete, onDuplicate, onMoveUp, onMoveDown,
}: Props): JSX.Element {
  const setType = (type: QuizQuestionType): void => {
    const options = type === 'boolean' ? ['True', 'False'] : question.options.length >= 2 ? question.options : ['', '', '', ''];
    onChange({ ...question, type, options, correctAnswer: [0] });
  };

  const setOption = (i: number, value: string): void => {
    const opts = [...question.options];
    opts[i] = value;
    onChange({ ...question, options: opts });
  };

  const addOption = (): void => {
    if (question.options.length < 6) onChange({ ...question, options: [...question.options, ''] });
  };

  const removeOption = (i: number): void => {
    const opts = question.options.filter((_, idx) => idx !== i);
    const correct = question.correctAnswer.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c));
    onChange({ ...question, options: opts, correctAnswer: correct.length ? correct : [0] });
  };

  const toggleCorrect = (i: number): void => {
    if (question.type === 'single' || question.type === 'boolean') {
      onChange({ ...question, correctAnswer: [i] });
    } else {
      const set = new Set(question.correctAnswer);
      if (set.has(i)) { set.delete(i); } else { set.add(i); }
      onChange({ ...question, correctAnswer: [...set] });
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Q{index + 1}</span>
        {/* Type selector */}
        <div className="flex gap-1">
          {(['single', 'multiple', 'boolean'] as QuizQuestionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${question.type === t ? 'bg-brand-primary text-white' : 'border hover:bg-accent'}`}
            >
              {t === 'single' ? 'Single' : t === 'multiple' ? 'Multi' : 'T/F'}
            </button>
          ))}
        </div>
        {/* Actions */}
        <div className="ml-auto flex gap-1">
          <button type="button" onClick={onMoveUp} disabled={index === 0} aria-label="Move up" className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"><ChevronUp className="size-3.5" /></button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1} aria-label="Move down" className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
          <button type="button" onClick={onDuplicate} aria-label="Duplicate question" className="rounded p-1 text-muted-foreground hover:bg-accent"><Copy className="size-3.5" /></button>
          <button type="button" onClick={onDelete} aria-label="Delete question" className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3.5" /></button>
        </div>
      </div>

      <div>
        <Label htmlFor={`q-${index}-text`}>Question</Label>
        <textarea
          id={`q-${index}-text`}
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          rows={2}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          placeholder="Enter your question…"
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <Label>Options (select correct)</Label>
        {question.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type={question.type === 'multiple' ? 'checkbox' : 'radio'}
              name={`q-${index}-correct`}
              checked={question.correctAnswer.includes(i)}
              onChange={() => toggleCorrect(i)}
              aria-label={`Mark option ${i + 1} as correct`}
              className="shrink-0"
            />
            <Input
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              readOnly={question.type === 'boolean'}
              className={question.type === 'boolean' ? 'bg-muted' : ''}
            />
            {question.type !== 'boolean' && question.options.length > 2 && (
              <button type="button" onClick={() => removeOption(i)} aria-label="Remove option" className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
            )}
          </div>
        ))}
        {question.type !== 'boolean' && question.options.length < 6 && (
          <Button type="button" variant="ghost" size="sm" onClick={addOption}>+ Add Option</Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`q-${index}-explanation`}>Explanation (shown after submission)</Label>
          <textarea
            id={`q-${index}-explanation`}
            value={question.explanation ?? ''}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
            placeholder="Explain why the answer is correct…"
          />
        </div>
        <div>
          <Label htmlFor={`q-${index}-points`}>Points</Label>
          <Input
            id={`q-${index}-points`}
            type="number"
            min={1}
            value={question.points}
            onChange={(e) => onChange({ ...question, points: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
