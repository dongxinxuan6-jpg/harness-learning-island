import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentConfigurator } from './AgentConfigurator'

describe('AgentConfigurator', () => {
  it('shows the efficiency and risk effect of permissions and human review', async () => {
    const user = userEvent.setup()
    render(<AgentConfigurator />)

    await user.click(screen.getByRole('checkbox', { name: '允许读取内部业务数据' }))
    await user.click(screen.getByRole('radio', { name: '关键决策必须人工审核' }))
    await user.click(screen.getByRole('button', { name: '生成配置结果' }))

    expect(screen.getByText('效率评分：72 / 100')).toBeVisible()
    expect(screen.getByText(/权限越大/)).toBeVisible()
    expect(screen.getByRole('button', { name: '重置配置' })).toBeVisible()
  })
})
