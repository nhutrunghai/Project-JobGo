import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

function ToolbarButton({ active = false, children, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange, placeholder, label }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'min-h-[150px] px-3 py-3 text-sm leading-6 text-slate-700 outline-none [&_p]:mb-3 [&_p:last-child]:mb-0 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:font-bold [&_ul]:mb-3 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:mb-3 [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:mb-1 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-200 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500',
        'aria-label': label,
      },
    },
    onUpdate: ({ editor: nextEditor }) => onChange(nextEditor.getHTML()),
  })

  useEffect(() => {
    if (!editor || value === editor.getHTML()) return
    editor.commands.setContent(value || '', false)
  }, [editor, value])

  if (!editor) return null

  const run = (command) => () => command(editor.chain().focus()).run()

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-2 py-1.5">
        <ToolbarButton label="Đoạn văn" active={editor.isActive('paragraph')} onClick={run((chain) => chain.setParagraph())}>
          <span className="material-symbols-outlined text-[19px]">format_paragraph</span>
        </ToolbarButton>
        <ToolbarButton label="Tiêu đề" active={editor.isActive('heading', { level: 2 })} onClick={run((chain) => chain.toggleHeading({ level: 2 }))}>
          <span className="text-xs font-extrabold">H2</span>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolbarButton label="In đậm" active={editor.isActive('bold')} onClick={run((chain) => chain.toggleBold())}><span className="font-extrabold">B</span></ToolbarButton>
        <ToolbarButton label="In nghiêng" active={editor.isActive('italic')} onClick={run((chain) => chain.toggleItalic())}><span className="italic">I</span></ToolbarButton>
        <ToolbarButton label="Gạch ngang" active={editor.isActive('strike')} onClick={run((chain) => chain.toggleStrike())}><span className="line-through">S</span></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolbarButton label="Danh sách" active={editor.isActive('bulletList')} onClick={run((chain) => chain.toggleBulletList())}><span className="material-symbols-outlined text-[19px]">format_list_bulleted</span></ToolbarButton>
        <ToolbarButton label="Danh sách đánh số" active={editor.isActive('orderedList')} onClick={run((chain) => chain.toggleOrderedList())}><span className="material-symbols-outlined text-[19px]">format_list_numbered</span></ToolbarButton>
        <ToolbarButton label="Trích dẫn" active={editor.isActive('blockquote')} onClick={run((chain) => chain.toggleBlockquote())}><span className="material-symbols-outlined text-[19px]">format_quote</span></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolbarButton label="Hoàn tác" disabled={!editor.can().undo()} onClick={run((chain) => chain.undo())}><span className="material-symbols-outlined text-[19px]">undo</span></ToolbarButton>
        <ToolbarButton label="Làm lại" disabled={!editor.can().redo()} onClick={run((chain) => chain.redo())}><span className="material-symbols-outlined text-[19px]">redo</span></ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
