import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useReadingProgress } from './useReadingProgress'
import { LearningProvider, useLearningState } from '../state/LearningProvider'
import { createEmptyLearningState, type LearningState } from '../state/learningStore'

let observerCallback: IntersectionObserverCallback

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback
  }

  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() { return [] }
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds = [0]
}

function Harness({ onRestore }: { onRestore?: (chapter: number) => void }) {
  useReadingProgress({ onRestore })
  const state = useLearningState()

  return (
    <>
      <output aria-label="saved unit">{state.readingPosition?.unitId ?? 'none'}</output>
      <section data-chapter="1"><article className="learning-unit" id="unit-1">one</article></section>
      <section data-chapter="2"><article className="learning-unit" id="unit-2">two</article></section>
    </>
  )
}

function renderHarness(initialState: LearningState, onRestore?: (chapter: number) => void) {
  return render(
    <LearningProvider initialState={initialState} storage={localStorage}>
      <Harness onRestore={onRestore} />
    </LearningProvider>,
  )
}

describe('useReadingProgress', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollBy = vi.fn()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('restores the saved unit once without smooth scrolling', async () => {
    const onRestore = vi.fn()
    const initialState: LearningState = {
      ...createEmptyLearningState(),
      readingPosition: {
        chapter: 2,
        unitId: 'unit-2',
        unitProgress: 0,
        updatedAt: '2026-07-21T10:00:00.000Z',
      },
    }

    renderHarness(initialState, onRestore)

    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' }))
    expect(onRestore).toHaveBeenCalledWith(2)
  })

  it('saves the visible unit and its chapter after scrolling', async () => {
    renderHarness(createEmptyLearningState())
    const target = document.getElementById('unit-2')!
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 80,
      top: 80,
      right: 800,
      bottom: 880,
      left: 0,
      width: 800,
      height: 800,
      toJSON: () => ({}),
    })

    observerCallback([{ target, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)
    fireEvent.scroll(window)

    await waitFor(() => expect(screen.getByLabelText('saved unit')).toHaveTextContent('unit-2'))
    const stored = JSON.parse(localStorage.getItem('harness-learning-state-v1')!) as LearningState
    expect(stored.readingPosition).toMatchObject({ chapter: 2, unitId: 'unit-2' })
  })
})
