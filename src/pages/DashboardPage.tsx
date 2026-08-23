import { ArrowRight, BarChart3, BookOpen, Check, CircleDot, Clock3, Database, FlaskConical, Sparkles, Target, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { getProblemProgress } from '../services/storage'
import type { LearningChapter, ProgressMap, SqlProblem } from '../types/problem'

interface DashboardPageProps {
  problems: SqlProblem[]
  chapters: LearningChapter[]
  progress: ProgressMap
  activityDays: string[]
  completedLessons: string[]
  onOpen: (id: string) => void
  onReset: () => void
  onNavigateSection: (section: AppSection) => void
}

export function DashboardPage({ problems, chapters, progress, activityDays, completedLessons, onOpen, onReset, onNavigateSection }: DashboardPageProps) {
  const completed = problems.filter((item) => getProblemProgress(progress, item.id).completed).length
  const incorrect = problems.filter((item) => getProblemProgress(progress, item.id).incorrectAttempts > 0).length
  const chapterStats = useMemo(() => chapters.map((chapter) => {
    const related = problems.filter((problem) => problem.chapter.toLowerCase().includes(chapter.title.toLowerCase()) || problem.tags.some((tag) => tag.toLowerCase().includes(chapter.title.toLowerCase())))
    const mastered = related.filter((problem) => getProblemProgress(progress, problem.id).completed).length
    const errors = related.reduce((sum, problem) => sum + getProblemProgress(progress, problem.id).incorrectAttempts, 0)
    return { title: chapter.title, total: related.length, score: related.length ? Math.round(mastered / related.length * 100) : 0, errors }
  }).filter((item) => item.total > 0).sort((a, b) => b.errors - a.errors || a.score - b.score).slice(0, 5), [chapters, problems, progress])
  const recent = problems.filter((problem) => getProblemProgress(progress, problem.id).attempts > 0).sort((a, b) => (getProblemProgress(progress, b.id).lastAttemptAt ?? '').localeCompare(getProblemProgress(progress, a.id).lastAttemptAt ?? '')).slice(0, 3)
  const reset = () => { if (window.confirm('确定重置全部课程、做题记录、错题与 SQL 草稿吗？')) onReset() }

  return <div className="home-page"><AppHeader completed={completed} total={problems.length} onReset={reset} currentSection="dashboard" onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} /><main className="home-main">
    <section className="hero-section"><div className="hero-copy"><div className="hero-pill"><Sparkles size={15} /> DATA TRANSFORMATION LAB</div><h1>看见数据变化，<br /><span>真正学会 SQL。</span></h1><p>为具有 Pandas 基础的数据科学学生设计。从原始表、分组和连接中间表，一直看到最终分析结果。</p><div className="hero-actions"><button className="primary-button" onClick={() => onNavigateSection('learn')}>开始学习路径 <ArrowRight size={17} /></button><button className="secondary-button" onClick={() => onNavigateSection('practice')}>进入练习中心</button></div></div><div className="hero-visual" aria-hidden="true"><div className="query-card query-a"><span>01</span><code>RAW DATA</code></div><div className="query-line line-one" /><div className="query-card query-b"><span>02</span><code>GROUP BY</code></div><div className="query-line line-two" /><div className="query-card query-c"><Check size={17} /><code>INSIGHT</code></div></div></section>
    <section className="stat-grid dashboard-stats"><Stat icon={<Clock3 size={21} />} color="lavender" value={activityDays.length} label="学习天数" /><Stat icon={<Check size={21} />} color="green" value={completed} label="完成题目" /><Stat icon={<BookOpen size={21} />} color="lavender" value={completedLessons.length} label="完成章节" /><Stat icon={<TriangleAlert size={21} />} color="amber" value={incorrect} label="需要复习" /></section>
    <section className="dashboard-section"><div className="section-heading"><div><span className="eyebrow">THREE WAYS TO LEARN</span><h2>选择今天的学习方式</h2></div></div><div className="module-grid"><ModuleCard icon={<BookOpen size={23} />} label="MODULE 1" title="Learning Path" text="11 个渐进章节：理论、Pandas 对照、交互可视化、配套练习。" action="继续课程" onClick={() => onNavigateSection('learn')} color="purple" /><ModuleCard icon={<Database size={23} />} label="MODULE 2" title="Practice Lab" text="20 道数据分析 SQL 题，每题都展示中间表和错误反馈。" action="开始练习" onClick={() => onNavigateSection('practice')} color="green" /><ModuleCard icon={<FlaskConical size={23} />} label="MODULE 3" title="SQL Playground" text="用同一组数据实验 SELECT、WHERE、GROUP、JOIN 和窗口函数。" action="自由实验" onClick={() => onNavigateSection('playground')} color="amber" /></div></section>
    <section className="dashboard-analysis-grid"><div className="dashboard-card knowledge-card"><div className="card-heading"><div><span className="eyebrow">KNOWLEDGE MAP</span><h2>知识点掌握度</h2></div><BarChart3 size={20} /></div>{chapterStats.length ? <div className="knowledge-bars">{chapterStats.map((item) => <div key={item.title}><div><span>{item.title}</span><strong>{item.score}%</strong></div><div className="knowledge-track"><span className={item.score < 40 ? 'weak' : item.score < 75 ? 'learning' : 'mastered'} style={{ width: `${Math.max(item.score, 4)}%` }} /></div></div>)}</div> : <DashboardEmpty icon={<Target size={24} />} text="完成几道练习后，这里会分析你的薄弱知识点。" />}</div><div className="dashboard-card recent-card"><div className="card-heading"><div><span className="eyebrow">RECENT PRACTICE</span><h2>最近练习</h2></div></div>{recent.length ? recent.map((problem) => <button key={problem.id} onClick={() => onOpen(problem.id)}><span className={`recent-status ${getProblemProgress(progress, problem.id).completed ? 'done' : ''}`}>{getProblemProgress(progress, problem.id).completed ? <Check size={16} /> : <CircleDot size={16} />}</span><span><strong>{problem.title}</strong><small>{getProblemProgress(progress, problem.id).incorrectAttempts} 次错误 · {problem.chapter}</small></span><ArrowRight size={17} /></button>) : <DashboardEmpty icon={<Database size={24} />} text="还没有练习记录。选一道题开始吧。" />}</div></section>
  </main><footer>SQL Learning Lab · Learn SQL by understanding data transformation.</footer></div>
}

function Stat({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: number; label: string }) { return <div className="stat-card"><span className={`stat-icon ${color}`}>{icon}</span><div><strong>{value}</strong><span>{label}</span></div></div> }
function ModuleCard({ icon, label, title, text, action, onClick, color }: { icon: React.ReactNode; label: string; title: string; text: string; action: string; onClick: () => void; color: string }) { return <button className={`module-card ${color}`} onClick={onClick}><span className="module-icon">{icon}</span><span className="eyebrow">{label}</span><strong>{title}</strong><p>{text}</p><span className="module-action">{action} <ArrowRight size={17} /></span></button> }
function DashboardEmpty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="dashboard-empty">{icon}<p>{text}</p></div> }
