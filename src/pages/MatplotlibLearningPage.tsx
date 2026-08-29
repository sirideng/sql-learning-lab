import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Database, Lightbulb, LineChart, TriangleAlert } from 'lucide-react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { CodeBlock } from '../components/CodeBlock'
import { DataTableView } from '../components/DataTableView'
import { ExpectedChartPreview } from '../components/ExpectedChartPreview'
import type { MatplotlibChapter } from '../types/problem'

interface Props {
  chapters: MatplotlibChapter[]
  completedLessons: string[]
  completedQuestions: number
  totalQuestions: number
  initialChapter?: string
  showLesson: boolean
  onToggleLesson: (id: string) => void
  onOpenPractice: (id: string) => void
  onNavigateSection: (section: AppSection) => void
}

export function MatplotlibLearningPage({ chapters, completedLessons, completedQuestions, totalQuestions, initialChapter, showLesson, onToggleLesson, onOpenPractice, onNavigateSection }: Props) {
  const chapter = chapters.find((item) => item.id === initialChapter) ?? chapters[0]
  const openChapter = (id: string) => { window.location.assign(`#/learn/matplotlib/${id}`); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const kind = chapter.id === 'line-bar' ? 'line' : chapter.id === 'scatter-hist' ? 'scatter' : chapter.id === 'subplots-export' ? 'subplots' : 'line'
  return <div className={`learning-page atlas-page track-pandas matplotlib-learning-page ${showLesson ? 'course-route' : 'map-route'}`}>
    <AppHeader mode="pandas" completed={completedQuestions} total={totalQuestions} currentSection="learn" onHome={() => onNavigateSection('dashboard')} onNavigateSection={onNavigateSection}/>
    <main className="atlas-main learning-map-page">
      <header className="page-title learning-map-overview"><span className="eyebrow">PANDAS DELIVERY · MATPLOTLIB</span>{showLesson ? <h2>基础数据可视化</h2> : <h1>基础数据可视化</h1>}<p>5 节短课，把 Pandas 结果转成可以解释、可以交付的图表。</p><a className="text-link" href="#/pandas/learn"><ArrowLeft size={16}/> 返回 Pandas 学习地图</a></header>
      <section className="matplotlib-chapter-map" aria-label="Matplotlib 短课">{chapters.map((item) => { const selected=item.id===chapter.id; const done=completedLessons.includes(item.id); return <button key={item.id} className={selected?'active':''} aria-current={selected?'page':undefined} onClick={() => openChapter(item.id)}><span>{done?<CheckCircle2 size={18}/>:String(item.order).padStart(2,'0')}</span><strong>{item.title}</strong><small>{item.subtitle}</small></button>})}</section>
      {showLesson && <article className="compact-lesson matplotlib-lesson">
        <a className="lesson-mobile-back" href="#/learn/matplotlib"><ArrowLeft size={17}/> 返回可视化学习地图</a>
        <header><span>MATPLOTLIB · LESSON {String(chapter.order).padStart(2,'0')}</span><h1>{chapter.title}</h1><p>{chapter.subtitle}</p></header>
        <Block icon={<Lightbulb/>} title="本节解决什么"><div className="lesson-question"><strong>{chapter.why.scenario}</strong><p>{chapter.why.question}</p><span>{chapter.why.reason}</span></div></Block>
        <Block icon={<Database/>} title="三个核心概念"><div className="compact-concepts">{chapter.concepts.map((item,index)=><article key={item.title}><span>0{index+1}</span><strong>{item.title}</strong><p>{item.what}</p><small>{item.when}</small></article>)}</div></Block>
        <Block icon={<LineChart/>} title="数据怎样变化"><div className="matplotlib-demo"><div><h4>输入 DataFrame</h4>{chapter.original.map((item)=><DataTableView key={item.name} table={item}/>)}</div><div><h4>Matplotlib</h4><CodeBlock code={chapter.code} tables={chapter.original} language="python"/></div><div><h4>图表信息</h4><ExpectedChartPreview kind={kind} title={chapter.title} summary={chapter.why.reason} ariaLabel={`${chapter.title}课程的目标图表示意`}/></div></div></Block>
        <Block icon={<TriangleAlert/>} title="两个常见错误"><div className="compact-mistakes">{chapter.mistakes.map((item)=><article key={item.title}><strong>{item.title}</strong><p>{item.problem}</p><span>修正：{item.fix}</span></article>)}</div></Block>
        <Block icon={<CheckCircle2/>} title="三题快速检查"><div className="quick-checks">{chapter.exercises.map((item,index)=><details key={item.question}><summary><span>{index+1}</span><strong>{item.question}</strong></summary><p>{item.hint}</p><CodeBlock code={item.answer} language="python"/></details>)}</div><div className="lesson-actions"><button className={`lesson-complete-button ${completedLessons.includes(chapter.id)?'complete':''}`} onClick={()=>onToggleLesson(chapter.id)}>{completedLessons.includes(chapter.id)?<CheckCircle2 size={18}/>:<Circle size={18}/>} {completedLessons.includes(chapter.id)?'本节已完成':'标记为已学会'}</button><button className="primary-button" onClick={()=>onOpenPractice(chapter.practiceIds[0])}>进入配套练习 <ArrowRight size={16}/></button></div></Block>
      </article>}
    </main>
  </div>
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <section className="compact-lesson-block"><div className="compact-block-title"><i>{icon}</i><h3>{title}</h3></div>{children}</section> }
