'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ICourse } from '@/types';

const schema = z.object({
  thumbnail: z.string().url().optional().or(z.literal('')),
  previewVideo: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1)).max(10).default([]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Partial<ICourse>;
  onSave: (data: Partial<ICourse>, advance: boolean) => Promise<boolean>;
  onBack: () => void;
  isSaving: boolean;
}

/** Step 4: thumbnail URL, preview video URL, and tags. */
export function Step4_Media({ initial, onSave, onBack, isSaving }: Props): JSX.Element {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      thumbnail: initial?.thumbnail ?? '',
      previewVideo: initial?.previewVideo ?? '',
      tags: initial?.tags ?? [],
    },
  });

  const tags = watch('tags');
  const [tagInput, setTagInput] = useState('');

  const addTag = (): void => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setValue('tags', [...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string): void => {
    setValue('tags', tags.filter((t) => t !== tag));
  };

  const toPayload = (d: FormData): Partial<ICourse> => ({
    thumbnail: d.thumbnail || undefined,
    previewVideo: d.previewVideo || undefined,
    tags: d.tags,
  });

  return (
    <form className="space-y-5">
      <h2 className="font-heading text-xl font-semibold">Media & SEO</h2>

      <div>
        <Label htmlFor="thumbnail">Thumbnail URL</Label>
        <Input
          id="thumbnail"
          type="url"
          {...register('thumbnail')}
          placeholder="https://res.cloudinary.com/… (use the uploader in the curriculum editor)"
        />
        {errors.thumbnail && <p className="mt-1 text-xs text-destructive">{errors.thumbnail.message}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          Recommended: 1280×720px, WebP. Use the Image Uploader in the curriculum editor to generate a Cloudinary URL.
        </p>
      </div>

      <div>
        <Label htmlFor="previewVideo">Preview Video URL (optional)</Label>
        <Input
          id="previewVideo"
          type="url"
          {...register('previewVideo')}
          placeholder="https://res.cloudinary.com/…/sp_full_hd/m3u8 (HLS URL from video uploader)"
        />
        {errors.previewVideo && <p className="mt-1 text-xs text-destructive">{errors.previewVideo.message}</p>}
      </div>

      <div>
        <Label>Tags (max 10)</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-medium text-brand-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="rounded-full hover:bg-brand-primary/20"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        {tags.length < 10 && (
          <div className="mt-2 flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Type a tag and press Enter"
              className="max-w-64"
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack}>← Back</Button>
        <Button type="button" variant="outline" disabled={isSaving} onClick={handleSubmit((d) => void onSave(toPayload(d), false))}>
          {isSaving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button type="button" variant="brand" disabled={isSaving} onClick={handleSubmit((d) => void onSave(toPayload(d), true))}>
          Next: Publish →
        </Button>
      </div>
    </form>
  );
}
