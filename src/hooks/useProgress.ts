import { useCallback, useState } from 'react'
import type { ProgressMap, ProjectProgressMap } from '../types/problem'
import {
  clearProgress,
  getProblemProgress,
  loadActivity,
  loadCompletedLessons,
  loadProgress,
  loadProjectProgress,
  recordActivity,
  toggleCompletedLesson,
  toggleProjectStep,
  updateProblemProgress,
} from '../services/storage'

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress())
  const [activityDays, setActivityDays] = useState<string[]>(() => loadActivity())
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => loadCompletedLessons())
  const [projectProgress, setProjectProgress] = useState<ProjectProgressMap>(() => loadProjectProgress())

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

  const toggleProject = useCallback((projectId: string, stepId: string) => {
    setProjectProgress((current) => toggleProjectStep(current, projectId, stepId))
  }, [])

  const reset = useCallback(() => {
    setProgress(clearProgress())
    setActivityDays([])
    setCompletedLessons([])
    setProjectProgress({})
  }, [])

  return { progress, activityDays, completedLessons, projectProgress, saveDraft, recordAttempt, toggleLesson, toggleProject, reset }
}
