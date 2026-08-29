import { ArrowDown, CheckCircle2, Languages } from 'lucide-react'
import { useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { CodeBlock } from '../components/CodeBlock'
import { DataTableView } from '../components/DataTableView'
import type { CrossLanguageMapping, DualAnalysisCase } from '../types/problem'

interface Props {
  mappings: CrossLanguageMapping[]
  cases: DualAnalysisCase[]
  completed: number
  total: number
}

export function ComparisonPage({ mappings, cases, completed, total }: Props) {
  const [activeMapping, setActiveMapping] = useState(mappings[0].id)
  const [activeCase, setActiveCase] = useState(cases[0].id)
  const mapping = mappings.find((item) => item.id === activeMapping) ?? mappings[0]
  const analysisCase = cases.find((item) => item.id === activeCase) ?? cases[0]

  return <div className="comparison-page">
    <AppHeader completed={completed} total={total} mode="compare" onHome={() => { window.location.hash = '/dashboard' }} />
    <main className="comparison-main">
      <section className="comparison-hero"><span className="eyebrow">ONE DATA FLOW · TWO LANGUAGES</span><h1>SQL ↔ Pandas</h1><p>不是背两套语法，而是用两种语言表达同一条数据转换链。</p><div className="comparison-equation"><span>输入数据</span><ArrowDown size={18} /><span>筛选 / 连接 / 分组 / 窗口</span><ArrowDown size={18} /><span>同一个结果</span></div></section>
      <section className="mapping-section"><div className="mapping-sidebar">{mappings.map((item) => <button className={item.id === mapping.id ? 'active' : ''} onClick={() => setActiveMapping(item.id)} key={item.id}><Languages size={16} /><span><strong>{item.title}</strong><small>{item.relation}</small></span></button>)}</div>
        <article className="mapping-detail" key={mapping.id}>
          <span className="eyebrow">BUSINESS QUESTION</span><h2>{mapping.businessQuestion}</h2><p className="mapping-relation">{mapping.relation}</p>
          <div className="lesson-source-tables multiple">{mapping.tables.map((item) => <DataTableView key={item.name} table={item} />)}</div>
          <div className="dual-code-grid"><article><span className="comparison-label sql">SQL</span><CodeBlock code={mapping.sql} tables={mapping.tables} language="sql" /></article><article><span className="comparison-label pandas">Pandas</span><CodeBlock code={mapping.pandas} tables={mapping.tables} language="python" /></article></div>
          <div className="dual-intermediate-grid"><div><h3>SQL 中间表</h3><DataTableView table={mapping.sqlIntermediate} /></div><div><h3>Pandas 中间 DataFrame</h3><DataTableView table={mapping.pandasIntermediate} /></div></div>
          <div className="comparison-final"><CheckCircle2 size={21} /><div><h3>共同最终结果</h3><p>两种实现得到相同字段、粒度与数值。</p></div></div><DataTableView table={mapping.result} />
        </article>
      </section>

      <section className="dual-case-section"><div className="section-heading"><div><span className="eyebrow">DATA ANALYSIS CASE STUDY</span><h2>完整分析案例</h2><p>相同数据、相同指标口径，两种实现逐步验证。</p></div></div><div className="case-tabs">{cases.map((item) => <button className={item.id === analysisCase.id ? 'active' : ''} onClick={() => setActiveCase(item.id)} key={item.id}>{item.title}</button>)}</div><article className="dual-case-card"><h3>{analysisCase.title}</h3><p>{analysisCase.description}</p><div className="lesson-source-tables">{analysisCase.tables.map((item) => <DataTableView key={item.name} table={item} />)}</div><div className="case-stage-list">{analysisCase.stages.map((stage, index) => <article className="case-stage" key={stage.title}><div className="case-stage-number">{String(index + 1).padStart(2, '0')}</div><div className="case-stage-content"><h4>{stage.title}</h4><p>{stage.purpose}</p><div className="dual-code-grid"><CodeBlock code={stage.sql} tables={analysisCase.tables} language="sql" /><CodeBlock code={stage.pandas} tables={analysisCase.tables} language="python" /></div><DataTableView table={stage.result} /><div className="case-conclusion"><strong>结果解释</strong><span>{stage.conclusion}</span></div></div></article>)}</div></article></section>
    </main>
  </div>
}
