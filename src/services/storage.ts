import type { ProblemProgress, ProgressMap } from '../types/problem'

const STORAGE_KEY = 'sql-learning-lab:progress:v1'
const ACTIVITY_KEY = 'sql-learning-lab:activity:v1'
const LESSONS_KEY = 'sql-learning-lab:lessons:v1'

const emptyProgress = (): ProblemProgress => ({
  completed: false,
  incorrectAttempts: 0,
  attempts: 0,
})

export function loadProgress(): ProgressMap {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? (JSON.parse(value) as ProgressMap) : {}
  } catch {
    return {}
  }
}

export function getProblemProgress(progress: ProgressMap, id: string): ProblemProgress {
  return progress[id] ?? emptyProgress()
}

export function updateProblemProgress(
  progress: ProgressMap,
  id: string,
  update: Partial<ProblemProgress>,
): ProgressMap {
  const next = {
    ...progress,
    [id]: { ...getProblemProgress(progress, id), ...update },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function clearProgress(): ProgressMap {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(ACTIVITY_KEY)
  localStorage.removeItem(LESSONS_KEY)
  return {}
}

export function loadActivity(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function recordActivity(activity: string[]): string[] {
  const today = new Date().toISOString().slice(0, 10)
  const next = activity.includes(today) ? activity : [...activity, today]
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next))
  return next
}

export function loadCompletedLessons(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LESSONS_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function toggleCompletedLesson(current: string[], id: string): string[] {
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  localStorage.setItem(LESSONS_KEY, JSON.stringify(next))
  return next
}
