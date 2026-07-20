# Harness Learning Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete local HTTP learning site that teaches every idea in the 65-minute podcast through 106 beginner-friendly learning units, eight chapter interactions, quizzes, and spaced review without displaying the raw transcript.

**Architecture:** A Vite React TypeScript application renders chapter data from focused files. Generic learning-unit components provide progressive disclosure, while one interaction component per chapter teaches the chapter's central relationship. A source-segment manifest and automated coverage verifier prove all 179 transcript segments map to learning units; localStorage persists progress, favorites, mistakes, and review dates.

**Tech Stack:** Vite, React, TypeScript, GSAP, Lucide React, Vitest, Testing Library, Playwright, CSS custom properties

---

## File Map

Application shell:

- `package.json`: scripts and dependencies.
- `vite.config.ts`: Vite and Vitest configuration.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript configuration.
- `index.html`: root document.
- `src/main.tsx`: React entry point.
- `src/App.tsx`: app composition and chapter route.
- `src/styles/tokens.css`: color, typography, spacing, motion, and responsive tokens.
- `src/styles/global.css`: reset, document layout, accessibility, and print styles.

Content and validation:

- `src/content/types.ts`: learning, glossary, quiz, interaction, and coverage types.
- `src/content/glossary.ts`: canonical `English（中文）` terms.
- `src/content/chapters/chapter1.ts` through `chapter8.ts`: 106 learning units and chapter quizzes.
- `src/content/chapters/index.ts`: chapter registry.
- `src/content/sourceSegments.ts`: 179 timestamp-and-speaker records without transcript text.
- `src/content/coverage.ts`: maps source segments to unit ranges.
- `src/content/validateContent.ts`: structural, coverage, and English-annotation validators.

Reusable UI:

- `src/components/AppHeader.tsx`: current chapter, progress, and directory button.
- `src/components/IntroHero.tsx`: explicit start point and course route.
- `src/components/ChapterSection.tsx`: chapter objectives, units, interaction, recap, and quiz.
- `src/components/LearningUnitCard.tsx`: progressive learning layers.
- `src/components/ExpandableLayer.tsx`: accessible expand/collapse button.
- `src/components/TermList.tsx`: annotated term cards and favorites.
- `src/components/ChapterQuiz.tsx`: mixed question types and explanations.
- `src/components/DirectoryDrawer.tsx`: non-primary chapter navigation.
- `src/components/ProgressRail.tsx`: desktop chapter position.
- `src/components/ReviewCenter.tsx`: mistakes, favorites, and review schedule.

Chapter interactions:

- `src/interactions/ScopeBuilder.tsx`: Prompt, Context, and Harness layer sorting.
- `src/interactions/IterationSimulator.tsx`: signal-driven day iteration.
- `src/interactions/BugTriageLab.tsx`: risk-based repair routing.
- `src/interactions/PlanCritic.tsx`: architecture-plan critique.
- `src/interactions/AgentConfigurator.tsx`: permission and review trade-offs.
- `src/interactions/OrgWorkbench.tsx`: role redistribution.
- `src/interactions/TalentMixer.tsx`: compound skill profiles.
- `src/interactions/EthicsLab.tsx`: stakeholder trade-offs.

State and tests:

- `src/state/learningStore.ts`: versioned localStorage state.
- `src/state/reviewScheduler.ts`: deterministic spaced-review dates.
- `src/test/setup.ts`: Testing Library setup.
- `src/**/*.test.ts(x)`: colocated unit and component tests.
- `tests/e2e/learning-flow.spec.ts`: full guided-learning flow.
- `tests/e2e/responsive.spec.ts`: desktop/mobile overflow and reduced-motion checks.

## Task 1: Project Baseline

