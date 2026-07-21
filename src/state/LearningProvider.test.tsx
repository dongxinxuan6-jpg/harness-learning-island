import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LearningProvider, useLearningActions, useLearningState } from './LearningProvider'

function Harness() {
  const state = useLearningState()
  const { resetReadingPosition, saveReadingPosition } = useLearningActions()

  return (
    <>
      <output aria-label="current unit">{state.readingPosition?.unitId ?? 'none'}</output>
      <button
        type="button"
        onClick={() => saveReadingPosition({
          chapter: 2,
          unitId: 'c2-feedback-loop',
          unitProgress: 0.35,
          updatedAt: '2026-07-21T10:00:00.000Z',
        })}
      >
        save
      </button>
      <button type="button" onClick={resetReadingPosition}>reset</button>
    </>
  )
}

describe('LearningProvider reading actions', () => {
  it('saves and resets the semantic reading position', async () => {
    const user = userEvent.setup()
    render(<LearningProvider storage={localStorage}><Harness /></LearningProvider>)

    await user.click(screen.getByRole('button', { name: 'save' }))
    expect(screen.getByLabelText('current unit')).toHaveTextContent('c2-feedback-loop')

    await user.click(screen.getByRole('button', { name: 'reset' }))
    expect(screen.getByLabelText('current unit')).toHaveTextContent('none')
  })
})
