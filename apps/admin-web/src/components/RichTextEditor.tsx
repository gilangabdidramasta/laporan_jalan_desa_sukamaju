import { useEffect, useRef } from 'react'
import { cn } from '../lib/format'

const TOOLS: Array<{ command: string; arg?: string; icon: string; label: string }> = [
  { command: 'bold', icon: 'format_bold', label: 'Tebal' },
  { command: 'italic', icon: 'format_italic', label: 'Miring' },
  { command: 'insertUnorderedList', icon: 'format_list_bulleted', label: 'Daftar' },
  { command: 'formatBlock', arg: 'blockquote', icon: 'format_quote', label: 'Kutipan' },
]

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Tulis isi berita…',
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (document.activeElement === element) return
    if (element.innerHTML !== value) {
      element.innerHTML = value
    }
  }, [value])

  const exec = (command: string, arg?: string) => {
    const element = ref.current
    if (!element) return
    element.focus()
    document.execCommand(command, false, arg)
    onChange(element.innerHTML)
  }

  const addLink = () => {
    const url = window.prompt('Masukkan URL tautan (https://…)')
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      window.alert('Tautan harus dimulai dengan http:// atau https://')
      return
    }
    exec('createLink', url)
  }

  return (
    <div className="rounded-md border border-border-strong bg-surface-container-lowest overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      <div className="flex items-center gap-0.5 border-b border-border-subtle bg-surface-container-low px-1.5 py-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.command}
            type="button"
            onClick={() => exec(tool.command, tool.arg)}
            className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            title={tool.label}
            aria-label={tool.label}
          >
            <span className="material-symbols-outlined text-[19px]">{tool.icon}</span>
          </button>
        ))}
        <span className="w-px h-5 bg-border-subtle mx-1" />
        <button
          type="button"
          onClick={addLink}
          className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          title="Sisipkan tautan"
          aria-label="Sisipkan tautan"
        >
          <span className="material-symbols-outlined text-[19px]">link</span>
        </button>
        <span className="ml-auto pr-1 font-caption text-[10px] text-on-surface-variant uppercase tracking-wider">
          Rich text
        </span>
      </div>

      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Isi berita"
        data-placeholder={placeholder}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
        className={cn(
          'min-h-[280px] px-3.5 py-3 font-body-md text-body-md text-on-surface outline-none leading-relaxed',
          '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-on-surface-variant/70',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:my-1',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-on-surface-variant [&_blockquote]:my-2',
          '[&_a]:text-primary [&_a]:underline',
          '[&_p]:my-2',
        )}
      />
    </div>
  )
}
