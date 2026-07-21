import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { STORAGE_KEY } from './state/learningStore'

const storedLearningState = {
  version: 2,
  answers: {
    'q-1': {
      questionId: 'q-1',
      unitId: 'c1-evolution',
      selected: 1,
      correct: true,
      attempts: 1,
      answeredAt: '2026-07-21T10:00:00.000Z',
    },
  },
  favoriteTerms: [],
  reviews: {},
  readingPosition: {
    chapter: 2,
    unitId: 'c2-feedback-loop',
    unitProgress: 0.25,
    updatedAt: '2026-07-21T10:00:00.000Z',
  },
}

describe('guided learning entry', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollBy = vi.fn()
  })

  afterEach(() => vi.restoreAllMocks())

  it('shows the explicit first action and starts at chapter one without directory use', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('button', { name: '从第一章开始' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: '从第一章开始' }))

    expect(screen.getByRole('heading', { level: 2, name: /^第 1 章：/ })).toHaveFocus()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  }, 15_000)

  it('restarts from chapter one while preserving answers', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedLearningState))
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
    vi.mocked(Element.prototype.scrollIntoView).mockClear()

    await user.click(screen.getByLabelText('从头开始'))

    expect(confirm).toHaveBeenCalledWith('回到第一章开头？答题、错题、收藏和复习记录都会保留。')
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(saved.readingPosition).toBeNull()
    expect(saved.answers['q-1']).toMatchObject({ correct: true })
  }, 15_000)

  it('keeps the saved position when restart is cancelled', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedLearningState))
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<App />)
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
    vi.mocked(Element.prototype.scrollIntoView).mockClear()

    await user.click(screen.getByLabelText('从头开始'))

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).readingPosition.unitId).toBe('c2-feedback-loop')
  }, 15_000)
})
