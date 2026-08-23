import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'))

const coreProblems = readJson('src/data/problems.json')
const additionalProblems = readJson('src/data/additionalQuestions.json')
const careerProblems = readJson('src/data/careerQuestions.json')
const learningPath = readJson('src/data/learningPath.json')

const legacyMetadata = {
  'next-day-retention': { source: 'LeetCode · 经典', chapter: 'JOIN' },
  'customers-without-transactions': { source: 'LeetCode · 经典', chapter: 'JOIN' },
  'products-sold-only-in-spring': { source: 'LeetCode · 经典', chapter: 'HAVING' },
  'manager-direct-reports': { source: 'LeetCode · 经典', chapter: 'JOIN' },
  'customers-who-bought-all-products': { source: 'LeetCode · 经典', chapter: 'Subquery' },
  'daily-cumulative-profit': { source: 'SQL Learning Lab', chapter: 'Window Function' },
}

const problems = [
  ...coreProblems.map((problem) => ({ ...problem, ...legacyMetadata[problem.id] })),
  ...additionalProblems,
  ...careerProblems,
]
const errors = []
const fail = (message) => errors.push(message)

const ids = new Set()
const numbers = new Set()
const allowedDifficulties = new Set(['简单', '中等', '困难'])
const chapterAliases = new Set([
  ...learningPath.map((chapter) => chapter.title),
  'WHERE', 'ORDER BY', 'Data Cleaning', 'GROUP BY', 'HAVING', 'JOIN', 'Subquery',
  'CASE WHEN', 'Window Function', '综合案例',
])

for (const problem of problems) {
  if (ids.has(problem.id)) fail(`题目 id 重复：${problem.id}`)
  ids.add(problem.id)
  if (numbers.has(problem.number)) fail(`题号重复：${problem.number}`)
  numbers.add(problem.number)
  if (!allowedDifficulties.has(problem.difficulty)) fail(`${problem.id} 的 difficulty 无效`)
  if (!problem.expectedResult?.columns?.length || !Array.isArray(problem.expectedResult.rows)) fail(`${problem.id} 缺少 expected output`)
  const steps = problem.visualizationSteps ?? problem.explanationSteps
  if (!Array.isArray(steps) || steps.length === 0) fail(`${problem.id} 缺少 visualizationSteps / explanationSteps`)
  if (!chapterAliases.has(problem.chapter)) fail(`${problem.id} 引用了未知章节：${problem.chapter}`)
}

const requiredCareerFields = ['id', 'title', 'source', 'chapter', 'difficulty', 'tags', 'description', 'tables', 'hints', 'solution', 'explanation', 'visualizationSteps', 'expectedResult']
for (const problem of careerProblems) {
  for (const field of requiredCareerFields) {
    if (problem[field] === undefined || problem[field] === null || problem[field] === '') fail(`${problem.id} 缺少字段 ${field}`)
  }
  if (!problem.tables.every((table) => Array.isArray(table.rows) && table.rows.length > 0)) fail(`${problem.id} 缺少 sample data`)
  if (problem.visualizationSteps.length < 2) fail(`${problem.id} 的 visualizationSteps 少于 2 步`)
  if (!problem.visualizationSteps.every((step) => step.table?.columns?.length && Array.isArray(step.table.rows))) fail(`${problem.id} 存在没有中间表的 visualizationSteps`)
}

const referencedPracticeIds = new Set(learningPath.flatMap((chapter) => chapter.practiceIds))
for (const practiceId of referencedPracticeIds) {
  if (!ids.has(practiceId)) fail(`课程章节引用了不存在的题目：${practiceId}`)
}
for (const problem of careerProblems) {
  if (!referencedPracticeIds.has(problem.id)) fail(`新增题目未加入学习路线：${problem.id}`)
}

const difficultyCounts = Object.fromEntries(['简单', '中等', '困难'].map((difficulty) => [difficulty, careerProblems.filter((problem) => problem.difficulty === difficulty).length]))
if (careerProblems.length !== 30) fail(`新增题目数量应为 30，当前为 ${careerProblems.length}`)
if (difficultyCounts['简单'] !== 10 || difficultyCounts['中等'] !== 18 || difficultyCounts['困难'] !== 2) {
  fail(`新增题目难度分布错误：${JSON.stringify(difficultyCounts)}`)
}

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function inferType(table, columnIndex) {
  const values = table.rows.map((row) => row[columnIndex]).filter((value) => value !== null)
  if (values.length > 0 && values.every((value) => typeof value === 'number' && Number.isInteger(value))) return 'INTEGER'
  if (values.length > 0 && values.every((value) => typeof value === 'number')) return 'REAL'
  return 'TEXT'
}

