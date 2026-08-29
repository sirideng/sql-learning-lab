import { BarChart3, CheckCircle2, Clock3, Target, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { getProblemProgress } from '../services/storage'
import type { ActivityMap, MatplotlibQuestion, PandasQuestion, ProgressMap, SqlProblem } from '../types/problem'

interface Props { problems: SqlProblem[]; pandasProblems: PandasQuestion[]; matplotlibProblems: MatplotlibQuestion[]; progress: ProgressMap; activity: ActivityMap; completedLessons: string[]; onNavigateSection: (section: AppSection) => void }

const skills = [
  ['基础查询', /select|where|order|limit|筛选/i], ['聚合分析', /group|having|sum|avg|count|聚合/i], ['表连接', /join|merge|连接/i],
  ['日期与清洗', /date|日期|string|清洗|missing/i], ['窗口分析', /window|over|rank|shift|diff/i], ['业务分析', /留存|用户|销售|analysis|分析/i],
  ['可视化交付', /matplotlib|plot|bar|hist|scatter|可视化/i],
] as const

export function LearningReportPage({ problems, pandasProblems, matplotlibProblems, progress, activity, completedLessons, onNavigateSection }: Props) {
  const all = [...problems, ...pandasProblems, ...matplotlibProblems]
  const completed = all.filter((item) => getProblemProgress(progress, item.id).completed).length
  const wrong = all.filter((item) => getProblemProgress(progress, item.id).incorrectAttempts > 0).length
  const attempted = all.filter((item) => getProblemProgress(progress, item.id).attempts > 0).length
  const hasLearningData = attempted > 0 || completedLessons.length > 0 || Object.keys(activity).length > 0
  const mastery = skills.map(([title, pattern]) => { const related = all.filter((item) => pattern.test(`${item.title} ${item.chapter} ${item.tags.join(' ')}`)); const done = related.filter((item) => getProblemProgress(progress, item.id).completed).length; return { title, score: related.length ? Math.round(done / related.length * 100) : 0, done, total: related.length } }).filter((item) => item.done > 0 || attempted > 0)
  return <div className="home-page atlas-page"><AppHeader completed={completed} total={all.length} currentSection="report" onHome={() => onNavigateSection('dashboard')} onNavigateSection={onNavigateSection} /><main className="home-main atlas-main report-page">
    <header className="page-title"><span className="eyebrow">LEARNING REPORT</span><h1>学习报告</h1><p>只展示已经产生的数据，帮助你决定下一步练什么。</p></header>
    {!hasLearningData ? <Empty title="还没有练习记录" text="完成一次练习后，这里会生成学习活动、掌握度和待复习内容。" action="去练习" onClick={() => onNavigateSection('practice')} /> : <>
      <section className="report-stats"><Stat icon={<CheckCircle2 />} value={completed} label="完成题目" /><Stat icon={<Clock3 />} value={Object.keys(activity).length} label="活跃天数" /><Stat icon={<Target />} value={completedLessons.length} label="完成章节" /><Stat icon={<TriangleAlert />} value={wrong} label="需要复习" /></section>
      {Object.keys(activity).length > 0 && <ActivityHeatmap activity={activity} />}
      {mastery.length > 0 && <section className="report-card"><div className="section-heading"><div><span className="eyebrow">KNOWLEDGE MAP</span><h2>知识点掌握度</h2></div><BarChart3 size={20} /></div><div className="report-mastery">{mastery.map((item) => <div key={item.title}><div><span>{item.title}</span><small>{item.done}/{item.total}</small><strong>{item.score}%</strong></div><i><b style={{ width: `${item.score}%` }} /></i></div>)}</div></section>}
    </>}
  </main></div>
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) { return <article><i>{icon}</i><strong>{value}</strong><span>{label}</span></article> }
function Empty({ title, text, action, onClick }: { title: string; text: string; action: string; onClick: () => void }) { return <section className="report-card report-empty"><strong>{title}</strong><p>{text}</p><button className="secondary-button" onClick={onClick}>{action}</button></section> }

function ActivityHeatmap({ activity }: { activity: ActivityMap }) {
  const days = useMemo(() => { const end = new Date(); end.setHours(12,0,0,0); const start = new Date(end); start.setDate(start.getDate() - 181); const result = []; for (let i=0;i<182;i++){ const date=new Date(start); date.setDate(start.getDate()+i); const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; result.push({key,count:activity[key] ?? 0,month:date.getDate()===1 ? `${date.getMonth()+1}月` : ''}) } const peak=Math.max(1,...result.map(x=>x.count)); return { result, peak } }, [activity])
  return <section className="report-card compact-heatmap"><div className="section-heading"><div><span className="eyebrow">PRACTICE ACTIVITY</span><h2>最近半年做题记录</h2><p>颜色按这半年单日峰值动态计算。</p></div><strong>累计提交 {days.result.reduce((sum,d)=>sum+d.count,0)} 次</strong></div><div className="heatmap-grid">{days.result.map((day) => <span key={day.key} title={`${day.key} · ${day.count} 次`} style={{ '--heat': day.count ? Math.max(.18, day.count / days.peak) : 0 } as React.CSSProperties} />)}</div><div className="heatmap-legend"><span>相对较少</span>{[0,.2,.4,.6,.8,1].map((x)=><i key={x} style={{ '--heat':x } as React.CSSProperties} />)}<span>相对较多</span></div></section>
}
