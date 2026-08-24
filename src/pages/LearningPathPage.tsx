import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Braces,
  CheckCircle2,
  Circle,
  Code2,
  Layers3,
  Lightbulb,
  ListChecks,
  PenLine,
  Table2,
  Workflow,
} from 'lucide-react'
import { useState } from 'react'
import { AppHeader, type AppSection } from '../components/AppHeader'
import { AnalyticsCaseStudies, ExecutionOrderVisualizer, ProjectLabModule, SqlExampleGallery, SqlPandasComparisonLab } from '../components/AdvancedLearningModules'
import { CodeBlock } from '../components/CodeBlock'
import { ConceptVisualizer } from '../components/ConceptVisualizer'
import { DataTableView } from '../components/DataTableView'
import visualStepSql from '../data/visualStepSql.json'
import type { LearningChapter, ProjectProgressMap } from '../types/problem'

interface LearningPathPageProps {
  chapters: LearningChapter[]
  completedLessons: string[]
  completedProblems: number
  totalProblems: number
  initialChapter?: string | null
  projectProgress: ProjectProgressMap
  onNavigateSection: (section: AppSection) => void
  onToggleLesson: (id: string) => void
  onToggleProjectStep: (projectId: string, stepId: string) => void
  onOpenPractice: (id: string) => void
}

