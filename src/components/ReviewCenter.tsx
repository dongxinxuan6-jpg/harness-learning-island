import { BookMarked, Brain, CalendarCheck2, Check, RotateCcw, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { chapters } from '../content/chapters'
import { glossary } from '../content/glossary'
import type { QuizQuestion } from '../content/types'
import { useLearningActions, useLearningState } from '../state/LearningProvider'
import { getReviewBucket, type ReviewBucket } from '../state/reviewScheduler'

const bucketLabels: Record<ReviewBucket, string> = {
  today: '今天',
  tomorrow: '明天',
  week: '本周',
  later: '以后',
}

const questions = chapters.flatMap((chapter) => [
  ...chapter.units.map((unit) => unit.check),
  ...chapter.quiz,
])

const questionById = new Map<string, QuizQuestion>(questions.map((question) => [question.id, question]))

interface ReviewCenterProps {
  now?: Date
}

export function ReviewCenter({ now = new Date() }: ReviewCenterProps) {
  const state = useLearningState()
  const { markReview, resetLearning } = useLearningActions()
  const [confirmReset, setConfirmReset] = useState(false)
  const reviews = Object.values(state.reviews)
  const wrongAnswers = Object.values(state.answers).filter((answer) => !answer.correct)
  const correctUnitCount = new Set(Object.values(state.answers).filter((answer) => answer.correct).map((answer) => answer.unitId)).size

  const grouped = useMemo(() => {
    const groups: Record<ReviewBucket, typeof reviews> = { today: [], tomorrow: [], week: [], later: [] }
    reviews.forEach((review) => groups[getReviewBucket(review.dueAt, now)].push(review))
    return groups
  }, [now, reviews])

  const clear = () => {
    resetLearning()
    setConfirmReset(false)
  }

  return (
    <section className="review-center" id="review-center">
      <div className="review-center__inner">
        <header className="review-center__header">
          <div><span>学习闭环</span><h2>复习中心</h2><p>已回答的题目和收藏词卡会按 1、3、7、14、30 天进入这里。</p></div>
          <div className="review-center__stats">
            <div><b>{Object.keys(state.answers).length}</b><span>已答题</span></div>
            <div><b>{correctUnitCount} / 106</b><span>掌握单元</span></div>
            <div><b>{wrongAnswers.length}</b><span>当前错题</span></div>
            <div><b>{state.favoriteTerms.length}</b><span>收藏词卡</span></div>
          </div>
        </header>

        <div className="review-center__schedule">
          {(Object.keys(bucketLabels) as ReviewBucket[]).map((bucket) => (
            <section aria-label={`${bucketLabels[bucket]}复习`} className="review-group" key={bucket}>
              <header><CalendarCheck2 aria-hidden="true" size={18} /><h3>{bucketLabels[bucket]}</h3><span>{grouped[bucket].length} 项</span></header>
              {grouped[bucket].length ? (
                <div className="review-group__items">
                  {grouped[bucket].map((review) => {
                    const question = review.type === 'question' ? questionById.get(review.refId) : undefined
                    const term = review.type === 'term' ? glossary.find((entry) => entry.key === review.refId) : undefined
                    const title = question?.prompt ?? (term ? `${term.english}（${term.chinese}）` : review.refId)
                    const detail = question?.explanation ?? term?.beginner ?? ''
                    return (
                      <article className="review-item" key={review.key}>
                        <div className="review-item__icon">{review.type === 'question' ? <Brain aria-hidden="true" size={17} /> : <BookMarked aria-hidden="true" size={17} />}</div>
                        <div><b>{title}</b><p>{detail}</p>{question ? <a href={`#${question.unitId}`}>回到知识点</a> : null}</div>
                        <div className="review-item__actions">
                          <button aria-label={`记住了：${title}`} onClick={() => markReview(review.key, true)} title="记住了" type="button"><Check aria-hidden="true" size={16} /></button>
                          <button aria-label={`还不熟：${title}`} onClick={() => markReview(review.key, false)} title="还不熟" type="button"><X aria-hidden="true" size={16} /></button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : <p className="review-group__empty">暂无项目</p>}
            </section>
          ))}
        </div>

        <footer className="review-center__reset">
          {!confirmReset ? <button onClick={() => setConfirmReset(true)} type="button"><RotateCcw aria-hidden="true" size={16} />清空学习记录</button> : (
            <div role="alert"><span>这会删除答题、错题、复习日期和收藏。</span><button onClick={clear} type="button">确认清空</button><button onClick={() => setConfirmReset(false)} type="button">取消</button></div>
          )}
        </footer>
      </div>
    </section>
  )
}
