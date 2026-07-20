import { useEffect, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { ChapterSection } from './components/ChapterSection'
import { DirectoryDrawer } from './components/DirectoryDrawer'
import { IntroHero } from './components/IntroHero'
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
import { LearningProvider } from './state/LearningProvider'

const chapterTitles = [
  '从提示词到 Harness 系统',
  'AI First 开发与反馈闭环',
  'Bug、质量与自我修复',
  '从 AI 辅助到 AI 主导',
  '市场、个人 Agent 与 SaaS 重构',
  '组织结构与角色融合',
  '未来工程师与复合型人才',
  '人的价值、伦理与谨慎乐观',
]

function CourseApp() {
  const firstChapterHeading = useRef<HTMLHeadingElement>(null)
  const [directoryOpen, setDirectoryOpen] = useState(false)
  const [currentChapter, setCurrentChapter] = useState(0)

  const goToChapter = (index: number) => {
    const section = document.getElementById(`chapter-${index + 1}`)
    const heading = section?.querySelector('h2')
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (heading instanceof HTMLElement) heading.focus({ preventScroll: true })
    setDirectoryOpen(false)
  }

  const startLearning = () => {
    const section = document.getElementById('chapter-1')
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        if (visible) setCurrentChapter(Number((visible.target as HTMLElement).dataset.chapter) - 1)
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
        progress={(currentChapter + 1) / chapterTitles.length}
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
