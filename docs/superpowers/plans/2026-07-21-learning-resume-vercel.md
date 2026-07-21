# Learning Resume and Vercel Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remember the learner's current knowledge unit in the same browser, restore it automatically on return, provide a deliberate restart command, and publish the course on Vercel.

**Architecture:** Extend the existing versioned learning state with a semantic reading anchor and migrate version 1 data in place. A focused `useReadingProgress` hook restores once after layout, tracks the active `.learning-unit` with `IntersectionObserver`, and saves throttled unit-relative progress through `LearningProvider`; `CourseApp` owns navigation and restart behavior.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Playwright, browser `localStorage`, browser `IntersectionObserver`, Vercel static hosting.

---

## File Map

- Modify `src/state/learningStore.ts`: version 2 shape, version 1 migration, reading-position pure functions.
- Modify `src/state/learningStore.test.ts`: migration, save, position-only reset, and full-reset coverage.
- Modify `src/state/LearningProvider.tsx`: expose position save/reset actions.
- Create `src/hooks/useReadingProgress.ts`: one-time restoration and throttled semantic position tracking.
- Create `src/hooks/useReadingProgress.test.tsx`: restoration and observation behavior.
- Modify `src/components/AppHeader.tsx`: restart icon command with explicit confirmation.
- Modify `src/App.tsx`: wire the hook and reset navigation.
- Modify `src/App.test.tsx`: restart confirmation and retained answer state.
- Modify `src/styles/global.css`: stable four-column header and compact confirmation affordance.
- Modify `tests/e2e/learning-flow.spec.ts`: refresh-and-resume and restart flows.

### Task 1: Version and migrate the persisted learning state

**Files:**
- Modify: `src/state/learningStore.ts`
- Test: `src/state/learningStore.test.ts`

- [ ] **Step 1: Write failing state tests**

Add imports for `clearReadingPosition` and `updateReadingPosition`, then add tests equivalent to:

```ts
it('migrates version 1 learning data without losing answers', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    answers: { 'q-1': { questionId: 'q-1', unitId: 'unit-1', selected: 1, correct: true, attempts: 1, answeredAt: '2026-07-20T08:00:00.000Z' } },
    favoriteTerms: ['harness'],
    reviews: {},
  }))
  expect(loadLearningState(localStorage)).toMatchObject({
    version: 2,
    answers: { 'q-1': { correct: true } },
    favoriteTerms: ['harness'],
    readingPosition: null,
  })
})

it('updates and clears only the reading position', () => {
  const answered = recordQuestionAnswer(createEmptyLearningState(), question, 1)
  const positioned = updateReadingPosition(answered, {
    chapter: 3, unitId: 'c3-autofix', unitProgress: 0.45, updatedAt: '2026-07-21T10:00:00.000Z',
  })
  expect(positioned.readingPosition).toMatchObject({ unitId: 'c3-autofix', unitProgress: 0.45 })
  const restarted = clearReadingPosition(positioned)
  expect(restarted.readingPosition).toBeNull()
  expect(restarted.answers['q-1']).toEqual(positioned.answers['q-1'])
})
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- src/state/learningStore.test.ts`

Expected: FAIL because reading-position functions and state fields do not exist.

- [ ] **Step 3: Implement version 2 and version 1 migration**

Add the exact public model and pure updates:

```ts
export const LEARNING_STATE_VERSION = 2

export interface ReadingPosition {
  chapter: number
  unitId: string
  unitProgress: number
  updatedAt: string
}

export interface LearningState {
  version: number
  answers: Record<string, AnswerRecord>
  favoriteTerms: string[]
  reviews: Record<string, ReviewRecord>
  readingPosition: ReadingPosition | null
}

export function createEmptyLearningState(): LearningState {
  return { version: LEARNING_STATE_VERSION, answers: {}, favoriteTerms: [], reviews: {}, readingPosition: null }
}

export function updateReadingPosition(state: LearningState, position: ReadingPosition): LearningState {
  return { ...state, readingPosition: { ...position, unitProgress: Math.min(1, Math.max(0, position.unitProgress)) } }
}

export function clearReadingPosition(state: LearningState): LearningState {
  return { ...state, readingPosition: null }
}
```

Change loading so valid version 2 data is returned and valid version 1 data is migrated to `{ ...parsed, version: 2, readingPosition: null }`; malformed data still returns an empty state. Keep `STORAGE_KEY` unchanged so old browsers can be migrated.

- [ ] **Step 4: Run the store tests**

Run: `npm test -- src/state/learningStore.test.ts`

Expected: all learning-store tests PASS.