**Files:** Create `package.json`, TypeScript configs, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`

- [ ] **Step 1: Create the package manifest with exact scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint:content": "vitest run src/content/validateContent.test.ts"
  },
  "dependencies": {
    "@gsap/react": "latest",
    "gsap": "latest",
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Add a failing render test**

```tsx
it('shows the explicit first learning action', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: '从第一章开始' })).toBeVisible()
})
```

- [ ] **Step 3: Run `npm install` and the test**

Run: `npm install && npm test -- src/App.test.tsx`

Expected: FAIL because the app shell does not exist.

- [ ] **Step 4: Implement the minimal entry point and start button**

```tsx
export default function App() {
  return <main><button type="button">从第一章开始</button></main>
}
```

- [ ] **Step 5: Run baseline tests and commit**

Run: `npm test -- src/App.test.tsx && npm run build`

Expected: PASS and a successful production build.

Commit: `feat: scaffold podcast learning app`

## Task 2: Content Contracts and Zero-Omission Validation

**Files:** Create `src/content/types.ts`, `glossary.ts`, `sourceSegments.ts`, `coverage.ts`, `validateContent.ts`, `validateContent.test.ts`

- [ ] **Step 1: Define focused content types**

```ts
export interface LearningUnit {
  id: string
  source: { start: number; end: number; speakers: number[] }
  title: string
  takeaway: string
  beginner: string
  example: string
  principle: string
  misconception: string
  extension: string
  terms: string[]
  check: QuizQuestion
}

export interface Chapter {
  id: string
  number: number
  title: string
  source: { start: number; end: number }
  objectives: string[]
  units: LearningUnit[]
  interaction: InteractionSpec
  quiz: QuizQuestion[]
}
```

- [ ] **Step 2: Add failing validator tests**

```ts
it('maps every source segment exactly once', () => {
  const result = validateCoverage(sourceSegments, chapters)
  expect(result.unmapped).toEqual([])
  expect(result.ambiguous).toEqual([])
  expect(sourceSegments).toHaveLength(179)
})

it('requires Chinese annotation after English in learner-facing text', () => {
  expect(validateEnglishAnnotations(chapters)).toEqual([])
})
```

- [ ] **Step 3: Generate timestamp-only source records from the supplied transcript**

Use a one-time PowerShell parser against the attachment to extract `Speaker N HH:MM:SS.mmm`; do not store transcript text in the app.

Expected: `sourceSegments.ts` exports 179 records ordered by start time.

- [ ] **Step 4: Implement validators**

`validateCoverage` checks every segment start falls within one and only one learning unit range. `validateEnglishAnnotations` recursively scans learner-facing strings and reports Latin sequences not followed by a full-width Chinese annotation, excluding URLs and internal IDs.

- [ ] **Step 5: Run and commit**

Run: `npm run lint:content`

Expected: initial chapter fixtures pass structure checks; coverage remains failing until all chapter files are complete, and the test is marked `it.todo` only in this commit. The final audit removes `it.todo`.

Commit: `test: add transcript coverage contracts`

## Task 3: Visual System and Guided Shell

**Files:** Create `src/styles/tokens.css`, `global.css`, `AppHeader.tsx`, `IntroHero.tsx`, `DirectoryDrawer.tsx`, `ProgressRail.tsx`; modify `App.tsx`

- [ ] **Step 1: Test first-run guidance and navigation accessibility**

```tsx
it('starts at chapter one without requiring directory use', async () => {
  render(<App />)
  await user.click(screen.getByRole('button', { name: '从第一章开始' }))
  expect(screen.getByRole('heading', { name: /第 1 章/ })).toHaveFocus()
})
```

- [ ] **Step 2: Implement light, cute, restrained design tokens**

Define OKLCH paper, ink, coral, mint, blue, yellow, spacing, 8px maximum card radius, focus rings, content widths, and reduced-motion durations.

- [ ] **Step 3: Implement guided start, sticky progress, and optional directory**

The primary flow is continuous scroll. The drawer can jump between chapters but never replaces the start button.

- [ ] **Step 4: Add GSAP progress behavior**

Use `gsap.matchMedia()` and `ScrollTrigger` only for chapter progress. No repeating or decorative animation.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/App.test.tsx src/components/AppHeader.test.tsx`

Commit: `feat: add guided continuous learning shell`

## Task 4: Progressive Learning Unit Component

