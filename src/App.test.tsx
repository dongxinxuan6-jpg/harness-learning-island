import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('guided learning entry', () => {
  it('shows the explicit first learning action', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: '从第一章开始' })).toBeVisible()
  })

  it('starts at chapter one without requiring directory use', async () => {
    const user = userEvent.setup()
    Element.prototype.scrollIntoView = vi.fn()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '从第一章开始' }))

    expect(screen.getByRole('heading', { name: /第 1 章/ })).toHaveFocus()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })
})