- [ ] **Step 5: Commit the state change**

```powershell
git add src/state/learningStore.ts src/state/learningStore.test.ts
git commit -m "feat: persist semantic reading position"
```

### Task 2: Expose reading actions from the provider

**Files:**
- Modify: `src/state/LearningProvider.tsx`

- [ ] **Step 1: Add typed actions**

Import `ReadingPosition`, `clearReadingPosition`, and `updateReadingPosition`; add these methods to `LearningActions` and `fallbackActions`:

```ts
saveReadingPosition: (position: ReadingPosition) => void
resetReadingPosition: () => void
```

Implement them in the memoized actions:

```ts
saveReadingPosition: (position) => setState((current) => updateReadingPosition(current, position)),
resetReadingPosition: () => setState((current) => clearReadingPosition(current)),
```

- [ ] **Step 2: Run provider consumers and type checking**

Run: `npm test -- src/state/learningStore.test.ts src/components/ReviewCenter.test.tsx && npm run build`

Expected: tests PASS and TypeScript build succeeds.

- [ ] **Step 3: Commit provider actions**

```powershell
git add src/state/LearningProvider.tsx
git commit -m "feat: expose reading progress actions"
```

### Task 3: Restore and track the active learning unit

**Files:**
- Create: `src/hooks/useReadingProgress.ts`
- Create: `src/hooks/useReadingProgress.test.tsx`

- [ ] **Step 1: Write failing hook tests**

Render a small harness inside `LearningProvider` with two `.learning-unit` articles and a mocked `IntersectionObserver`. Cover:

```ts
it('restores the saved unit once without smooth scrolling', async () => {
  const scrollIntoView = vi.fn()
  Element.prototype.scrollIntoView = scrollIntoView
  render(<Harness />, { wrapper: providerWithPosition({ chapter: 2, unitId: 'unit-2', unitProgress: 0 }) })
  await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }))
})

it('saves the visible unit and chapter through the provider', async () => {
  render(<Harness />)
  intersect(document.querySelector('#unit-2')!)
  fireEvent.scroll(window)
  await waitFor(() => expect(readStoredState().readingPosition).toMatchObject({ chapter: 2, unitId: 'unit-2' }))
})
```

- [ ] **Step 2: Run the hook tests and confirm failure**

Run: `npm test -- src/hooks/useReadingProgress.test.tsx`

Expected: FAIL because `useReadingProgress` does not exist.

- [ ] **Step 3: Implement the focused hook**

Create:

```ts
interface ReadingProgressOptions {
  onRestore?: (chapter: number) => void
  headerOffset?: number
}

export function useReadingProgress({ onRestore, headerOffset = 88 }: ReadingProgressOptions = {}) {
  const { readingPosition } = useLearningState()
  const { saveReadingPosition } = useLearningActions()
  // Restore saved unit in requestAnimationFrame after layout.
  // Observe `.learning-unit[id]`, keep the closest intersecting unit active,
  // and throttle scroll-derived relative progress writes to 300 ms.
  // Suppress writes until the one-time restoration has completed.
}
```

Restoration must call `target.scrollIntoView({ behavior: 'auto', block: 'start' })`, optionally add the clamped `unitProgress * target.offsetHeight` with `window.scrollBy`, and fall back to `#chapter-${chapter}` when the unit is absent. Tracking derives the chapter from `target.closest<HTMLElement>('[data-chapter]')?.dataset.chapter`, clamps progress to 0..1, and records an ISO timestamp.

- [ ] **Step 4: Run hook tests**

Run: `npm test -- src/hooks/useReadingProgress.test.tsx`

Expected: restoration and active-unit persistence tests PASS.

- [ ] **Step 5: Commit the hook**

```powershell
git add src/hooks/useReadingProgress.ts src/hooks/useReadingProgress.test.tsx
git commit -m "feat: restore last learning unit"
```

### Task 4: Wire automatic resume and deliberate restart into the UI

**Files:**
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write failing UI tests**

Add tests that initialize version 2 state with a reading position, mock `window.confirm`, and verify:

```ts
expect(screen.getByRole('button', { name: '从头开始' })).toBeVisible()
await user.click(screen.getByRole('button', { name: '从头开始' }))
expect(window.confirm).toHaveBeenCalledWith('回到第一章开头？答题、错题、收藏和复习记录都会保留。')
expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
```

Also assert that cancelling does not move, and that confirming keeps an existing answer in `localStorage` while setting `readingPosition` to `null`.

- [ ] **Step 2: Run the App tests and confirm failure**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because the restart control and reading hook are not wired.

- [ ] **Step 3: Add the restart header command**

