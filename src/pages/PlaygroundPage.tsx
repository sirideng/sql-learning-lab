import { CheckCircle2, Database, Play, RotateCcw, Sparkles, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { DataTableView } from '../components/DataTableView'
import { runPlaygroundSql, type RunResult } from '../services/sqlRunner'
import type { DataTable, PlaygroundScenario } from '../types/problem'

interface PlaygroundPageProps {
  scenarios: PlaygroundScenario[]
  completed: number
  total: number
  onNavigateSection: (section: AppSection) => void
}

const playgroundTables: DataTable[] = [
  {
    name: 'orders',
    columns: ['order_id', 'customer_id', 'amount'],
    rows: [[1, 10, 120], [2, 11, 80], [3, 10, 200], [4, 12, 60], [5, 11, 150]],
  },
  {
    name: 'customers',
    columns: ['customer_id', 'customer_name'],
    rows: [[10, 'Ada'], [11, 'Bo'], [12, 'Chen']],
  },
]

export function PlaygroundPage({ scenarios, completed, total, onNavigateSection }: PlaygroundPageProps) {
  const [selectedId, setSelectedId] = useState(scenarios[0].id)
  const scenario = scenarios.find((item) => item.id === selectedId) ?? scenarios[0]
  const [sql, setSql] = useState(scenario.sql)
  const [result, setResult] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const lines = useMemo(() => sql.split('\n'), [sql])

  const choose = (item: PlaygroundScenario) => {
    setSelectedId(item.id)
    setSql(item.sql)
    setResult(null)
  }

  const run = async () => {
    if (isRunning) return
    setIsRunning(true)
    try {
      setResult(await runPlaygroundSql(playgroundTables, sql))
    } finally {
      setIsRunning(false)
    }
  }

  return <div className="playground-page">
    <AppHeader completed={completed} total={total} currentSection="playground" onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} />
    <main className="playground-main">
      <section className="playground-heading"><div><span className="hero-pill"><Sparkles size={15} /> SANDBOX</span><h1>SQL Playground</h1><p>用同一组订单数据自由实验。选择一个概念模板，修改 SQL，再观察真实运行结果。</p></div><div className="playground-dataset"><Database size={20} /><span><strong>内置数据集</strong><small>orders · customers</small></span></div></section>
      <div className="scenario-tabs">{scenarios.map((item) => <button className={item.id === selectedId ? 'active' : ''} key={item.id} onClick={() => choose(item)}><span>{item.concept}</span>{item.title}</button>)}</div>
      <div className="playground-grid">
        <section className="playground-editor-card">
          <div className="workspace-panel-title"><div><strong>实验 SQL</strong></div><span>MySQL 8.0</span></div>
          <div className="editor-shell">
            <div className="editor-chrome"><span /><span /><span /><small>playground.sql</small></div>
            <div className="editor-body"><div className="line-numbers">{lines.map((_, index) => <span key={index}>{index + 1}</span>)}</div><textarea value={sql} onChange={(event) => { setSql(event.target.value); setResult(null) }} spellCheck={false} /></div>
          </div>
          <div className="playground-actions"><button className="secondary-button" onClick={() => { setSql(scenario.sql); setResult(null) }}><RotateCcw size={16} /> 重置</button><button className="run-button" onClick={run} disabled={isRunning}><Play size={17} fill="currentColor" /> {isRunning ? '正在运行…' : '运行实验'}</button></div>
        </section>
        <section className={`playground-result-card ${result?.status ?? ''}`}>
          <div className="workspace-panel-title"><div><strong>结果表</strong></div>{result && <span>{result.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />} 已运行 · {result.durationMs} ms</span>}</div>
          {result ? (
            <div className="playground-result-content">
              {result.table && <DataTableView table={{ ...result.table, name: 'SQL 运行结果' }} />}
              <div className={`execution-explanation ${result.status}`}><span>{result.status === 'success' ? '真实执行结果' : '执行失败'}</span><p>{result.message}</p></div>
            </div>
          ) : (
            <div className="playground-empty"><Play size={24} /><strong>等待运行</strong><p>查询结果会显示在这里。</p></div>
          )}
        </section>
      </div>
      <section className="playground-schema"><h2>实验数据</h2><div>{playgroundTables.map((table) => <DataTableView table={table} key={table.name} />)}</div></section>
    </main>
  </div>
}
