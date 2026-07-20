import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { QuizQuestion } from '../content/types'
import { useLearning } from '../state/LearningProvider'

interface QuickCheckProps {
  question: QuizQuestion
}

export function QuickCheck({ question }: QuickCheckProps) {
  const { recordAnswer } = useLearning()
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const correct = selected === question.answer

  const submit = () => {
    if (selected === null) return
    recordAnswer(question, selected)
    setSubmitted(true)
  }

  const retry = () => {
    setSelected(null)
    setSubmitted(false)
  }

  return (
    <section className="quick-check" aria-label="即时检查">
      <span>马上检查</span>
      <h4>{question.prompt}</h4>
      <div className="quick-check__options">
        {question.options.map((option, index) => (
          <label className={submitted && index === question.answer ? 'is-answer' : ''} key={option}>
            <input checked={selected === index} disabled={submitted} name={question.id} onChange={() => setSelected(index)} type="radio" />
            {option}
          </label>
        ))}
      </div>
      {!submitted ? <button className="quick-check__submit" disabled={selected === null} onClick={submit} type="button">检查答案</button> : null}
      {submitted ? (
        <div className={`quick-check__feedback ${correct ? 'is-correct' : 'is-wrong'}`} aria-live="polite">
          {correct ? <CheckCircle2 aria-hidden="true" size={20} /> : <XCircle aria-hidden="true" size={20} />}
          <div><b>{correct ? '答对了' : '还差一点'}</b><p>{question.explanation}</p></div>
          <div className="quick-check__feedback-actions">
            <a href={`#${question.unitId}`}>回看这个知识点</a>
            <button onClick={retry} type="button"><RotateCcw aria-hidden="true" size={14} />再答一次</button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
