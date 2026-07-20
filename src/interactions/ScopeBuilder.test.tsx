import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScopeBuilder } from './ScopeBuilder'

describe('ScopeBuilder', () => {
  it('lets a beginner place a system card and explains the result', async () => {
    const user = userEvent.setup()
    render(<ScopeBuilder />)

    await user.click(screen.getByRole('button', { name: '选择安全边界' }))
    await user.click(screen.getByRole('button', { name: '放入 Harness（驾驭系统）层' }))
    await user.click(screen.getByRole('button', { name: '检查搭建' }))

    expect(screen.getByText(/安全边界放对了/)).toBeVisible()
    expect(screen.getByRole('button', { name: '重新搭建' })).toBeVisible()
  })
})
