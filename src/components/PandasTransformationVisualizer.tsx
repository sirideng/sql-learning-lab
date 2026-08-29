import { ArrowDown, Check, GitMerge, Layers3, MoveDown, Rows3 } from 'lucide-react'
import { useState } from 'react'
import type { DataTable, ExplanationStep, PandasChapter } from '../types/problem'
import { CodeBlock } from './CodeBlock'
import { DataTableView } from './DataTableView'

interface VisualStep {
  title: string
  description: string
  code?: string
  table?: DataTable
}

interface Props {
  type: PandasChapter['visualType']
  original: DataTable[]
  steps: VisualStep[] | ExplanationStep[]
  finalTable: DataTable
}

const visualNotes: Partial<Record<PandasChapter['visualType'], { icon: typeof Rows3; title: string; detail: string }>> = {
  filter: { icon: Rows3, title: 'False 行消失，True 行保留', detail: '布尔掩码与原 DataFrame 使用同一索引逐行对齐。' },
  groupby: { icon: Layers3, title: 'Split → Apply → Combine', detail: '先分桶，再对每组计算，最后组合为组级结果。' },
  merge: { icon: GitMerge, title: '连接键决定匹配与扩行', detail: '一对多会把左行复制多次；未匹配的右侧字段成为 NaN。' },
  diff: { icon: MoveDown, title: '当前行 − shift(1)', detail: '先把上一行移动到当前行旁边，再执行逐行相减。' },
  transform: { icon: Layers3, title: '组级值广播回原行', detail: '先计算每组指标，再按原索引映射，因此行数不变。' },
  date: { icon: MoveDown, title: '字符串 → datetime → 时间维度', detail: '日期类型转换后才能安全计算周期、间隔与观察窗口。' },
}

export function PandasTransformationVisualizer({ type, original, steps, finalTable }: Props) {
  const [active, setActive] = useState(0)
  const sequence: VisualStep[] = [
    { title: '原始 DataFrame', description: '确认字段、索引与一行代表的业务对象。', table: original[0] },
    ...steps.map((step) => ({ title: step.title, description: 'description' in step ? step.description : step.detail, code: (step as ExplanationStep).sql ?? (step as VisualStep).code, table: step.table })),
    { title: '最终结果', description: '核对字段名、结果粒度、行数和缺失值。', table: finalTable },
  ]
  const current = sequence[active]
  const note = visualNotes[type]
  const Icon = note?.icon

  return <div className="pandas-transformation-visual">
    {note && Icon && <div className="transformation-principle"><Icon size={21} /><div><strong>{note.title}</strong><span>{note.detail}</span></div></div>}
    {type === 'merge' && original.length > 1 && active === 0 && <div className="pandas-merge-inputs">{original.map((item) => <DataTableView key={item.name} table={item} />)}</div>}
    <div className="transformation-timeline">{sequence.map((step, index) => <button key={`${step.title}-${index}`} className={active === index ? 'active' : active > index ? 'done' : ''} onClick={() => setActive(index)}><span>{active > index ? <Check size={13} /> : index + 1}</span><strong>{step.title}</strong></button>)}</div>
    <article className="transformation-stage">
      <div><span className="eyebrow">DATAFRAME STEP {active + 1}</span><h4>{current.title}</h4><p>{current.description}</p></div>
      {current.code && <CodeBlock code={current.code} tables={original} language="python" />}
      {current.table && <DataTableView table={current.table} />}
    </article>
    <div className="transformation-controls"><button disabled={active === 0} onClick={() => setActive(active - 1)}>上一步</button><span>{active + 1} / {sequence.length}</span><button disabled={active === sequence.length - 1} onClick={() => setActive(active + 1)}>下一步 <ArrowDown size={14} /></button></div>
  </div>
}
