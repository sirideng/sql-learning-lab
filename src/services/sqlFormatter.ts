const protectedPattern = /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|\\.|[^'])*'|"(?:""|\\.|[^"])*"|`(?:``|[^`])*`/g

const keywords = [
  'select', 'distinct', 'from', 'where', 'group', 'by', 'having', 'order', 'limit', 'offset',
  'join', 'left', 'right', 'inner', 'outer', 'full', 'cross', 'on', 'as', 'and', 'or', 'not',
  'is', 'null', 'in', 'exists', 'between', 'like', 'case', 'when', 'then', 'else', 'end',
  'with', 'union', 'all', 'over', 'partition', 'rows', 'range', 'preceding', 'following',
  'current', 'row', 'unbounded', 'asc', 'desc', 'interval',
]

const functions = [
  'avg', 'coalesce', 'concat', 'count', 'date_add', 'date_sub', 'date_format', 'datediff',
  'day', 'ifnull', 'lag', 'lead', 'length', 'lower', 'max', 'min', 'month', 'rank', 'replace',
  'round', 'row_number', 'substring', 'sum', 'upper', 'year',
]

const wordPattern = new RegExp(`\\b(${[...keywords, ...functions].sort((left, right) => right.length - left.length).join('|')})\\b`, 'gi')

export function formatSql(source: string) {
  if (!source.trim()) return ''

  const protectedParts: string[] = []
  let sql = source.replace(protectedPattern, (value) => {
    const marker = `__SQL_PROTECTED_${protectedParts.length}__`
    protectedParts.push(value)
    return marker
  })

  sql = sql
    .replace(/\s+/g, ' ')
    .trim()
    .replace(wordPattern, (word) => word.toUpperCase())
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*(<>|!=|<=|>=|=|<|>)\s*/g, ' $1 ')
    .replace(/\s*;\s*$/g, ';')

  sql = breakSelectColumns(sql)
    .replace(/\s+(LEFT\s+JOIN|RIGHT\s+JOIN|INNER\s+JOIN|FULL\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|JOIN)\s+/gi, '\n$1 ')
    .replace(/\s+(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|OFFSET|UNION(?:\s+ALL)?)\s+/gi, '\n$1 ')
    .replace(/\s+ON\s+/gi, '\n  ON ')
    .replace(/\(\s*SELECT\b/gi, '(\n  SELECT')
    .replace(/,\s*(?=[A-Za-z_][A-Za-z0-9_]*\s+AS\s*\()/g, ',\n')

  const lines = sql.split('\n').map((line) => line.trim()).filter(Boolean)
  let inSelectList = false
  let indentLevel = 0
  sql = lines.map((line) => {
    const leadingClosings = line.match(/^\)+/)?.[0].length ?? 0
    if (leadingClosings > 0) indentLevel = Math.max(0, indentLevel - leadingClosings)
    if (/^SELECT\b/i.test(line)) {
      inSelectList = true
    } else if (/^FROM\b/i.test(line)) inSelectList = false
    const extraIndent = (inSelectList && !/^SELECT\b/i.test(line)) || /^(ON|AND|OR)\b/i.test(line) ? 1 : 0
    const formattedLine = `${'  '.repeat(indentLevel + extraIndent)}${line}`
    const openingCount = (line.match(/\(/g) ?? []).length
    const closingCount = (line.match(/\)/g) ?? []).length - leadingClosings
    indentLevel = Math.max(0, indentLevel + openingCount - closingCount)
    return formattedLine
  }).join('\n')

  protectedParts.forEach((value, index) => {
    sql = sql.replace(`__SQL_PROTECTED_${index}__`, value)
  })
  return sql
}

function breakSelectColumns(sql: string) {
  let output = ''
  let depth = 0
  let selectDepth = -1

  for (let index = 0; index < sql.length;) {
    const word = sql.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0]
    if (word) {
      const upper = word.toUpperCase()
      if (upper === 'SELECT') {
        selectDepth = depth
        output += word
        index += word.length
        while (sql[index] === ' ') index += 1
        output += '\n  '
        continue
      }
      else if (upper === 'FROM' && selectDepth === depth) selectDepth = -1
      output += word
      index += word.length
      continue
    }

    const character = sql[index]
    if (character === '(') depth += 1
    else if (character === ')') depth = Math.max(0, depth - 1)
    if (character === ',' && selectDepth === depth) {
      output += ',\n  '
      index += 1
      while (sql[index] === ' ') index += 1
      continue
    }
    output += character
    index += 1
  }
  return output
}
