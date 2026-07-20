import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { QuizQuestion } from '../content/types'
import { LearningProvider } from '../state/LearningProvider'
import { ChapterQuiz } from './ChapterQuiz'

const questions: QuizQuestion[] = [
  { id: 'chapter-q1', unitId: 'unit-1', prompt: '第一题', options: ['甲', '乙'], answer: 0, explanation: '第一题解释。' },
  { id: 'chapter-q2', unitId: 'unit-2', prompt: '第二题', options: ['丙', '丁'], answer: 1, explanation: '第二题解释。' },
]

describe('ChapterQuiz', () => {
  it('moves through questions with rationale and finishes with a score', async () => {
    const user = userEvent.setup()
    render(<LearningProvider><ChapterQuiz chapterNumber={1} questions={questions} /></LearningProvider>)

    await user.click(screen.getByRole('button', { name: '开始第 1 章测验' }))
    await user.click(screen.getByRole('radio', { name: '甲' }))
    await user.click(screen.getByRole('button', { name: '提交本题' }))
    expect(screen.getByText('第一题解释。')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '下一题' }))
    await user.click(screen.getByRole('radio', { name: '丙' }))
    await user.click(screen.getByRole('button', { name: '提交本题' }))
    await user.click(screen.getByRole('button', { name: '查看成绩' }))

    expect(screen.getByText('本次得分 1 / 2')).toBeVisible()
    expect(screen.getByRole('button', { name: '再测一次' })).toBeVisible()
  })
})
