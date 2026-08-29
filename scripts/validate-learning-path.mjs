import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
const chapters = readJson('src/data/learningPath.json')
const lessons = readJson('src/data/chapterDeepDives.json')
const visualStepSql = readJson('src/data/visualStepSql.json')
const errors = []
const fail = (message) => errors.push(message)
const lessonMap = new Map(lessons.map((lesson) => [lesson.id, lesson]))
const priorityIds = new Set(['join', 'group-by', 'having', 'case-when', 'window'])
const extendedExerciseChapterIds = new Set(['date-functions', 'string-functions', 'cte', 'analytics-cases', 'performance-basics', 'sql-pandas', 'project-lab'])

const validateTable = (table, context) => {
  if (!table?.name || !Array.isArray(table.columns) || table.columns.length === 0 || !Array.isArray(table.rows)) {
    fail(`${context} 表结构不完整`)
    return
  }
  table.rows.forEach((row, index) => {
    if (!Array.isArray(row) || row.length !== table.columns.length) fail(`${context} 第 ${index + 1} 行字段数量不一致`)
  })
}

if (chapters.length !== 18) fail(`Learning Path 应为 18 章，当前 ${chapters.length} 章`)
if (lessons.length !== chapters.length) fail(`深度课程数量 ${lessons.length} 与章节数量 ${chapters.length} 不一致`)
if (lessonMap.size !== lessons.length) fail('深度课程存在重复 id')
if (new Set(chapters.map((chapter) => chapter.id)).size !== chapters.length) fail('章节存在重复 id')
chapters.forEach((chapter, index) => {
  if (chapter.order !== index + 1) fail(`${chapter.id} 的章节顺序应为 ${index + 1}`)
})

for (const chapter of chapters) {
  const lesson = lessonMap.get(chapter.id)
  if (!lesson) {
    fail(`${chapter.id} 缺少深度课程`)
    continue
  }
  if (!lesson.why?.scenario || !lesson.why?.question || !lesson.why?.reason) fail(`${chapter.id} 缺少“为什么需要”内容`)
  if (!Array.isArray(lesson.coreConcepts) || lesson.coreConcepts.length < 3) fail(`${chapter.id} 核心概念少于 3 个`)
  if (!lesson.coreConcepts?.every((item) => item.what && item.solves && item.when)) fail(`${chapter.id} 核心概念字段不完整`)
  lesson.demo?.originalTables?.forEach((table, index) => validateTable(table, `${chapter.id} 原始表 ${index + 1}`))
  validateTable(lesson.demo?.finalTable, `${chapter.id} 最终表`)
  if (!lesson.demo?.steps?.every((step) => step.title && step.description && step.table?.columns?.length && Array.isArray(step.table.rows))) fail(`${chapter.id} 执行步骤缺少中间表`)
  lesson.demo?.steps?.forEach((step, index) => validateTable(step.table, `${chapter.id} 中间表 ${index + 1}`))
  const stepSql = visualStepSql[chapter.id]
  if (!Array.isArray(stepSql) || stepSql.length !== lesson.demo.steps.length) fail(`${chapter.id} 可视化步骤代码数量与中间表数量不一致`)
  else if (!stepSql.every((sql) => typeof sql === 'string' && /\b(select|with)\b/i.test(sql))) fail(`${chapter.id} 可视化步骤存在空白或无效 SQL`)
  if (priorityIds.has(chapter.id) && lesson.demo.steps.length < 3) fail(`${chapter.id} 重点章节执行步骤少于 3 个`)
  if (chapter.id === 'join' && lesson.demo.originalTables.length < 2) fail('JOIN 章节必须展示两张原始表')
  if (!Array.isArray(lesson.commonMistakes) || lesson.commonMistakes.length < 3) fail(`${chapter.id} 错误案例少于 3 个`)
  if (!lesson.commonMistakes?.every((item) => item.wrongSql && item.problem && item.fix)) fail(`${chapter.id} 错误案例字段不完整`)
  if (!lesson.pandasComparison?.sql || !lesson.pandasComparison?.pandas || !lesson.pandasComparison?.explanation) fail(`${chapter.id} 缺少 SQL/Pandas 对照`)

  const counts = { 基础: 0, 理解: 0, 综合: 0 }
  const difficulties = { Easy: 0, Medium: 0 }
  for (const [index, exercise] of (lesson.exercises ?? []).entries()) {
    if (!(exercise.level in counts) || !exercise.question || !exercise.answer) fail(`${chapter.id} 存在无效小练习`)
    else counts[exercise.level] += 1
    if (extendedExerciseChapterIds.has(chapter.id)) {
      if (!(exercise.difficulty in difficulties)) fail(`${chapter.id} 练习 ${index + 1} 难度无效`)
      else difficulties[exercise.difficulty] += 1
      if (!exercise.tables?.length || !exercise.expectedResult || !exercise.hints?.length || !exercise.solution || !exercise.errorTips?.length) fail(`${chapter.id} 练习 ${index + 1} 缺少数据表、预期输出、Hint、Solution 或错误提示`)
      exercise.tables?.forEach((table, tableIndex) => validateTable(table, `${chapter.id} 练习 ${index + 1} 输入表 ${tableIndex + 1}`))
      validateTable(exercise.expectedResult, `${chapter.id} 练习 ${index + 1} 预期输出`)
    }
  }
  if (counts.基础 < 2 || counts.理解 < 2 || counts.综合 < 1) fail(`${chapter.id} 小练习分布不足：${JSON.stringify(counts)}`)
  if (extendedExerciseChapterIds.has(chapter.id) && (difficulties.Easy !== 2 || difficulties.Medium !== 3)) fail(`${chapter.id} 应有 Easy 2 题、Medium 3 题：${JSON.stringify(difficulties)}`)
  if (extendedExerciseChapterIds.has(chapter.id) && (!lesson.sqlExamples || lesson.sqlExamples.length < 2)) fail(`${chapter.id} 缺少基础与实际 SQL 示例`)
  if (!Array.isArray(lesson.checklist) || lesson.checklist.length < 4) fail(`${chapter.id} 学完检查少于 4 项`)
}

