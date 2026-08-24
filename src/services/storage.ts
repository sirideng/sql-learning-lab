import type { ActivityMap, ProblemProgress, ProgressMap, ProjectProgressMap } from '../types/problem'

const STORAGE_KEY = 'sql-learning-lab:progress:v1'
const ACTIVITY_KEY = 'sql-learning-lab:activity:v1'
const ACTIVITY_MIGRATION_KEY = 'sql-learning-lab:activity-counts-migrated:v2'
const LESSONS_KEY = 'sql-learning-lab:lessons:v1'
const PROJECTS_KEY = 'sql-learning-lab:projects:v1'

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
  localStorage.removeItem(ACTIVITY_MIGRATION_KEY)
  localStorage.removeItem(LESSONS_KEY)
  localStorage.removeItem(PROJECTS_KEY)
  return {}
}

export function loadActivity(progress: ProgressMap = {}): ActivityMap {
  try {
    const stored = JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? '{}') as unknown
    let activity: ActivityMap
    if (Array.isArray(stored)) {
      activity = Object.fromEntries(stored.filter((date): date is string => typeof date === 'string').map((date) => [date, 1]))
    } else if (stored && typeof stored === 'object') {
      activity = Object.fromEntries(Object.entries(stored).filter(([, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0).map(([date, count]) => [date, Math.floor(count as number)]))
    } else activity = {}

    if (localStorage.getItem(ACTIVITY_MIGRATION_KEY) !== '1') {
      const inferredByLastAttempt: ActivityMap = {}
      Object.values(progress).forEach((item) => {
        if (!item.lastAttemptAt || item.attempts <= 0) return
        const attemptedAt = new Date(item.lastAttemptAt)
        if (Number.isNaN(attemptedAt.getTime())) return
        const date = formatLocalDate(attemptedAt)
        inferredByLastAttempt[date] = (inferredByLastAttempt[date] ?? 0) + item.attempts
      })
      Object.entries(inferredByLastAttempt).forEach(([date, count]) => {
        activity[date] = Math.max(activity[date] ?? 0, count)
      })
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity))
      localStorage.setItem(ACTIVITY_MIGRATION_KEY, '1')
    }
    return activity
  } catch {
    return {}
  }
}

export function recordActivity(activity: ActivityMap): ActivityMap {
  const today = formatLocalDate(new Date())
  const next = { ...activity, [today]: (activity[today] ?? 0) + 1 }
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next))
  return next
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

export function loadProjectProgress(): ProjectProgressMap {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? '{}') as ProjectProgressMap
  } catch {
    return {}
  }
}

export function toggleProjectStep(current: ProjectProgressMap, projectId: string, stepId: string): ProjectProgressMap {
  const completed = current[projectId] ?? []
  const nextSteps = completed.includes(stepId) ? completed.filter((item) => item !== stepId) : [...completed, stepId]
  const next = { ...current, [projectId]: nextSteps }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(next))
  return next
}
