import { render, screen } from '@testing-library/react'
import App from './App'

describe('guided learning entry', () => {
  it('shows the explicit first learning action', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: '从第一章开始' })).toBeVisible()
  })
})
