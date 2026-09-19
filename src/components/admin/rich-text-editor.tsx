"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { MediaPickerDialog } from "@/components/admin/media-picker";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write the article…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const [mediaOpen, setMediaOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: "rounded-lg" } },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg" } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[320px] px-4 py-3 focus:outline-none prose-headings:tracking-tight",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  // Keep the editor in sync when the form resets or loads a different record.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) {
    return (
      <div className="h-[380px] animate-pulse rounded-lg border border-[var(--a-border)] bg-[var(--a-hover)]" />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-input)]">
      <Toolbar editor={editor} onPickImage={() => setMediaOpen(true)} />
      <div className="admin-editor text-[var(--a-fg)]">
        <EditorContent editor={editor} />
      </div>

      <MediaPickerDialog
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(item) => editor.chain().focus().setImage({ src: item.url, alt: item.alt ?? "" }).run()}
      />

      <style>{`
        .admin-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          color: var(--a-subtle);
        }
        .admin-editor .ProseMirror { color: var(--a-fg); }
        .admin-editor .ProseMirror h2,
        .admin-editor .ProseMirror h3,
        .admin-editor .ProseMirror h4,
        .admin-editor .ProseMirror strong { color: var(--a-fg-strong); }
        .admin-editor .ProseMirror a { color: var(--accent); }
        .admin-editor .ProseMirror blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 1rem;
          font-style: normal;
        }
        .admin-editor .ProseMirror pre {
          background: var(--a-panel-2);
          border: 1px solid var(--a-border);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
        }
        .admin-editor .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
        }
        .admin-editor .ProseMirror td,
        .admin-editor .ProseMirror th {
          border: 1px solid var(--a-border);
          padding: 0.5rem 0.75rem;
        }
        .admin-editor .ProseMirror th { background: var(--a-panel-2); }
      `}</style>
    </div>
  );
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  const button = (
    label: string,
    icon: React.ReactNode,
    action: () => void,
    active?: boolean,
  ) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={action}
      className={cn(
        "grid size-8 place-items-center rounded-md text-[var(--a-muted)] transition-colors hover:bg-[var(--a-hover)] hover:text-[var(--a-fg)]",
        active && "bg-[var(--a-active)] text-[var(--a-fg-strong)]",
      )}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--a-border)] bg-[var(--a-panel-2)] p-1.5">
      {button("Bold", <Bold className="size-4" />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {button("Italic", <Italic className="size-4" />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {button("Underline", <UnderlineIcon className="size-4" />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"))}
      {button("Strikethrough", <Strikethrough className="size-4" />, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}

      <span className="mx-1 h-5 w-px bg-[var(--a-border)]" />

      {button("Heading 2", <Heading2 className="size-4" />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
      {button("Heading 3", <Heading3 className="size-4" />, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
      {button("Bullet list", <List className="size-4" />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {button("Numbered list", <ListOrdered className="size-4" />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {button("Quote", <Quote className="size-4" />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
      {button("Code block", <Code className="size-4" />, () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}

      <span className="mx-1 h-5 w-px bg-[var(--a-border)]" />

      {button("Align left", <AlignLeft className="size-4" />, () => editor.chain().focus().setTextAlign("left").run(), editor.isActive({ textAlign: "left" }))}
      {button("Align center", <AlignCenter className="size-4" />, () => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }))}
      {button("Align right", <AlignRight className="size-4" />, () => editor.chain().focus().setTextAlign("right").run(), editor.isActive({ textAlign: "right" }))}

      <span className="mx-1 h-5 w-px bg-[var(--a-border)]" />

      {button("Link", <Link2 className="size-4" />, () => {
        const previous = editor.getAttributes("link").href as string | undefined;
        const href = window.prompt("Link URL", previous ?? "https://");
        if (href === null) return;
        if (href === "") {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
      }, editor.isActive("link"))}
      {button("Insert image", <ImageIcon className="size-4" />, onPickImage)}
      {button("Insert table", <TableIcon className="size-4" />, () =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      )}

      <span className="ml-auto flex items-center gap-0.5">
        {button("Undo", <Undo2 className="size-4" />, () => editor.chain().focus().undo().run())}
        {button("Redo", <Redo2 className="size-4" />, () => editor.chain().focus().redo().run())}
      </span>
    </div>
  );
}
