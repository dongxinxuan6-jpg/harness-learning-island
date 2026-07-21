import { useCallback, useEffect, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { ChapterSection } from './components/ChapterSection'
import { DirectoryDrawer } from './components/DirectoryDrawer'
import { IntroHero } from './components/IntroHero'
import { KnowledgeMap } from './components/KnowledgeMap'
import { ProgressRail } from './components/ProgressRail'
import { ReviewCenter } from './components/ReviewCenter'
import { chapter1 } from './content/chapters/chapter1'
import { chapter2 } from './content/chapters/chapter2'
import { chapter3 } from './content/chapters/chapter3'
import { chapter4 } from './content/chapters/chapter4'
import { chapter5 } from './content/chapters/chapter5'
import { chapter6 } from './content/chapters/chapter6'
import { chapter7 } from './content/chapters/chapter7'
import { chapter8 } from './content/chapters/chapter8'
import { AgentConfigurator } from './interactions/AgentConfigurator'
import { BugTriageLab } from './interactions/BugTriageLab'
import { EthicsLab } from './interactions/EthicsLab'
import { IterationSimulator } from './interactions/IterationSimulator'
import { OrgWorkbench } from './interactions/OrgWorkbench'
import { PlanCritic } from './interactions/PlanCritic'
import { ScopeBuilder } from './interactions/ScopeBuilder'
import { TalentMixer } from './interactions/TalentMixer'
import { useReadingProgress } from './hooks/useReadingProgress'
import { LearningProvider, useLearningActions, useLearningState } from './state/LearningProvider'

const chapterTitles = [
  '提示词、上下文与驾驭系统',
  '人工智能优先开发与反馈闭环',
  '错误、质量与自我修复',
  '从人工智能辅助到人工智能主导',
  '市场、个人智能体与软件即服务重构',
  '组织结构与角色融合',
  '未来工程师与复合型人才',
  '人的价值、伦理与谨慎乐观',
]

function CourseApp() {
  const { readingPosition } = useLearningState()
  const { resetReadingPosition } = useLearningActions()
  const firstChapterHeading = useRef<HTMLHeadingElement>(null)
  const [directoryOpen, setDirectoryOpen] = useState(false)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [started, setStarted] = useState(false)

  const handleRestore = useCallback((chapter: number) => {
    setCurrentChapter(Math.min(chapterTitles.length - 1, Math.max(0, chapter - 1)))
    setStarted(true)
  }, [])

  useReadingProgress({ onRestore: handleRestore })

  const goToChapter = (index: number) => {
    const section = document.getElementById(`chapter-${index + 1}`)
    const heading = section?.querySelector('h2')
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (heading instanceof HTMLElement) heading.focus({ preventScroll: true })
    setDirectoryOpen(false)
  }

  const startLearning = () => {
    setStarted(true)
    const section = document.getElementById('chapter-1')
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    firstChapterHeading.current?.focus({ preventScroll: true })
  }

  const restartLearning = () => {
    resetReadingPosition()
    setCurrentChapter(0)
    setStarted(true)
    document.getElementById('chapter-1')?.scrollIntoView({ behavior: 'auto', block: 'start' })
    firstChapterHeading.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const sections = [...document.querySelectorAll<HTMLElement>('[data-chapter]')]
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) {
          setCurrentChapter(Number((visible.target as HTMLElement).dataset.chapter) - 1)
          setStarted(true)
        }
      },
      { rootMargin: '-30% 0px -55%', threshold: [0, 0.3, 0.6] },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <AppHeader
        currentChapter={currentChapter}
        progress={(started ? currentChapter + 1 : 0) / chapterTitles.length}
        started={started}
        canRestart={Boolean(readingPosition)}
        onRestart={restartLearning}
        onOpenDirectory={() => setDirectoryOpen(true)}
      />
      <ProgressRail
        currentChapter={currentChapter}
        chapters={chapterTitles}
        onSelect={goToChapter}
      />
      <DirectoryDrawer
        chapters={chapterTitles}
        currentChapter={currentChapter}
        open={directoryOpen}
        onClose={() => setDirectoryOpen(false)}
        onSelect={goToChapter}
      />
      <main>
        <IntroHero chapters={chapterTitles} onStart={startLearning} />
        <KnowledgeMap />
        <div className="course-flow">
          <ChapterSection chapter={chapter1} interaction={<ScopeBuilder />} headingRef={firstChapterHeading} />
          <ChapterSection chapter={chapter2} interaction={<IterationSimulator />} />
          <ChapterSection chapter={chapter3} interaction={<BugTriageLab />} interactionAfter={8} />
          <ChapterSection chapter={chapter4} interaction={<PlanCritic />} />
          <ChapterSection chapter={chapter5} interaction={<AgentConfigurator />} interactionAfter={6} />
          <ChapterSection chapter={chapter6} interaction={<OrgWorkbench />} interactionAfter={5} />
          <ChapterSection chapter={chapter7} interaction={<TalentMixer />} interactionAfter={8} />
          <ChapterSection chapter={chapter8} interaction={<EthicsLab />} interactionAfter={3} />
        </div>
        <ReviewCenter />
      </main>
    </>
  )
}

export default function App() {
  return <LearningProvider><CourseApp /></LearningProvider>
}
