import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlanCritic } from './PlanCritic'

describe('PlanCritic', () => {
  it('improves the plan through explicit architecture critiques', async () => {
    const user = userEvent.setup()
    render(<PlanCritic />)

    await user.click(screen.getByRole('button', { name: '指出安全缺陷' }))
    await user.click(screen.getByRole('button', { name: '指出延迟缺陷' }))

    expect(screen.getByText('计划评分：70 / 100')).toBeVisible()
    expect(screen.getByText(/增加最小权限与操作确认/)).toBeVisible()
    expect(screen.getByText(/增加缓存与超时策略/)).toBeVisible()
    expect(screen.getByRole('button', { name: '重置评审' })).toBeVisible()
  })
})
