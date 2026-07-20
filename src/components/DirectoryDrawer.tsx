import { X } from 'lucide-react'

interface DirectoryDrawerProps {
  chapters: string[]
  currentChapter: number
  open: boolean
  onClose: () => void
  onSelect: (index: number) => void
}

export function DirectoryDrawer({ chapters, currentChapter, open, onClose, onSelect }: DirectoryDrawerProps) {
  if (!open) return null

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="directory-drawer" role="dialog" aria-modal="true" aria-label="课程目录" onMouseDown={(event) => event.stopPropagation()}>
        <div className="directory-drawer__header">
          <div><p>课程目录</p><h2>8 章完整路线</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭课程目录" title="关闭">
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <ol>
          {chapters.map((chapter, index) => (
            <li key={chapter}>
              <button className={index === currentChapter ? 'is-current' : ''} type="button" onClick={() => onSelect(index)}>
                <span>{String(index + 1).padStart(2, '0')}</span>{chapter}
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  )
}
