import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { CellValue, DataTable, SqlProblem } from '../types/problem'

export interface RunResult {
  status: 'success' | 'error'
  message: string
  missingConcepts: string[]
  table?: DataTable
  durationMs: number
}

const friendlyNames: Record<string, string> = {
  select: 'SELECT',
  'min(': 'MIN()',
  'max(': 'MAX()',
  'group by': 'GROUP BY',
  'left join': 'LEFT JOIN',
  join: 'JOIN',
  date_add: 'DATE_ADD()',
  date_format: 'DATE_FORMAT()',
  'count(': 'COUNT()',
  'count(distinct': 'COUNT(DISTINCT ...)',
  'is null': 'IS NULL',
  having: 'HAVING',
  'avg(': 'AVG()',
  'round(': 'ROUND(..., 3)',
  reports_to: 'reports_to 连接条件',
  'from product': 'Product 子查询',
  'sum(': 'SUM()',
  over: 'OVER()',
  'order by': 'ORDER BY',
  'rank(': 'RANK()',
}

let enginePromise: Promise<SqlJsStatic> | undefined

function getEngine() {
  enginePromise ??= initSqlJs({ locateFile: () => wasmUrl })
  return enginePromise
}

function stripComments(sql: string) {
  return sql.replace(/--.*$/gm, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ')
}

function normalizeSql(sql: string) {
  return stripComments(sql).replace(/\s+/g, ' ').trim().toLowerCase()
}

function translateMySql(sql: string) {
  const translatedFunctions = sql
    .replace(
      /date_add\s*\(\s*([^,()]+?)\s*,\s*interval\s+([+-]?\d+)\s+(day|month|year|hour|minute|second)s?\s*\)/gi,
      (_match, expression: string, amount: string, unit: string) => {
        const numericAmount = Number(amount)
        const modifier = `${numericAmount >= 0 ? '+' : ''}${numericAmount} ${unit.toLowerCase()}`
        const sqliteFunction = /^(hour|minute|second)$/i.test(unit) ? 'datetime' : 'date'
        return `${sqliteFunction}(${expression.trim()}, '${modifier}')`
      },
    )
    .replace(
      /date_format\s*\(\s*([^,()]+?)\s*,\s*(['"])(.*?)\2\s*\)/gi,
      (_match, expression: string, _quote: string, format: string) => `strftime('${format}', ${expression.trim()})`,
    )
  return translateMySqlDivision(translatedFunctions)
}

function translateMySqlDivision(sql: string) {
  let result = ''
  let quote: "'" | '"' | '`' | undefined
  let lineComment = false
  let blockComment = false

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index]
    const next = sql[index + 1]

    if (lineComment) {
      result += character
      if (character === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      result += character
      if (character === '*' && next === '/') {
        result += next
        index += 1
        blockComment = false
      }
      continue
    }
    if (quote) {
      result += character
      if (character === quote) {
        if (next === quote) {
          result += next
          index += 1
        } else {
          quote = undefined
        }
      } else if (character === '\\' && next) {
        result += next
        index += 1
      }
      continue
    }
    if (character === '-' && next === '-') {
      result += character + next
      index += 1
      lineComment = true
      continue
    }
    if (character === '/' && next === '*') {
      result += character + next
      index += 1
      blockComment = true
      continue
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character
      result += character
      continue
    }
    if (character === '/') {
      result += '* 1.0 /'
      continue
    }
    result += character
  }

  return result
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function inferSqliteType(values: CellValue[]) {
  const populated = values.filter((value) => value !== null)
  if (populated.length > 0 && populated.every((value) => typeof value === 'number' && Number.isInteger(value))) return 'INTEGER'
  if (populated.length > 0 && populated.every((value) => typeof value === 'number')) return 'REAL'
  return 'TEXT'
}

function createProblemDatabase(SQL: SqlJsStatic, problem: SqlProblem) {
  const database = new SQL.Database()

  for (const table of problem.tables) {
    const columnDefinitions = table.columns.map((column, index) => {
      const values = table.rows.map((row) => row[index])
      return `${quoteIdentifier(column)} ${inferSqliteType(values)}`
    })
    database.run(`CREATE TABLE ${quoteIdentifier(table.name)} (${columnDefinitions.join(', ')})`)

    if (table.rows.length === 0) continue
    const placeholders = table.columns.map(() => '?').join(', ')
    const insert = database.prepare(`INSERT INTO ${quoteIdentifier(table.name)} VALUES (${placeholders})`)
    try {
      table.rows.forEach((row) => insert.run(row))
    } finally {
      insert.free()
    }
  }

  return database
}

function conceptPresent(normalized: string, token: string) {
  if (token === 'count(distinct') return /\bcount\s*\(\s*distinct\b/.test(normalized)
  if (token.endsWith('(')) {
    const functionName = token.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${functionName}\\s*\\(`).test(normalized)
  }
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+')
  return new RegExp(escaped).test(normalized)
}

function validateReadOnlyQuery(sql: string) {
  const normalized = normalizeSql(sql).replace(/;+$/, '').trim()
  if (!normalized) return '编辑器还是空的。先写一条查询再提交。'
  if (!/^(select|with)\b/.test(normalized)) return '只允许提交 SELECT 查询或以 WITH 开头的查询。'
  if (/\b(insert|update|delete|drop|alter|create|replace|truncate|attach|detach)\b/.test(normalized)) {
    return '练习环境只允许读取数据，不能修改数据表。'
  }
  return undefined
}

function resultFromDatabase(database: Database, sql: string) {
  const resultSets = database.exec(translateMySql(sql))
  if (resultSets.length === 0) throw new Error('查询没有返回结果表。请确认写的是完整的 SELECT 查询。')
  if (resultSets.length !== 1) throw new Error('一次只能提交一条返回结果的 SELECT 查询。')
  const [result] = resultSets
  return {
    name: '运行结果',
    columns: result.columns,
    rows: result.values as CellValue[][],
  } satisfies DataTable
}

function valuesEqual(actual: CellValue, expected: CellValue) {
  if (actual === null || expected === null) return actual === expected
  if (typeof actual === 'number' && typeof expected === 'number') return Math.abs(actual - expected) <= 1e-6
  return String(actual) === String(expected)
}

function rowsEqual(actual: CellValue[], expected: CellValue[]) {
  return actual.length === expected.length && actual.every((cell, index) => valuesEqual(cell, expected[index]))
}

function compareResult(actual: DataTable, expected: DataTable, ordered: boolean) {
  if (actual.columns.length !== expected.columns.length) {
    return `输出列数不正确：当前为 ${actual.columns.length} 列，期望为 ${expected.columns.length} 列。`
  }
  const wrongColumn = expected.columns.findIndex((column, index) => actual.columns[index] !== column)
  if (wrongColumn >= 0) {
    return `第 ${wrongColumn + 1} 列名称不正确：当前为 ${actual.columns[wrongColumn]}，期望为 ${expected.columns[wrongColumn]}。`
  }
  if (actual.rows.length !== expected.rows.length) {
    return `返回行数不正确：当前为 ${actual.rows.length} 行，期望为 ${expected.rows.length} 行。`
  }

  if (ordered) {
    const wrongRow = expected.rows.findIndex((row, index) => !rowsEqual(actual.rows[index], row))
    return wrongRow >= 0 ? `第 ${wrongRow + 1} 行的数据或排序不正确。` : undefined
  }

  const unmatched = [...actual.rows]
  for (const expectedRow of expected.rows) {
    const matchIndex = unmatched.findIndex((actualRow) => rowsEqual(actualRow, expectedRow))
    if (matchIndex < 0) return '查询返回的数据与期望结果不一致。'
    unmatched.splice(matchIndex, 1)
  }
  return undefined
}

function databaseErrorMessage(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error)
  if (/syntax error/i.test(detail)) return `SQL 语法错误：${detail}`
  if (/no such table/i.test(detail)) return `数据表不存在：${detail}`
  if (/no such column/i.test(detail)) return `字段不存在或写法不正确：${detail}`
  if (/ambiguous column/i.test(detail)) return `字段名存在歧义，请加上表名或别名：${detail}`
  if (/wrong number of arguments/i.test(detail)) return `函数参数数量不正确：${detail}`
  return `SQL 执行失败：${detail}`
}

export async function runSql(problem: SqlProblem, sql: string): Promise<RunResult> {
  const startedAt = performance.now()
  const readOnlyError = validateReadOnlyQuery(sql)
  if (readOnlyError) {
    return {
      status: 'error',
      message: readOnlyError,
      missingConcepts: [],
      durationMs: Math.max(1, Math.round(performance.now() - startedAt)),
    }
  }

  let database: Database | undefined
  try {
    const SQL = await getEngine()
    database = createProblemDatabase(SQL, problem)
    const actualResult = resultFromDatabase(database, sql)
    const normalized = normalizeSql(sql)
    const missing = problem.validationTokens.filter((token) => !conceptPresent(normalized, token))
    if (missing.length > 0) {
      return {
        status: 'error',
        message: 'SQL 可以运行，但缺少这道题要求验证的关键逻辑。',
        missingConcepts: missing.map((token) => friendlyNames[token] ?? token),
        table: actualResult,
        durationMs: Math.max(1, Math.round(performance.now() - startedAt)),
      }
    }

    const comparisonError = compareResult(actualResult, problem.expectedResult, /\border\s+by\b/i.test(problem.solution))
    if (comparisonError) {
      return {
        status: 'error',
        message: comparisonError,
        missingConcepts: [],
        table: actualResult,
        durationMs: Math.max(1, Math.round(performance.now() - startedAt)),
      }
    }

    return {
      status: 'success',
      message: '通过！SQL 已真实执行，字段、行数和每个结果值均正确。',
      missingConcepts: [],
      table: actualResult,
      durationMs: Math.max(1, Math.round(performance.now() - startedAt)),
    }
  } catch (error) {
    return {
      status: 'error',
      message: databaseErrorMessage(error),
      missingConcepts: [],
      durationMs: Math.max(1, Math.round(performance.now() - startedAt)),
    }
  } finally {
    database?.close()
  }
}