if (lessonMap.get('analytics-cases')?.caseStudies?.length !== 3) fail('Chapter 15 必须包含 3 个完整 Analytics Case Study')
lessonMap.get('analytics-cases')?.caseStudies?.forEach((item, index) => {
  if (!item.businessQuestions?.length || !item.tables?.length || !item.steps?.length) fail(`Chapter 15 项目 ${index + 1} 内容不完整`)
  item.tables?.forEach((table, tableIndex) => validateTable(table, `Chapter 15 项目 ${index + 1} 输入表 ${tableIndex + 1}`))
  item.steps?.forEach((step, stepIndex) => validateTable(step.result, `Chapter 15 项目 ${index + 1} 结果 ${stepIndex + 1}`))
})
const expectedOrder = ['FROM', 'JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY']
if (JSON.stringify(lessonMap.get('performance-basics')?.executionOrder?.map((item) => item.stage)) !== JSON.stringify(expectedOrder)) fail('Chapter 16 SQL 执行顺序不正确')
if ((lessonMap.get('sql-pandas')?.comparisonPairs?.length ?? 0) < 5) fail('Chapter 17 SQL/Pandas 对照少于 5 组')
if (lessonMap.get('project-lab')?.projectLab?.steps?.length !== 5) fail('Chapter 18 Project Lab 必须包含 5 个步骤')

for (const lesson of lessons) {
  if (!chapters.some((chapter) => chapter.id === lesson.id)) fail(`深度课程引用未知章节：${lesson.id}`)
}
for (const id of Object.keys(visualStepSql)) {
  if (!lessonMap.has(id)) fail(`可视化步骤代码引用未知章节：${id}`)
}

