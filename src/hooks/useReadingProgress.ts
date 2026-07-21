import { useEffect, useRef } from 'react'
import { useLearningActions, useLearningState } from '../state/LearningProvider'

interface ReadingProgressOptions {
  onRestore?: (chapter: number) => void
  headerOffset?: number
}

const SAVE_DELAY_MS = 300

function closestUnit(units: HTMLElement[], headerOffset: number) {
  if (!units.length) return null
  return units
    .map((unit) => ({ unit, distance: Math.abs(unit.getBoundingClientRect().top - headerOffset) }))
    .sort((a, b) => a.distance - b.distance)[0]?.unit ?? null
}

export function useReadingProgress({ onRestore, headerOffset = 88 }: ReadingProgressOptions = {}) {
  const { readingPosition } = useLearningState()
  const { saveReadingPosition } = useLearningActions()
  const initialPositionRef = useRef(readingPosition)
  const activeUnitRef = useRef<HTMLElement | null>(null)
  const visibleUnitsRef = useRef(new Set<HTMLElement>())
  const restoredRef = useRef(false)
  const suppressSaveRef = useRef(Boolean(initialPositionRef.current))

  useEffect(() => {
    if (restoredRef.current) return

    const frame = window.requestAnimationFrame(() => {
      if (restoredRef.current) return
      restoredRef.current = true
      const position = initialPositionRef.current

      if (!position) {
        suppressSaveRef.current = false
        return
      }

      const unit = document.getElementById(position.unitId)
      const target = unit ?? document.getElementById(`chapter-${position.chapter}`)
      target?.scrollIntoView({ behavior: 'auto', block: 'start' })

      if (unit && position.unitProgress > 0) {
        window.scrollBy({
          top: position.unitProgress * Math.max(unit.offsetHeight - headerOffset, 0),
          behavior: 'auto',
        })
      }

      onRestore?.(position.chapter)
      window.setTimeout(() => {
        suppressSaveRef.current = false
      }, 0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [headerOffset, onRestore])

  useEffect(() => {
    const units = [...document.querySelectorAll<HTMLElement>('.learning-unit[id]')]
    if (!units.length) return
    let saveTimer: number | undefined

    const findViewportUnit = () => {
      const atReadingLine = units.find((unit) => {
        const rect = unit.getBoundingClientRect()
        return rect.top <= headerOffset && rect.bottom > headerOffset
      })
      return atReadingLine ?? closestUnit(units, headerOffset)
    }

    const saveCurrentPosition = () => {
      if (suppressSaveRef.current) return
      const unit = activeUnitRef.current ?? findViewportUnit()
      if (!unit) return
      const chapter = Number(unit.closest<HTMLElement>('[data-chapter]')?.dataset.chapter)
      if (!Number.isInteger(chapter) || chapter < 1) return
      const rect = unit.getBoundingClientRect()
      const unitProgress = Math.min(1, Math.max(0, (headerOffset - rect.top) / Math.max(rect.height, 1)))

      saveReadingPosition({
        chapter,
        unitId: unit.id,
        unitProgress,
        updatedAt: new Date().toISOString(),
      })
    }

    const scheduleSave = () => {
      if (saveTimer !== undefined) window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(saveCurrentPosition, SAVE_DELAY_MS)
    }

    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const unit = entry.target as HTMLElement
            if (entry.isIntersecting) visibleUnitsRef.current.add(unit)
            else visibleUnitsRef.current.delete(unit)
          })
          activeUnitRef.current = closestUnit([...visibleUnitsRef.current], headerOffset)
        }, { rootMargin: `-${headerOffset}px 0px -35%`, threshold: [0, 0.25, 0.5] })
      : null

    observer?.takeRecords()
    units.forEach((unit) => observer?.observe(unit))
    window.addEventListener('scroll', scheduleSave, { passive: true })
    window.addEventListener('resize', scheduleSave)
    window.addEventListener('pagehide', saveCurrentPosition)

    return () => {
      observer?.disconnect()
      if (saveTimer !== undefined) window.clearTimeout(saveTimer)
      window.removeEventListener('scroll', scheduleSave)
      window.removeEventListener('resize', scheduleSave)
      window.removeEventListener('pagehide', saveCurrentPosition)
    }
  }, [headerOffset, saveReadingPosition])
}
