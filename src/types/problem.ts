export type Difficulty = '简单' | '中等' | '困难'

export type CellValue = string | number | null

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
}

export interface ProblemProgress {
  completed: boolean
  incorrectAttempts: number
  attempts: number
  lastAttemptAt?: string
  draft?: string
  lastIncorrectSql?: string
}

export type ProgressMap = Record<string, ProblemProgress>

export type VisualType = 'select' | 'filter' | 'aggregate' | 'group' | 'having' | 'join' | 'subquery' | 'case' | 'window' | 'project'

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
}

export interface PlaygroundScenario {
  id: string
  title: string
  concept: string
  sql: string
  explanation: string
  result: DataTable
}
