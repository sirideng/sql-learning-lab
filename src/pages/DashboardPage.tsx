import { ArrowRight, BarChart3, BookOpen, Check, CircleDot, Clock3, Database, FlaskConical, Sparkles, Target, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { getProblemProgress } from '../services/storage'
import type { LearningChapter, ProgressMap, ProjectProgressMap, SqlProblem } from '../types/problem'

interface DashboardPageProps {
  problems: SqlProblem[]
  chapters: LearningChapter[]
  progress: ProgressMap
  activityDays: string[]
  completedLessons: string[]
  projectProgress: ProjectProgressMap
  onOpen: (id: string) => void
  onReset: () => void
  onNavigateSection: (section: AppSection) => void
}

export function DashboardPage({ problems, chapters, progress, activityDays, completedLessons, projectProgress, onOpen, onReset, onNavigateSection }: DashboardPageProps) {
  const completed = problems.filter((item) => getProblemProgress(progress, item.id).completed).length
  const incorrect = problems.filter((item) => getProblemProgress(progress, item.id).incorrectAttempts > 0).length
  const chapterStats = useMemo(() => chapters.map((chapter) => {
    const related = problems.filter((problem) => problem.chapter.toLowerCase().includes(chapter.title.toLowerCase()) || problem.tags.some((tag) => tag.toLowerCase().includes(chapter.title.toLowerCase())))
    const mastered = related.filter((problem) => getProblemProgress(progress, problem.id).completed).length
    const errors = related.reduce((sum, problem) => sum + getProblemProgress(progress, problem.id).incorrectAttempts, 0)
    return { title: chapter.title, total: related.length, score: related.length ? Math.round(mastered / related.length * 100) : 0, errors }
  }).filter((item) => item.total > 0).sort((a, b) => b.errors - a.errors || a.score - b.score).slice(0, 5), [chapters, problems, progress])
  const recent = problems.filter((problem) => getProblemProgress(progress, problem.id).attempts > 0).sort((a, b) => (getProblemProgress(progress, b.id).lastAttemptAt ?? '').localeCompare(getProblemProgress(progress, a.id).lastAttemptAt ?? '')).slice(0, 3)
  const projectSteps = Object.values(projectProgress).reduce((sum, steps) => sum + steps.length, 0)
  const skillAxes = useMemo(() => buildSkillAxes(problems, progress, completedLessons), [problems, progress, completedLessons])
  const reset = () => { if (window.confirm('确定重置全部课程、做题记录、错题与 SQL 草稿吗？')) onReset() }

  return <div className="home-page"><AppHeader completed={completed} total={problems.length} onReset={reset} currentSection="dashboard" onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} /><main className="home-main">
    <section className="hero-section"><div className="hero-copy"><div className="hero-pill"><Sparkles size={15} /> DATA TRANSFORMATION LAB</div><h1>看见数据变化，<br /><span>真正学会 SQL。</span></h1><p>为具有 Pandas 基础的数据科学学生设计。从原始表、分组和连接中间表，一直看到最终分析结果。</p><div className="hero-actions"><button className="primary-button" onClick={() => onNavigateSection('learn')}>开始学习路径 <ArrowRight size={17} /></button><button className="secondary-button" onClick={() => onNavigateSection('practice')}>进入练习中心</button></div></div><div className="hero-visual" aria-hidden="true"><div className="query-card query-a"><span>01</span><code>RAW DATA</code></div><div className="query-line line-one" /><div className="query-card query-b"><span>02</span><code>GROUP BY</code></div><div className="query-line line-two" /><div className="query-card query-c"><Check size={17} /><code>INSIGHT</code></div></div></section>
    <section className="stat-grid dashboard-stats"><Stat icon={<Clock3 size={21} />} color="lavender" value={activityDays.length} label="学习天数" /><Stat icon={<Check size={21} />} color="green" value={completed} label="完成题目" /><Stat icon={<BookOpen size={21} />} color="lavender" value={completedLessons.length} label="完成章节" /><Stat icon={<Target size={21} />} color="green" value={projectSteps} label="项目步骤" /><Stat icon={<TriangleAlert size={21} />} color="amber" value={incorrect} label="需要复习" /></section>
    <section className="dashboard-section"><div className="section-heading"><div><span className="eyebrow">THREE WAYS TO LEARN</span><h2>选择今天的学习方式</h2></div></div><div className="module-grid"><ModuleCard icon={<BookOpen size={23} />} label="MODULE 1" title="Learning Path" text={`${chapters.length} 个渐进章节：场景、执行中间表、SQL/Pandas 对照与项目实践。`} action="继续课程" onClick={() => onNavigateSection('learn')} color="purple" /><ModuleCard icon={<Database size={23} />} label="MODULE 2" title="Practice Lab" text={`${problems.length} 道数据分析 SQL 题，每题都展示预期输出和错误反馈。`} action="开始练习" onClick={() => onNavigateSection('practice')} color="green" /><ModuleCard icon={<FlaskConical size={23} />} label="MODULE 3" title="SQL Playground" text="用同一组数据实验 SELECT、WHERE、GROUP、JOIN 和窗口函数。" action="自由实验" onClick={() => onNavigateSection('playground')} color="amber" /></div></section>
    <section className="dashboard-skill-grid"><div className="dashboard-card radar-card"><div className="card-heading"><div><span className="eyebrow">SQL CAPABILITY RADAR</span><h2>数据分析能力雷达</h2></div><BarChart3 size={20} /></div><SkillRadar axes={skillAxes} /></div><div className="dashboard-card skill-path-card"><div className="card-heading"><div><span className="eyebrow">SKILL TREE</span><h2>从取数走向分析交付</h2></div><Target size={20} /></div><DashboardSkillTree chapters={chapters} completedLessons={completedLessons} /><button className="skill-path-action" onClick={() => onNavigateSection('learn')}>继续提升能力 <ArrowRight size={16} /></button></div></section>
    <section className="dashboard-analysis-grid"><div className="dashboard-card knowledge-card"><div className="card-heading"><div><span className="eyebrow">KNOWLEDGE MAP</span><h2>知识点掌握度</h2></div><BarChart3 size={20} /></div>{chapterStats.length ? <div className="knowledge-bars">{chapterStats.map((item) => <div key={item.title}><div><span>{item.title}</span><strong>{item.score}%</strong></div><div className="knowledge-track"><span className={item.score < 40 ? 'weak' : item.score < 75 ? 'learning' : 'mastered'} style={{ width: `${Math.max(item.score, 4)}%` }} /></div></div>)}</div> : <DashboardEmpty icon={<Target size={24} />} text="完成几道练习后，这里会分析你的薄弱知识点。" />}</div><div className="dashboard-card recent-card"><div className="card-heading"><div><span className="eyebrow">RECENT PRACTICE</span><h2>最近练习</h2></div></div>{recent.length ? recent.map((problem) => <button key={problem.id} onClick={() => onOpen(problem.id)}><span className={`recent-status ${getProblemProgress(progress, problem.id).completed ? 'done' : ''}`}>{getProblemProgress(progress, problem.id).completed ? <Check size={16} /> : <CircleDot size={16} />}</span><span><strong>{problem.title}</strong><small>{getProblemProgress(progress, problem.id).incorrectAttempts} 次错误 · {problem.chapter}</small></span><ArrowRight size={17} /></button>) : <DashboardEmpty icon={<Database size={24} />} text="还没有练习记录。选一道题开始吧。" />}</div></section>
  </main><footer>SQL Learning Lab · Learn SQL by understanding data transformation.</footer></div>
}

