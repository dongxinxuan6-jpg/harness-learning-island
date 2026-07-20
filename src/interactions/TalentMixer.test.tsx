import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TalentMixer } from './TalentMixer'

describe('TalentMixer', () => {
  it('builds a cross-functional architect profile without dismissing senior expertise', async () => {
    const user = userEvent.setup()
    render(<TalentMixer />)

    fireEvent.change(screen.getByRole('slider', { name: '系统架构能力' }), { target: { value: '88' } })
    fireEvent.change(screen.getByRole('slider', { name: '产品与市场判断' }), { target: { value: '82' } })
    fireEvent.change(screen.getByRole('slider', { name: '专业技术深度' }), { target: { value: '76' } })
    await user.click(screen.getByRole('button', { name: '生成人才画像' }))

    expect(screen.getByText('架构型复合人才')).toBeVisible()
    expect(screen.getByText(/不要把资深经验当成过时负担/)).toBeVisible()
    expect(screen.getByRole('button', { name: '重置人才混合器' })).toBeVisible()
  })
})