Extend `AppHeaderProps` with `canRestart` and `onRestart`, import `RotateCcw`, and render a familiar icon button only when a reading position exists:

```tsx
{canRestart ? (
  <button
    className="icon-button"
    type="button"
    onClick={() => {
      if (window.confirm('回到第一章开头？答题、错题、收藏和复习记录都会保留。')) onRestart()
    }}
    aria-label="从头开始"
    title="从头开始"
  >
    <RotateCcw aria-hidden="true" size={19} />
  </button>
) : null}
```

- [ ] **Step 4: Wire the course behavior**

Inside `CourseApp`, read `readingPosition`, call `useReadingProgress({ onRestore })`, and use `resetReadingPosition`. Restart must clear only the anchor, mark chapter one active, then call:

```ts
document.getElementById('chapter-1')?.scrollIntoView({ behavior: 'auto', block: 'start' })
firstChapterHeading.current?.focus({ preventScroll: true })
```

Pass `canRestart={Boolean(readingPosition)}` and `onRestart={restartLearning}` to `AppHeader`.

- [ ] **Step 5: Stabilize the responsive header**

Change `.app-header` to `grid-template-columns: 1fr auto auto auto` and keep each icon at `44px`. On mobile, hide the brand label as today and retain both restart and directory icons without shrinking or overlapping.

- [ ] **Step 6: Run App and responsive unit tests**

Run: `npm test -- src/App.test.tsx src/components/ReviewCenter.test.tsx`

Expected: all selected tests PASS.

- [ ] **Step 7: Commit the UI flow**

```powershell
git add src/App.tsx src/App.test.tsx src/components/AppHeader.tsx src/styles/global.css
git commit -m "feat: add automatic resume and restart control"
```

### Task 5: Prove refresh persistence end to end

**Files:**
- Modify: `tests/e2e/learning-flow.spec.ts`

- [ ] **Step 1: Add the resume-and-restart browser test**

```ts
test('refresh resumes the last unit and restart returns to chapter one', async ({ page }) => {
  await page.goto('/')
  const target = page.locator('#c3-autofix')
  await target.scrollIntoViewIfNeeded()
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('harness-learning-state-v1')
    return raw && JSON.parse(raw).readingPosition?.unitId === 'c3-autofix'
  })

  await page.reload()
  await expect(target).toBeInViewport()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '从头开始' }).click()
  await expect(page.locator('#chapter-1')).toBeInViewport()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('harness-learning-state-v1')!).readingPosition)).toBeNull()
})
```

Use a real chapter 3 unit ID from content if `c3-autofix` differs.

- [ ] **Step 2: Run the focused browser test**

Run: `npx playwright test tests/e2e/learning-flow.spec.ts`

Expected: all learning-flow tests PASS in Chromium.

- [ ] **Step 3: Run the full quality gate**

Run: `npm test && npm run lint:content && npm run build && npm run test:e2e`

Expected: 0 failures; production files are emitted to `dist/`.

- [ ] **Step 4: Commit the browser coverage**

```powershell
git add tests/e2e/learning-flow.spec.ts
git commit -m "test: cover resume and restart workflow"
```

### Task 6: Deploy and verify the public production URL

**Files:**
- Generated local metadata only: `.vercel/project.json` (kept uncommitted or ignored)

- [ ] **Step 1: Confirm Vercel identity or authenticate**

Run: `npx vercel@latest whoami`

Expected: authenticated Vercel username. If authentication is required, run `npx vercel@latest login`, complete the official browser/device flow, then rerun `whoami`.

- [ ] **Step 2: Create the production deployment**

Run: `npx vercel@latest --prod --yes`

Expected: command exits 0 and prints a production `https://*.vercel.app` URL.

- [ ] **Step 3: Verify public HTTP and course content**

Run:

```powershell
$url = '<production-url-from-vercel>'
$response = Invoke-WebRequest -UseBasicParsing $url
if ($response.StatusCode -ne 200) { throw "Unexpected HTTP $($response.StatusCode)" }
if ($response.Content -notmatch '驾驭系统学习岛') { throw 'Course title missing' }
```

Expected: HTTP 200 and course title present.

- [ ] **Step 4: Verify persistence on the deployed origin**

Run a Playwright check against the production URL: load the site, seed a version 2 `readingPosition`, reload, verify the target unit is in the viewport, accept restart confirmation, and verify `readingPosition` becomes `null` while an existing answer remains.

- [ ] **Step 5: Record the deployment outcome**

Report the production URL, latest commit, test totals, and the same-browser limitation. Do not commit `.vercel` account metadata or unrelated workspace files.
