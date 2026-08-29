export function formatPython(code: string): string {
  const lines = code.replace(/\t/g, '    ').split('\n')
  let indent = 0
  return lines.map((raw) => {
    const line = raw.trim()
    if (!line) return ''
    if (/^(elif|else|except|finally)\b/.test(line)) indent = Math.max(0, indent - 1)
    const formatted = `${'    '.repeat(indent)}${normalizeAssignments(line)}`
    if (line.endsWith(':')) indent += 1
    return formatted
  }).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function normalizeAssignments(line: string) {
  if (/^(#|from\b|import\b)/.test(line)) return line
  return line.replace(/\s*=\s*(?!=)/g, ' = ')
}
