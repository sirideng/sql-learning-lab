import { CheckCircle2, FlaskConical, RotateCcw, XCircle } from 'lucide-react'
import { useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { DataTableView } from '../components/DataTableView'
import { LearningCodeEditor } from '../components/LearningCodeEditor'
import { PandasTransformationVisualizer } from '../components/PandasTransformationVisualizer'
import type { PandasPlaygroundScenario } from '../types/problem'

interface Props {
  scenarios: PandasPlaygroundScenario[]
  completed: number
  total: number
  onNavigateSection: (section: AppSection) => void
}

export function PandasPlaygroundPage({ scenarios, completed, total, onNavigateSection }: Props) {
  const [selectedId, setSelectedId] = useState(scenarios[0].id)
  const scenario = scenarios.find((item) => item.id === selectedId) ?? scenarios[0]
  const [codeByScenario, setCodeByScenario] = useState<Record<string, string>>(() => Object.fromEntries(scenarios.map((item) => [item.id, item.code])))
  const [status, setStatus] = useState<'success' | 'error' | null>(null)
  const code = codeByScenario[scenario.id]
  const setCode = (value: string) => { setCodeByScenario((current) => ({ ...current, [scenario.id]: value })); setStatus(null) }
  const run = () => {
    const normalized = code.toLowerCase().replace(/\s+/g, ' ')
    setStatus(scenario.requiredPatterns.every((pattern) => normalized.includes(pattern.toLowerCase())) ? 'success' : 'error')
  }

  return <div className="pandas-playground-page">
    <AppHeader completed={completed} total={total} mode="pandas" currentSection="playground" onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} />
    <main className="pandas-playground-main">
      <section className="playground-heading"><div><span className="eyebrow">PRACTICE SANDBOX</span><h1>自由实验</h1><p>在预定义数据集上练习核心 DataFrame 操作，并观察每次转换。</p><div className="language-local-switch"><button onClick={() => { window.location.hash = '/playground' }}>SQL</button><button className="active">Pandas</button></div></div><label>实验场景<select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setStatus(null) }}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></section>
      <div className="pandas-playground-grid">
        <section className="playground-pane input-pane"><div className="workspace-panel-title"><strong>输入数据</strong><span>{scenario.concept}</span></div><div className="playground-pane-scroll">{scenario.tables.map((item) => <DataTableView key={item.name} table={item} />)}</div></section>
        <section className="playground-pane code-pane"><LearningCodeEditor language="python" value={code} tables={scenario.tables} fileName="playground.py" environment="Learning Simulator" runLabel="运行实验" onChange={setCode} onRun={run} /><button className="reset-code-button" onClick={() => setCode(scenario.code)}><RotateCcw size={16} />重置示例</button></section>
        <section className="playground-pane result-pane"><div className="workspace-panel-title"><strong>结果 DataFrame</strong><span>{status ? '已运行' : '等待运行'}</span></div>{!status && <div className="playground-empty"><FlaskConical size={30} /><strong>准备就绪</strong><span>Ctrl + Enter 或点击“运行实验”</span></div>}{status === 'success' && <><div className="result-banner success"><CheckCircle2 size={20} /><div><strong>转换成功</strong><span>{scenario.explanation}</span></div></div><DataTableView table={scenario.result} /></>}{status === 'error' && <div className="result-banner error"><XCircle size={20} /><div><strong>当前操作不受支持</strong><span>此学习模拟器只识别当前场景的目标 Pandas 操作，请参考场景标题和输入数据。</span></div></div>}</section>
      </div>
      <section className="playground-visual-section"><div className="section-heading"><div><span className="eyebrow">DATAFRAME TRANSFORMATION</span><h2>数据变化过程</h2></div></div><PandasTransformationVisualizer type={scenario.id === 'merge' ? 'merge' : scenario.id === 'groupby' ? 'groupby' : scenario.id === 'diff' ? 'diff' : scenario.id === 'transform' ? 'transform' : 'filter'} original={scenario.tables} steps={scenario.steps} finalTable={scenario.result} /></section>
    </main>
  </div>
}
