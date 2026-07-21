import { expect, test } from '@playwright/test'

test('guided learning, immediate check, interaction, and persistence work together', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')

  await expect(page.getByRole('button', { name: '从第一章开始' })).toBeVisible()
  await page.screenshot({ path: 'test-results/home-desktop.png' })

  await page.getByRole('button', { name: '打开课程目录' }).click()
  await expect(page.getByRole('button', { name: '关闭课程目录' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '打开课程目录' })).toBeFocused()

  await page.getByRole('button', { name: '从第一章开始' }).click()
  await expect(page.getByRole('heading', { level: 2, name: /^第 1 章：/ })).toBeFocused()

  const firstUnit = page.locator('#c1-evolution')
  await firstUnit.getByRole('button', { name: '看例子' }).click()
  await expect(firstUnit.getByRole('button', { name: '收起例子' })).toHaveAttribute('aria-expanded', 'true')

  const correctOption = firstUnit.locator('.quick-check__options input').nth(1)
  await correctOption.check()
  await firstUnit.getByRole('button', { name: '检查答案' }).click()
  await expect(firstUnit.locator('.quick-check__feedback')).toBeVisible()

  const scopeBuilder = page.locator('#chapter-1').locator('.scope-builder')
  await scopeBuilder.getByRole('button', { name: /选择/ }).first().click()
  await scopeBuilder.locator('.scope-builder__layers button').first().click()
  await scopeBuilder.getByRole('button', { name: '检查搭建' }).click()
  await expect(scopeBuilder.locator('.scope-builder__result')).toBeVisible()

  const stored = await page.evaluate(() => window.localStorage.getItem('harness-learning-state-v1'))
  expect(stored).toContain('answers')
})

test('chapter quiz and review center expose a complete learning loop', async ({ page }) => {
  await page.goto('/')
  const quiz = page.locator('#chapter-1').locator('.chapter-quiz')
  await quiz.getByRole('button', { name: '开始第 1 章测验' }).click()
  await quiz.locator('input[type="radio"]').first().check()
  await quiz.getByRole('button', { name: '提交本题' }).click()
  await expect(quiz.locator('.chapter-quiz__feedback')).toBeVisible()

  await page.locator('#review-center').scrollIntoViewIfNeeded()
  await expect(page.getByRole('heading', { name: '复习中心' })).toBeVisible()
  await expect(page.getByText('已答题')).toBeVisible()
})

test('refresh resumes the last unit and restart returns to chapter one', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('harness-learning-state-v1', JSON.stringify({
      version: 2,
      answers: {
        'seed-answer': {
          questionId: 'seed-answer',
          unitId: 'c1-evolution',
          selected: 1,
          correct: true,
          attempts: 1,
          answeredAt: '2026-07-21T10:00:00.000Z',
        },
      },
      favoriteTerms: [],
      reviews: {},
      readingPosition: null,
    }))
  })
  await page.reload()

  const target = page.locator('#c3-autofixing')
  await target.scrollIntoViewIfNeeded()
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('harness-learning-state-v1')
    return raw && JSON.parse(raw).readingPosition?.unitId === 'c3-autofixing'
  })

  await page.reload()
  await expect(target).toBeInViewport()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '从头开始' }).click()
  await page.waitForFunction(() => Math.abs((document.querySelector('#chapter-1')?.getBoundingClientRect().top ?? 0) - 64) < 16)
  await expect(page.getByRole('button', { name: '从头开始' })).toBeHidden()
  await page.waitForTimeout(450)

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('harness-learning-state-v1')!))
  expect(stored.readingPosition).toBeNull()
  expect(stored.answers['seed-answer']).toMatchObject({ correct: true })
})
