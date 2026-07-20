interface ProgressRailProps {
  chapters: string[]
  currentChapter: number
  onSelect: (index: number) => void
}

export function ProgressRail({ chapters, currentChapter, onSelect }: ProgressRailProps) {
  return (
    <nav className="progress-rail" aria-label="快速章节导航">
      {chapters.map((chapter, index) => (
        <button
          className={index === currentChapter ? 'is-current' : ''}
          type="button"
          key={chapter}
          onClick={() => onSelect(index)}
          aria-label={`前往第 ${index + 1} 章：${chapter}`}
          title={`第 ${index + 1} 章：${chapter}`}
        />
      ))}
    </nav>
  )
}
