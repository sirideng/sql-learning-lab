import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Database,
  Lightbulb,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Table2,
  TerminalSquare,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AppHeader } from '../components/AppHeader'
import { DataTableView } from '../components/DataTableView'
import { ExplanationDrawer } from '../components/ExplanationDrawer'
import { SyntaxHighlightedCode } from '../components/SyntaxHighlightedCode'
import { runSql, type RunResult } from '../services/sqlRunner'
import { formatSql } from '../services/sqlFormatter'
import { getEditorPairEdit } from '../services/editorPairs'
import { getProblemProgress } from '../services/storage'
import type { ProgressMap, SqlProblem } from '../types/problem'

interface PracticePageProps {
  problem: SqlProblem
  progress: ProgressMap
  total: number
  completed: number
  onHome: () => void
  onNavigate: (id: string) => void
  onDraft: (id: string, sql: string) => void
  onAttempt: (id: string, correct: boolean, sql: string, language?: 'sql', errorReason?: string) => void
  alternatePandasId?: string
  onOpenPandas?: (id: string) => void
}

const DEFAULT_EDITOR_FONT_SIZE = 18
const MIN_EDITOR_FONT_SIZE = 14
const MAX_EDITOR_FONT_SIZE = 28
const EDITOR_FONT_STORAGE_KEY = 'sql-learning-lab:editor-font-size:v1'

