import type { ReactNode } from 'react'
import type { DataTable } from '../types/problem'

type Language = 'auto' | 'sql' | 'python'
type TokenKind = 'keyword' | 'function' | 'table' | 'column' | 'string' | 'number' | 'comment' | 'operator'

const sqlKeywords = new Set([
  'all', 'and', 'as', 'asc', 'between', 'by', 'case', 'cross', 'delete', 'desc', 'distinct',
  'else', 'end', 'exists', 'from', 'full', 'group', 'having', 'in', 'inner', 'insert', 'into',
  'is', 'join', 'left', 'like', 'limit', 'not', 'null', 'offset', 'on', 'or', 'order', 'outer',
  'over', 'partition', 'right', 'rows', 'range', 'select', 'set', 'then', 'union', 'update',
  'values', 'when', 'where', 'with', 'interval', 'preceding', 'following', 'current', 'row', 'unbounded',
])

const pythonKeywords = new Set([
  'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'false', 'finally', 'for', 'from', 'if', 'import', 'in', 'is', 'lambda', 'none', 'not', 'or',
  'pass', 'raise', 'return', 'true', 'try', 'while', 'with', 'yield',
])

const knownFunctions = new Set([
  'avg', 'coalesce', 'concat', 'count', 'date_add', 'date_sub', 'date_format', 'datediff', 'day',
  'ifnull', 'lag', 'lead', 'length', 'lower', 'max', 'min', 'month', 'rank', 'replace', 'round',
  'row_number', 'substring', 'sum', 'upper', 'year', 'groupby', 'merge', 'agg', 'mean', 'query',
  'sort_values', 'drop_duplicates', 'cumsum', 'rolling', 'where', 'loc', 'nunique', 'size',
])

const tokenPattern = /--[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|'(?:''|\\.|[^'])*'|"(?:""|\\.|[^"])*"|`(?:``|[^`])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_$]*\b|\s+|[^\sA-Za-z0-9_]+/g

export function SyntaxHighlightedCode({ code, tables = [], language = 'auto' }: { code: string; tables?: DataTable[]; language?: Language }) {
  return <>{highlightCode(code, tables, language)}</>
}

function highlightCode(code: string, tables: DataTable[] = [], language: Language = 'auto'): ReactNode[] | string {
  const detectedLanguage = language === 'auto' ? detectLanguage(code) : language
  const parts = code.match(tokenPattern) ?? []
  if (!parts.length) return ' '

  const tableNames = new Set(tables.map((table) => table.name.toLowerCase()))
  const columnNames = new Set(tables.flatMap((table) => table.columns.map((column) => column.toLowerCase())))
  inferTableNames(parts).forEach((name) => tableNames.add(name))

  return parts.map((part, index) => {
    const normalized = part.toLowerCase()
    const next = nextMeaningful(parts, index)
    let kind: TokenKind | undefined

    if (part.startsWith('--') || part.startsWith('/*') || (detectedLanguage === 'python' && part.startsWith('#'))) kind = 'comment'
    else if (/^['"`]/.test(part)) kind = 'string'
    else if (/^\d/.test(part)) kind = 'number'
    else if ((detectedLanguage === 'sql' ? sqlKeywords : pythonKeywords).has(normalized)) kind = 'keyword'
    else if (knownFunctions.has(normalized) || next === '(') kind = 'function'
    else if (tableNames.has(normalized) || (detectedLanguage === 'python' && /^(df|data|orders|users|result|metrics)$/.test(normalized))) kind = 'table'
    else if (columnNames.has(normalized) || /^[A-Za-z_][A-Za-z0-9_$]*$/.test(part)) kind = 'column'
    else if (/^[=<>+*/%!.|&-]+$/.test(part)) kind = 'operator'

    return kind ? <span className={`sql-token-${kind}`} key={`${index}-${part}`}>{part}</span> : part
  })
}

function detectLanguage(code: string): Exclude<Language, 'auto'> {
  if (/\b(SELECT|FROM|JOIN|WHERE|GROUP\s+BY|WITH)\b/i.test(code)) return 'sql'
  if (/\b(import|DataFrame|groupby|merge|sort_values|\.loc|np\.)\b/i.test(code)) return 'python'
  return 'sql'
}

function inferTableNames(parts: string[]) {
  const names = new Set<string>()
  for (let index = 0; index < parts.length; index += 1) {
    const normalized = parts[index].toLowerCase()
    if (!['from', 'join', 'update', 'into'].includes(normalized)) continue
    const next = nextMeaningful(parts, index)
    if (next && /^[A-Za-z_][A-Za-z0-9_$]*$/.test(next)) names.add(next.toLowerCase())
  }
  return names
}

function nextMeaningful(parts: string[], index: number) {
  return parts.slice(index + 1).find((part) => !/^\s+$/.test(part))
}