**Files:** Create `LearningUnitCard.tsx`, `ExpandableLayer.tsx`, `TermList.tsx` and tests

- [ ] **Step 1: Test default and expanded layers**

```tsx
it('shows beginner content first and reveals complete layers on demand', async () => {
  render(<LearningUnitCard unit={fixture} />)
  expect(screen.getByText(fixture.beginner)).toBeVisible()
  expect(screen.queryByText(fixture.principle)).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '看原理' }))
  expect(screen.getByText(fixture.principle)).toBeVisible()
})
```

- [ ] **Step 2: Implement semantic expand buttons**

Use buttons with `aria-expanded`, stable layout containers, Escape handling, and a 200-300ms one-shot transition.

- [ ] **Step 3: Implement term cards**

Term cards show `English（中文）`, beginner definition, context sentence, and favorite button.

- [ ] **Step 4: Verify keyboard and reduced-motion behavior**

Run: `npm test -- src/components/LearningUnitCard.test.tsx src/components/TermList.test.tsx`

Commit: `feat: add progressive learning units`

## Task 5: Chapter 1, Scope Builder

**Files:** Create `chapter1.ts`, `ScopeBuilder.tsx`, tests

- [ ] Write chapter data for all 13 units in the approved design spec.
- [ ] Test unit count, source continuity from 0 to 661 seconds, required examples, and annotations.
- [ ] Build accessible click-or-drag sorting for Prompt, Context, and Harness layers.
- [ ] Add step-by-step explanations for incomplete systems and a reset button.
- [ ] Add at least six mixed quiz questions.
- [ ] Run chapter and interaction tests.
- [ ] Commit: `feat: teach prompt context and harness foundations`

## Task 6: Chapter 2, Iteration Simulator

**Files:** Create `chapter2.ts`, `IterationSimulator.tsx`, tests

- [ ] Write all 10 approved units covering mindset, alignment, metrics, rollout, fallback, testing, and market bottlenecks.
- [ ] Test source continuity from 661 to 1151 seconds and annotation completeness.
- [ ] Build a four-step 10:00-17:00 simulator with signal choices and stable end states.
- [ ] Explain consequences for rollout, modification, and fallback after every choice.
- [ ] Add at least six mixed quiz questions.
- [ ] Run tests and commit: `feat: add ai first iteration course`

## Task 7: Chapter 3, Bug Triage Lab

**Files:** Create `chapter3.ts`, `BugTriageLab.tsx`, tests

- [ ] Write all 19 approved units covering prevention, detection, parallel agents, autofixing, architecture, Agent Economy, and SaaS interfaces.
- [ ] Test source continuity from 1151 to 1866 seconds and preserve all numeric claims as program viewpoints.
- [ ] Build click-or-drag risk routing with low, medium, and high-risk consequences.
- [ ] Include cost, speed, and safety scoring plus reset.
- [ ] Add at least eight mixed quiz questions.
- [ ] Run tests and commit: `feat: add quality and self healing course`

## Task 8: Chapter 4, Plan Critic

**Files:** Create `chapter4.ts`, `PlanCritic.tsx`, tests

- [ ] Write all 10 approved units covering transition history, planning quality, reusable skills, productivity numbers, and market reversal.
- [ ] Test source continuity from 1866 to 2343 seconds.
- [ ] Build a critique interaction with security, latency, cost, and maintainability dimensions.
- [ ] Make each critique visibly improve a plan score and explanation; animation stops after each change.
- [ ] Add at least six questions.
- [ ] Run tests and commit: `feat: add ai transformation planning course`

## Task 9: Chapter 5, Agent Configurator

**Files:** Create `chapter5.ts`, `AgentConfigurator.tsx`, tests

- [ ] Write all 15 approved units covering subjective evaluation, permissions, personal agents, SMB adoption, legacy constraints, and productized Harness.
- [ ] Test source continuity from 2343 to 2867 seconds.
- [ ] Build a 30-person-company configurator for permissions, data, metrics, and human review points.
- [ ] Show efficiency and risk outcomes with textual explanations, not unexplained meters.
- [ ] Add at least seven questions.
- [ ] Run tests and commit: `feat: add agent economy and saas course`

