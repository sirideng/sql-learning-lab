import { Minus, Play, Plus, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState, type CSSProperties } from 'react'
import type { DataTable } from '../types/problem'
import { getEditorPairEdit } from '../services/editorPairs'
import { formatPython } from '../services/pythonFormatter'
import { formatSql } from '../services/sqlFormatter'
import { SyntaxHighlightedCode } from './SyntaxHighlightedCode'

interface LearningCodeEditorProps {
  language: 'sql' | 'python'
  value: string
  tables?: DataTable[]
  fileName: string
  environment: string
  runLabel: string
  editorLabel?: string
  disabled?: boolean
  onChange: (value: string) => void
  onRun: () => void
}

const DEFAULT_SIZE = 20
const MIN_SIZE = 16
const MAX_SIZE = 30

export function LearningCodeEditor({ language, value, tables = [], fileName, environment, runLabel, editorLabel, disabled, onChange, onRun }: LearningCodeEditorProps) {
  const storageKey = `sql-learning-lab:${language}-editor-font-size:v2`
  const [fontSize, setFontSize] = useState(() => {
    const stored = Number(localStorage.getItem(storageKey))
    return Number.isFinite(stored) && stored >= MIN_SIZE && stored <= MAX_SIZE ? stored : DEFAULT_SIZE
  })
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const highlightRef = useRef<HTMLPreElement | null>(null)
  const numbersRef = useRef<HTMLDivElement | null>(null)
  const lines = useMemo(() => value.split('\n').map((_, index) => index + 1), [value])

  const resize = (change: number) => {
    setFontSize((current) => {
      const next = Math.max(MIN_SIZE, Math.min(MAX_SIZE, current + change))
      localStorage.setItem(storageKey, String(next))
      return next
    })
  }
  const format = () => {
    if (!value.trim()) return textareaRef.current?.focus()
    const next = language === 'sql' ? formatSql(value) : formatPython(value)
    onChange(next)
    requestAnimationFrame(() => {
      if (!textareaRef.current) return
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = next.length
    })
  }
  const keyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      onRun()
      return
    }
    const target = event.currentTarget
    const pair = getEditorPairEdit(value, target.selectionStart, target.selectionEnd, event.key)
    if (pair) {
      event.preventDefault()
      onChange(pair.value)
      requestAnimationFrame(() => {
        target.selectionStart = pair.selectionStart
        target.selectionEnd = pair.selectionEnd
      })
      return
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      const spaces = language === 'python' ? '    ' : '  '
      const start = target.selectionStart
      const next = `${value.slice(0, start)}${spaces}${value.slice(target.selectionEnd)}`
      onChange(next)
      requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + spaces.length })
      return
    }
    if (language === 'python' && event.key === 'Enter') {
      event.preventDefault()
      const start = target.selectionStart
      const currentLine = value.slice(0, start).split('\n').at(-1) ?? ''
      const leading = currentLine.match(/^\s*/)?.[0] ?? ''
      const indentation = `${leading}${currentLine.trimEnd().endsWith(':') ? '    ' : ''}`
      const next = `${value.slice(0, start)}\n${indentation}${value.slice(target.selectionEnd)}`
      onChange(next)
      requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + indentation.length + 1 })
    }
  }

  return <div className="learning-code-editor">
    <div className="workspace-panel-title">
      <strong>{editorLabel ?? (language === 'sql' ? 'SQL 编辑器' : 'Pandas 编辑器')}</strong>
      <div className="editor-title-tools">
        <div className="editor-zoom-controls" aria-label="编辑器字号">
          <button disabled={fontSize === MIN_SIZE} onClick={() => resize(-2)} aria-label="缩小编辑器文字"><Minus size={15} /></button>
          <span>{Math.round(fontSize / DEFAULT_SIZE * 100)}%</span>
          <button disabled={fontSize === MAX_SIZE} onClick={() => resize(2)} aria-label="放大编辑器文字"><Plus size={15} /></button>
        </div>
        <button className="format-sql-button" onClick={format} disabled={!value.trim()}><Sparkles size={15} />一键格式化</button>
        <span className="editor-dialect">{environment}</span>
      </div>
    </div>
    <div className="editor-shell shared-editor-shell" style={{ '--editor-font-size': `${fontSize}px` } as CSSProperties}>
      <div className="editor-chrome"><span /><span /><span /><small>{fileName}</small></div>
      <div className="editor-body">
        <div ref={numbersRef} className="line-numbers" aria-hidden="true">{lines.map((line) => <span key={line}>{line}</span>)}</div>
        <div className="editor-code-area">
          <pre ref={highlightRef} className="sql-highlight-layer" aria-hidden="true"><SyntaxHighlightedCode code={value} tables={tables} language={language} /></pre>
          <textarea ref={textareaRef} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={keyDown} onScroll={(event) => {
            if (highlightRef.current) { highlightRef.current.scrollTop = event.currentTarget.scrollTop; highlightRef.current.scrollLeft = event.currentTarget.scrollLeft }
            if (numbersRef.current) numbersRef.current.scrollTop = event.currentTarget.scrollTop
          }} spellCheck={false} aria-label={editorLabel ?? (language === 'sql' ? 'SQL 编辑器' : 'Pandas 编辑器')} />
        </div>
      </div>
      <div className="editor-status"><span>Ln {lines.length}</span><span>Ctrl + Enter · {language === 'python' ? 'Python / Pandas' : 'SQL'}</span></div>
    </div>
    <div className="shared-editor-actions"><span>受控学习环境 · 支持本页目标操作</span><button className="run-button" disabled={disabled || !value.trim()} onClick={onRun}><Play size={17} />{runLabel}</button></div>
  </div>
}
