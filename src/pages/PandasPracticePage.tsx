import { ArrowLeft, CheckCircle2, ChevronDown, Lightbulb, RotateCcw, Table2, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { CodeBlock } from '../components/CodeBlock'
import { DataTableView } from '../components/DataTableView'
import { LearningCodeEditor } from '../components/LearningCodeEditor'
import { PandasTransformationVisualizer } from '../components/PandasTransformationVisualizer'
import { getProblemProgress } from '../services/storage'
import type { PandasQuestion, ProgressMap } from '../types/problem'

interface Props {
  problem: PandasQuestion
  progress: ProgressMap
  total: number
  completed: number
  onHome: () => void
  onNavigate: (id: string) => void
  onOpenSql: (id: string) => void
  onDraft: (id: string, code: string) => void
  onAttempt: (id: string, correct: boolean, code: string, language: 'pandas', errorReason?: string) => void
}

export function PandasPracticePage({ problem, progress, total, completed, onHome, onNavigate, onOpenSql, onDraft, onAttempt }: Props) {
  const saved = getProblemProgress(progress, problem.id)
  const [code, setCode] = useState(saved.draft ?? '')
  const [result, setResult] = useState<'success' | 'error' | null>(null)
  const [hintOpen, setHintOpen] = useState(false)
  const [visualOpen, setVisualOpen] = useState(false)
  const saveTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  const edit = (value: string) => {
    setCode(value)
    setResult(null)
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => onDraft(problem.id, value), 500)
  }
  const run = () => {
    window.clearTimeout(saveTimer.current)
    onDraft(problem.id, code)
    const normalized = code.toLowerCase().replace(/\s+/g, ' ')
    const correct = problem.validationPatterns.every((pattern) => normalized.includes(pattern.toLowerCase()))
    setResult(correct ? 'success' : 'error')
    onAttempt(problem.id, correct, code, 'pandas', correct ? undefined : '尚未识别出本题要求的关键 Pandas 转换，请检查操作函数、字段名与执行顺序。')
  }
  const leave = () => {
    window.clearTimeout(saveTimer.current)
    onDraft(problem.id, code)
    onHome()
  }
  const navigate = (offset: number) => {
    const number = problem.number + offset
    if (number < 1 || number > total) return
    onDraft(problem.id, code)
    onNavigate(String(number))
  }

  return <div className="practice-page pandas-practice-page">
    <AppHeader compact completed={completed} total={total} onHome={leave} />
    <div className="practice-toolbar">
      <button className="back-button" onClick={leave}><ArrowLeft size={17} /> 返回 Pandas 题库</button>
      <div className="question-position">题目 {problem.number} <span>/ {total}</span></div>
      <div className="question-nav"><button disabled={problem.number === 1} onClick={() => navigate(-1)}>上一题</button><button disabled={problem.number === total} onClick={() => navigate(1)}>下一题</button></div>
    </div>
    <main className="workspace-grid">
      <section className="workspace-panel problem-panel"><div className="panel-scroll problem-panel-scroll">
        <div className="panel-header"><span className="panel-kicker">PANDAS QUESTION {String(problem.number).padStart(2, '0')}</span><h1>{problem.title}</h1><div className="title-meta"><span className={`difficulty ${problem.difficulty}`}>{problem.difficulty}</span>{saved.completed && <span className="solved-badge"><CheckCircle2 size={14} /> 已完成</span>}</div><div className="problem-tags">{problem.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
        <div className="problem-content">
          {problem.alternateSqlId && <div className="language-solution-switch"><button onClick={() => onOpenSql(problem.alternateSqlId!)}>SQL</button><button className="active">Pandas</button><span>同一数据问题 · 两种实现</span></div>}
          <article><h2>问题描述</h2><p>{problem.description}</p><div className="challenge-callout"><span className="pandas-inline-mark">pd</span><p>{problem.challenge}</p></div></article>
          <article><h2>输入 DataFrame</h2>{problem.tables.map((item) => <DataTableView key={item.name} table={item} />)}<div className="output-example-section"><div className="output-example-heading"><span className="output-example-icon"><Table2 size={18} /></span><div><h3>Expected Output</h3><p>字段名、顺序与结果粒度应保持一致。</p></div></div><DataTableView table={{ ...problem.expectedOutput, name: 'expected_output' }} /></div></article>
          <article className="hint-section"><button className="hint-toggle" onClick={() => setHintOpen(!hintOpen)}><span><Lightbulb size={17} /> 需要一点提示？</span><ChevronDown className={hintOpen ? 'rotated' : ''} size={17} /></button>{hintOpen && <ol className="hint-list">{problem.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol>}</article>
        </div>
      </div></section>

      <section className={`workspace-panel editor-panel ${result ? 'has-result' : ''}`}>
        <LearningCodeEditor language="python" value={code} tables={problem.tables} fileName="solution.py" environment="Practice Simulator" runLabel="运行 Pandas" onChange={edit} onRun={run} />
        <button className="reset-code-button" onClick={() => edit('')}><RotateCcw size={16} />清空代码</button>
        {result && <section className="inline-run-result">
          <div className="workspace-panel-title"><strong>运行结果</strong><span>受控 Pandas 学习模拟器</span></div>
          {result === 'success' ? <><div className="result-banner success"><CheckCircle2 size={21} /><div><strong>通过！目标转换与预期一致。</strong><span>模拟器已识别本题所需的 Pandas 操作。</span></div></div><DataTableView table={{ ...problem.expectedOutput, name: 'result' }} /></> : <div className="result-banner error"><XCircle size={21} /><div><strong>还差一步</strong><span>当前代码没有完整表达本题目标操作。请检查提示与中间 DataFrame。</span></div></div>}
        </section>}
        <button className="explanation-entry" onClick={() => setVisualOpen(!visualOpen)}><span><Lightbulb size={18} /><span><strong>查看解题思路与 DataFrame 变化</strong><small>逐步展示中间结果，最后显示参考实现</small></span></span><ChevronDown className={visualOpen ? 'rotated' : ''} size={18} /></button>
        {visualOpen && <div className="pandas-practice-explanation"><PandasTransformationVisualizer type={visualTypeFor(problem.tags)} original={problem.tables} steps={problem.visualizationSteps} finalTable={problem.expectedOutput} /><article className="reference-solution"><h3>参考 Pandas</h3><CodeBlock code={problem.solution} tables={problem.tables} language="python" /><h3>SQL 对照</h3><CodeBlock code={problem.sqlEquivalent ?? '-- 本题暂无 SQL 对照'} tables={problem.tables} language="sql" /><p>{problem.explanation}</p></article></div>}
      </section>
    </main>
  </div>
}

function visualTypeFor(tags: string[]) {
  const text = tags.join(' ').toLowerCase()
  if (text.includes('merge')) return 'merge' as const
  if (text.includes('groupby')) return 'groupby' as const
  if (text.includes('diff') || text.includes('shift')) return 'diff' as const
  if (text.includes('transform')) return 'transform' as const
  if (text.includes('date') || text.includes('日期') || text.includes('datetime')) return 'date' as const
  if (text.includes('filter') || text.includes('筛选') || text.includes('loc')) return 'filter' as const
  if (text.includes('pivot') || text.includes('melt')) return 'pivot' as const
  return 'analysis' as const
}
