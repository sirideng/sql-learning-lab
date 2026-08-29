export type Difficulty = '简单' | '中等' | '困难'
export type LearningLanguage = 'sql' | 'pandas' | 'both'

export type CellValue = string | number | boolean | null

export interface DataTable {
  name: string
  columns: string[]
  rows: CellValue[][]
}

export interface ExplanationStep {
  title: string
  goal: string
  detail: string
  sql?: string
  table?: DataTable
}

export interface SqlProblem {
  id: string
  number: number
  title: string
  source: string
  chapter: string
  difficulty: Difficulty
  tags: string[]
  description: string
  challenge: string
  tables: DataTable[]
  hints: string[]
  starterSql: string
  solution: string
  validationTokens: string[]
  expectedResult: DataTable
  explanationSteps: ExplanationStep[]
  explanation?: string
  visualizationSteps?: ExplanationStep[]
  language?: 'sql'
}

export interface LearningQuestion {
  id: string
  number: number
  title: string
  source: string
  chapter: string
  language: LearningLanguage
  difficulty: Difficulty
  tags: string[]
  description: string
  challenge: string
  tables: DataTable[]
  sampleData: DataTable[]
  expectedOutput: DataTable
  hints: string[]
  solution: string
  explanation: string
  visualizationSteps: ExplanationStep[]
}

export interface PandasQuestion extends LearningQuestion {
  language: 'pandas'
  starterCode: string
  validationPatterns: string[]
  sqlEquivalent?: string
  alternateSqlId?: string
}

export interface ProblemProgress {
  completed: boolean
  incorrectAttempts: number
  attempts: number
  lastAttemptAt?: string
  draft?: string
  lastIncorrectSql?: string
  lastIncorrectCode?: string
  lastErrorReason?: string
  language?: 'sql' | 'pandas'
}

export type ProgressMap = Record<string, ProblemProgress>

export type ActivityMap = Record<string, number>

export type VisualType = 'select' | 'filter' | 'aggregate' | 'group' | 'having' | 'join' | 'subquery' | 'case' | 'window' | 'project' | 'date' | 'string' | 'cte' | 'analytics' | 'performance' | 'pandas' | 'project-lab'

export interface LearningChapter {
  id: string
  order: number
  title: string
  subtitle: string
  visualType: VisualType
  description: string
  theory: string[]
  pandasBridge: string
  sqlExample: string
  takeaways: string[]
  practiceIds: string[]
  deepDive: ChapterDeepDive
}

export interface ChapterDeepDive {
  id: string
  why: {
    scenario: string
    question: string
    reason: string
  }
  coreConcepts: Array<{
    title: string
    what: string
    solves: string
    when: string
  }>
  demo: {
    originalTables: DataTable[]
    steps: Array<{
      title: string
      description: string
      table: DataTable
    }>
    finalTable: DataTable
  }
  commonMistakes: Array<{
    title: string
    wrongSql: string
    problem: string
    fix: string
  }>
  pandasComparison: {
    sql: string
    pandas: string
    explanation: string
  }
  exercises: Array<{
    level: '基础' | '理解' | '综合'
    difficulty?: 'Easy' | 'Medium'
    question: string
    answer: string
    tables?: DataTable[]
    expectedResult?: DataTable
    hints?: string[]
    solution?: string
    errorTips?: string[]
  }>
  checklist: string[]
  sqlExamples?: Array<{
    title: string
    level: '基础' | '实际分析'
    description: string
    sql: string
  }>
  caseStudies?: Array<{
    title: string
    description: string
    businessQuestions: string[]
    tables: DataTable[]
    steps: Array<{
      title: string
      sql: string
      result: DataTable
      interpretation: string
    }>
  }>
  comparisonPairs?: Array<{
    concept: string
    sql: string
    pandas: string
    takeaway: string
  }>
  executionOrder?: Array<{
    stage: string
    purpose: string
    example: string
  }>
  projectLab?: {
    id: string
    title: string
    description: string
    steps: Array<{
      id: string
      title: string
      description: string
      deliverable: string
    }>
  }
}

export type ProjectProgressMap = Record<string, string[]>

export interface PlaygroundScenario {
  id: string
  title: string
  concept: string
  sql: string
  explanation: string
  result: DataTable
}

export interface PandasChapter {
  id: string
  order: number
  title: string
  subtitle: string
  why: { scenario: string; question: string; reason: string }
  concepts: Array<{ title: string; what: string; when: string }>
  code: string
  sqlComparison: string
  original: DataTable[]
  steps: Array<{ title: string; description: string; code: string; table: DataTable }>
  finalTable: DataTable
  mistakes: Array<{ title: string; problem: string; fix: string }>
  exercises: Array<{ question: string; hint: string; answer: string }>
  checklist: string[]
  visualType: 'dataframe' | 'filter' | 'groupby' | 'merge' | 'date' | 'string' | 'transform' | 'diff' | 'pivot' | 'cleaning' | 'analysis'
}

export interface CrossLanguageMapping {
  id: string
  title: string
  businessQuestion: string
  relation: string
  tables: DataTable[]
  sql: string
  pandas: string
  sqlIntermediate: DataTable
  pandasIntermediate: DataTable
  result: DataTable
}

export interface PandasPlaygroundScenario {
  id: string
  title: string
  concept: string
  code: string
  requiredPatterns: string[]
  explanation: string
  tables: DataTable[]
  steps: ExplanationStep[]
  result: DataTable
}

export interface DualAnalysisCase {
  id: string
  title: string
  description: string
  tables: DataTable[]
  stages: Array<{
    title: string
    purpose: string
    sql: string
    pandas: string
    result: DataTable
    conclusion: string
  }>
}
