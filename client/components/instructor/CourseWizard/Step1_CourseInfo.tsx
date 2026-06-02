'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ICourse } from '@/types';

const CATEGORIES = [
  'programming','data-science','ai-ml','cybersecurity','cloud',
  'web-development','mobile','devops','database','ui-ux',
  'mathematics','physics','chemistry','biology','engineering',
  'business','marketing','finance','language','other',
] as const;

const schema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150),
  category: z.enum(CATEGORIES),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  language: z.string().default('en'),
  shortDescription: z.string().trim().max(200).default(''),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000),
  requirements: z.array(z.object({ value: z.string().trim().min(1) })).max(20).default([]),
  outcomes: z.array(z.object({ value: z.string().trim().min(1) })).min(1, 'At least one outcome').max(20),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Partial<ICourse>;
  onSave: (data: Partial<ICourse>, advance: boolean) => Promise<boolean>;
  isSaving: boolean;
}

/** Step 1 of the course wizard: title, category, description, requirements, outcomes. */
export function Step1_CourseInfo({ initial, onSave, isSaving }: Props): JSX.Element {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? '',
      category: (initial?.category as (typeof CATEGORIES)[number]) ?? 'programming',
      level: initial?.level ?? 'beginner',
      language: initial?.language ?? 'en',
      shortDescription: initial?.shortDescription ?? '',
      description: initial?.description ?? '',
      requirements: (initial?.requirements ?? []).map((v) => ({ value: String(v) })),
      outcomes: (initial?.outcomes && initial.outcomes.length > 0 ? initial.outcomes : ['']).map((v) => ({ value: String(v) })),
    },
  });

  const reqFields = useFieldArray({ control, name: 'requirements' });
  const outFields = useFieldArray({ control, name: 'outcomes' });

  const title = watch('title');
  const slugPreview = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const toPayload = (d: FormData): Partial<ICourse> => ({
    title: d.title,
    category: d.category,
    level: d.level,
    language: d.language,
    shortDescription: d.shortDescription,
    description: d.description,
    requirements: d.requirements.map((r) => r.value),
    outcomes: d.outcomes.map((o) => o.value),
  });

  return (
    <form className="space-y-5">
      <h2 className="font-heading text-xl font-semibold">Course Info</h2>

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register('title')} placeholder="e.g. Complete Python Bootcamp" />
        {title && <p className="mt-1 text-xs text-muted-foreground">Slug: {slugPreview}</p>}
        {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="category">Category *</Label>
          <select id="category" {...register('category')} className="input-base mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="level">Level *</Label>
          <select id="level" {...register('level')} className="input-base mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <Label htmlFor="language">Language</Label>
          <select id="language" {...register('language')} className="input-base mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="shortDescription">Short Description (max 200 chars)</Label>
        <textarea
          id="shortDescription"
          {...register('shortDescription')}
          rows={2}
          maxLength={200}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          placeholder="A one-line pitch shown on course cards…"
        />
      </div>

      <div>
        <Label htmlFor="description">Full Description *</Label>
        <textarea
          id="description"
          {...register('description')}
          rows={5}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
          placeholder="Describe what students will learn, who it's for, and why they should enroll…"
        />
        {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* Requirements */}
      <div>
        <Label>Requirements (max 20)</Label>
        <div className="mt-2 space-y-2">
          {reqFields.fields.map((f, i) => (
            <div key={f.id} className="flex gap-2">
              <Input {...register(`requirements.${i}.value`)} placeholder="e.g. Basic Python knowledge" />
              <Button type="button" variant="ghost" size="icon" onClick={() => reqFields.remove(i)} aria-label="Remove requirement">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {reqFields.fields.length < 20 && (
            <Button type="button" variant="outline" size="sm" onClick={() => reqFields.append({ value: '' })}>
              <Plus className="size-4 mr-1" /> Add Requirement
            </Button>
          )}
        </div>
      </div>

      {/* Learning outcomes */}
      <div>
        <Label>Learning Outcomes * (min 1, max 20)</Label>
        <div className="mt-2 space-y-2">
          {outFields.fields.map((f, i) => (
            <div key={f.id} className="flex gap-2">
              <Input {...register(`outcomes.${i}.value`)} placeholder="e.g. Build REST APIs with FastAPI" />
              {outFields.fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => outFields.remove(i)} aria-label="Remove outcome">
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
          {outFields.fields.length < 20 && (
            <Button type="button" variant="outline" size="sm" onClick={() => outFields.append({ value: '' })}>
              <Plus className="size-4 mr-1" /> Add Outcome
            </Button>
          )}
          {errors.outcomes && <p className="mt-1 text-xs text-destructive">{errors.outcomes.message}</p>}
        </div>
      </div>

      <div className="flex gap-3 border-t pt-4">
        <Button type="button" variant="outline" disabled={isSaving} onClick={handleSubmit((d: FormData) => void onSave(toPayload(d), false))}>
          {isSaving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button type="button" variant="brand" disabled={isSaving} onClick={handleSubmit((d: FormData) => void onSave(toPayload(d), true))}>
          Next: Curriculum →
        </Button>
      </div>
    </form>
  );
}
