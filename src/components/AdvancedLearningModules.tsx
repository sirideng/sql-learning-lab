import { BarChart3, Check, ChevronRight, Circle, Code2, Database, FileText, Play, Route, Rows3, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { ChapterDeepDive } from '../types/problem'
import { CodeBlock } from './CodeBlock'
import { DataTableView } from './DataTableView'

type SqlExample = NonNullable<ChapterDeepDive['sqlExamples']>[number]
type CaseStudy = NonNullable<ChapterDeepDive['caseStudies']>[number]
type ComparisonPair = NonNullable<ChapterDeepDive['comparisonPairs']>[number]
type ExecutionStage = NonNullable<ChapterDeepDive['executionOrder']>[number]
type Project = NonNullable<ChapterDeepDive['projectLab']>

export function SqlExampleGallery({ examples }: { examples: SqlExample[] }) {
  return <div className="sql-example-gallery">{examples.map((example) => <article className="sql-example-card" key={example.title}><div className="sql-example-heading"><span>{example.level}</span><div><h4>{example.title}</h4><p>{example.description}</p></div></div><CodeBlock code={example.sql} /></article>)}</div>
}

export function AnalyticsCaseStudies({ cases }: { cases: CaseStudy[] }) {
  const [active, setActive] = useState(0)
  const current = cases[active]
  return <div className="analytics-case-module">
    <div className="case-tabs" role="tablist">{cases.map((item, index) => <button role="tab" aria-selected={active === index} className={active === index ? 'active' : ''} onClick={() => setActive(index)} key={item.title}><span>0{index + 1}</span>{item.title.replace(/^项目 \d · /, '')}</button>)}</div>
    <article className="case-study-panel">
      <div className="case-study-intro"><span className="eyebrow">ANALYTICS CASE STUDY</span><h4>{current.title}</h4><p>{current.description}</p><div className="case-question-list">{current.businessQuestions.map((question) => <span key={question}><ChevronRight size={15} />{question}</span>)}</div></div>
      <div className={`lesson-source-tables ${current.tables.length > 1 ? 'multiple' : ''}`}>{current.tables.map((table) => <DataTableView table={table} key={table.name} />)}</div>
      <div className="case-analysis-steps">{current.steps.map((step, index) => <section key={step.title}><div className="case-step-marker"><span>{index + 1}</span><i /></div><div className="case-step-body"><h5>{step.title}</h5><CodeBlock code={step.sql} /><DataTableView table={step.result} /><p><Sparkles size={16} />{step.interpretation}</p></div></section>)}</div>
    </article>
  </div>
}

export function ExecutionOrderVisualizer({ stages }: { stages: ExecutionStage[] }) {
  const [active, setActive] = useState(0)
  const current = stages[active]
  return <div className="execution-order-module">
    <div className="execution-order-track">{stages.map((stage, index) => <button className={index === active ? 'active' : index < active ? 'visited' : ''} onClick={() => setActive(index)} key={stage.stage}><span>{index < active ? <Check size={14} /> : index + 1}</span><strong>{stage.stage}</strong>{index < stages.length - 1 && <i><ChevronRight size={15} /></i>}</button>)}</div>
    <div className="execution-order-detail"><div><span className="eyebrow">LOGICAL STEP {active + 1}</span><h4>{current.stage}</h4><p>{current.purpose}</p></div><code>{current.example}</code><button onClick={() => setActive((value) => (value + 1) % stages.length)}><Play size={15} />演示下一步</button></div>
  </div>
}

export function SqlPandasComparisonLab({ pairs }: { pairs: ComparisonPair[] }) {
  const [active, setActive] = useState(0)
  const current = pairs[active]
  return <div className="sql-pandas-lab">
    <div className="comparison-topic-list">{pairs.map((pair, index) => <button className={active === index ? 'active' : ''} onClick={() => setActive(index)} key={pair.concept}><span>{String(index + 1).padStart(2, '0')}</span>{pair.concept}</button>)}</div>
    <div className="comparison-workbench"><div className="comparison-workbench-heading"><div><span className="eyebrow">CONCEPT BRIDGE</span><h4>{current.concept}</h4></div><Route size={21} /></div><div className="comparison-grid"><article><span className="comparison-label sql">SQL · DATABASE</span><CodeBlock code={current.sql} /></article><article><span className="comparison-label pandas">PANDAS · DATAFRAME</span><CodeBlock code={current.pandas} /></article></div><p className="comparison-takeaway"><Sparkles size={17} />{current.takeaway}</p></div>
  </div>
}

export function ProjectLabModule({ project, completedSteps, onToggle }: { project: Project; completedSteps: string[]; onToggle: (stepId: string) => void }) {
  const completed = project.steps.filter((step) => completedSteps.includes(step.id)).length
  const percent = Math.round(completed / project.steps.length * 100)
  return <div className="project-lab-module">
    <div className="project-lab-summary"><div className="project-lab-icon"><BarChart3 size={25} /></div><div><span className="eyebrow">PROJECT LAB</span><h4>{project.title}</h4><p>{project.description}</p></div><strong>{percent}%</strong></div>
    <div className="project-progress-track"><span style={{ width: `${percent}%` }} /></div>
    <div className="project-step-list">{project.steps.map((step, index) => {
      const done = completedSteps.includes(step.id)
      const icons = [Database, Rows3, Code2, BarChart3, FileText]
      const Icon = icons[index] ?? Circle
      return <button className={done ? 'complete' : ''} onClick={() => onToggle(step.id)} key={step.id}><span className="project-step-check">{done ? <Check size={18} /> : <Icon size={18} />}</span><span className="project-step-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{step.title}</strong><small>{step.description}</small><em>交付物：{step.deliverable}</em></span></button>
    })}</div>
  </div>
}
