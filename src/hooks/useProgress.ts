import { useCallback, useState } from 'react'
import type { ProgressMap } from '../types/problem'
import {
  clearProgress,
  getProblemProgress,
  loadActivity,
  loadCompletedLessons,
  loadProgress,
  recordActivity,
  toggleCompletedLesson,
  updateProblemProgress,
} from '../services/storage'

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress())
  const [activityDays, setActivityDays] = useState<string[]>(() => loadActivity())
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => loadCompletedLessons())

  const saveDraft = useCallback((id: string, draft: string) => {
    setProgress((current) => updateProblemProgress(current, id, { draft }))
  }, [])

  const recordAttempt = useCallback((id: string, correct: boolean, draft: string) => {
    setActivityDays((current) => recordActivity(current))
    setProgress((current) => {
      const item = getProblemProgress(current, id)
      return updateProblemProgress(current, id, {
        attempts: item.attempts + 1,
        incorrectAttempts: item.incorrectAttempts + (correct ? 0 : 1),
        completed: item.completed || correct,
        lastAttemptAt: new Date().toISOString(),
        draft,
        lastIncorrectSql: correct ? item.lastIncorrectSql : draft,
      })
    })
  }, [])

  const toggleLesson = useCallback((id: string) => {
    setCompletedLessons((current) => toggleCompletedLesson(current, id))
  }, [])

  const reset = useCallback(() => {
    setProgress(clearProgress())
    setActivityDays([])
    setCompletedLessons([])
  }, [])

  return { progress, activityDays, completedLessons, saveDraft, recordAttempt, toggleLesson, reset }
}
