import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KnowledgeMap } from './KnowledgeMap'

describe('KnowledgeMap', () => {
  it('connects all eight chapters and reveals the selected relationship', async () => {
    const user = userEvent.setup()
    render(<KnowledgeMap />)

    expect(screen.getByRole('heading', { name: '全局思维导图' })).toBeVisible()
    expect(screen.getAllByRole('button', { name: /查看第/ })).toHaveLength(8)

    await user.click(screen.getByRole('button', { name: /查看第 7 章/ }))
    expect(screen.getByRole('heading', { level: 3, name: '专业深度 × 架构能力 × 产品与市场判断' })).toBeVisible()
  })
})
