import { BarChart3, CheckCircle2, Database, FlaskConical, GraduationCap, RotateCcw } from 'lucide-react'

export type AppSection = 'dashboard' | 'learn' | 'practice' | 'playground'

interface AppHeaderProps {
  completed: number
  total: number
  compact?: boolean
  onHome?: () => void
  onReset?: () => void
  currentSection?: AppSection
  onNavigateSection?: (section: AppSection) => void
}

const navigation = [
  { id: 'dashboard' as const, label: '学习概览', icon: BarChart3 },
  { id: 'learn' as const, label: '学习路径', icon: GraduationCap },
  { id: 'practice' as const, label: '练习中心', icon: Database },
  { id: 'playground' as const, label: 'Playground', icon: FlaskConical },
]

export function AppHeader({ completed, total, compact, onHome, onReset, currentSection, onNavigateSection }: AppHeaderProps) {
  return (
    <header className={`app-header ${compact ? 'compact' : ''}`}>
      <button className="brand" onClick={onHome} aria-label="返回题库首页">
        <span className="brand-mark"><Database size={20} strokeWidth={2.3} /></span>
        <span>
          <strong>SQL Learning Lab</strong>
          {!compact && <small>Visualize the logic.</small>}
        </span>
      </button>
      {onNavigateSection && !compact && (
        <nav className="main-navigation" aria-label="主要导航">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={currentSection === item.id ? 'active' : ''} onClick={() => onNavigateSection(item.id)}>
                <Icon size={16} /> {item.label}
              </button>
            )
          })}
        </nav>
      )}
      <div className="header-actions">
        <div className="header-progress">
          <CheckCircle2 size={16} />
          <span><strong>{completed}</strong> / {total} 已完成</span>
        </div>
        {onReset && (
          <button className="ghost-button reset-button" onClick={onReset} title="重置全部学习记录">
            <RotateCcw size={15} />
            <span>重置进度</span>
          </button>
        )}
      </div>
    </header>
  )
}
