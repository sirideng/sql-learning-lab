import { ArrowRight, LineChart } from 'lucide-react'

interface Props { completedLessons: number; completedQuestions: number; onOpen: () => void }

export function MatplotlibMiniPath({ completedLessons, completedQuestions, onOpen }: Props) {
  return <section className="matplotlib-mini-path" aria-labelledby="matplotlib-mini-title">
    <i><LineChart size={24}/></i><div><span className="eyebrow">PROJECT DELIVERY · OPTIONAL PATH</span><h2 id="matplotlib-mini-title">Matplotlib 可视化交付</h2><p>把 Pandas 分析结果转换为清晰、可信、可以交付的图表。</p><small>{completedLessons}/5 节 · {completedQuestions}/8 题</small></div>
    <button className="secondary-button" onClick={onOpen}>开始可视化学习 <ArrowRight size={16}/></button>
  </section>
}