function createDatabase(SQL, problem) {
  const database = new SQL.Database()
  for (const table of problem.tables) {
    const definitions = table.columns.map((column, index) => `${quoteIdentifier(column)} ${inferType(table, index)}`)
    database.run(`CREATE TABLE ${quoteIdentifier(table.name)} (${definitions.join(', ')})`)
    if (table.rows.length === 0) continue
    const statement = database.prepare(`INSERT INTO ${quoteIdentifier(table.name)} VALUES (${table.columns.map(() => '?').join(', ')})`)
    try {
      table.rows.forEach((row) => statement.run(row))
    } finally {
      statement.free()
    }
  }
  return database
}

function translateDivision(sql) {
  let output = ''
  let quote
  let lineComment = false
  let blockComment = false
  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index]
    const next = sql[index + 1]
    if (lineComment) {
      output += character
      if (character === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      output += character
      if (character === '*' && next === '/') {
        output += next
        index += 1
        blockComment = false
      }
      continue
    }
    if (quote) {
      output += character
      if (character === quote) {
        if (next === quote) {
          output += next
          index += 1
        } else quote = undefined
      } else if (character === '\\' && next) {
        output += next
        index += 1
      }
      continue
    }
    if (character === '-' && next === '-') {
      output += character + next
      index += 1
      lineComment = true
      continue
    }
    if (character === '/' && next === '*') {
      output += character + next
      index += 1
      blockComment = true
      continue
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character
      output += character
      continue
    }
    output += character === '/' ? '* 1.0 /' : character
  }
  return output
}

function translateMySql(sql) {
  const functions = sql
    .replace(/date_add\s*\(\s*([^,()]+?)\s*,\s*interval\s+([+-]?\d+)\s+(day|month|year|hour|minute|second)s?\s*\)/gi, (_match, expression, amount, unit) => {
      const numericAmount = Number(amount)
      const modifier = `${numericAmount >= 0 ? '+' : ''}${numericAmount} ${unit.toLowerCase()}`
      return `${/^(hour|minute|second)$/i.test(unit) ? 'datetime' : 'date'}(${expression.trim()}, '${modifier}')`
    })
    .replace(/date_format\s*\(\s*([^,()]+?)\s*,\s*(['"])(.*?)\2\s*\)/gi, (_match, expression, _quote, format) => `strftime('${format}', ${expression.trim()})`)
  return translateDivision(functions)
}

function cellEqual(actual, expected) {
  if (actual === null || expected === null) return actual === expected
  if (typeof actual === 'number' && typeof expected === 'number') return Math.abs(actual - expected) <= 1e-6
  return String(actual) === String(expected)
}

function rowEqual(actual, expected) {
  return actual.length === expected.length && actual.every((cell, index) => cellEqual(cell, expected[index]))
}

function compareResult(actual, expected, ordered) {
  if (JSON.stringify(actual.columns) !== JSON.stringify(expected.columns)) return false
  if (actual.rows.length !== expected.rows.length) return false
  if (ordered) return expected.rows.every((row, index) => rowEqual(actual.rows[index], row))
  const unmatched = [...actual.rows]
  for (const expectedRow of expected.rows) {
    const index = unmatched.findIndex((row) => rowEqual(row, expectedRow))
    if (index < 0) return false
    unmatched.splice(index, 1)
  }
  return true
}

const SQL = await initSqlJs()
for (const problem of careerProblems) {
  let database
  try {
    database = createDatabase(SQL, problem)
    const sets = database.exec(translateMySql(problem.solution))
    if (sets.length !== 1) {
      fail(`${problem.id} 的 solution 没有返回唯一结果表`)
      continue
    }
    const actual = { columns: sets[0].columns, rows: sets[0].values }
    if (!compareResult(actual, problem.expectedResult, /\border\s+by\b/i.test(problem.solution))) fail(`${problem.id} 的 solution 与 expectedResult 不一致`)
  } catch (error) {
    fail(`${problem.id} 的 solution 执行失败：${error instanceof Error ? error.message : error}`)
  } finally {
    database?.close()
  }
}

if (errors.length > 0) {
  console.error(`题库校验失败（${errors.length} 项）：`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`题库校验通过：共 ${problems.length} 题，新增 ${careerProblems.length} 题。`)
console.log(`新增难度分布：简单 ${difficultyCounts['简单']}，中等 ${difficultyCounts['中等']}，困难 ${difficultyCounts['困难']}。`)
console.log('新增 30 题的标准答案均已真实执行，并与 expectedResult 完全一致。')
