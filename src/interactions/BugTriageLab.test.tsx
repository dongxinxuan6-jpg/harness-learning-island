import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BugTriageLab } from './BugTriageLab'

describe('BugTriageLab', () => {
  it('routes a sensitive issue to deep review and explains the trade-off', async () => {
    const user = userEvent.setup()
    render(<BugTriageLab />)

    await user.click(screen.getByRole('button', { name: '选择登录权限泄露' }))
    await user.click(screen.getByRole('button', { name: '送入高风险人工深度审核' }))

    expect(screen.getByText(/登录权限泄露分流正确/)).toBeVisible()
    expect(screen.getByText(/安全优先于速度/)).toBeVisible()
    expect(screen.getByRole('button', { name: '重置分诊台' })).toBeVisible()
  })
})
