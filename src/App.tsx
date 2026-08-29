import { useEffect, useMemo, useState } from 'react'
import additionalProblemData from './data/additionalQuestions.json'
import careerProblemData from './data/careerQuestions.json'
import chapterDeepDiveData from './data/chapterDeepDives.json'
import learningData from './data/learningPath.json'
import { crossLanguageMappings } from './data/crossLanguageMappings'
import { dualAnalysisCases } from './data/dualAnalysisCases'
import { pandasChapters } from './data/pandasLearningPath'
import { pandasPlaygroundScenarios } from './data/pandasPlaygroundScenarios'
import { pandasQuestions } from './data/pandasQuestions'
import playgroundData from './data/playgroundScenarios.json'
import problemData from './data/problems.json'
import windowPracticeData from './data/windowPracticeQuestions.json'
import { useProgress } from './hooks/useProgress'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { LearningPathPage } from './pages/LearningPathPage'
import { PlaygroundPage } from './pages/PlaygroundPage'
import { PracticePage } from './pages/PracticePage'
import { ComparisonPage } from './pages/ComparisonPage'
import { PandasLearningPage } from './pages/PandasLearningPage'
import { PandasPlaygroundPage } from './pages/PandasPlaygroundPage'
import { PandasPracticePage } from './pages/PandasPracticePage'
import { LearningReportPage } from './pages/LearningReportPage'
import { ProjectCasesPage } from './pages/ProjectCasesPage'
import type { AppSection } from './components/AppHeader'
import type { ChapterDeepDive, ExplanationStep, LearningChapter, LearningLanguage, PlaygroundScenario, SqlProblem } from './types/problem'

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
].map((problem) => ({ ...problem, language: 'sql' as const })) as SqlProblem[]
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
  const pandasProblemId = route.startsWith('pandas/problem/') ? route.slice('pandas/problem/'.length) : null
  const selectedProblem = useMemo(
    () => problems.find((problem) => problem.id === problemId || String(problem.number) === problemId),
    [problemId],
  )
  const selectedPandasProblem = useMemo(
    () => pandasQuestions.find((problem) => problem.id === pandasProblemId || String(problem.number) === pandasProblemId),
    [pandasProblemId],
  )
  const completed = problems.filter((problem) => progress[problem.id]?.completed).length
  const pandasCompleted = pandasQuestions.filter((problem) => progress[problem.id]?.completed).length
  const allQuestions = [...problems, ...pandasQuestions]

  const openProblem = (id: string) => {
    const problem = problems.find((item) => item.id === id || String(item.number) === id)
    if (!problem) return
    window.location.hash = `/problem/${problem.id}`
    setRoute(`problem/${problem.id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateSection = (section: AppSection) => {
    window.location.hash = `/${section}`
    setRoute(section)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openPandasProblem = (id: string) => {
    const problem = pandasQuestions.find((item) => item.id === id || String(item.number) === id)
    if (!problem) return
    window.location.hash = `/pandas/problem/${problem.id}`
    setRoute(`pandas/problem/${problem.id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigatePandasSection = (section: AppSection) => {
    const target = section === 'learn' || section === 'practice' || section === 'playground' ? `pandas/${section}` : section
    window.location.hash = `/${target}`
    setRoute(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openAnyQuestion = (question: { id: string; language?: LearningLanguage }) => question.language === 'pandas' ? openPandasProblem(question.id) : openProblem(question.id)

  if (selectedPandasProblem) {
    return <PandasPracticePage key={selectedPandasProblem.id} problem={selectedPandasProblem} progress={progress} total={pandasQuestions.length} completed={pandasCompleted} onHome={() => navigatePandasSection('practice')} onNavigate={openPandasProblem} onOpenSql={openProblem} onDraft={saveDraft} onAttempt={recordAttempt} />
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
        alternatePandasId={pandasQuestions.find((item) => item.alternateSqlId === selectedProblem.id)?.id}
        onOpenPandas={openPandasProblem}
      />
    )
  }

  if (route.startsWith('learn')) {
    return <LearningPathPage chapters={chapters} completedLessons={completedLessons} completedProblems={completed} totalProblems={problems.length} initialChapter={route.split('/')[1]} projectProgress={projectProgress} onNavigateSection={navigateSection} onToggleLesson={toggleLesson} onToggleProjectStep={toggleProject} onOpenPractice={openProblem} />
  }


  if (route.startsWith('pandas/learn')) {
    return <PandasLearningPage chapters={pandasChapters} completedLessons={completedLessons} completed={pandasCompleted} total={pandasQuestions.length} initialChapter={route.split('/')[2]} onToggleLesson={toggleLesson} onNavigateSection={navigatePandasSection} />
  }

  if (route === 'pandas/playground') {
    return <PandasPlaygroundPage scenarios={pandasPlaygroundScenarios} completed={pandasCompleted} total={pandasQuestions.length} onNavigateSection={navigatePandasSection} />
  }

  if (route === 'pandas/practice') {
    return <HomePage problems={pandasQuestions} allProblems={allQuestions} progress={progress} onOpen={(id) => openPandasProblem(id)} onOpenQuestion={openAnyQuestion} onReset={reset} libraryOnly languageMode="pandas" onNavigateSection={navigatePandasSection} />
  }

  if (route === 'compare') {
    return <ComparisonPage mappings={crossLanguageMappings} completed={completed + pandasCompleted} total={allQuestions.length} onNavigateSection={navigateSection} />
  }

  if (route === 'projects') {
    return <ProjectCasesPage cases={dualAnalysisCases} completed={completed + pandasCompleted} total={allQuestions.length} onNavigateSection={navigateSection} />
  }

  if (route === 'report') {
    return <LearningReportPage problems={problems} pandasProblems={pandasQuestions} progress={progress} activity={activity} completedLessons={completedLessons} onNavigateSection={navigateSection} />
  }

  if (route === 'playground') {
    return <PlaygroundPage scenarios={scenarios} completed={completed} total={problems.length} onNavigateSection={navigateSection} />
  }

  if (route === 'practice') {
    return <HomePage problems={problems} allProblems={allQuestions} progress={progress} onOpen={openProblem} onOpenQuestion={openAnyQuestion} onReset={reset} libraryOnly languageMode="sql" onNavigateSection={navigateSection} />
  }

  return <DashboardPage problems={problems} pandasProblems={pandasQuestions} chapters={chapters} progress={progress} activity={activity} completedLessons={completedLessons} projectProgress={projectProgress} onOpen={openProblem} onOpenPandas={openPandasProblem} onReset={reset} onNavigateSection={navigateSection} />
}
