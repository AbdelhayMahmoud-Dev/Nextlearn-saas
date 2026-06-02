'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code2, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

function ToolbarBtn({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'rounded p-1.5 transition-colors hover:bg-accent',
        active && 'bg-accent text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Full Tiptap rich-text editor for lesson articles.
 * Includes toolbar, character count, and all Tiptap extensions required
 * for lesson content (no Mathematics extension — deferred, KaTeX causes SSR issues).
 */
export function ArticleEditor({ content, onChange }: Props): JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Start writing your lesson content…' }),
      CharacterCount,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor: updatedEditor }) => onChange(updatedEditor.getHTML()),
    editorProps: {
      attributes: { class: 'prose prose-neutral dark:prose-invert max-w-none min-h-[400px] focus:outline-none p-4' },
    },
  });

  if (!editor) return <div className="h-[400px] animate-pulse rounded-lg bg-muted" />;

  const e = editor;

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/50 p-1.5">
        <ToolbarBtn onClick={() => e.chain().focus().toggleBold().run()} active={e.isActive('bold')} label="Bold"><Bold className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleItalic().run()} active={e.isActive('italic')} label="Italic"><Italic className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleStrike().run()} active={e.isActive('strike')} label="Strikethrough"><Strikethrough className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleCode().run()} active={e.isActive('code')} label="Inline code"><Code className="size-3.5" /></ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 1 }).run()} active={e.isActive('heading', { level: 1 })} label="Heading 1"><Heading1 className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 2 }).run()} active={e.isActive('heading', { level: 2 })} label="Heading 2"><Heading2 className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 3 }).run()} active={e.isActive('heading', { level: 3 })} label="Heading 3"><Heading3 className="size-3.5" /></ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolbarBtn onClick={() => e.chain().focus().toggleBulletList().run()} active={e.isActive('bulletList')} label="Bullet list"><List className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleOrderedList().run()} active={e.isActive('orderedList')} label="Ordered list"><ListOrdered className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleBlockquote().run()} active={e.isActive('blockquote')} label="Blockquote"><Quote className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleCodeBlock().run()} active={e.isActive('codeBlock')} label="Code block"><Code2 className="size-3.5" /></ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolbarBtn onClick={() => e.chain().focus().setTextAlign('left').run()} active={e.isActive({ textAlign: 'left' })} label="Align left"><AlignLeft className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().setTextAlign('center').run()} active={e.isActive({ textAlign: 'center' })} label="Align center"><AlignCenter className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().setTextAlign('right').run()} active={e.isActive({ textAlign: 'right' })} label="Align right"><AlignRight className="size-3.5" /></ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolbarBtn onClick={() => { const url = window.prompt('URL'); if (url) e.chain().focus().setLink({ href: url }).run(); }} active={e.isActive('link')} label="Add link"><Link2 className="size-3.5" /></ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolbarBtn onClick={() => e.chain().focus().undo().run()} label="Undo"><Undo className="size-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().redo().run()} label="Redo"><Redo className="size-3.5" /></ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Character count */}
      <div className="border-t bg-muted/30 px-4 py-1.5 text-right text-xs text-muted-foreground">
        {editor.storage.characterCount?.characters() ?? 0} characters
      </div>
    </div>
  );
}
