import { useEffect, useMemo, useState } from 'react'
import additionalProblemData from './data/additionalQuestions.json'
import careerProblemData from './data/careerQuestions.json'
import chapterDeepDiveData from './data/chapterDeepDives.json'
import learningData from './data/learningPath.json'
import playgroundData from './data/playgroundScenarios.json'
import problemData from './data/problems.json'
import windowPracticeData from './data/windowPracticeQuestions.json'
import { useProgress } from './hooks/useProgress'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { LearningPathPage } from './pages/LearningPathPage'
import { PlaygroundPage } from './pages/PlaygroundPage'
import { PracticePage } from './pages/PracticePage'
import type { ChapterDeepDive, ExplanationStep, LearningChapter, PlaygroundScenario, SqlProblem } from './types/problem'

const legacyMetadata: Record<string, { source: string; chapter: string }> = {
  'next-day-retention': { source: 'LeetCode · 经典', chapter: 'JOIN' },
  'customers-without-transactions': { source: 'LeetCode · 经典', chapter: 'JOIN' },
  'products-sold-only-in-spring': { source: 'LeetCode · 经典', chapter: 'HAVING' },
  'manager-direct-reports': { source: 'LeetCode · 经典', chapter: 'JOIN' },
  'customers-who-bought-all-products': { source: 'LeetCode · 经典', chapter: 'Subquery' },
  'daily-cumulative-profit': { source: 'SQL Learning Lab', chapter: '窗口函数' },
}

const problems = [
  ...(problemData as Omit<SqlProblem, 'source' | 'chapter'>[]).map((problem) => ({ ...problem, ...legacyMetadata[problem.id] })),
  ...(additionalProblemData as SqlProblem[]),
  ...(careerProblemData as (Omit<SqlProblem, 'explanationSteps'> & { visualizationSteps: ExplanationStep[] })[])
    .map((problem) => ({ ...problem, explanationSteps: problem.visualizationSteps })),
  ...(windowPracticeData as (Omit<SqlProblem, 'explanationSteps'> & { visualizationSteps: ExplanationStep[] })[])
    .map((problem) => ({ ...problem, explanationSteps: problem.visualizationSteps })),
] as SqlProblem[]
const chapterDeepDives = Object.fromEntries((chapterDeepDiveData as ChapterDeepDive[]).map((item) => [item.id, item]))
const chapters = (learningData as Omit<LearningChapter, 'deepDive'>[]).map((chapter) => ({ ...chapter, deepDive: chapterDeepDives[chapter.id] })) as LearningChapter[]
const scenarios = playgroundData as PlaygroundScenario[]

function currentHash() {
  return window.location.hash.replace(/^#\/?/, '') || 'dashboard'
}

export default function App() {
  const [route, setRoute] = useState(() => currentHash())
  const { progress, activity, completedLessons, projectProgress, saveDraft, recordAttempt, toggleLesson, toggleProject, reset } = useProgress()

  useEffect(() => {
    const syncRoute = () => setRoute(currentHash())
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  const problemId = route.startsWith('problem/') ? route.slice('problem/'.length) : null
  const selectedProblem = useMemo(
    () => problems.find((problem) => problem.id === problemId || String(problem.number) === problemId),
    [problemId],
  )
  const completed = problems.filter((problem) => progress[problem.id]?.completed).length

  const openProblem = (id: string) => {
    const problem = problems.find((item) => item.id === id || String(item.number) === id)
    if (!problem) return
    window.location.hash = `/problem/${problem.id}`
    setRoute(`problem/${problem.id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateSection = (section: 'dashboard' | 'learn' | 'practice' | 'playground') => {
    window.location.hash = `/${section}`
    setRoute(section)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (selectedProblem) {
    return (
      <PracticePage
        key={selectedProblem.id}
        problem={selectedProblem}
        progress={progress}
        total={problems.length}
        completed={completed}
        onHome={() => navigateSection('practice')}
        onNavigate={openProblem}
        onDraft={saveDraft}
        onAttempt={recordAttempt}
      />
    )
  }

  if (route.startsWith('learn')) {
    return <LearningPathPage chapters={chapters} completedLessons={completedLessons} completedProblems={completed} totalProblems={problems.length} initialChapter={route.split('/')[1]} projectProgress={projectProgress} onNavigateSection={navigateSection} onToggleLesson={toggleLesson} onToggleProjectStep={toggleProject} onOpenPractice={openProblem} />
  }

  if (route === 'playground') {
    return <PlaygroundPage scenarios={scenarios} completed={completed} total={problems.length} onNavigateSection={navigateSection} />
  }

  if (route === 'practice') {
    return <HomePage problems={problems} progress={progress} onOpen={openProblem} onReset={reset} libraryOnly onNavigateSection={navigateSection} />
  }

  return <DashboardPage problems={problems} chapters={chapters} progress={progress} activity={activity} completedLessons={completedLessons} projectProgress={projectProgress} onOpen={openProblem} onReset={reset} onNavigateSection={navigateSection} />
}
