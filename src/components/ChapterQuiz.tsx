import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { QuizQuestion } from '../content/types'
import { useLearningActions } from '../state/LearningProvider'

interface ChapterQuizProps {
  chapterNumber: number
  questions: QuizQuestion[]
}

export function ChapterQuiz({ chapterNumber, questions }: ChapterQuizProps) {
  const { recordAnswer } = useLearningActions()
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const question = questions[index]
  const correct = selected === question?.answer

  const submit = () => {
    if (selected === null || !question) return
    recordAnswer(question, selected)
    if (selected === question.answer) setScore((value) => value + 1)
    setSubmitted(true)
  }

  const advance = () => {
    if (index === questions.length - 1) {
      setFinished(true)
      return
    }
    setIndex((value) => value + 1)
    setSelected(null)
    setSubmitted(false)
  }

  const restart = () => {
    setStarted(true)
    setFinished(false)
    setIndex(0)
    setSelected(null)
    setSubmitted(false)
    setScore(0)
  }

  if (!started) {
    return (
      <section className="chapter-quiz chapter-quiz--closed">
        <div><span>章节测验</span><h3>第 {chapterNumber} 章 · {questions.length} 题</h3></div>
        <button onClick={() => setStarted(true)} type="button">开始第 {chapterNumber} 章测验<ArrowRight aria-hidden="true" size={17} /></button>
      </section>
    )
  }

  if (finished) {
    return (
      <section className="chapter-quiz chapter-quiz--result" aria-live="polite">
        <span>章节测验完成</span>
        <h3>本次得分 {score} / {questions.length}</h3>
        <p>{score === questions.length ? '本章概念已经连起来了。' : '错题已进入复习中心，可以回到对应知识点再看一层。'}</p>
        <button onClick={restart} type="button"><RotateCcw aria-hidden="true" size={16} />再测一次</button>
      </section>
    )
  }

  return (
    <section className="chapter-quiz">
      <header><span>第 {index + 1} / {questions.length} 题</span><progress aria-label="章节测验进度" max={questions.length} value={index + 1} /></header>
      <h3>{question.prompt}</h3>
      <div className="chapter-quiz__options">
        {question.options.map((option, optionIndex) => (
          <label className={submitted && optionIndex === question.answer ? 'is-answer' : ''} key={option}>
            <input checked={selected === optionIndex} disabled={submitted} name={question.id} onChange={() => setSelected(optionIndex)} type="radio" />
            {option}
          </label>
        ))}
      </div>
      {!submitted ? <button className="secondary-button" disabled={selected === null} onClick={submit} type="button">提交本题</button> : (
        <div className={`chapter-quiz__feedback ${correct ? 'is-correct' : 'is-wrong'}`} aria-live="polite">
          {correct ? <CheckCircle2 aria-hidden="true" size={20} /> : <XCircle aria-hidden="true" size={20} />}
          <p><b>{correct ? '回答正确。' : '这次选错了。'}</b>{question.explanation}</p>
          <button onClick={advance} type="button">{index === questions.length - 1 ? '查看成绩' : '下一题'}<ArrowRight aria-hidden="true" size={16} /></button>
        </div>
      )}
    </section>
  )
}
