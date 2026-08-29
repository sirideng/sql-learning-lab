import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Database, Lightbulb, Table2, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { CodeBlock } from '../components/CodeBlock'
import { DataTableView } from '../components/DataTableView'
import { TrackTabs } from '../components/TrackTabs'
import { MatplotlibMiniPath } from '../components/MatplotlibMiniPath'
import type { LearningChapter, ProjectProgressMap } from '../types/problem'

interface Props { chapters: LearningChapter[]; completedLessons: string[]; completedProblems: number; totalProblems: number; initialChapter?: string; showLesson?: boolean; projectProgress: ProjectProgressMap; matplotlibCompletedLessons: number; matplotlibCompletedQuestions: number; onOpenMatplotlib: () => void; onNavigateSection: (section: AppSection) => void; onToggleLesson: (id: string) => void; onToggleProjectStep: (projectId: string, stepId: string) => void; onOpenPractice: (id: string) => void }

const modulePlan = [
  ['查询基础', [1,2,3]], ['聚合与分组', [4,5,6]], ['多表连接', [7]], ['子查询与条件', [8,9]], ['窗口函数', [10]],
  ['日期与字符串', [11,12]], ['CTE 与可读性', [13]], ['分析案例', [14,15]], ['性能与迁移', [16,17]], ['综合项目', [18]],
] as const

