import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IterationSimulator } from './IterationSimulator'

describe('IterationSimulator', () => {
  it('walks through signals and leaves a readable decision explanation', async () => {
    const user = userEvent.setup()
    render(<IterationSimulator />)

    await user.click(screen.getByRole('button', { name: '开始一天迭代' }))
    await user.click(screen.getByRole('button', { name: '运行 A/B Test（对照测试）' }))
    await user.click(screen.getByRole('button', { name: '选择修改后再测' }))

    expect(screen.getByText(/你选择了修改后再测/)).toBeVisible()
    expect(screen.getByText(/真实信号/)).toBeVisible()
    expect(screen.getByRole('button', { name: '重新模拟' })).toBeVisible()
  })
})