function quoteIdentifier(identifier) { return `"${identifier.replaceAll('"', '""')}"` }
function inferType(table, columnIndex) {
  const values = table.rows.map((row) => row[columnIndex]).filter((value) => value !== null)
  if (values.length && values.every((value) => typeof value === 'number' && Number.isInteger(value))) return 'INTEGER'
  if (values.length && values.every((value) => typeof value === 'number')) return 'REAL'
  return 'TEXT'
}
function createDatabase(SQL, tables) {
  const database = new SQL.Database()
  for (const table of tables) {
    const definitions = table.columns.map((column, index) => `${quoteIdentifier(column)} ${inferType(table, index)}`)
    database.run(`CREATE TABLE ${quoteIdentifier(table.name)} (${definitions.join(', ')})`)
    if (!table.rows.length) continue
    const statement = database.prepare(`INSERT INTO ${quoteIdentifier(table.name)} VALUES (${table.columns.map(() => '?').join(', ')})`)
    try { table.rows.forEach((row) => statement.run(row)) } finally { statement.free() }
  }
  return database
}
function splitArgs(value) {
  const args = []
  let start = 0
  let depth = 0
  let quote
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    const next = value[index + 1]
    if (quote) {
      if (character === quote && next === quote) index += 1
      else if (character === quote) quote = undefined
      continue
    }
    if (`'\"\``.includes(character)) quote = character
    else if (character === '(') depth += 1
    else if (character === ')') depth -= 1
    else if (character === ',' && depth === 0) { args.push(value.slice(start, index)); start = index + 1 }
  }
  args.push(value.slice(start))
  return args
}
function translateConcat(sql) {
  const matcher = /\bconcat\s*\(/gi
  let cursor = 0
  let output = ''
  while (cursor < sql.length) {
    matcher.lastIndex = cursor
    const match = matcher.exec(sql)
    if (!match) return output + sql.slice(cursor)
    output += sql.slice(cursor, match.index)
    const open = matcher.lastIndex - 1
    let depth = 1
    let quote
    let close = open + 1
    for (; close < sql.length; close += 1) {
      const character = sql[close]
      const next = sql[close + 1]
      if (quote) {
        if (character === quote && next === quote) close += 1
        else if (character === quote) quote = undefined
      } else if (`'\"\``.includes(character)) quote = character
      else if (character === '(') depth += 1
      else if (character === ')' && --depth === 0) break
    }
    if (depth) return output + sql.slice(match.index)
    output += `(${splitArgs(sql.slice(open + 1, close)).map((argument) => translateConcat(argument.trim())).join(' || ')})`
    cursor = close + 1
  }
  return output
}
function translateDivision(sql) {
  let output = ''
  let quote
  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index]
    const next = sql[index + 1]
    if (quote) {
      output += character
      if (character === quote && next === quote) { output += next; index += 1 }
      else if (character === quote) quote = undefined
      continue
    }
    if (`'\"\``.includes(character)) quote = character
    output += character === '/' ? '* 1.0 /' : character
  }
  return output
}
function translateMySql(sql) {
  const translated = translateConcat(sql)
    .replace(/date_add\s*\(\s*([^,()]+?)\s*,\s*interval\s+([+-]?\d+)\s+(day|month|year|hour|minute|second)s?\s*\)/gi, (_match, expression, amount, unit) => `${/^(hour|minute|second)$/i.test(unit) ? 'datetime' : 'date'}(${expression.trim()}, '${Number(amount) >= 0 ? '+' : ''}${Number(amount)} ${unit.toLowerCase()}')`)
    .replace(/date_sub\s*\(\s*([^,()]+?)\s*,\s*interval\s+([+-]?\d+)\s+(day|month|year|hour|minute|second)s?\s*\)/gi, (_match, expression, amount, unit) => `${/^(hour|minute|second)$/i.test(unit) ? 'datetime' : 'date'}(${expression.trim()}, '${-Number(amount) >= 0 ? '+' : ''}${-Number(amount)} ${unit.toLowerCase()}')`)
    .replace(/date_format\s*\(\s*([^,()]+?)\s*,\s*(['"])(.*?)\2\s*\)/gi, (_match, expression, _quote, format) => `strftime('${format}', ${expression.trim()})`)
    .replace(/datediff\s*\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)/gi, (_match, end, start) => `CAST(julianday(${end.trim()}) - julianday(${start.trim()}) AS INTEGER)`)
    .replace(/\byear\s*\(\s*([^()]+?)\s*\)/gi, (_match, expression) => `CAST(strftime('%Y', ${expression.trim()}) AS INTEGER)`)
    .replace(/\bmonth\s*\(\s*([^()]+?)\s*\)/gi, (_match, expression) => `CAST(strftime('%m', ${expression.trim()}) AS INTEGER)`)
    .replace(/\bday\s*\(\s*([^()]+?)\s*\)/gi, (_match, expression) => `CAST(strftime('%d', ${expression.trim()}) AS INTEGER)`)
  return translateDivision(translated)
}
function cellsEqual(actual, expected) {
  if (actual === null || expected === null) return actual === expected
  if (typeof actual === 'number' && typeof expected === 'number') return Math.abs(actual - expected) < 1e-6
  return String(actual) === String(expected)
}
function compareResult(set, expected, ordered) {
  if (JSON.stringify(set.columns) !== JSON.stringify(expected.columns) || set.values.length !== expected.rows.length) return false
  const rowEqual = (actual, target) => actual.length === target.length && actual.every((cell, index) => cellsEqual(cell, target[index]))
  if (ordered) return set.values.every((row, index) => rowEqual(row, expected.rows[index]))
  const unmatched = [...set.values]
  for (const row of expected.rows) {
    const index = unmatched.findIndex((candidate) => rowEqual(candidate, row))
    if (index < 0) return false
    unmatched.splice(index, 1)
  }
  return true
}

const SQL = await initSqlJs()
for (const chapter of chapters.filter((item) => extendedExerciseChapterIds.has(item.id))) {
  const lesson = lessonMap.get(chapter.id)
  for (const [index, exercise] of lesson.exercises.entries()) {
    let database
    try {
      database = createDatabase(SQL, exercise.tables)
      const sets = database.exec(translateMySql(exercise.solution))
      if (sets.length !== 1 || !compareResult(sets[0], exercise.expectedResult, /\border\s+by\b/i.test(exercise.solution))) fail(`${chapter.id} 练习 ${index + 1} 的 Solution 与预期输出不一致`)
    } catch (error) {
      fail(`${chapter.id} 练习 ${index + 1} SQL 执行失败：${error instanceof Error ? error.message : error}`)
    } finally { database?.close() }
  }
}

if (errors.length > 0) {
  console.error(`Learning Path 校验失败（${errors.length} 项）：`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`Learning Path 校验通过：${chapters.length} 个章节，数据结构、章节引用与表字段一致。`)
console.log('所有 SQL 执行可视化步骤均已配对独立 SQL 代码。')
console.log('7 个进阶章节共 35 道配套练习，全部 Solution 已真实执行并与预期输出一致。')
console.log('Analytics Case Study、执行顺序、SQL/Pandas 对照和 Project Lab 专项结构完整。')