export function LearningPathPage({ chapters, completedLessons, completedProblems, totalProblems, initialChapter, showLesson = false, matplotlibCompletedLessons, matplotlibCompletedQuestions, onOpenMatplotlib, onNavigateSection, onToggleLesson, onOpenPractice }: Props) {
  const [selectedId, setSelectedId] = useState(initialChapter && chapters.some(c=>c.id===initialChapter) ? initialChapter : chapters[0].id)
  const routeSelectedId = initialChapter && chapters.some((item) => item.id === initialChapter) ? initialChapter : selectedId
  const chapter = chapters.find((item) => item.id === routeSelectedId) ?? chapters[0]
  const lesson = chapter.deepDive
  const modules = useMemo(() => modulePlan.map(([title, orders]) => ({ title, chapters: chapters.filter(c => (orders as readonly number[]).includes(c.order)) })).filter(m=>m.chapters.length), [chapters])
  const activeModule = modules.findIndex((module) => module.chapters.some(c=>c.id===chapter.id))
  const selectModule = (id: string) => { if (showLesson) window.location.assign(`#/learn/sql/${id}`); else setSelectedId(id); window.scrollTo({top:0,behavior:'smooth'}) }
  const openChapter = (id: string) => { window.location.assign(`#/learn/sql/${id}`); window.scrollTo({top:0,behavior:'smooth'}) }
  const isComplete = completedLessons.includes(chapter.id)
  return <div className={`learning-page atlas-page track-sql ${showLesson?'course-route':'map-route'}`}><AppHeader mode="sql" completed={completedProblems} total={totalProblems} currentSection="learn" onHome={()=>onNavigateSection('dashboard')} onNavigateSection={onNavigateSection}/><main className="atlas-main learning-map-page">
    <header className="page-title learning-map-overview"><span className="eyebrow">SQL TRACK · LEARNING MAP</span>{showLesson?<h2>数据分析学习地图</h2>:<h1>数据分析学习地图</h1>}<p>先选模块，再进入短而完整的一节课。原章节链接和学习进度继续保留。</p><TrackTabs value="sql" onChange={(value)=>{ if(value==='pandas') window.location.hash='/pandas/learn' }}/></header>
    <section className="module-map" aria-label="SQL 学习模块">{modules.map((module,index)=><button key={module.title} className={index===activeModule?'active':''} aria-pressed={index===activeModule} onClick={()=>selectModule(module.chapters[0].id)}><span>{String(index+1).padStart(2,'0')}</span><strong>{module.title}</strong><small>{module.chapters.filter(c=>completedLessons.includes(c.id)).length}/{module.chapters.length}</small></button>)}</section>
    {!showLesson&&<MatplotlibMiniPath completedLessons={matplotlibCompletedLessons} completedQuestions={matplotlibCompletedQuestions} onOpen={onOpenMatplotlib}/>}
    <div className="lesson-workspace"><aside className="lesson-subnav"><strong>{modules[activeModule]?.title}</strong>{modules[activeModule]?.chapters.map(item=><button key={item.id} className={item.id===chapter.id?'active':''} aria-current={item.id===chapter.id?'page':undefined} onClick={()=>openChapter(item.id)}>{completedLessons.includes(item.id)?<CheckCircle2 size={17}/>:<span>{String(item.order).padStart(2,'0')}</span>}<div><b>{item.title}</b><small>{item.subtitle}</small></div></button>)}</aside>
      <article className="compact-lesson" key={chapter.id}><a className="lesson-mobile-back" href="#/learn"><ArrowLeft size={17}/> 返回学习地图</a><header><span>SQL TRACK · CHAPTER {String(chapter.order).padStart(2,'0')}</span>{showLesson?<h1>{chapter.title}</h1>:<h2>{chapter.title}</h2>}<p>{chapter.description}</p></header>
        <LessonBlock icon={<Lightbulb/>} title="本节解决什么"><div className="lesson-question"><strong>{lesson.why.scenario}</strong><p>{lesson.why.question}</p><span>{lesson.why.reason}</span></div></LessonBlock>
        <LessonBlock icon={<Database/>} title="三个核心概念"><div className="compact-concepts">{lesson.coreConcepts.slice(0,3).map((item,index)=><article key={item.title}><span>0{index+1}</span><strong>{item.title}</strong><p>{item.what}</p><small>{item.when}</small></article>)}</div></LessonBlock>
        <LessonBlock icon={<Table2/>} title="数据怎样变化"><div className="transformation-flow"><div><h4>输入数据</h4><div className="lesson-source-tables">{lesson.demo.originalTables.map(table=><DataTableView key={table.name} table={table}/>)}</div></div><ArrowRight/><div><h4>SQL</h4><CodeBlock code={chapter.sqlExample} tables={lesson.demo.originalTables} language="sql"/></div><ArrowRight/><div><h4>最终输出</h4><DataTableView table={lesson.demo.finalTable}/></div></div><details className="alternate-language"><summary>查看 Pandas 对照</summary><CodeBlock code={lesson.pandasComparison.pandas} tables={lesson.demo.originalTables} language="python"/><p>{lesson.pandasComparison.explanation}</p></details></LessonBlock>
        <LessonBlock icon={<TriangleAlert/>} title="常见错误"><div className="compact-mistakes">{lesson.commonMistakes.slice(0,2).map(item=><article key={item.title}><strong>{item.title}</strong><CodeBlock code={item.wrongSql} tables={lesson.demo.originalTables} language="sql"/><p>{item.problem}</p><span>修正：{item.fix}</span></article>)}</div></LessonBlock>
        <LessonBlock icon={<CheckCircle2/>} title="快速检查"><div className="quick-checks">{lesson.exercises.slice(0,3).map((item,index)=><details key={item.question}><summary><span>{index+1}</span><strong>{item.question}</strong></summary><p>{item.hints?.[0] ?? item.answer}</p>{item.solution && <CodeBlock code={item.solution} tables={item.tables ?? lesson.demo.originalTables} language="sql"/>}</details>)}</div><div className="lesson-actions"><button className={`lesson-complete-button ${isComplete?'complete':''}`} onClick={()=>onToggleLesson(chapter.id)}>{isComplete?<CheckCircle2 size={18}/>:<Circle size={18}/>} {isComplete?'本节已完成':'标记为已学会'}</button>{chapter.practiceIds[0] && <button className="primary-button" onClick={()=>onOpenPractice(chapter.practiceIds[0])}>进入配套练习 <ArrowRight size={16}/></button>}</div></LessonBlock>
      </article>
    </div>
  </main></div>
}

function LessonBlock({icon,title,children}:{icon:React.ReactNode;title:string;children:React.ReactNode}){return <section className="compact-lesson-block"><div className="compact-block-title"><i>{icon}</i><h3>{title}</h3></div>{children}</section>}