function Stat({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: number; label: string }) { return <div className="stat-card"><span className={`stat-icon ${color}`}>{icon}</span><div><strong>{value}</strong><span>{label}</span></div></div> }
function ModuleCard({ icon, label, title, text, action, onClick, color }: { icon: React.ReactNode; label: string; title: string; text: string; action: string; onClick: () => void; color: string }) { return <button className={`module-card ${color}`} onClick={onClick}><span className="module-icon">{icon}</span><span className="eyebrow">{label}</span><strong>{title}</strong><p>{text}</p><span className="module-action">{action} <ArrowRight size={17} /></span></button> }
function DashboardEmpty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="dashboard-empty">{icon}<p>{text}</p></div> }

type SkillAxis = { label: string; score: number }

function buildSkillAxes(problems: SqlProblem[], progress: ProgressMap, completedLessons: string[]): SkillAxis[] {
  const definitions = [
    { label: 'SELECT', tokens: ['select', 'where', 'order by', 'limit', 'distinct'], lessons: ['select-foundation', 'where-filter'] },
    { label: 'JOIN', tokens: ['join', 'left join', 'self join'], lessons: ['join'] },
    { label: 'GROUP BY', tokens: ['group by', 'having', 'aggregate', 'count distinct'], lessons: ['aggregate', 'group-by', 'having'] },
    { label: 'Window', tokens: ['window function', 'rank', 'row_number', 'over'], lessons: ['window-functions'] },
    { label: '清洗', tokens: ['case when', 'string', 'date', 'clean'], lessons: ['case-when', 'date-functions', 'string-functions'] },
    { label: 'Analytics', tokens: ['retention', 'dau', 'funnel', 'analytics', 'cte', '复购', '留存'], lessons: ['cte', 'analytics-cases', 'project-lab'] },
  ]
  return definitions.map((definition) => {
    const related = problems.filter((problem) => {
      const text = `${problem.title} ${problem.chapter} ${problem.tags.join(' ')}`.toLowerCase()
      return definition.tokens.some((token) => text.includes(token))
    })
    const solvedScore = related.length ? related.filter((problem) => getProblemProgress(progress, problem.id).completed).length / related.length * 75 : 0
    const lessonScore = definition.lessons.filter((id) => completedLessons.includes(id)).length / definition.lessons.length * 25
    return { label: definition.label, score: Math.round(Math.min(100, solvedScore + lessonScore)) }
  })
}

