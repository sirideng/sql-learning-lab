import { ArrowRight, BarChart3, BookOpen, Check, CircleDot, Clock3, Database, Sparkles, Target, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { getProblemProgress } from '../services/storage'
import type { ActivityMap, LearningChapter, ProgressMap, ProjectProgressMap, SqlProblem } from '../types/problem'

interface DashboardPageProps {
  problems: SqlProblem[]
  chapters: LearningChapter[]
  progress: ProgressMap
  activity: ActivityMap
  completedLessons: string[]
  projectProgress: ProjectProgressMap
  onOpen: (id: string) => void
  onReset: () => void
  onNavigateSection: (section: AppSection) => void
}

export function DashboardPage({ problems, chapters, progress, activity, completedLessons, projectProgress, onOpen, onReset, onNavigateSection }: DashboardPageProps) {
  const completed = problems.filter((item) => getProblemProgress(progress, item.id).completed).length
  const incorrect = problems.filter((item) => getProblemProgress(progress, item.id).incorrectAttempts > 0).length
  const knowledgeStats = useMemo(() => buildKnowledgeStats(problems, progress, completedLessons), [completedLessons, problems, progress])
  const recent = problems.filter((problem) => getProblemProgress(progress, problem.id).attempts > 0).sort((a, b) => (getProblemProgress(progress, b.id).lastAttemptAt ?? '').localeCompare(getProblemProgress(progress, a.id).lastAttemptAt ?? '')).slice(0, 3)
  const projectSteps = Object.values(projectProgress).reduce((sum, steps) => sum + steps.length, 0)
  const skillAxes = useMemo(() => buildSkillAxes(problems, progress, completedLessons), [problems, progress, completedLessons])
  const reset = () => { if (window.confirm('确定重置全部课程、做题记录、错题与 SQL 草稿吗？')) onReset() }

  return <div className="home-page"><AppHeader completed={completed} total={problems.length} onReset={reset} currentSection="dashboard" onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} /><main className="home-main">
    <section className="hero-section"><div className="hero-copy"><div className="hero-pill"><Sparkles size={15} /> DATA TRANSFORMATION LAB</div><h1>看见数据变化，<br /><span>真正学会 SQL。</span></h1><p>为具有 Pandas 基础的数据科学学生设计。从原始表、分组和连接中间表，一直看到最终分析结果。</p><div className="hero-actions"><button className="primary-button" onClick={() => onNavigateSection('learn')}>开始学习路径 <ArrowRight size={17} /></button><button className="secondary-button" onClick={() => onNavigateSection('practice')}>进入练习中心</button></div></div><div className="hero-visual" aria-hidden="true"><div className="query-card query-a"><span>01</span><code>RAW DATA</code></div><div className="query-line line-one" /><div className="query-card query-b"><span>02</span><code>GROUP BY</code></div><div className="query-line line-two" /><div className="query-card query-c"><Check size={17} /><code>INSIGHT</code></div></div></section>
    <section className="stat-grid dashboard-stats"><Stat icon={<Clock3 size={21} />} color="lavender" value={Object.keys(activity).length} label="学习天数" /><Stat icon={<Check size={21} />} color="green" value={completed} label="完成题目" /><Stat icon={<BookOpen size={21} />} color="lavender" value={completedLessons.length} label="完成章节" /><Stat icon={<Target size={21} />} color="green" value={projectSteps} label="项目步骤" /><Stat icon={<TriangleAlert size={21} />} color="amber" value={incorrect} label="需要复习" /></section>
    <ActivityHeatmap activity={activity} />
    <section className="dashboard-skill-grid"><div className="dashboard-card radar-card"><div className="card-heading"><div><span className="eyebrow">SQL CAPABILITY RADAR</span><h2>数据分析能力雷达</h2></div><BarChart3 size={20} /></div><SkillRadar axes={skillAxes} /></div><div className="dashboard-card skill-path-card"><div className="card-heading"><div><span className="eyebrow">SKILL TREE</span><h2>从取数走向分析交付</h2></div><Target size={20} /></div><DashboardSkillTree chapters={chapters} completedLessons={completedLessons} /><button className="skill-path-action" onClick={() => onNavigateSection('learn')}>继续提升能力 <ArrowRight size={16} /></button></div></section>
    <section className="dashboard-analysis-grid"><div className="dashboard-card knowledge-card"><div className="card-heading"><div><span className="eyebrow">KNOWLEDGE MAP · 12 SKILLS</span><h2>知识点掌握度</h2><p className="card-subtitle">综合课程完成度与练习正确情况计算</p></div><BarChart3 size={20} /></div><div className="knowledge-bars comprehensive">{knowledgeStats.map((item) => <div className="knowledge-item" key={item.title}><div><span>{item.title}</span><strong>{item.score}%</strong></div><small>{item.detail}</small><div className="knowledge-track"><span className={item.score < 40 ? 'weak' : item.score < 75 ? 'learning' : 'mastered'} style={{ width: `${Math.max(item.score, 4)}%` }} /></div></div>)}</div></div><div className="dashboard-card recent-card"><div className="card-heading"><div><span className="eyebrow">RECENT PRACTICE</span><h2>最近练习</h2></div></div>{recent.length ? recent.map((problem) => <button key={problem.id} onClick={() => onOpen(problem.id)}><span className={`recent-status ${getProblemProgress(progress, problem.id).completed ? 'done' : ''}`}>{getProblemProgress(progress, problem.id).completed ? <Check size={16} /> : <CircleDot size={16} />}</span><span><strong>{problem.title}</strong><small>{getProblemProgress(progress, problem.id).incorrectAttempts} 次错误 · {problem.chapter}</small></span><ArrowRight size={17} /></button>) : <DashboardEmpty icon={<Database size={24} />} text="还没有练习记录。选一道题开始吧。" />}</div></section>
  </main><footer>SQL Learning Lab · Learn SQL by understanding data transformation.</footer></div>
}

