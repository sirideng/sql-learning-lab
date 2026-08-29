import { AlertTriangle, CheckCircle2, Circle, Code2, Lightbulb, Table2 } from 'lucide-react'
import { useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { CodeBlock } from '../components/CodeBlock'
import { DataTableView } from '../components/DataTableView'
import { PandasTransformationVisualizer } from '../components/PandasTransformationVisualizer'
import type { PandasChapter } from '../types/problem'

interface Props {
  chapters: PandasChapter[]
  completedLessons: string[]
  completed: number
  total: number
  initialChapter?: string | null
  onToggleLesson: (id: string) => void
  onNavigateSection: (section: AppSection) => void
}

export function PandasLearningPage({ chapters, completedLessons, completed, total, initialChapter, onToggleLesson, onNavigateSection }: Props) {
  const [selectedId, setSelectedId] = useState(initialChapter && chapters.some((item) => item.id === initialChapter) ? initialChapter : chapters[0].id)
  const chapter = chapters.find((item) => item.id === selectedId) ?? chapters[0]
  const isComplete = completedLessons.includes(chapter.id)

  return <div className="learning-page pandas-learning-page">
    <AppHeader completed={completed} total={total} mode="pandas" currentSection="learn" onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} />
    <main className="learning-layout">
      <aside className="chapter-sidebar">
        <div className="chapter-sidebar-heading"><span className="eyebrow">PANDAS LEARNING PATH</span><h1>DataFrame 数据分析路径</h1><p>{chapters.filter((item) => completedLessons.includes(item.id)).length} / {chapters.length} 章节完成</p></div>
        <div className="chapter-list">{chapters.map((item) => <button key={item.id} className={item.id === chapter.id ? 'active' : ''} onClick={() => { setSelectedId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><span className={`chapter-status ${completedLessons.includes(item.id) ? 'complete' : ''}`}>{completedLessons.includes(item.id) ? <CheckCircle2 size={18} /> : <span>{String(item.order).padStart(2, '0')}</span>}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span></button>)}</div>
      </aside>
      <article className="lesson-content" key={chapter.id}>
        <div className="lesson-hero pandas-lesson-hero"><div><span className="lesson-number">PANDAS CHAPTER {String(chapter.order).padStart(2, '0')}</span><h2>{chapter.title}</h2><p>{chapter.subtitle}</p></div><span className="pandas-mark">pd</span></div>

        <PandasSection number="01" title="为什么需要" icon={<Lightbulb size={19} />}>
          <div className="lesson-scenario-card"><span className="lesson-mini-label">真实数据分析场景</span><p>{chapter.why.scenario}</p><div className="scenario-question"><strong>业务问题</strong><span>{chapter.why.question}</span></div><div className="scenario-reason"><strong>为什么需要</strong><span>{chapter.why.reason}</span></div></div>
        </PandasSection>

        <PandasSection number="02" title="核心概念" icon={<Circle size={19} />}>
          <div className="deep-concept-grid">{chapter.concepts.map((concept) => <article className="deep-concept-card" key={concept.title}><h4>{concept.title}</h4><p><strong>是什么：</strong>{concept.what}</p><p><strong>什么时候用：</strong>{concept.when}</p></article>)}</div>
        </PandasSection>

        <PandasSection number="03" title="原始 DataFrame" icon={<Table2 size={19} />}>
          <p className="lesson-section-intro">先确认字段、索引和一行数据代表的业务对象。</p><div className={`lesson-source-tables ${chapter.original.length > 1 ? 'multiple' : ''}`}>{chapter.original.map((item) => <DataTableView key={item.name} table={item} />)}</div>
        </PandasSection>

        <PandasSection number="04" title="DataFrame 变化可视化" icon={<Code2 size={19} />}>
          <PandasTransformationVisualizer type={chapter.visualType} original={chapter.original} steps={chapter.steps} finalTable={chapter.finalTable} />
        </PandasSection>

        <PandasSection number="05" title="Pandas 与 SQL 对照" icon={<Code2 size={19} />}>
          <div className="comparison-grid"><article><span className="comparison-label pandas">Pandas</span><CodeBlock code={chapter.code} tables={chapter.original} language="python" /></article><article><span className="comparison-label sql">SQL</span><CodeBlock code={chapter.sqlComparison} tables={chapter.original} language="sql" /></article></div>
        </PandasSection>

        <PandasSection number="06" title="常见错误" icon={<AlertTriangle size={19} />}>
          <div className="mistake-grid">{chapter.mistakes.map((mistake, index) => <article className="mistake-card" key={mistake.title}><div className="mistake-heading"><span>{index + 1}</span><h4>{mistake.title}</h4></div><p><strong>问题：</strong>{mistake.problem}</p><p className="mistake-fix"><strong>修正：</strong>{mistake.fix}</p></article>)}</div>
        </PandasSection>

        <PandasSection number="07" title="小练习" icon={<Circle size={19} />}>
          <div className="chapter-exercise-list">{chapter.exercises.map((exercise, index) => <details key={exercise.question}><summary><span className="exercise-level 基础">练习</span><strong>{index + 1}. {exercise.question}</strong><span className="exercise-reveal">展开</span></summary><div className="exercise-answer"><p><strong>Hint：</strong>{exercise.hint}</p><CodeBlock code={exercise.answer} language="python" /></div></details>)}</div>
        </PandasSection>

        <PandasSection number="08" title="本章掌握清单" icon={<CheckCircle2 size={19} />}>
          <div className="chapter-checklist">{chapter.checklist.map((item) => <div key={item}><CheckCircle2 size={18} /><span>{item}</span></div>)}</div>
          <button className={`lesson-complete-button ${isComplete ? 'complete' : ''}`} onClick={() => onToggleLesson(chapter.id)}>{isComplete ? <><CheckCircle2 size={18} /> 已完成本章</> : '标记为已完成'}</button>
        </PandasSection>
      </article>
    </main>
  </div>
}

function PandasSection({ number, title, icon, children }: { number: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="lesson-section"><div className="lesson-section-title"><span>{number}</span><span className="lesson-section-icon">{icon}</span><h3>{title}</h3></div>{children}</section>
}
