import type { ReactNode, RefObject } from 'react'
import type { Chapter } from '../content/types'
import { ChapterQuiz } from './ChapterQuiz'
import { LearningUnitCard } from './LearningUnitCard'

interface ChapterSectionProps {
  chapter: Chapter
  interaction: ReactNode
  interactionAfter?: number
  headingRef?: RefObject<HTMLHeadingElement | null>
}

export function ChapterSection({ chapter, interaction, interactionAfter = 4, headingRef }: ChapterSectionProps) {
  return (
    <section className="chapter-section" data-chapter={chapter.number} id={chapter.id}>
      <header className="chapter-section__header">
        <p>第 {chapter.number} 章 · {chapter.units.length} 个知识单元</p>
        <h2 ref={headingRef} tabIndex={-1}>第 {chapter.number} 章：{chapter.title}</h2>
        <div className="chapter-section__objectives">
          <b>学完你能做到</b>
          <ul>{chapter.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
        </div>
      </header>
      <div className="chapter-section__units">
        {chapter.units.map((unit, index) => (
          <div key={unit.id}>
            <LearningUnitCard unit={unit} index={index} />
            {index === interactionAfter ? (
              <section className="chapter-interaction" aria-labelledby={`${chapter.id}-interaction`}>
                <div className="chapter-interaction__header">
                  <p>动手理解</p>
                  <h3 id={`${chapter.id}-interaction`}>{chapter.interaction.title}</h3>
                  <span>{chapter.interaction.description}</span>
                </div>
                {interaction}
              </section>
            ) : null}
          </div>
        ))}
      </div>
      <ChapterQuiz chapterNumber={chapter.number} questions={chapter.quiz} />
      <footer className="chapter-section__recap">
        <p>本章已覆盖 {chapter.units.length} 个知识单元</p>
        <h3>{chapter.recap}</h3>
        <span>{chapter.next}</span>
      </footer>
    </section>
  )
}
