import { BookOpen, Menu, RotateCcw } from 'lucide-react'

interface AppHeaderProps {
  currentChapter: number
  progress: number
  started: boolean
  canRestart: boolean
  onRestart: () => void
  onOpenDirectory: () => void
}

export function AppHeader({ currentChapter, progress, started, canRestart, onRestart, onOpenDirectory }: AppHeaderProps) {
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
      <div className="app-header__actions">
        {canRestart ? (
          <button
            className="icon-button"
            type="button"
            onClick={() => {
              if (window.confirm('回到第一章开头？答题、错题、收藏和复习记录都会保留。')) onRestart()
            }}
            aria-label="从头开始"
            title="从头开始"
          >
            <RotateCcw aria-hidden="true" size={19} />
          </button>
        ) : null}
        <button className="icon-button" type="button" onClick={onOpenDirectory} aria-label="打开课程目录" title="课程目录">
          <Menu aria-hidden="true" size={20} />
        </button>
      </div>
    </header>
  )
}
