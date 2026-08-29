import { CheckCircle2, ChevronDown, FolderKanban } from 'lucide-react'
import { useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { CodeBlock } from '../components/CodeBlock'
import { DataTableView } from '../components/DataTableView'
import type { DualAnalysisCase } from '../types/problem'

interface Props { cases: DualAnalysisCase[]; completed: number; total: number; onNavigateSection: (section: AppSection) => void }

export function ProjectCasesPage({ cases, completed, total, onNavigateSection }: Props) {
  const [activeId, setActiveId] = useState(cases[0].id)
  const active = cases.find((item) => item.id === activeId) ?? cases[0]
  return <div className="atlas-page"><AppHeader completed={completed} total={total} currentSection="projects" onHome={() => onNavigateSection('dashboard')} onNavigateSection={onNavigateSection} /><main className="atlas-main projects-page"><header className="page-title"><span className="eyebrow">ANALYTICS PROJECTS</span><h1>项目案例</h1><p>从业务问题、数据清洗和指标口径，一步步走到可以解释的分析结论。</p></header><div className="project-tabs">{cases.map((item,index)=><button key={item.id} className={active.id===item.id?'active':''} onClick={()=>setActiveId(item.id)}><span>{String(index+1).padStart(2,'0')}</span><strong>{item.title}</strong></button>)}</div><article className="project-case"><div className="project-intro"><i><FolderKanban size={22}/></i><div><h2>{active.title}</h2><p>{active.description}</p></div></div><details><summary>查看项目数据表 <ChevronDown size={18}/></summary><div className="lesson-source-tables multiple">{active.tables.map(table=><DataTableView key={table.name} table={table}/>)}</div></details><div className="project-stage-list">{active.stages.map((stage,index)=><details key={stage.title} open={index===0}><summary><span>{String(index+1).padStart(2,'0')}</span><div><strong>{stage.title}</strong><small>{stage.purpose}</small></div><ChevronDown size={18}/></summary><div className="project-stage-body"><div className="dual-code-grid"><article><span className="comparison-label sql">SQL</span><CodeBlock code={stage.sql} tables={active.tables} language="sql"/></article><article><span className="comparison-label pandas">Pandas</span><CodeBlock code={stage.pandas} tables={active.tables} language="python"/></article></div><DataTableView table={stage.result}/><p className="case-conclusion"><CheckCircle2 size={18}/><span><strong>结果解释</strong>{stage.conclusion}</span></p></div></details>)}</div></article></main></div>
}
