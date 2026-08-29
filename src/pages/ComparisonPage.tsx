import { ArrowRightLeft, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { CodeBlock } from '../components/CodeBlock'
import { DataTableView } from '../components/DataTableView'
import type { CrossLanguageMapping } from '../types/problem'

interface Props { mappings: CrossLanguageMapping[]; completed: number; total: number; onNavigateSection: (section: AppSection) => void }

export function ComparisonPage({ mappings, completed, total, onNavigateSection }: Props) {
  const [activeId, setActiveId] = useState(mappings[0].id)
  const mapping = mappings.find((item) => item.id === activeId) ?? mappings[0]
  return <div className="comparison-page atlas-page"><AppHeader completed={completed} total={total} currentSection="compare" onHome={() => onNavigateSection('dashboard')} onNavigateSection={onNavigateSection} /><main className="comparison-main atlas-main">
    <header className="page-title"><span className="eyebrow">SQL ↔ PANDAS</span><h1>双语对照</h1><p>只对照同一个数据动作的两种写法；完整业务分析统一放在“项目案例”。</p></header>
    <section className="mapping-section compact-mapping"><nav className="mapping-sidebar" aria-label="转换类型">{mappings.map((item) => {const selected=item.id===mapping.id;return <button className={selected?'active':''} aria-current={selected?'page':undefined} onClick={() => setActiveId(item.id)} key={item.id}><ArrowRightLeft size={16} /><span><strong>{item.title}</strong><small>{item.relation}</small></span></button>})}</nav><article className="mapping-detail" key={mapping.id}><span className="eyebrow">同一个问题</span><h2>{mapping.businessQuestion}</h2><p className="mapping-relation">{mapping.relation}</p><div className="dual-code-grid"><article><span className="comparison-label sql">SQL</span><CodeBlock code={mapping.sql} tables={mapping.tables} language="sql" /></article><article><span className="comparison-label pandas">Pandas</span><CodeBlock code={mapping.pandas} tables={mapping.tables} language="python" /></article></div><details className="mapping-data-details"><summary>查看输入数据与共同输出</summary><div className="lesson-source-tables multiple">{mapping.tables.map((item) => <DataTableView key={item.name} table={item} />)}</div><div className="comparison-final"><CheckCircle2 size={20} /><div><h3>两种写法得到相同结果</h3><p>字段、粒度和数值一致。</p></div></div><DataTableView table={mapping.result} /></details></article></section>
  </main></div>
}
