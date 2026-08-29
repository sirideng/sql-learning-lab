import { ArrowDown, Check, Circle, MousePointer2 } from 'lucide-react'
import { useState } from 'react'
import type { DataTable, VisualType } from '../types/problem'
import { DataTableView } from './DataTableView'

export function ConceptVisualizer({ type }: { type: VisualType }) {
  if (type === 'join') return <JoinVisualizer />
  if (type === 'group') return <GroupVisualizer />
  if (type === 'having') return <HavingVisualizer />
  if (type === 'window') return <WindowVisualizer />
  return <PipelineVisualizer type={type} />
}

function JoinVisualizer() {
  const [step, setStep] = useState(0)
  const steps = ['查看两张原表', '按 id 逐行匹配', '生成完整中间表']
  return (
    <div className="concept-visualizer join-visualizer">
      <VisualizerHeader title="LEFT JOIN 如何产生 NULL" step={step} steps={steps} onStep={setStep} />
      {step === 0 && <div className="visual-two-tables">
        <DataTableView table={{ name: 'users AS u', columns: ['u.id', 'u.name'], rows: [[1, 'Ada'], [2, 'Bo'], [3, 'Chen']] }} />
        <DataTableView table={{ name: 'orders AS o', columns: ['o.id', 'o.amount'], rows: [[1, 120], [1, 80], [2, 200]] }} />
      </div>}
      {step === 1 && <div className="match-board">
        <p>连接条件 <code>u.id = o.id</code></p>
        {[[1, '匹配 2 行'], [2, '匹配 1 行'], [3, '没有匹配']].map(([id, label], index) => (
          <div className={`match-row ${index === 2 ? 'unmatched' : ''}`} key={String(id)}><span>u.id = {id}</span><span className="match-line" /><strong>{label}</strong></div>
        ))}
      </div>}
      {step === 2 && <DataTableView table={{ name: 'LEFT JOIN 完整中间表', columns: ['u.id', 'u.name', 'o.id', 'o.amount'], rows: [[1, 'Ada', 1, 120], [1, 'Ada', 1, 80], [2, 'Bo', 2, 200], [3, 'Chen', null, null]] }} />}
      <VisualizerControls step={step} total={steps.length} onStep={setStep} />
    </div>
  )
}

function GroupVisualizer() {
  const [step, setStep] = useState(0)
  const steps = ['原始订单', '按照 customer_id 分组', '分别聚合']
  return (
    <div className="concept-visualizer">
      <VisualizerHeader title="GROUP BY 改变结果粒度" step={step} steps={steps} onStep={setStep} />
      {step === 0 && <DataTableView table={{ name: 'orders', columns: ['order_id', 'customer_id', 'amount'], rows: [[1, 10, 120], [2, 11, 80], [3, 10, 200], [4, 12, 60], [5, 11, 100]] }} />}
      {step === 1 && <div className="group-buckets">
        <GroupBucket id="customer_id = 10" values="120, 200" color="purple" />
        <GroupBucket id="customer_id = 11" values="80, 100" color="green" />
        <GroupBucket id="customer_id = 12" values="60" color="amber" />
      </div>}
      {step === 2 && <DataTableView table={{ name: 'GROUP BY 后', columns: ['customer_id', 'COUNT(*)', 'SUM(amount)'], rows: [[10, 2, 320], [11, 2, 180], [12, 1, 60]] }} />}
      <VisualizerControls step={step} total={steps.length} onStep={setStep} />
    </div>
  )
}

