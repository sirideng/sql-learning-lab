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
  const [activity, setActivity] = useState(() => loadActivity(progress))
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => loadCompletedLessons())
  const [projectProgress, setProjectProgress] = useState<ProjectProgressMap>(() => loadProjectProgress())

  const saveDraft = useCallback((id: string, draft: string) => {
    setProgress((current) => updateProblemProgress(current, id, { draft }))
  }, [])

  const recordAttempt = useCallback((id: string, correct: boolean, draft: string, language: 'sql' | 'pandas' = 'sql', errorReason?: string) => {
    setActivity((current) => recordActivity(current))
    setProgress((current) => {
      const item = getProblemProgress(current, id)
      return updateProblemProgress(current, id, {
        attempts: item.attempts + 1,
        incorrectAttempts: item.incorrectAttempts + (correct ? 0 : 1),
        completed: item.completed || correct,
        lastAttemptAt: new Date().toISOString(),
        draft,
        language,
        lastIncorrectSql: correct ? item.lastIncorrectSql : draft,
        lastIncorrectCode: correct ? item.lastIncorrectCode : draft,
        lastErrorReason: correct ? item.lastErrorReason : (errorReason ?? '运行结果与预期输出不一致，请检查字段、行数和转换步骤。'),
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
    setActivity({})
    setCompletedLessons([])
    setProjectProgress({})
  }, [])

  return { progress, activity, completedLessons, projectProgress, saveDraft, recordAttempt, toggleLesson, toggleProject, reset }
}