function Stat({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: number; label: string }) { return <div className="stat-card"><span className={`stat-icon ${color}`}>{icon}</span><div><strong>{value}</strong><span>{label}</span></div></div> }
function DashboardEmpty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="dashboard-empty">{icon}<p>{text}</p></div> }

function ActivityHeatmap({ activity }: { activity: ActivityMap }) {
  const calendar = useMemo(() => buildActivityCalendar(activity), [activity])
  const columns = { gridTemplateColumns: `repeat(${calendar.weeks.length}, minmax(16px, 26px))` }

  return <section className="dashboard-card activity-card">
    <div className="activity-card-heading"><div><span className="eyebrow">PRACTICE ACTIVITY</span><h2>做题记录</h2><p>最近半年 · 每天提交 SQL 的次数</p></div><div className="activity-summary"><strong>累计提交 {calendar.total} 次</strong><span>{calendar.activeDays} 个活跃日 · 单日峰值 {calendar.peak} 次</span></div></div>
    <div className="activity-heatmap-scroll"><div className="activity-calendar">
      <div className="activity-month-row" style={columns}>{calendar.weeks.map((week, index) => <span key={week[0].key}>{calendar.monthLabels[index]}</span>)}</div>
      <div className="activity-calendar-body"><div className="activity-weekday-labels"><span>一</span><span /><span>三</span><span /><span>五</span><span /><span>日</span></div><div className="activity-weeks" style={columns}>{calendar.weeks.map((week) => <div className="activity-week" key={week[0].key}>{week.map((day) => <span key={day.key} className={`activity-cell level-${day.level} ${day.inRange ? '' : 'outside'}`} title={day.inRange ? `${day.key} · 提交 ${day.count} 次` : undefined} aria-label={day.inRange ? `${day.key}，提交 ${day.count} 次` : undefined} />)}</div>)}</div></div>
    </div></div>
    <div className="activity-legend"><span>相对较少</span>{[0, 1, 2, 3, 4, 5].map((level) => <i className={`activity-cell level-${level}`} key={level} />)}<span>相对较多</span><small>颜色按当前半年峰值动态计算</small></div>
  </section>
}

type ActivityCalendarDay = {
  key: string
  date: Date
  inRange: boolean
  count: number
  level: number
}

