import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

for (const viewport of viewports) {
  test(`${viewport.name} layout has no horizontal overflow or infinite motion`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      infiniteAnimations: document.getAnimations().filter((animation) => animation.effect?.getTiming().iterations === Infinity).length,
      bodyTextLength: document.body.textContent?.length ?? 0,
      learningUnits: document.querySelectorAll('.learning-unit').length,
      unannotatedEnglish: [...document.querySelectorAll('body *')].flatMap((element) => {
        if (element.children.length || element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return []
        const value = element.textContent ?? ''
        const english = /[A-Za-z][A-Za-z0-9+./-]*(?:[ -][A-Za-z][A-Za-z0-9+./-]*)*/g
        return [...value.matchAll(english)].filter((match) => value[(match.index ?? 0) + match[0].length] !== '（').map((match) => match[0])
      }),
    }))

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1)
    expect(metrics.infiniteAnimations).toBe(0)
    expect(metrics.bodyTextLength).toBeGreaterThan(20_000)
    expect(metrics.learningUnits).toBe(106)
    expect(metrics.unannotatedEnglish).toEqual([])

    if (viewport.name === 'desktop') {
      await page.locator('.knowledge-map').scrollIntoViewIfNeeded()
      await page.screenshot({ path: 'test-results/mindmap-desktop.png' })
    }

    if (viewport.name === 'mobile') {
      await page.screenshot({ path: 'test-results/home-mobile.png' })
      await page.getByRole('button', { name: '从第一章开始' }).click()
      await page.waitForFunction(() => Math.abs((document.querySelector('#chapter-1')?.getBoundingClientRect().top ?? 0) - 64) < 12)
      await page.screenshot({ path: 'test-results/chapter-mobile.png' })
      await page.locator('.knowledge-map').evaluate((element) => window.scrollTo({ top: (element as HTMLElement).offsetTop - 64 }))
      await page.screenshot({ path: 'test-results/mindmap-mobile.png' })
    }
  })
}

test('reduced motion keeps content visible and makes transitions immediate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/')
  await page.getByRole('button', { name: '从第一章开始' }).click()
  const firstUnit = page.locator('#c1-evolution')
  await firstUnit.getByRole('button', { name: '看原理' }).click()
  await expect(firstUnit.getByText(/优化单次输入/)).toBeVisible()

  const longestDuration = await page.evaluate(() => Math.max(0, ...document.getAnimations().map((animation) => Number(animation.effect?.getTiming().duration) || 0)))
  expect(longestDuration).toBeLessThanOrEqual(1)
})
