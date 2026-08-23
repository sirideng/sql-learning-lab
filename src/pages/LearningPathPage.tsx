import { ArrowRight, BookOpen, CheckCircle2, Circle, Code2, Link2 } from 'lucide-react'
import { useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { CodeBlock } from '../components/CodeBlock'
import { ConceptVisualizer } from '../components/ConceptVisualizer'
import type { LearningChapter } from '../types/problem'

interface LearningPathPageProps {
  chapters: LearningChapter[]
  completedLessons: string[]
  completedProblems: number
  totalProblems: number
  initialChapter?: string | null
  onNavigateSection: (section: AppSection) => void
  onToggleLesson: (id: string) => void
  onOpenPractice: (id: string) => void
}

export function LearningPathPage({ chapters, completedLessons, completedProblems, totalProblems, initialChapter, onNavigateSection, onToggleLesson, onOpenPractice }: LearningPathPageProps) {
  const [selectedId, setSelectedId] = useState(initialChapter ?? chapters[0].id)
  const chapter = chapters.find((item) => item.id === selectedId) ?? chapters[0]
  const isComplete = completedLessons.includes(chapter.id)
  return <div className="learning-page">
    <AppHeader completed={completedProblems} total={totalProblems} currentSection="learn" onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} />
    <main className="learning-layout">
      <aside className="chapter-sidebar">
        <div className="chapter-sidebar-heading"><span className="eyebrow">LEARNING PATH</span><h1>SQL 数据分析路径</h1><p>{completedLessons.length} / {chapters.length} 章节完成</p></div>
        <div className="chapter-list">{chapters.map((item) => <button key={item.id} className={item.id === chapter.id ? 'active' : ''} onClick={() => setSelectedId(item.id)}><span className={`chapter-status ${completedLessons.includes(item.id) ? 'complete' : ''}`}>{completedLessons.includes(item.id) ? <CheckCircle2 size={18} /> : <span>{String(item.order).padStart(2, '0')}</span>}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span></button>)}</div>
      </aside>
      <article className="lesson-content">
        <div className="lesson-hero"><div><span className="lesson-number">CHAPTER {String(chapter.order).padStart(2, '0')}</span><h2>{chapter.title}</h2><p>{chapter.description}</p></div><BookOpen size={42} /></div>
        <section className="lesson-section"><div className="lesson-section-title"><Circle size={12} fill="currentColor" /><h3>核心理论</h3></div><div className="theory-grid">{chapter.theory.map((item, index) => <div key={item}><span>{index + 1}</span><p>{item}</p></div>)}</div></section>
        <section className="lesson-section"><div className="lesson-section-title"><Link2 size={17} /><h3>从 Pandas 迁移理解</h3></div><div className="pandas-bridge"><span>Pandas → SQL</span><p>{chapter.pandasBridge}</p></div></section>
        <section className="lesson-section visual-lesson-section"><ConceptVisualizer type={chapter.visualType} /></section>
        <section className="lesson-section"><div className="lesson-section-title"><Code2 size={17} /><h3>SQL 示例</h3></div><CodeBlock code={chapter.sqlExample} /></section>
        <section className="lesson-section takeaway-section"><h3>这一章你应该掌握</h3>{chapter.takeaways.map((item) => <div key={item}><CheckCircle2 size={17} /><span>{item}</span></div>)}</section>
        <div className="lesson-actions"><button className={`lesson-complete-button ${isComplete ? 'complete' : ''}`} onClick={() => onToggleLesson(chapter.id)}>{isComplete ? <CheckCircle2 size={18} /> : <Circle size={18} />}{isComplete ? '本章已完成' : '标记为已学会'}</button>{chapter.practiceIds[0] && <button className="primary-button" onClick={() => onOpenPractice(chapter.practiceIds[0])}>去做配套练习 <ArrowRight size={17} /></button>}</div>
      </article>
    </main>
  </div>
}
