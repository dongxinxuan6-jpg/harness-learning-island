import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { chapters } from '../content/chapters'
import { LearningProvider } from '../state/LearningProvider'
import { createEmptyLearningState, recordQuestionAnswer, toggleFavoriteTerm } from '../state/learningStore'
import { ReviewCenter } from './ReviewCenter'

describe('ReviewCenter', () => {
  it('shows mistakes and favorite terms in the due review group', async () => {
    const user = userEvent.setup()
    const now = new Date('2026-07-20T08:00:00.000Z')
    const question = chapters[0].units[0].check
    const wrongOption = question.answer === 0 ? 1 : 0
    let state = recordQuestionAnswer(createEmptyLearningState(), question, wrongOption, now)
    state = toggleFavoriteTerm(state, 'harness-engineering', now)

    render(
      <LearningProvider initialState={state} now={() => now}>
        <ReviewCenter now={now} />
      </LearningProvider>,
    )

    const today = screen.getByRole('region', { name: '今天复习' })
    expect(within(today).getByText(question.prompt)).toBeVisible()
    expect(within(today).getByText('Harness Engineering（驾驭系统工程）')).toBeVisible()

    await user.click(screen.getByRole('button', { name: '清空学习记录' }))
    expect(screen.getByRole('button', { name: '确认清空' })).toBeVisible()
  })
})
