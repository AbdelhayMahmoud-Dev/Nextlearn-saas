'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { IQuiz } from '@/types';

interface Props {
  settings: Pick<IQuiz, 'passingScore' | 'timeLimit' | 'shuffleQuestions' | 'shuffleOptions' | 'allowRetry' | 'maxAttempts'>;
  onChange: (updates: Partial<IQuiz>) => void;
}

/** Quiz settings panel: passing score, time limit, shuffle, retry. */
export function QuizSettings({ settings, onChange }: Props): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="passingScore">Passing Score (%)</Label>
        <Input
          id="passingScore"
          type="number"
          min={0}
          max={100}
          value={settings.passingScore}
          onChange={(e) => onChange({ passingScore: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="timeLimit">Time Limit (min, 0 = unlimited)</Label>
        <Input
          id="timeLimit"
          type="number"
          min={0}
          value={settings.timeLimit}
          onChange={(e) => onChange({ timeLimit: Number(e.target.value) })}
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.shuffleQuestions}
          onChange={(e) => onChange({ shuffleQuestions: e.target.checked })}
          className="rounded"
        />
        Shuffle questions
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.shuffleOptions}
          onChange={(e) => onChange({ shuffleOptions: e.target.checked })}
          className="rounded"
        />
        Shuffle options
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.allowRetry}
          onChange={(e) => onChange({ allowRetry: e.target.checked })}
          className="rounded"
        />
        Allow retry
      </label>
      {settings.allowRetry && (
        <div>
          <Label htmlFor="maxAttempts">Max Attempts</Label>
          <Input
            id="maxAttempts"
            type="number"
            min={1}
            value={settings.maxAttempts}
            onChange={(e) => onChange({ maxAttempts: Number(e.target.value) })}
          />
        </div>
      )}
    </div>
  );
}
