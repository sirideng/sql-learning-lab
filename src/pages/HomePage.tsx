import {
  ArrowRight,
  Check,
  CircleDot,
  Search,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { getProblemProgress } from '../services/storage'
import type { ProgressMap, SqlProblem } from '../types/problem'

interface HomePageProps {
  problems: SqlProblem[]
  progress: ProgressMap
  onOpen: (id: string) => void
  onReset: () => void
  libraryOnly?: boolean
  onNavigateSection: (section: AppSection) => void
}

const filters = ['全部', '未完成', '已完成', '错题'] as const
const difficultyFilters = ['全部难度', '简单', '中等', '困难'] as const
const PAGE_SIZE = 10

export function HomePage({ problems, progress, onOpen, onReset, libraryOnly = false, onNavigateSection }: HomePageProps) {
  const [filter, setFilter] = useState<(typeof filters)[number]>('全部')
  const [search, setSearch] = useState('')
  const [chapter, setChapter] = useState('全部章节')
  const [difficulty, setDifficulty] = useState<(typeof difficultyFilters)[number]>('全部难度')
  const [page, setPage] = useState(1)
  const libraryRef = useRef<HTMLElement | null>(null)
  const chapters = ['全部章节', ...new Set(problems.map((problem) => problem.chapter))]
  const completed = problems.filter((item) => getProblemProgress(progress, item.id).completed).length
  const incorrect = problems.filter((item) => getProblemProgress(progress, item.id).incorrectAttempts > 0).length

  const visibleProblems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return problems.filter((problem) => {
      const item = getProblemProgress(progress, problem.id)
      const matchesFilter = filter === '全部'
        || (filter === '未完成' && !item.completed)
        || (filter === '已完成' && item.completed)
        || (filter === '错题' && item.incorrectAttempts > 0)
      const matchesSearch = !query
        || problem.title.toLowerCase().includes(query)
        || problem.tags.some((tag) => tag.toLowerCase().includes(query))
      const matchesChapter = chapter === '全部章节' || problem.chapter === chapter
      const matchesDifficulty = difficulty === '全部难度' || problem.difficulty === difficulty
      return matchesFilter && matchesSearch && matchesChapter && matchesDifficulty
    })
  }, [chapter, difficulty, filter, problems, progress, search])
  const pageCount = Math.max(1, Math.ceil(visibleProblems.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageProblems = visibleProblems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const changePage = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, pageCount)))
    requestAnimationFrame(() => libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const resetPage = () => setPage(1)

  const reset = () => {
    if (window.confirm('确定重置全部做题记录、错题与 SQL 草稿吗？')) onReset()
  }

  return (
    <div className="home-page">
      <AppHeader completed={completed} total={problems.length} onReset={reset} currentSection={libraryOnly ? 'practice' : 'dashboard'} onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} />
      <main className="home-main">
        {!libraryOnly && <>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-pill"><Sparkles size={14} /> Visual SQL Workspace</div>
            <h1>不只写出 SQL，<br /><span>更要看懂它。</span></h1>
            <p>从原始表到最终答案，把 JOIN、GROUP BY 和窗口函数的每一次数据变化都摊开来看。</p>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="query-card query-a"><span>01</span><code>GROUP BY</code></div>
            <div className="query-line line-one" />
            <div className="query-card query-b"><span>02</span><code>LEFT JOIN</code></div>
            <div className="query-line line-two" />
            <div className="query-card query-c"><Check size={17} /><code>RESULT</code></div>
          </div>
        </section>

        <section className="stat-grid" aria-label="学习进度">
          <div className="stat-card">
            <span className="stat-icon lavender"><Target size={19} /></span>
            <div><strong>{problems.length}</strong><span>经典题目</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon green"><Check size={19} /></span>
            <div><strong>{completed}</strong><span>已经完成</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon amber"><TriangleAlert size={19} /></span>
            <div><strong>{incorrect}</strong><span>需要复习</span></div>
          </div>
          <div className="stat-card progress-stat">
            <div className="progress-meta"><span>总体进度</span><strong>{Math.round((completed / problems.length) * 100)}%</strong></div>
            <div className="progress-track"><span style={{ width: `${(completed / problems.length) * 100}%` }} /></div>
          </div>
        </section>
        </>}

        <section ref={libraryRef} className={`library-section ${libraryOnly ? 'library-only' : ''}`}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">PRACTICE LAB</span>
              <h2>{libraryOnly ? 'SQL 数据分析练习' : '题库'}</h2>
          {libraryOnly && <p className="section-description">{problems.length} 道题，从基础查询逐步走向用户与商业数据分析。</p>}
            </div>
            <label className="search-box">
              <Search size={17} />
              <input value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} placeholder="搜索题目或标签" />
            </label>
          </div>
          <div className="library-controls"><div className="filter-row">
            {filters.map((item) => (
              <button key={item} className={filter === item ? 'active' : ''} onClick={() => { setFilter(item); resetPage() }}>
                {item}
              </button>
            ))}
          </div><div className="library-selects">
            <select aria-label="按难度筛选" value={difficulty} onChange={(event) => { setDifficulty(event.target.value as (typeof difficultyFilters)[number]); resetPage() }}>
              {difficultyFilters.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select aria-label="按章节筛选" value={chapter} onChange={(event) => { setChapter(event.target.value); resetPage() }}>{chapters.map((item) => <option key={item}>{item}</option>)}</select>
          </div></div>

          <div className="problem-list">
            {pageProblems.map((problem) => {
              const item = getProblemProgress(progress, problem.id)
              return (
                <button className="problem-card" key={problem.id} onClick={() => onOpen(problem.id)}>
                  <span className="problem-number">{String(problem.number).padStart(2, '0')}</span>
                  <span className="problem-main">
                    <span className="problem-title-row">
                      <strong>{problem.title}</strong>
                      <span className={`difficulty ${problem.difficulty}`}>{problem.difficulty}</span>
                      <span className="problem-source">{problem.source}</span>
                    </span>
                    <span className="problem-tags">
                      {problem.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </span>
                  </span>
                  <span className={`completion-state ${item.completed ? 'done' : ''}`}>
                    {item.completed ? <Check size={16} /> : <CircleDot size={16} />}
                    {item.completed ? '已完成' : item.attempts > 0 ? '继续练习' : '开始练习'}
                  </span>
                  <ArrowRight className="problem-arrow" size={19} />
                </button>
              )
            })}
            {visibleProblems.length === 0 && (
              <div className="empty-list"><Search size={22} /><p>没有找到匹配的题目</p></div>
            )}
          </div>
          {visibleProblems.length > 0 && <nav className="practice-pagination" aria-label="练习题翻页">
            <span className="pagination-summary">第 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visibleProblems.length)} 题，共 {visibleProblems.length} 题</span>
            <div>
              <button className="pagination-direction" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>上一页</button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button aria-current={number === currentPage ? 'page' : undefined} className={number === currentPage ? 'active' : ''} onClick={() => changePage(number)} key={number}>{number}</button>)}
              <button className="pagination-direction" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>下一页</button>
            </div>
          </nav>}
        </section>
      </main>
      <footer>SQL Learning Lab · Built for deliberate practice</footer>
    </div>
  )
}