export function LearningPathPage({ chapters, completedLessons, completedProblems, totalProblems, initialChapter, projectProgress, onNavigateSection, onToggleLesson, onToggleProjectStep, onOpenPractice }: LearningPathPageProps) {
  const [selectedId, setSelectedId] = useState(initialChapter ?? chapters[0].id)
  const chapter = chapters.find((item) => item.id === selectedId) ?? chapters[0]
  const lesson = chapter.deepDive
  const isComplete = completedLessons.includes(chapter.id)

  return <div className="learning-page">
    <AppHeader completed={completedProblems} total={totalProblems} currentSection="learn" onNavigateSection={onNavigateSection} onHome={() => onNavigateSection('dashboard')} />
    <main className="learning-layout">
      <aside className="chapter-sidebar">
        <div className="chapter-sidebar-heading"><span className="eyebrow">LEARNING PATH</span><h1>SQL 数据分析路径</h1><p>{completedLessons.length} / {chapters.length} 章节完成</p></div>
        <div className="chapter-list">{chapters.map((item) => <button key={item.id} className={item.id === chapter.id ? 'active' : ''} onClick={() => { setSelectedId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><span className={`chapter-status ${completedLessons.includes(item.id) ? 'complete' : ''}`}>{completedLessons.includes(item.id) ? <CheckCircle2 size={18} /> : <span>{String(item.order).padStart(2, '0')}</span>}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span></button>)}</div>
        <SkillTree chapters={chapters} completedLessons={completedLessons} />
      </aside>

      <article className="lesson-content" key={chapter.id}>
        <div className="lesson-hero"><div><span className="lesson-number">CHAPTER {String(chapter.order).padStart(2, '0')}</span><h2>{chapter.title}</h2><p>{chapter.description}</p></div><BookOpen size={42} /></div>

        <LessonSection number="01" icon={<Lightbulb size={19} />} title="为什么需要这个知识点">
          <div className="lesson-scenario-card">
            <span className="lesson-mini-label">真实数据分析场景</span>
            <p>{lesson.why.scenario}</p>
            <div className="scenario-question"><strong>要解决的问题</strong><span>{lesson.why.question}</span></div>
            <div className="scenario-reason"><strong>为什么需要 {chapter.title}</strong><span>{lesson.why.reason}</span></div>
          </div>
        </LessonSection>

        <LessonSection number="02" icon={<Layers3 size={19} />} title="核心概念">
          <div className="deep-concept-grid">{lesson.coreConcepts.map((concept) => <article key={concept.title} className="deep-concept-card"><h4>{concept.title}</h4><DefinitionRow label="是什么" value={concept.what} /><DefinitionRow label="解决什么" value={concept.solves} /><DefinitionRow label="什么时候用" value={concept.when} /></article>)}</div>
        </LessonSection>

        <LessonSection number="03" icon={<Table2 size={19} />} title="数据表演示">
          <p className="lesson-section-intro">先确认原始数据的字段和粒度。后面的每一步都由这些真实小表转换而来。</p>
          <div className={`lesson-source-tables ${lesson.demo.originalTables.length > 1 ? 'multiple' : ''}`}>{lesson.demo.originalTables.map((table) => <DataTableView table={table} key={table.name} />)}</div>
        </LessonSection>

        <LessonSection number="04" icon={<Workflow size={19} />} title="SQL 执行过程可视化" className="visual-lesson-section deep-visual-section">
          <ConceptVisualizer type={chapter.visualType} />
          {lesson.sqlExamples && <SqlExampleGallery examples={lesson.sqlExamples} />}
          <div className="execution-step-list">{lesson.demo.steps.map((step, index) => {
            const chapterStepSql = visualStepSql[chapter.id as keyof typeof visualStepSql]
            const sql = chapterStepSql?.[index] ?? chapter.sqlExample
            return <div className="execution-step-wrap" key={step.title}>{index > 0 && <div className="execution-flow-arrow"><ArrowDown size={20} /></div>}<article className="execution-step-card"><div className="execution-step-heading"><span>{String(index + 1).padStart(2, '0')}</span><div><small>EXECUTION STEP</small><h4>{step.title}</h4></div></div><p>{step.description}</p><div className="execution-step-code"><div className="execution-step-code-label"><Code2 size={17} /><span>本步执行 SQL</span><small>下方中间表由这段代码产生</small></div><CodeBlock code={sql} tables={lesson.demo.originalTables} language="sql" /></div><DataTableView table={step.table} /></article></div>
          })}</div>
          <div className="lesson-final-result"><div><CheckCircle2 size={20} /><span><strong>最终结果表</strong><small>检查字段、粒度和每个结果值</small></span></div><DataTableView table={lesson.demo.finalTable} /></div>
          {lesson.executionOrder && <ExecutionOrderVisualizer stages={lesson.executionOrder} />}
          {lesson.caseStudies && <AnalyticsCaseStudies cases={lesson.caseStudies} />}
          {lesson.comparisonPairs && <SqlPandasComparisonLab pairs={lesson.comparisonPairs} />}
          {lesson.projectLab && <ProjectLabModule project={lesson.projectLab} completedSteps={projectProgress[lesson.projectLab.id] ?? []} onToggle={(stepId) => onToggleProjectStep(lesson.projectLab!.id, stepId)} />}
        </LessonSection>

        <LessonSection number="05" icon={<AlertTriangle size={19} />} title="常见错误">
          <div className="mistake-grid">{lesson.commonMistakes.map((mistake, index) => <article className="mistake-card" key={mistake.title}><div className="mistake-heading"><span>{index + 1}</span><h4>{mistake.title}</h4></div><CodeBlock code={mistake.wrongSql} /><p><strong>为什么错：</strong>{mistake.problem}</p><p className="mistake-fix"><strong>如何修正：</strong>{mistake.fix}</p></article>)}</div>
        </LessonSection>

        <LessonSection number="06" icon={<Braces size={19} />} title="SQL 与 Pandas 对应">
          <div className="comparison-grid"><article><span className="comparison-label sql">SQL</span><CodeBlock code={lesson.pandasComparison.sql} language="sql" /></article><article><span className="comparison-label pandas">Pandas</span><CodeBlock code={lesson.pandasComparison.pandas} language="python" /></article></div>
          <div className="comparison-note"><Braces size={18} /><p>{lesson.pandasComparison.explanation}</p></div>
        </LessonSection>

        <LessonSection number="07" icon={<PenLine size={19} />} title="章节小练习">
          <p className="lesson-section-intro">先在脑中写出查询步骤，再展开数据、预期输出和参考解法。新增进阶章节固定包含 2 道 Easy 与 3 道 Medium。</p>
          <div className="chapter-exercise-list">{lesson.exercises.map((exercise, index) => <details key={`${exercise.level}-${exercise.question}`}><summary><span className={`exercise-level ${exercise.level}`}>{exercise.difficulty ?? exercise.level}</span><strong>{index + 1}. {exercise.question}</strong><span className="exercise-reveal">展开练习</span></summary><div className={`exercise-answer ${exercise.tables ? 'rich' : ''}`}>
            {exercise.tables ? <><div className={`lesson-source-tables ${exercise.tables.length > 1 ? 'multiple' : ''}`}>{exercise.tables.map((table) => <DataTableView table={table} key={table.name} />)}</div><div className="exercise-guidance"><div><span>HINT</span>{exercise.hints?.map((hint) => <p key={hint}>{hint}</p>)}</div><div><span>错误提示</span>{exercise.errorTips?.map((tip) => <p key={tip}>{tip}</p>)}</div></div>{exercise.expectedResult && <div className="exercise-expected"><strong>预期输出</strong><DataTableView table={exercise.expectedResult} /></div>}<div className="exercise-solution"><span>参考 SQL</span><CodeBlock code={exercise.solution ?? exercise.answer} /></div></> : <><span>参考答案</span><p>{exercise.answer}</p></>}
          </div></details>)}</div>
          {chapter.practiceIds.length > 0 && <div className="related-practice"><div><strong>进入真实 SQL 环境继续练习</strong><span>课程理解后，用完整题目检查能否独立写出结果。</span></div><div>{chapter.practiceIds.slice(0, 3).map((id, index) => <button key={id} onClick={() => onOpenPractice(id)}>配套题 {index + 1}<ArrowRight size={15} /></button>)}</div></div>}
        </LessonSection>

        <LessonSection number="08" icon={<ListChecks size={19} />} title="学完检查" className="chapter-check-section">
          <p className="lesson-section-intro">当下面每一项都能独立完成时，再把本章标记为已学会。</p>
          <div className="chapter-checklist">{lesson.checklist.map((item) => <label key={item}><input type="checkbox" /><span className="check-box"><CheckCircle2 size={16} /></span><span>{item}</span></label>)}</div>
        </LessonSection>

        <div className="lesson-actions"><button className={`lesson-complete-button ${isComplete ? 'complete' : ''}`} onClick={() => onToggleLesson(chapter.id)}>{isComplete ? <CheckCircle2 size={18} /> : <Circle size={18} />}{isComplete ? '本章已完成' : '标记为已学会'}</button>{chapter.practiceIds[0] && <button className="primary-button" onClick={() => onOpenPractice(chapter.practiceIds[0])}>去做配套练习 <ArrowRight size={17} /></button>}</div>
      </article>
    </main>
  </div>
}

function LessonSection({ number, icon, title, className = '', children }: { number: string; icon: React.ReactNode; title: string; className?: string; children: React.ReactNode }) {
  return <section className={`lesson-section deep-lesson-section ${className}`}><div className="lesson-section-title deep-section-title"><span className="deep-section-number">{number}</span><span className="deep-section-icon">{icon}</span><h3>{title}</h3></div>{children}</section>
}

function DefinitionRow({ label, value }: { label: string; value: string }) {
  return <div className="definition-row"><span>{label}</span><p>{value}</p></div>
}

function SkillTree({ chapters, completedLessons }: { chapters: LearningChapter[]; completedLessons: string[] }) {
  const branches = [
    { label: '基础查询', range: [1, 6] },
    { label: '分析核心', range: [7, 14] },
    { label: '项目进阶', range: [15, 18] },
  ]
  return <div className="sidebar-skill-tree"><span className="eyebrow">SKILL TREE</span>{branches.map((branch) => {
    const items = chapters.filter((item) => item.order >= branch.range[0] && item.order <= branch.range[1])
    const done = items.filter((item) => completedLessons.includes(item.id)).length
    const percent = items.length ? Math.round(done / items.length * 100) : 0
    return <div key={branch.label}><p><strong>{branch.label}</strong><span>{done}/{items.length}</span></p><i><span style={{ width: `${percent}%` }} /></i></div>
  })}</div>
}
