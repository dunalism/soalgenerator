"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Code,
  RotateCcw,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline.configure(),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert focus:outline-none min-h-[120px] max-h-[300px] overflow-y-auto px-3 py-2 text-sm text-foreground",
      },
    },
  });

  // Sync value from outside if it changes and is different from editor HTML
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary transition-all overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b bg-muted/20 p-1.5 select-none">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${
            editor.isActive("bold")
              ? "bg-muted text-primary font-bold"
              : "text-muted-foreground"
          }`}
          title="Tebal (Bold)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${
            editor.isActive("italic")
              ? "bg-muted text-primary"
              : "text-muted-foreground"
          }`}
          title="Miring (Italic)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${
            editor.isActive("underline")
              ? "bg-muted text-primary"
              : "text-muted-foreground"
          }`}
          title="Garis Bawah (Underline)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border self-center mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${
            editor.isActive("bulletList")
              ? "bg-muted text-primary"
              : "text-muted-foreground"
          }`}
          title="Daftar Simbol (Bullet List)"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${
            editor.isActive("orderedList")
              ? "bg-muted text-primary"
              : "text-muted-foreground"
          }`}
          title="Daftar Angka (Ordered List)"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${
            editor.isActive("code")
              ? "bg-muted text-primary"
              : "text-muted-foreground"
          }`}
          title="Kode (Code)"
        >
          <Code className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border self-center mx-1" />
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          className="p-1.5 rounded hover:bg-muted transition-colors cursor-pointer text-muted-foreground"
          title="Hapus Format"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      {/* Editor Area */}
      <div className="relative">
        <EditorContent editor={editor} />
        {editor.isEmpty && placeholder && (
          <div className="absolute top-2 left-3 text-sm text-muted-foreground/60 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
