import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EthicsLab } from './EthicsLab'

describe('EthicsLab', () => {
  it('shows stakeholders, privacy safeguards, and residual uncertainty', async () => {
    const user = userEvent.setup()
    render(<EthicsLab />)

    await user.click(screen.getByRole('button', { name: '选择员工聊天记录场景' }))
    await user.click(screen.getByRole('button', { name: '采用最小必要权限方案' }))

    expect(screen.getByRole('heading', { name: '最小必要权限，目的受限' })).toBeVisible()
    expect(screen.getByText('隐私与责任护栏')).toBeVisible()
    expect(screen.getByText('仍需回答')).toBeVisible()
    expect(screen.getByRole('button', { name: '重置伦理实验室' })).toBeVisible()
  })
})
