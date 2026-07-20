import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { QuizQuestion } from '../content/types'
import { LearningProvider } from '../state/LearningProvider'
import { QuickCheck } from './QuickCheck'

const question: QuizQuestion = {
  id: 'quick-1', unitId: 'unit-1', prompt: '可靠系统需要什么？', options: ['只要长提示词', '反馈与测试'], answer: 1, explanation: '持续反馈和测试才能稳定改进。',
}

describe('QuickCheck', () => {
  it('gives immediate rationale and a route back to the learning unit', async () => {
    const user = userEvent.setup()
    render(<LearningProvider><QuickCheck question={question} /></LearningProvider>)

    await user.click(screen.getByRole('radio', { name: '反馈与测试' }))
    await user.click(screen.getByRole('button', { name: '检查答案' }))

    expect(screen.getByText('答对了')).toBeVisible()
    expect(screen.getByText(question.explanation)).toBeVisible()
    expect(screen.getByRole('link', { name: '回看这个知识点' })).toHaveAttribute('href', '#unit-1')
  })
})