function HavingVisualizer() {
  const [stage, setStage] = useState<'where' | 'group' | 'having'>('where')
  const data: Record<'where' | 'group' | 'having', DataTable> = {
    where: { name: 'WHERE 后：分组前过滤 paid 行', columns: ['city', 'amount', 'status'], rows: [['A', 100, 'paid'], ['A', 180, 'paid'], ['B', 220, 'paid'], ['B', 80, 'paid']] },
    group: { name: 'GROUP BY 后：每个城市一行', columns: ['city', 'AVG(amount)'], rows: [['A', 140], ['B', 150]] },
    having: { name: 'HAVING 后：过滤聚合结果', columns: ['city', 'AVG(amount)'], rows: [['B', 150]] },
  }
  return <div className="concept-visualizer">
    <div className="where-having-switch">
      {(['where', 'group', 'having'] as const).map((item, index) => <button className={stage === item ? 'active' : ''} onClick={() => setStage(item)} key={item}><span>{index + 1}</span>{item.toUpperCase()}</button>)}
    </div>
    <div className="stage-caption">{stage === 'where' ? 'WHERE 看原始行，发生在 GROUP BY 之前。' : stage === 'group' ? '分组后，结果粒度变成 city。' : 'HAVING 看聚合结果，发生在 GROUP BY 之后。'}</div>
    <DataTableView table={data[stage]} />
  </div>
}

function WindowVisualizer() {
  const values = [100, 80, 40, 50]
  const dates = ['01-01', '01-02', '01-03', '01-04']
  const [selected, setSelected] = useState(2)
  const sum = values.slice(0, selected + 1).reduce((total, value) => total + value, 0)
  return <div className="concept-visualizer window-visualizer">
    <div className="window-instruction"><MousePointer2 size={17} /> 点击一行，观察该行能看到的窗口范围</div>
    <div className="window-grid">
      {dates.map((date, index) => <button key={date} onClick={() => setSelected(index)} className={`${index <= selected ? 'in-window' : ''} ${index === selected ? 'current' : ''}`}><span>{date}</span><strong>{values[index]}</strong><small>{index === selected ? 'CURRENT ROW' : index < selected ? 'IN WINDOW' : 'OUTSIDE'}</small></button>)}
    </div>
    <div className="window-equation"><span>SUM(profit)</span><strong>{values.slice(0, selected + 1).join(' + ')} = {sum}</strong><code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code></div>
  </div>
}

function PipelineVisualizer({ type }: { type: VisualType }) {
  const labels: Record<string, string[]> = {
    select: ['原始表：全部字段', 'SELECT 指定字段', '结果：只保留分析列'], filter: ['原始数据', '逐行判断 WHERE', '保留 TRUE 的行'], aggregate: ['多条明细行', 'SUM / AVG / COUNT', '一个指标'], subquery: ['运行内层查询', '得到中间值或表', '外层查询继续计算'], case: ['读取当前行', '按顺序匹配 WHEN', '生成分类字段'],
  }
  const items = labels[type]
  if (!items) return null
  return <div className="pipeline-visual">{items.map((item, index) => <div key={item}><span>{index + 1}</span><strong>{item}</strong>{index < items.length - 1 && <ArrowDown size={18} />}</div>)}</div>
}

function VisualizerHeader({ title, step, steps, onStep }: { title: string; step: number; steps: string[]; onStep: (step: number) => void }) {
  return <div className="visualizer-header"><div><span className="eyebrow">INTERACTIVE VISUAL</span><h3>{title}</h3></div><div className="visualizer-dots">{steps.map((label, index) => <button title={label} aria-label={label} key={label} className={index === step ? 'active' : index < step ? 'done' : ''} onClick={() => onStep(index)}>{index < step ? <Check size={13} /> : <Circle size={10} />}</button>)}</div></div>
}

function VisualizerControls({ step, total, onStep }: { step: number; total: number; onStep: (step: number) => void }) {
  return <div className="visualizer-controls"><button disabled={step === 0} onClick={() => onStep(step - 1)}>上一步</button><span>Step {step + 1} / {total}</span><button disabled={step === total - 1} onClick={() => onStep(step + 1)}>下一步</button></div>
}

function GroupBucket({ id, values, color }: { id: string; values: string; color: string }) {
  return <div className={`group-bucket ${color}`}><span>{id}</span><strong>amount: {values}</strong><small>这个组会得到 1 行结果</small></div>
}
