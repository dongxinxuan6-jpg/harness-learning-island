import { BookOpenText, CircleAlert, FlaskConical, Languages, Lightbulb, Telescope } from 'lucide-react'
import type { LearningUnit } from '../content/types'
import { useLearning } from '../state/LearningProvider'
import { ExpandableLayer } from './ExpandableLayer'
import { QuickCheck } from './QuickCheck'
import { TermList } from './TermList'

interface LearningUnitCardProps {
  unit: LearningUnit
  index?: number
}

export function LearningUnitCard({ unit, index }: LearningUnitCardProps) {
  const { state, toggleFavorite } = useLearning()

  return (
    <article className="learning-unit" id={unit.id}>
      <header className="learning-unit__header">
        {index !== undefined ? <span className="learning-unit__index">知识 {String(index + 1).padStart(2, '0')}</span> : null}
        <h3>{unit.title}</h3>
        <p className="learning-unit__takeaway"><Lightbulb aria-hidden="true" size={19} />{unit.takeaway}</p>
      </header>
      <div className="learning-unit__beginner">
        <span>小白解释</span>
        <p>{unit.beginner}</p>
      </div>
      <div className="learning-unit__layers">
        <ExpandableLayer label="看例子" collapseLabel="收起例子" icon={<FlaskConical aria-hidden="true" size={17} />}>
          <p>{unit.example}</p>
        </ExpandableLayer>
        <ExpandableLayer label="看原理" collapseLabel="收起原理" icon={<BookOpenText aria-hidden="true" size={17} />}>
          <p>{unit.principle}</p>
        </ExpandableLayer>
        <ExpandableLayer label="别这样理解" collapseLabel="收起误区" icon={<CircleAlert aria-hidden="true" size={17} />}>
          <p>{unit.misconception}</p>
        </ExpandableLayer>
        <ExpandableLayer label="英文词卡" collapseLabel="收起词卡" icon={<Languages aria-hidden="true" size={17} />}>
          <TermList termKeys={unit.terms} favorites={new Set(state.favoriteTerms)} onToggleFavorite={toggleFavorite} />
        </ExpandableLayer>
        <ExpandableLayer label="再多学一点" collapseLabel="收起延伸" icon={<Telescope aria-hidden="true" size={17} />}>
          <p>{unit.extension}</p>
        </ExpandableLayer>
      </div>
      <QuickCheck question={unit.check} />
    </article>
  )
}
