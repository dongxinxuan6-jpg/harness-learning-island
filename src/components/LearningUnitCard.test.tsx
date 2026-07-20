import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LearningUnit } from '../content/types'
import { LearningUnitCard } from './LearningUnitCard'

const fixture: LearningUnit = {
  id: 'fixture-unit',
  source: { start: 0, end: 30, speakers: [1] },
  title: '为什么需要系统',
  takeaway: '一次好答案不等于一个可靠系统。',
  beginner: '模型像一名刚入职的新员工，需要工作环境和检查机制。',
  example: '写一篇文章成功，不代表每天都能稳定写好。',
  principle: '反馈、测试和权限共同决定系统能否长期运行。',
  misconception: '不要把更长的提示词当作完整系统。',
  extension: '这和控制系统中的反馈回路有关。',
  terms: ['harness-engineering', 'feedback'],
  check: {
    id: 'fixture-check',
    prompt: '哪个说法更准确？',
    options: ['只写长提示词', '建立反馈系统'],
    answer: 1,
    explanation: '可靠工作需要反馈与测试。',
    unitId: 'fixture-unit',
  },
}

describe('LearningUnitCard', () => {
  it('shows beginner content first and reveals the complete principle on demand', async () => {
    const user = userEvent.setup()
    render(<LearningUnitCard unit={fixture} />)

    expect(screen.getByText(fixture.beginner)).toBeVisible()
    expect(screen.queryByText(fixture.principle)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '看原理' }))

    expect(screen.getByText(fixture.principle)).toBeVisible()
    expect(screen.getByRole('button', { name: '收起原理' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders every term with adjacent Chinese meaning', async () => {
    const user = userEvent.setup()
    render(<LearningUnitCard unit={fixture} />)

    await user.click(screen.getByRole('button', { name: '英文词卡' }))

    expect(screen.getByText('Harness Engineering（驾驭系统工程）')).toBeVisible()
    expect(screen.getByText('Feedback（反馈）')).toBeVisible()
  })
})