function SkillRadar({ axes }: { axes: SkillAxis[] }) {
  const center = 150
  const radius = 96
  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / axes.length
    const distance = radius * value / 100
    return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance]
  }
  const polygon = (value: number) => axes.map((_, index) => point(index, value).join(',')).join(' ')
  const values = axes.map((axis, index) => point(index, Math.max(axis.score, 4)).join(',')).join(' ')
  return <div className="skill-radar"><svg viewBox="0 0 300 300" role="img" aria-label="六维 SQL 能力雷达图">{[25, 50, 75, 100].map((value) => <polygon key={value} points={polygon(value)} className="radar-grid" />)}{axes.map((axis, index) => { const [x, y] = point(index, 100); return <line key={axis.label} x1={center} y1={center} x2={x} y2={y} className="radar-axis" /> })}<polygon points={values} className="radar-value" />{axes.map((axis, index) => { const [x, y] = point(index, axis.score); return <circle key={axis.label} cx={x} cy={y} r="4" className="radar-dot" /> })}</svg><div className="radar-labels">{axes.map((axis, index) => <span key={axis.label} className={`radar-label label-${index}`}><strong>{axis.label}</strong><small>{axis.score}%</small></span>)}</div></div>
}

function DashboardSkillTree({ chapters, completedLessons }: { chapters: LearningChapter[]; completedLessons: string[] }) {
  const levels = [
    { title: '取数基础', description: 'SELECT · WHERE · 聚合', range: [1, 6] },
    { title: '分析核心', description: 'JOIN · 窗口 · 日期 · CTE', range: [7, 14] },
    { title: '业务交付', description: '案例 · 性能 · Pandas · 项目', range: [15, 18] },
  ]
  return <div className="dashboard-skill-tree">{levels.map((level, index) => {
    const branch = chapters.filter((chapter) => chapter.order >= level.range[0] && chapter.order <= level.range[1])
    const done = branch.filter((chapter) => completedLessons.includes(chapter.id)).length
    const percent = branch.length ? Math.round(done / branch.length * 100) : 0
    return <div key={level.title}><span className={`skill-tree-node ${percent === 100 ? 'complete' : ''}`}>{percent === 100 ? <Check size={17} /> : index + 1}</span><div><p><strong>{level.title}</strong><span>{done}/{branch.length}</span></p><small>{level.description}</small><i><span style={{ width: `${percent}%` }} /></i></div></div>
  })}</div>
}
