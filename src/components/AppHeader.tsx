import { BarChart3, BookOpenCheck, CheckCircle2, Code2, Database, FlaskConical, FolderKanban, RotateCcw } from 'lucide-react'

export type AppSection = 'dashboard' | 'learn' | 'practice' | 'compare' | 'projects' | 'playground' | 'report'
export type LearningMode = 'sql' | 'pandas' | 'compare'

interface AppHeaderProps {
  completed: number
  total: number
  compact?: boolean
  onHome?: () => void
  onReset?: () => void
  currentSection?: AppSection
  onNavigateSection?: (section: AppSection) => void
  mode?: LearningMode
}

const navigation = [
  { id: 'learn' as const, label: '学习地图', icon: BookOpenCheck },
  { id: 'practice' as const, label: '练习中心', icon: Database },
  { id: 'compare' as const, label: '双语对照', icon: Code2 },
  { id: 'projects' as const, label: '项目案例', icon: FolderKanban },
  { id: 'playground' as const, label: '自由实验', icon: FlaskConical },
]

export function AppHeader({ completed, total, compact, onHome, onReset, currentSection, onNavigateSection, mode }: AppHeaderProps) {
  const route = window.location.hash.toLowerCase()
  const effectiveMode: LearningMode = mode ?? (route.includes('pandas') ? 'pandas' : ['dashboard', 'compare', 'projects', 'report'].some((item) => route.includes(item)) ? 'compare' : 'sql')
  const brand = { title: 'Data Learning Lab', subtitle: 'SQL + Pandas workspace' }
  const navigate = (section: AppSection) => {
    if (onNavigateSection) onNavigateSection(section)
    else window.location.assign(`#/${section}`)
  }

  const brandMark = <span className={`brand-mark brand-mark-${effectiveMode}`} aria-hidden="true"><b>D</b></span>
  if (compact) return <header className="app-header compact"><button className="brand" onClick={onHome} aria-label="返回练习中心">{brandMark}<strong>{brand.title}</strong></button><div className="header-actions"><div className="header-progress"><CheckCircle2 size={16} /><span><strong>{completed}</strong> / {total}</span></div></div></header>

  return <>
    <aside className="app-sidebar" aria-label="网站导航">
      <button className="sidebar-brand" onClick={onHome} aria-label="返回首页">{brandMark}<span><strong>{brand.title}</strong><small>{brand.subtitle}</small></span></button>
      <nav className="sidebar-navigation" aria-label="主要导航">{navigation.map((item) => { const Icon = item.icon; const active = currentSection === item.id; return <button key={item.id} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon size={18} /><span>{item.label}</span></button> })}</nav>
      <div className="sidebar-footer"><button className={currentSection === 'report' ? 'active' : ''} aria-current={currentSection === 'report' ? 'page' : undefined} onClick={() => navigate('report')}><BarChart3 size={18} /><span>学习报告</span></button><div className="sidebar-progress"><span>{completed} / {total} 题完成</span><i><b style={{ width: `${total ? Math.round(completed / total * 100) : 0}%` }} /></i></div>{onReset && <button className="sidebar-reset" onClick={onReset}><RotateCcw size={15} />重置进度</button>}</div>
    </aside>
    <header className="mobile-app-bar"><button className="mobile-brand" onClick={onHome}>{brandMark}<strong>{brand.title}</strong></button><button onClick={() => navigate('report')} aria-label="打开学习报告"><BarChart3 size={19} /></button></header>
    <nav className="mobile-bottom-nav" aria-label="移动端主要导航">{navigation.map((item) => { const Icon = item.icon; const active = currentSection === item.id; return <button key={item.id} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon size={18} /><span>{item.label}</span></button> })}</nav>
  </>
}
