import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrgWorkbench } from './OrgWorkbench'

describe('OrgWorkbench', () => {
  it('explains the trust and alignment result of distributing a responsibility', async () => {
    const user = userEvent.setup()
    render(<OrgWorkbench />)

    await user.click(screen.getByRole('button', { name: '选择定义用户价值' }))
    await user.click(screen.getByRole('button', { name: '分配给跨职能团队' }))

    expect(screen.getByText(/价值定义不应只交给 AI/)).toBeVisible()
    expect(screen.getByText(/对齐成本/)).toBeVisible()
    expect(screen.getByRole('button', { name: '重置组织桌面' })).toBeVisible()
  })
})
