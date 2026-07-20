import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface DirectoryDrawerProps {
  chapters: string[]
  currentChapter: number
  open: boolean
  onClose: () => void
  onSelect: (index: number) => void
}

export function DirectoryDrawer({ chapters, currentChapter, open, onClose, onSelect }: DirectoryDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')]
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="directory-drawer" ref={dialogRef} role="dialog" aria-modal="true" aria-label="课程目录" onMouseDown={(event) => event.stopPropagation()}>
        <div className="directory-drawer__header">
          <div><p>课程目录</p><h2>8 章完整路线</h2></div>
          <button className="icon-button" ref={closeButtonRef} type="button" onClick={onClose} aria-label="关闭课程目录" title="关闭">
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <ol>
          {chapters.map((chapter, index) => (
            <li key={chapter}>
              <button aria-current={index === currentChapter ? 'page' : undefined} className={index === currentChapter ? 'is-current' : ''} type="button" onClick={() => onSelect(index)}>
                <span>{String(index + 1).padStart(2, '0')}</span>{chapter}
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  )
}
