import { BookOpen, Menu } from 'lucide-react'

interface AppHeaderProps {
  currentChapter: number
  progress: number
  started: boolean
  onOpenDirectory: () => void
}

export function AppHeader({ currentChapter, progress, started, onOpenDirectory }: AppHeaderProps) {
  return (
    <header className="app-header">
      <a className="app-header__brand" href="#top" aria-label="返回课程起点">
        <span className="app-header__mark"><BookOpen aria-hidden="true" size={18} /></span>
        <span>驾驭系统学习岛</span>
      </a>
      <div className="app-header__status" aria-label={`学习进度 ${Math.round(progress * 100)}%`}>
        <span>{started ? `第 ${currentChapter + 1} 章` : '准备学习'}</span>
        <span className="app-header__meter" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </span>
      </div>
      <button className="icon-button" type="button" onClick={onOpenDirectory} aria-label="打开课程目录" title="课程目录">
        <Menu aria-hidden="true" size={20} />
      </button>
    </header>
  )
}