export function PracticePage({
  problem,
  progress,
  total,
  completed,
  onHome,
  onNavigate,
  onDraft,
  onAttempt,
  alternatePandasId,
  onOpenPandas,
}: PracticePageProps) {
  const saved = getProblemProgress(progress, problem.id)
  const [sql, setSql] = useState(() => {
    if (!saved.draft || saved.draft === problem.starterSql) return ''
    return saved.draft
  })
  const [cursorPosition, setCursorPosition] = useState(0)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [suppressedPrefix, setSuppressedPrefix] = useState('')
  const [result, setResult] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [editorFontSize, setEditorFontSize] = useState(() => {
    const savedSize = Number(window.localStorage.getItem(EDITOR_FONT_STORAGE_KEY))
    return Number.isFinite(savedSize) && savedSize >= MIN_EDITOR_FONT_SIZE && savedSize <= MAX_EDITOR_FONT_SIZE ? savedSize : DEFAULT_EDITOR_FONT_SIZE
  })
  const saveTimer = useRef<number | undefined>(undefined)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const highlightRef = useRef<HTMLPreElement | null>(null)
  const lineNumbersRef = useRef<HTMLDivElement | null>(null)
  const resultRef = useRef<HTMLElement | null>(null)

  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  useEffect(() => {
    if (!result) return
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }, [result])

  const lineNumbers = useMemo(() => sql.split('\n').map((_, index) => index + 1), [sql])
  const currentIdentifier = useMemo(() => getIdentifierAt(sql, cursorPosition), [cursorPosition, sql])
  const autocompleteItems = useMemo(() => {
    const prefix = currentIdentifier.prefix.toLowerCase()
    if (currentIdentifier.suffix.length > 0 || prefix.length < 2 || prefix === suppressedPrefix.toLowerCase()) return []

    const candidates = new Map<string, 'TABLE' | 'COLUMN'>()
    problem.tables.forEach((table) => {
      candidates.set(table.name, 'TABLE')
      table.columns.forEach((column) => {
        if (!candidates.has(column)) candidates.set(column, 'COLUMN')
      })
    })
    return [...candidates.entries()]
      .filter(([value]) => value.toLowerCase() !== prefix && identifierMatches(value, prefix))
      .sort(([left, leftKind], [right, rightKind]) => {
        const kindOrder = { TABLE: 0, COLUMN: 1 }
        const leftStarts = left.toLowerCase().startsWith(prefix) ? 0 : 1
        const rightStarts = right.toLowerCase().startsWith(prefix) ? 0 : 1
        return leftStarts - rightStarts || kindOrder[leftKind] - kindOrder[rightKind] || left.length - right.length
      })
      .slice(0, 6)
      .map(([value, kind]) => ({ value, kind }))
  }, [currentIdentifier.prefix, currentIdentifier.suffix, problem.tables, suppressedPrefix])
  const activeSuggestionIndex = Math.min(suggestionIndex, Math.max(autocompleteItems.length - 1, 0))
  const autocompletePosition = useMemo(() => {
    const beforeCursor = sql.slice(0, cursorPosition)
    const lines = beforeCursor.split('\n')
    const row = lines.length - 1
    const column = lines.at(-1)?.length ?? 0
    const lineHeight = editorFontSize * 1.75
    return { top: 40 + (row + 1) * lineHeight, left: 62 + Math.min(column, 12) * editorFontSize * .6 }
  }, [cursorPosition, editorFontSize, sql])
  const changeEditorFontSize = (change: number) => {
    setEditorFontSize((current) => {
      const next = Math.max(MIN_EDITOR_FONT_SIZE, Math.min(MAX_EDITOR_FONT_SIZE, current + change))
      window.localStorage.setItem(EDITOR_FONT_STORAGE_KEY, String(next))
      return next
    })
  }
  const formatEditorSql = () => {
    if (!sql.trim()) {
      editorRef.current?.focus()
      return
    }
    const formatted = formatSql(sql)
    editSql(formatted)
    setCursorPosition(formatted.length)
    requestAnimationFrame(() => {
      if (!editorRef.current) return
      editorRef.current.focus()
      editorRef.current.selectionStart = editorRef.current.selectionEnd = formatted.length
    })
  }
  const editSql = (value: string) => {
    setSql(value)
    setSuggestionIndex(0)
    setSuppressedPrefix('')
    setResult(null)
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => onDraft(problem.id, value), 500)
  }

  const execute = async () => {
    if (isRunning) return
    window.clearTimeout(saveTimer.current)
    onDraft(problem.id, sql)
    setIsRunning(true)
    try {
      const nextResult = await runSql(problem, sql)
      setResult(nextResult)
      onAttempt(problem.id, nextResult.status === 'success', sql, 'sql', nextResult.status === 'success' ? undefined : nextResult.message)
    } finally {
      setIsRunning(false)
    }
  }

  const onEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      execute()
      return
    }
    const target = event.currentTarget
    const pairEdit = getEditorPairEdit(sql, target.selectionStart, target.selectionEnd, event.key)
    if (pairEdit) {
      event.preventDefault()
      editSql(pairEdit.value)
      setCursorPosition(pairEdit.selectionStart)
      requestAnimationFrame(() => {
        target.focus()
        target.selectionStart = pairEdit.selectionStart
        target.selectionEnd = pairEdit.selectionEnd
      })
      return
    }
    if (autocompleteItems.length > 0 && event.key === 'ArrowDown') {
      event.preventDefault()
      setSuggestionIndex((index) => (index + 1) % autocompleteItems.length)
      return
    }
    if (autocompleteItems.length > 0 && event.key === 'ArrowUp') {
      event.preventDefault()
      setSuggestionIndex((index) => (index - 1 + autocompleteItems.length) % autocompleteItems.length)
      return
    }
    if (autocompleteItems.length > 0 && (event.key === 'Tab' || event.key === 'Enter')) {
      event.preventDefault()
      completeIdentifier(autocompleteItems[activeSuggestionIndex].value)
      return
    }
    if (autocompleteItems.length > 0 && event.key === 'Escape') {
      event.preventDefault()
      setSuppressedPrefix(currentIdentifier.prefix)
      return
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      const start = target.selectionStart
      const end = target.selectionEnd
      const next = `${sql.slice(0, start)}  ${sql.slice(end)}`
      editSql(next)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2
      })
    }
  }

  const completeIdentifier = (value: string) => {
    const nextSql = `${sql.slice(0, currentIdentifier.start)}${value}${sql.slice(currentIdentifier.end)}`
    const nextCursor = currentIdentifier.start + value.length
    editSql(nextSql)
    setCursorPosition(nextCursor)
    setSuppressedPrefix(value)
    requestAnimationFrame(() => {
      if (!editorRef.current) return
      editorRef.current.focus()
      editorRef.current.selectionStart = editorRef.current.selectionEnd = nextCursor
    })
  }

  const navigateRelative = (offset: number) => {
    const targetNumber = problem.number + offset
    if (targetNumber < 1 || targetNumber > total) return
    window.clearTimeout(saveTimer.current)
    onDraft(problem.id, sql)
    onNavigate(String(targetNumber))
  }

  const leavePractice = () => {
    window.clearTimeout(saveTimer.current)
    onDraft(problem.id, sql)
    onHome()
  }

  return (
    <div className="practice-page">
      <AppHeader compact completed={completed} total={total} onHome={leavePractice} />
      <div className="practice-toolbar">
        <button className="back-button" onClick={leavePractice}><ArrowLeft size={17} /> 返回题库</button>
        <div className="question-position">
          题目 {problem.number} <span>/ {total}</span>
        </div>
        <div className="question-nav">
          <button disabled={problem.number === 1} onClick={() => navigateRelative(-1)}>上一题</button>
          <button disabled={problem.number === total} onClick={() => navigateRelative(1)}>下一题</button>
        </div>
      </div>

      <main className="workspace-grid">
        <section className="workspace-panel problem-panel">
          <div className="panel-scroll problem-panel-scroll">
            <div className="panel-header">
              <span className="panel-kicker">QUESTION {String(problem.number).padStart(2, '0')}</span>
              <h1>{problem.title}</h1>
              <div className="title-meta">
                <span className={`difficulty ${problem.difficulty}`}>{problem.difficulty}</span>
                {saved.completed && <span className="solved-badge"><CheckCircle2 size={14} /> 已完成</span>}
              </div>
              <div className="problem-tags">{problem.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
            <div className="problem-content">
              {alternatePandasId && onOpenPandas && <div className="language-solution-switch"><button className="active">SQL</button><button onClick={() => onOpenPandas(alternatePandasId)}>Pandas</button><span>同一数据问题 · 两种实现</span></div>}
              <article>
                <h2>问题描述</h2>
                <p>{problem.description}</p>
                <div className="challenge-callout"><TargetIcon /><p>{problem.challenge}</p></div>
              </article>

              <article>
                <h2><Database size={16} /> 数据表</h2>
                {problem.tables.map((table) => <DataTableView key={table.name} table={table} />)}
                <div className="output-example-section">
                  <div className="output-example-heading">
                    <span className="output-example-icon"><Table2 size={18} /></span>
                    <div>
                      <h3>期望输出示例</h3>
                      <p>用于确认字段名、字段顺序和数据格式，不需要逐字复制示例值。</p>
                    </div>
                  </div>
                  <DataTableView
                    table={{
                      ...problem.expectedResult,
                      name: 'expected_output',
                      rows: problem.expectedResult.rows.slice(0, 2),
                    }}
                  />
                </div>
              </article>

              <article className="hint-section">
                <button className="hint-toggle" onClick={() => setHintOpen((open) => !open)}>
                  <span><Lightbulb size={17} /> 需要一点提示？</span>
                  <ChevronDown className={hintOpen ? 'rotated' : ''} size={17} />
                </button>
                {hintOpen && (
                  <ol className="hint-list">
                    {problem.hints.map((hint) => <li key={hint}>{hint}</li>)}
                  </ol>
                )}
              </article>
            </div>
          </div>
        </section>

        <section className={`workspace-panel editor-panel ${result ? 'has-result' : ''}`}>
          <div className="workspace-panel-title">
            <div><Code2 size={17} /><strong>SQL 编辑器</strong></div>
            <div className="editor-title-tools">
              <div className="editor-zoom-controls" aria-label="编辑器字号">
                <button disabled={editorFontSize === MIN_EDITOR_FONT_SIZE} onClick={() => changeEditorFontSize(-2)} aria-label="缩小编辑器文字"><Minus size={15} /></button>
                <span>{Math.round(editorFontSize / DEFAULT_EDITOR_FONT_SIZE * 100)}%</span>
                <button disabled={editorFontSize === MAX_EDITOR_FONT_SIZE} onClick={() => changeEditorFontSize(2)} aria-label="放大编辑器文字"><Plus size={15} /></button>
              </div>
              <button className="format-sql-button" onClick={formatEditorSql} disabled={!sql.trim()} title="自动整理关键字、换行和缩进"><Sparkles size={15} />一键格式化</button>
              <span className="editor-dialect">MySQL 8.0</span>
            </div>
          </div>
          <div className="editor-shell" style={{ '--editor-font-size': `${editorFontSize}px` } as CSSProperties}>
            <div className="editor-chrome">
              <span /><span /><span />
              <small>solution.sql</small>
            </div>
            <div className="editor-body">
              <div ref={lineNumbersRef} className="line-numbers" aria-hidden="true">{lineNumbers.map((line) => <span key={line}>{line}</span>)}</div>
              <div className="editor-code-area">
                <pre ref={highlightRef} className="sql-highlight-layer" aria-hidden="true"><SyntaxHighlightedCode code={sql} tables={problem.tables} language="sql" /></pre>
                <textarea
                  ref={editorRef}
                  value={sql}
                  onChange={(event) => {
                    setCursorPosition(event.target.selectionStart)
                    editSql(event.target.value)
                  }}
                  onSelect={(event) => {
                    setCursorPosition(event.currentTarget.selectionStart)
                    setSuggestionIndex(0)
                    setSuppressedPrefix('')
                  }}
                  onScroll={(event) => {
                    if (highlightRef.current) {
                      highlightRef.current.scrollTop = event.currentTarget.scrollTop
                      highlightRef.current.scrollLeft = event.currentTarget.scrollLeft
                    }
                    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop
                  }}
                  onKeyDown={onEditorKeyDown}
                  spellCheck={false}
                  aria-label="SQL 编辑器"
                  aria-autocomplete="list"
                  aria-controls="sql-autocomplete-list"
                />
                {autocompleteItems.length > 0 && (
                  <div id="sql-autocomplete-list" className="sql-autocomplete" role="listbox" style={{ top: autocompletePosition.top, left: autocompletePosition.left }}>
                    <div className="autocomplete-caption">快捷输入 <span>Tab / Enter</span></div>
                    {autocompleteItems.map((item, index) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === activeSuggestionIndex}
                        className={index === activeSuggestionIndex ? 'active' : ''}
                        key={`${item.kind}-${item.value}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => completeIdentifier(item.value)}
                      >
                        <span className={`autocomplete-kind ${item.kind.toLowerCase()}`}>{item.kind}</span>
                        <code>{item.value}</code>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="editor-status"><span>Ln {lineNumbers.length}, Col 1</span><span>输入 2 个字符 · 自动闭合 · Tab 补全 · SQL</span></div>
          </div>
          <div className="editor-actions">
            <button className="secondary-button" onClick={() => editSql('')}><RotateCcw size={16} /> 重置</button>
            <span className="shortcut-hint">Ctrl + Enter</span>
            <button className="run-button" onClick={execute} disabled={isRunning}><Play size={17} fill="currentColor" /> {isRunning ? '正在运行…' : '提交 SQL'}</button>
          </div>
          {result && (
            <section ref={resultRef} className={`inline-result-panel ${result.status}`} aria-live="polite">
              <div className="inline-result-header">
                <div><TerminalSquare size={19} /><strong>运行结果</strong></div>
                <span><Clock3 size={14} /> {result.durationMs} ms</span>
              </div>
              <div className="inline-result-body">
                {result.status === 'success' ? (
                  <div className="run-result success-result">
                    <div className="result-message"><CheckCircle2 size={22} /><div><strong>{result.message}</strong><span>{result.table?.rows.length} rows returned</span></div></div>
                    {result.table && <DataTableView table={result.table} />}
                    <div className="success-note">完成状态和本次 SQL 已保存到本机。</div>
                  </div>
                ) : (
                  <div className="run-result error-result">
                    <div className="result-message"><XCircle size={22} /><div><strong>还差一点</strong><span>{result.message}</span></div></div>
                    {result.table && <DataTableView table={result.table} />}
                    {result.missingConcepts.length > 0 && (
                      <div className="missing-card">
                        <span>建议检查以下关键逻辑</span>
                        <div>{result.missingConcepts.map((item) => <code key={item}>{item}</code>)}</div>
                      </div>
                    )}
                    <button className="inline-hint-button" onClick={() => setHintOpen(true)}><Lightbulb size={16} /> 查看提示</button>
                  </div>
                )}
              </div>
            </section>
          )}
          <button className="thinking-button" onClick={() => setDrawerOpen(true)}>
            <span className="thinking-icon"><Sparkles size={18} /></span>
            <span><strong>查看解题思路</strong><small>逐步查看中间表，不会立刻显示答案</small></span>
            <ChevronDown size={17} className="side-chevron" />
          </button>
        </section>

      </main>

      <div className="simulator-note">SQL 在浏览器内的真实数据库中执行，并逐项核对结果；数据不会离开浏览器。</div>
      <ExplanationDrawer problem={problem} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

function TargetIcon() {
  return <div className="target-mini"><span /></div>
}

function getIdentifierAt(sql: string, cursor: number) {
  const before = sql.slice(0, cursor)
  const prefix = before.match(/[A-Za-z_][A-Za-z0-9_]*$/)?.[0] ?? ''
  const suffix = sql.slice(cursor).match(/^[A-Za-z0-9_]*/)?.[0] ?? ''
  return { prefix, suffix, start: cursor - prefix.length, end: cursor + suffix.length }
}

function identifierMatches(identifier: string, prefix: string) {
  const normalized = identifier.toLowerCase()
  return normalized.startsWith(prefix) || normalized.split('_').some((part) => part.startsWith(prefix))
}
