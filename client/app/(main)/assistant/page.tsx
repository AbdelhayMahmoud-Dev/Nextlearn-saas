'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bot, Loader2, Plus, SendHorizonal, Sparkles, Trash2, User } from 'lucide-react';
import {
  useAIStatus,
  useAIRecommendations,
  useConversation,
  useConversations,
  useDeleteConversation,
  useTutorChat,
  type AIMessage,
} from '@/hooks/useAI';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PROVIDER_LABEL: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  local: 'Built-in assistant',
};

export default function AssistantPage(): JSX.Element {
  const status = useAIStatus();
  const [page] = useState(1);
  const conversations = useConversations(page);
  const [activeId, setActiveId] = useState<string | null>(null);
  const detail = useConversation(activeId);
  const tutor = useTutorChat();
  const deleteConv = useDeleteConversation();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync the loaded thread into local message state when switching conversations.
  useEffect(() => {
    if (activeId && detail.data) setMessages(detail.data.messages);
  }, [activeId, detail.data]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const startNew = (): void => {
    setActiveId(null);
    setMessages([]);
    setInput('');
  };

  const send = (): void => {
    const text = input.trim();
    if (!text || tutor.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    tutor.mutate(
      { message: text, conversationId: activeId ?? undefined },
      {
        onSuccess: (data) => {
          setActiveId(data.conversationId);
          setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        },
        onError: (e) => {
          toast.error(e.message);
          setMessages((prev) => prev.slice(0, -1));
        },
      },
    );
  };

  const onDelete = (id: string): void => {
    deleteConv.mutate(id, {
      onSuccess: () => {
        toast.success('Conversation deleted');
        if (activeId === id) startNew();
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const recs = useAIRecommendations();

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-bold tracking-tight">
            <Sparkles className="size-7 text-brand-primary" /> Learning Assistant
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask questions, get summaries, and find your next course.
            {status.data && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {PROVIDER_LABEL[status.data.active] ?? status.data.active}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Conversation list */}
        <aside className="space-y-3">
          <Button variant="brand" className="w-full" onClick={startNew}>
            <Plus className="size-4" /> New chat
          </Button>
          <div className="space-y-1">
            {conversations.data?.items.length === 0 && (
              <p className="px-2 py-4 text-sm text-muted-foreground">No conversations yet.</p>
            )}
            {conversations.data?.items.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  activeId === c.id ? 'bg-accent' : 'hover:bg-accent/60',
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className="min-w-0 flex-1 truncate text-left"
                  title={c.title}
                >
                  {c.title}
                </button>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={() => onDelete(c.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat window */}
        <section className="flex min-h-[60vh] flex-col rounded-xl border bg-card">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Bot className="size-10" />
                <p className="max-w-sm text-sm">
                  Ask me anything about your courses. I&apos;ll answer using the material you&apos;re
                  studying.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    m.role === 'user' ? 'bg-brand-primary text-brand-primary-foreground' : 'bg-muted',
                  )}
                >
                  {m.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm',
                    m.role === 'user' ? 'bg-brand-primary text-brand-primary-foreground' : 'bg-muted',
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {tutor.isPending && (
              <div className="flex gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center rounded-2xl bg-muted px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 border-t p-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask a question…"
              aria-label="Message"
              className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" variant="brand" size="icon" disabled={!input.trim() || tutor.isPending}>
              <SendHorizonal className="size-4" />
            </Button>
          </form>
        </section>
      </div>

      {/* Recommendations */}
      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold">Recommended for you</h2>
        {recs.data && <p className="text-sm text-muted-foreground">{recs.data.reason}</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recs.isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          {recs.data?.courses.map((c) => {
            const onSale = c.salePrice !== undefined && c.salePrice < c.price;
            return (
              <Link
                key={c._id}
                href={`/courses/${c.slug}`}
                className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:border-brand-primary"
              >
                <span className="text-xs font-medium text-brand-primary">{c.category}</span>
                <span className="line-clamp-2 font-medium leading-snug">{c.title}</span>
                <span className="mt-auto pt-2 text-sm font-semibold">
                  {c.price === 0 ? 'Free' : formatPrice(onSale ? (c.salePrice as number) : c.price)}
                </span>
              </Link>
            );
          })}
          {recs.data?.courses.length === 0 && (
            <p className="text-sm text-muted-foreground">No recommendations available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
