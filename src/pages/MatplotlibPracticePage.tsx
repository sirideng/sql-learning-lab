import { ArrowLeft, Check, CheckCircle2, ChevronDown, Circle, Eye, Lightbulb, RotateCcw, X, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { CodeBlock } from '../components/CodeBlock'
import { DataTableView } from '../components/DataTableView'
import { ExpectedChartPreview } from '../components/ExpectedChartPreview'
import { LearningCodeEditor } from '../components/LearningCodeEditor'
import { gradeMatplotlib, type ChartGrade } from '../services/matplotlibGrader'
import { runMatplotlib, type MatplotlibRunResult } from '../services/matplotlibRuntime'
import { getProblemProgress } from '../services/storage'
import type { MatplotlibQuestion, ProgressMap } from '../types/problem'

interface Props {
  problem: MatplotlibQuestion
  questions: MatplotlibQuestion[]
  progress: ProgressMap
  completed: number
  trackTotal: number
  onHome: () => void
  onNavigate: (id: string) => void
  onDraft: (id: string, code: string) => void
  onAttempt: (id: string, correct: boolean, code: string, language: 'matplotlib', errorReason?: string) => void
}

export function MatplotlibPracticePage({ problem, questions, progress, completed, trackTotal, onHome, onNavigate, onDraft, onAttempt }: Props) {
  const saved = getProblemProgress(progress, problem.id)
  const [code, setCode] = useState(saved.draft ?? '')
  const [runtimeStatus, setRuntimeStatus] = useState('首次运行会加载 Python、Pandas 与 Matplotlib，并在本页缓存复用。')
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<MatplotlibRunResult | null>(null)
  const [grade, setGrade] = useState<ChartGrade | null>(null)
  const [error, setError] = useState('')
  const [hintOpen, setHintOpen] = useState(false)
  const [targetOpen, setTargetOpen] = useState(false)
  const [solutionOpen, setSolutionOpen] = useState(false)
  const saveTimer = useRef<number | undefined>(undefined)
  const currentIndex = questions.findIndex((item) => item.id === problem.id)

  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  const edit = (value: string) => {
    setCode(value); setRunResult(null); setGrade(null); setError('')
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => onDraft(problem.id, value), 500)
  }

  const run = async () => {
    window.clearTimeout(saveTimer.current)
    onDraft(problem.id, code)
    if (!code.trim()) { setError('请先输入 Matplotlib 代码。'); return }
    setRunning(true); setError(''); setGrade(null); setRunResult(null)
    try {
      const nextResult = await runMatplotlib(code, problem.tables, setRuntimeStatus)
      const nextGrade = gradeMatplotlib(code, nextResult.semantic, problem.expectedChart.expectation)
      setRunResult(nextResult); setGrade(nextGrade)
      const missing = nextGrade.feedback.filter((item) => !item.passed).map((item) => item.message).join(' ')
      onAttempt(problem.id, nextGrade.correct, code, 'matplotlib', nextGrade.correct ? undefined : missing)
    } catch (caught) {
      const message = cleanPythonError(caught instanceof Error ? caught.message : String(caught))
      setError(message)
      onAttempt(problem.id, false, code, 'matplotlib', message)
    } finally { setRunning(false) }
  }

  const leave = () => { window.clearTimeout(saveTimer.current); onDraft(problem.id, code); onHome() }
  const move = (offset: number) => { const next=questions[currentIndex+offset]; if (!next) return; onDraft(problem.id, code); onNavigate(next.id) }
  const summary = runResult ? describeChart(runResult) : ''

  return <div className="practice-page pandas-practice-page matplotlib-practice-page">
    <AppHeader compact mode="pandas" completed={completed} total={trackTotal} onHome={leave}/>
    <div className="practice-toolbar"><button className="back-button" onClick={leave}><ArrowLeft size={17}/> 返回 Pandas / Python 题库</button><div className="question-position">可视化 {currentIndex+1} <span>/ {questions.length}</span></div><div className="question-nav"><button disabled={currentIndex===0} onClick={()=>move(-1)}>上一题</button><button disabled={currentIndex===questions.length-1} onClick={()=>move(1)}>下一题</button></div></div>
    <main className="workspace-grid matplotlib-workspace">
      <section className="workspace-panel problem-panel"><div className="panel-scroll problem-panel-scroll">
        <div className="panel-header"><span className="panel-kicker">MATPLOTLIB QUESTION {String(currentIndex+1).padStart(2,'0')}</span><h1>{problem.title}</h1><div className="title-meta"><span className={`difficulty ${problem.difficulty}`}>{problem.difficulty}</span>{saved.completed&&<span className="solved-badge"><CheckCircle2 size={14}/> 已完成</span>}</div><div className="problem-tags">{problem.tags.map((tag)=><span key={tag}>{tag}</span>)}</div></div>
        <div className="problem-content"><article><h2>问题描述</h2><p>{problem.description}</p><div className="challenge-callout"><span className="matplotlib-inline-mark">plt</span><p>{problem.challenge}</p></div></article>
          <article><h2>输入 DataFrame</h2>{problem.tables.map((item)=><DataTableView key={item.name} table={item}/>)}</article>
          <article><h2>图表要求</h2><ul className="chart-requirements">{problem.expectedChart.expectation.xColumns.map((item)=><li key={`x-${item}`}><Check size={15}/> x 字段：{item}</li>)}{problem.expectedChart.expectation.yColumns.map((item)=><li key={`y-${item}`}><Check size={15}/> y 字段：{item}</li>)}<li><Check size={15}/> {problem.expectedChart.summary}</li></ul><button className="target-chart-button" onClick={()=>setTargetOpen(true)}><Eye size={17}/> 查看目标效果</button></article>
          <article className="hint-section"><button className="hint-toggle" onClick={()=>setHintOpen(!hintOpen)} aria-expanded={hintOpen}><span><Lightbulb size={17}/> 需要一点提示？</span><ChevronDown className={hintOpen?'rotated':''} size={17}/></button>{hintOpen&&<ol className="hint-list">{problem.hints.map((hint)=><li key={hint}>{hint}</li>)}</ol>}</article>
        </div>
      </div></section>
      <section className={`workspace-panel editor-panel matplotlib-editor-panel ${runResult||error?'has-result':''}`}>
        <LearningCodeEditor language="python" value={code} tables={problem.tables} fileName="visualization.py" environment="Python · Matplotlib" editorLabel="Matplotlib 编辑器" runLabel={running?'正在运行…':'运行 Matplotlib'} disabled={running} onChange={edit} onRun={run}/>
        <button className="reset-code-button" onClick={()=>edit('')}><RotateCcw size={16}/>清空代码</button>
        <div className="matplotlib-runtime-status" aria-live="polite"><Circle size={10} fill="currentColor"/><span>{running?'正在准备并运行代码…':runtimeStatus}</span></div>
        {(runResult||error)&&<section className="inline-run-result matplotlib-output"><div className="workspace-panel-title"><strong>图表预览与判题</strong><span>真实 Python / Matplotlib 输出</span></div>
          {error?<div className="python-error" role="alert"><XCircle size={21}/><div><strong>Python 运行失败</strong><pre>{error}</pre></div></div>:runResult&&<><figure className="rendered-chart" role="img" aria-label={summary}><img src={runResult.imageDataUrl} alt="用户代码生成的 Matplotlib 图表"/><figcaption>{summary}</figcaption></figure>{grade&&<div className={`result-banner ${grade.correct?'success':'error'}`}><div>{grade.correct?<CheckCircle2 size={21}/>:<XCircle size={21}/>}<strong>{grade.correct?'通过！图表结构满足要求。':'图表已生成，还需要补充以下内容。'}</strong></div><ul>{grade.feedback.map((item)=><li className={item.passed?'passed':'missing'} key={item.message}>{item.passed?<CheckCircle2 size={15}/>:<Circle size={15}/>} {item.message}</li>)}</ul></div>}</>}
        </section>}
        <button className="explanation-entry" onClick={()=>setSolutionOpen(!solutionOpen)} aria-expanded={solutionOpen}><span><Lightbulb size={18}/><span><strong>查看参考实现与解释</strong><small>不会影响你的代码和运行结果</small></span></span><ChevronDown className={solutionOpen?'rotated':''} size={18}/></button>
        {solutionOpen&&<article className="reference-solution"><h3>参考 Matplotlib</h3><CodeBlock code={problem.solution} tables={problem.tables} language="python"/><p>{problem.explanation}</p></article>}
      </section>
    </main>
    {targetOpen&&<div className="target-chart-overlay" role="dialog" aria-modal="true" aria-labelledby="target-chart-title" onKeyDown={(event)=>{if(event.key==='Escape')setTargetOpen(false)}}><div><button className="target-chart-close" onClick={()=>setTargetOpen(false)} autoFocus aria-label="关闭目标图表"><X size={20}/></button><h2 id="target-chart-title">目标效果</h2><p>只核对图表类型、字段关系和信息层级，不要求颜色或像素完全相同。</p><ExpectedChartPreview kind={problem.expectedChart.expectation.kind} title={problem.expectedChart.title} summary={problem.expectedChart.summary} ariaLabel={problem.expectedChart.ariaLabel}/></div></div>}
  </div>
}

function cleanPythonError(message: string) { const lines=message.split('\n'); const start=lines.findIndex((line)=>/Traceback|File "solution.py"|Error:/.test(line)); return (start>=0?lines.slice(start):lines).slice(-12).join('\n').replace(/^PythonError:\s*/,'').trim() }
function describeChart(result: MatplotlibRunResult) { const {semantic}=result; const named=semantic.kind==='subplots'?`${semantic.axesCount} 个子图`:semantic.kind==='scatter'?'散点图':semantic.kind==='bar'?'柱状图':semantic.kind==='hist'?'直方图':semantic.kind==='multi-line'?'多系列折线图':'折线图'; const titles=semantic.axes.map((axis)=>axis.title).filter(Boolean); return `${named}${titles.length?`，标题为“${titles.join('、')}”`:''}。` }
