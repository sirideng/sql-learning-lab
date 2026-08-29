import {
  ArrowRight,
  Check,
  CircleDot,
  Search,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { getProblemProgress } from '../services/storage'
import type { Difficulty, LearningLanguage, ProgressMap } from '../types/problem'

interface QuestionListItem {
  id: string
  number: number
  title: string
  source: string
  chapter: string
  difficulty: Difficulty
  tags: string[]
  language?: LearningLanguage
  solution?: string
  explanation?: string
}

interface HomePageProps {
  problems: QuestionListItem[]
  allProblems?: QuestionListItem[]
  progress: ProgressMap
  onOpen: (id: string) => void
  onOpenQuestion?: (problem: QuestionListItem) => void
  onReset: () => void
  libraryOnly?: boolean
  onNavigateSection: (section: AppSection) => void
  languageMode?: 'sql' | 'pandas'
}

const filters = ['全部', '未完成', '已完成', '错题'] as const
const difficultyFilters = ['全部难度', '简单', '中等', '困难'] as const
const PAGE_SIZE = 10
const LIBRARY_VIEW_KEY = 'sql-learning-lab:practice-view:v1'

type PracticeFilter = (typeof filters)[number]
type DifficultyFilter = (typeof difficultyFilters)[number]

interface LibraryViewState {
  filter: PracticeFilter
  search: string
  chapter: string
  difficulty: DifficultyFilter
  page: number
  wrongLanguage: '全部语言' | 'SQL' | 'Pandas'
  knowledge: string
}

function loadLibraryView(chapters: string[]): LibraryViewState {
  const defaults: LibraryViewState = { filter: '全部', search: '', chapter: '全部章节', difficulty: '全部难度', page: 1, wrongLanguage: '全部语言', knowledge: '全部知识点' }
  try {
    const saved = JSON.parse(localStorage.getItem(LIBRARY_VIEW_KEY) ?? '{}') as Partial<LibraryViewState>
    return {
      filter: filters.includes(saved.filter as PracticeFilter) ? saved.filter as PracticeFilter : defaults.filter,
      search: typeof saved.search === 'string' ? saved.search : defaults.search,
      chapter: typeof saved.chapter === 'string' && chapters.includes(saved.chapter) ? saved.chapter : defaults.chapter,
      difficulty: difficultyFilters.includes(saved.difficulty as DifficultyFilter) ? saved.difficulty as DifficultyFilter : defaults.difficulty,
      page: typeof saved.page === 'number' && Number.isInteger(saved.page) && saved.page > 0 ? saved.page : defaults.page,
      wrongLanguage: ['全部语言', 'SQL', 'Pandas'].includes(saved.wrongLanguage ?? '') ? saved.wrongLanguage as LibraryViewState['wrongLanguage'] : defaults.wrongLanguage,
      knowledge: typeof saved.knowledge === 'string' ? saved.knowledge : defaults.knowledge,
    }
  } catch {
    return defaults
  }
}

export function HomePage({ problems, allProblems, progress, onOpen, onOpenQuestion, onReset, libraryOnly = false, onNavigateSection, languageMode = 'sql' }: HomePageProps) {
  const chapters = ['全部章节', ...new Set(problems.map((problem) => problem.chapter))]
  const [initialView] = useState(() => loadLibraryView(chapters))
  const [filter, setFilter] = useState<PracticeFilter>(initialView.filter)
  const [search, setSearch] = useState(initialView.search)
  const [chapter, setChapter] = useState(initialView.chapter)
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(initialView.difficulty)
  const [page, setPage] = useState(initialView.page)
  const [wrongLanguage, setWrongLanguage] = useState(initialView.wrongLanguage)
  const [knowledge, setKnowledge] = useState(initialView.knowledge)
  const libraryRef = useRef<HTMLElement | null>(null)
  const completed = problems.filter((item) => getProblemProgress(progress, item.id).completed).length
  const incorrect = problems.filter((item) => getProblemProgress(progress, item.id).incorrectAttempts > 0).length

  const visibleProblems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const sourceProblems = filter === '错题' && allProblems ? allProblems : problems
    return sourceProblems.filter((problem) => {
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
      const matchesLanguage = filter !== '错题' || wrongLanguage === '全部语言' || (problem.language ?? 'sql') === wrongLanguage.toLowerCase()
      const matchesKnowledge = filter !== '错题' || knowledge === '全部知识点' || normalizeKnowledge(problem.tags) === knowledge
      return matchesFilter && matchesSearch && matchesChapter && matchesDifficulty && matchesLanguage && matchesKnowledge
    })
  }, [allProblems, chapter, difficulty, filter, knowledge, problems, progress, search, wrongLanguage])
  const pageCount = Math.max(1, Math.ceil(visibleProblems.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageProblems = visibleProblems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  useEffect(() => {
    localStorage.setItem(LIBRARY_VIEW_KEY, JSON.stringify({ filter, search, chapter, difficulty, page: currentPage, wrongLanguage, knowledge }))
  }, [chapter, currentPage, difficulty, filter, knowledge, search, wrongLanguage])
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
      <AppHeader completed={completed} total={problems.length} mode={languageMode} onReset={reset} currentSection={libraryOnly ? 'practice' : 'dashboard'} onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} />
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
              {libraryOnly ? <h1>{languageMode === 'sql' ? 'SQL' : 'Pandas'} 数据分析练习</h1> : <h2>题库</h2>}
          {libraryOnly && <p className="section-description">{problems.length} 道题，从基础操作逐步走向用户与商业数据分析。</p>}
            </div>
            <label className="search-box">
              <Search size={17} />
              <input value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} placeholder="搜索题目或标签" />
            </label>
          </div>
          {libraryOnly && <div className="language-local-switch" aria-label="练习语言"><button className={languageMode === 'sql' ? 'active' : ''} onClick={() => { window.location.hash = '/practice' }}>SQL</button><button className={languageMode === 'pandas' ? 'active' : ''} onClick={() => { window.location.hash = '/pandas/practice' }}>Pandas</button></div>}
          <div className="library-controls"><div className="filter-row">
            {filters.map((item) => (
              <button key={item} className={filter === item ? 'active' : ''} onClick={() => { setFilter(item); if (item === '错题') setChapter('全部章节'); resetPage() }}>
                {item}
              </button>
            ))}
          </div><div className="library-selects">
            <select aria-label="按难度筛选" value={difficulty} onChange={(event) => { setDifficulty(event.target.value as (typeof difficultyFilters)[number]); resetPage() }}>
              {difficultyFilters.map((item) => <option key={item}>{item}</option>)}
            </select>
            {filter === '错题' ? <><select aria-label="按语言筛选错题" value={wrongLanguage} onChange={(event) => { setWrongLanguage(event.target.value as LibraryViewState['wrongLanguage']); setChapter('全部章节'); resetPage() }}><option>全部语言</option><option>SQL</option><option>Pandas</option></select><select aria-label="按知识点筛选错题" value={knowledge} onChange={(event) => { setKnowledge(event.target.value); setChapter('全部章节'); resetPage() }}>{['全部知识点', '筛选', '连接 JOIN / merge', '分组 GROUP BY / groupby', '窗口 Window / shift', '日期 Date', '清洗与字符串', '重塑 Pivot'].map((item) => <option key={item}>{item}</option>)}</select></> : <select aria-label="按章节筛选" value={chapter} onChange={(event) => { setChapter(event.target.value); resetPage() }}>{chapters.map((item) => <option key={item}>{item}</option>)}</select>}
          </div></div>

          <div className="problem-list">
            {pageProblems.map((problem) => {
              const item = getProblemProgress(progress, problem.id)
              return (
                <button className="problem-card" key={problem.id} onClick={() => onOpenQuestion ? onOpenQuestion(problem) : onOpen(problem.id)}>
                  <span className="problem-number">{String(problem.number).padStart(2, '0')}</span>
                  <span className="problem-main">
                    <span className="problem-title-row">
                      <strong>{problem.title}</strong>
                      <span className={`language-badge ${problem.language ?? 'sql'}`}>{(problem.language ?? 'sql') === 'pandas' ? 'Pandas' : 'SQL'}</span>
                      <span className={`difficulty ${problem.difficulty}`}>{problem.difficulty}</span>
                    </span>
                    <span className="problem-tags">
                      {problem.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                    </span>
                    {filter === '错题' && <span className="wrong-record-detail">
                      <span className="wrong-record-meta">
                        <strong>错误 {item.incorrectAttempts} 次</strong>
                        <span>{normalizeKnowledge(problem.tags)}</span>
                        <time>{formatAttemptTime(item.lastAttemptAt)}</time>
                      </span>
                      <span className="wrong-code-pair">
                        <span><small>我的代码</small><code>{item.lastIncorrectCode ?? item.lastIncorrectSql ?? '未保存'}</code></span>
                        <span><small>正确代码</small><code>{problem.solution ?? '进入题目查看参考实现'}</code></span>
                      </span>
                      <span className="wrong-reason"><small>错误原因</small>{item.lastErrorReason ?? '运行结果与预期输出不一致，请重新检查转换步骤。'}</span>
                    </span>}
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
      <footer>{languageMode === 'pandas' ? 'Pandas Learning Lab' : 'SQL Learning Lab'} · Built for deliberate practice</footer>
    </div>
  )
}

function normalizeKnowledge(tags: string[]) {
  const text = tags.join(' ').toLowerCase()
  if (/join|merge/.test(text)) return '连接 JOIN / merge'
  if (/group|聚合|sum|avg|mean/.test(text)) return '分组 GROUP BY / groupby'
  if (/window|shift|diff|rank|cumsum|rolling|transform/.test(text)) return '窗口 Window / shift'
  if (/date|日期|month|留存/.test(text)) return '日期 Date'
  if (/string|字符串|clean|清洗|fillna|missing/.test(text)) return '清洗与字符串'
  if (/pivot|melt|重塑/.test(text)) return '重塑 Pivot'
  return '筛选'
}

function formatAttemptTime(value?: string) {
  if (!value) return '暂无时间记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '暂无时间记录'
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}