function buildActivityCalendar(activity: ActivityMap) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const rangeStart = new Date(today.getFullYear(), today.getMonth() - 5, 1, 12)
  const calendarStart = new Date(rangeStart)
  calendarStart.setDate(calendarStart.getDate() - ((calendarStart.getDay() + 6) % 7))
  const calendarEnd = new Date(today)
  calendarEnd.setDate(calendarEnd.getDate() + (6 - ((calendarEnd.getDay() + 6) % 7)))

  const days: ActivityCalendarDay[] = []
  for (const cursor = new Date(calendarStart); cursor <= calendarEnd; cursor.setDate(cursor.getDate() + 1)) {
    const date = new Date(cursor)
    const key = formatActivityDate(date)
    const inRange = date >= rangeStart && date <= today
    days.push({ key, date, inRange, count: inRange ? activity[key] ?? 0 : 0, level: 0 })
  }
  const peak = Math.max(0, ...days.map((day) => day.count))
  days.forEach((day) => {
    day.level = day.count === 0 || peak === 0 ? 0 : Math.max(1, Math.ceil(day.count / peak * 5))
  })
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7))
  const monthLabels = weeks.map((week) => {
    const firstDay = week.find((day) => day.inRange && day.date.getDate() === 1)
    return firstDay ? `${firstDay.date.getMonth() + 1}月` : ''
  })
  const visibleDays = days.filter((day) => day.inRange)
  return {
    weeks,
    monthLabels,
    peak,
    total: visibleDays.reduce((sum, day) => sum + day.count, 0),
    activeDays: visibleDays.filter((day) => day.count > 0).length,
  }
}

function formatActivityDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function buildKnowledgeStats(problems: SqlProblem[], progress: ProgressMap, completedLessons: string[]) {
  const definitions = [
    { title: '基础查询', tokens: ['select', 'where', 'order by', 'limit', 'distinct'], lessons: ['sql-foundations', 'select', 'where-order'] },
    { title: '聚合与分组', tokens: ['聚合函数', 'group by', 'having', 'aggregate', 'count distinct'], lessons: ['aggregate', 'group-by', 'having'] },
    { title: 'JOIN 多表分析', tokens: ['join', 'left join', 'self join'], lessons: ['join'] },
    { title: '子查询与 CTE', tokens: ['subquery', '子查询', 'cte', 'with'], lessons: ['subquery', 'cte'] },
    { title: 'CASE WHEN', tokens: ['case when'], lessons: ['case-when'] },
    { title: '窗口函数', tokens: ['window function', '窗口函数', 'rank', 'row_number', 'lag', 'sum over', 'avg over', 'count over'], lessons: ['window'] },
    { title: '日期函数', tokens: ['date', 'date_format', 'date_add', 'datediff', 'year', 'month'], lessons: ['date-functions'] },
    { title: '字符串函数', tokens: ['string', 'concat', 'substring', 'replace', 'lower', 'upper', 'length'], lessons: ['string-functions'] },
    { title: '业务分析案例', tokens: ['综合分析', '综合案例', 'analytics', 'retention', 'dau', 'funnel', '复购', '留存'], lessons: ['analytics-project', 'analytics-cases'] },
    { title: 'SQL 性能基础', tokens: [], lessons: ['performance-basics'] },
    { title: 'SQL + Pandas', tokens: [], lessons: ['sql-pandas'] },
    { title: '综合项目实践', tokens: [], lessons: ['project-lab'] },
  ]

  return definitions.map((definition) => {
    const related = problems.filter((problem) => {
      const text = `${problem.title} ${problem.chapter} ${problem.tags.join(' ')}`.toLowerCase()
      return definition.tokens.some((token) => text.includes(token))
    })
    const solved = related.filter((problem) => getProblemProgress(progress, problem.id).completed).length
    const lessonsDone = definition.lessons.filter((id) => completedLessons.includes(id)).length
    const practiceRatio = related.length ? solved / related.length : 0
    const lessonRatio = definition.lessons.length ? lessonsDone / definition.lessons.length : 0
    const score = related.length
      ? Math.round(practiceRatio * (definition.lessons.length ? 75 : 100) + lessonRatio * (definition.lessons.length ? 25 : 0))
      : Math.round(lessonRatio * 100)
    const detail = related.length
      ? `练习 ${solved}/${related.length} · 课程 ${lessonsDone}/${definition.lessons.length}`
      : `课程 ${lessonsDone}/${definition.lessons.length}`
    return { title: definition.title, score, detail }
  })
}

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