## Task 10: Chapter 6, Organization Workbench

**Files:** Create `chapter6.ts`, `OrgWorkbench.tsx`, tests

- [ ] Write all 12 approved units covering trust, guardrails, product management, role fusion, designers, and implementation cost.
- [ ] Test source continuity from 2867 to 3201 seconds.
- [ ] Build click-or-drag responsibility allocation with keyboard alternatives.
- [ ] Compare alignment cost and trust requirements for each arrangement.
- [ ] Add at least six questions.
- [ ] Run tests and commit: `feat: add organization redesign course`

## Task 11: Chapter 7, Talent Mixer

**Files:** Create `chapter7.ts`, `TalentMixer.tsx`, tests

- [ ] Write all 16 approved units covering junior/senior trade-offs, expanded scope, ideal profiles, hiring, Peter's background, pretrained models, and future architecture work.
- [ ] Test source continuity from 3201 to 3668 seconds.
- [ ] Build a skill-profile mixer with architecture, judgment, product, market, implementation, and depth controls.
- [ ] Explain which organizational stage benefits from each profile and why.
- [ ] Add at least seven questions.
- [ ] Run tests and commit: `feat: add future talent course`

## Task 12: Chapter 8, Ethics Lab

**Files:** Create `chapter8.ts`, `EthicsLab.tsx`, tests

- [ ] Write all 11 approved units covering need definition, result review, philosophy, privacy, value, optimism, industrial transition, and closing synthesis.
- [ ] Test source continuity from 3668 to 3920 seconds.
- [ ] Build four stakeholder scenarios for privacy, permission, responsibility, and value conflict.
- [ ] Show trade-offs without pretending every ethical question has one answer.
- [ ] Mark the DeepMind philosopher-role mention as a program claim until a primary source is linked.
- [ ] Add at least seven questions.
- [ ] Run tests and commit: `feat: add human value and ethics course`

## Task 13: Quiz, Persistence, and Review

**Files:** Create `ChapterQuiz.tsx`, `ReviewCenter.tsx`, `learningStore.ts`, `reviewScheduler.ts`, tests

- [ ] Test versioned state hydration and malformed-data fallback.
- [ ] Implement progress, expanded layers, favorites, mistakes, answer history, and reset confirmation.
- [ ] Test deterministic review intervals of 1, 3, 7, 14, and 30 days.
- [ ] Implement mixed quizzes with immediate rationale and linked learning units.
- [ ] Implement Today, Tomorrow, and This Week review groups.
- [ ] Run tests and commit: `feat: add quizzes and spaced review`

## Task 14: Final Coverage and Browser Verification

**Files:** Modify validators and tests; create Playwright specs

- [ ] Remove the temporary coverage `it.todo` and require 179 mapped segments.
- [ ] Require exactly eight chapters and 106 learning units.
- [ ] Require every unit to contain takeaway, beginner explanation, example, principle, misconception, extension, terms, and immediate check.
- [ ] Require every chapter to have a working interaction and reset action.
- [ ] Run `npm run lint:content`, `npm test`, and `npm run build`.
- [ ] Run Playwright at 1440x1000, 768x1024, and 390x844.
- [ ] Check no horizontal overflow, no text overlap, no infinite animations, and reduced-motion usability.
- [ ] Check canvas/pixel output is nonblank and all visualizations render.
- [ ] Start the final Vite server on an available port and verify HTTP 200.
- [ ] Commit: `test: complete learning site verification`

## Plan Self-Review

- The eight chapter tasks map one-to-one to all 106 approved knowledge units.
- The shell, progressive disclosure, English annotation, no-transcript rule, interaction rule, review system, accessibility, local persistence, and responsive verification each have explicit tasks.
- Exact shared type names stay consistent across tasks.
- The only temporary incomplete test is the explicitly named coverage `it.todo`, which Task 14 must remove before completion.
- No production content or interaction is deferred beyond this plan.

