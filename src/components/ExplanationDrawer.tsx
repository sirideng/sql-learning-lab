import { ArrowDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { SqlProblem } from '../types/problem'
import { CodeBlock } from './CodeBlock'
import { DataTableView } from './DataTableView'

interface ExplanationDrawerProps {
  problem: SqlProblem
  open: boolean
  onClose: () => void
}

export function ExplanationDrawer({ problem, open, onClose }: ExplanationDrawerProps) {
  const [visibleSteps, setVisibleSteps] = useState(1)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setVisibleSteps(1)
        onClose()
      }
    }
    if (open) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const allVisible = visibleSteps === problem.explanationSteps.length
  const close = () => {
    setVisibleSteps(1)
    onClose()
  }

  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="解题思路">
      <button className="drawer-backdrop" onClick={close} aria-label="关闭解题思路" />
      <aside className="explanation-drawer">
        <div className="drawer-header">
          <div>
            <span className="eyebrow">VISUAL WALKTHROUGH</span>
            <h2>一步一步，看见 SQL</h2>
            <p>每次只展开一个关键变化，最后才揭晓完整答案。</p>
          </div>
          <button className="icon-button" onClick={close} aria-label="关闭"><X size={20} /></button>
        </div>

        <div className="step-progress" aria-label={`已显示 ${visibleSteps} 个步骤`}>
          {problem.explanationSteps.map((step, index) => (
            <div key={step.title} className={`progress-segment ${index < visibleSteps ? 'active' : ''}`} />
          ))}
        </div>

        <div className="drawer-content">
          {problem.explanationSteps.slice(0, visibleSteps).map((step, index) => (
            <div className="step-wrap" key={step.title}>
              {index > 0 && <div className="flow-arrow"><ArrowDown size={18} /></div>}
              <article className="explanation-step">
                <div className="step-heading">
                  <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <span className="step-label">STEP {index + 1}</span>
                    <h3>{step.title}</h3>
                  </div>
                </div>
                <div className="step-copy">
                  <strong>目标</strong>
                  <p>{step.goal}</p>
                  <p className="step-detail">{step.detail}</p>
                </div>
                {step.sql && <CodeBlock code={step.sql} tables={problem.tables} language="sql" />}
                {step.table && <DataTableView table={step.table} compact />}
              </article>
            </div>
          ))}
        </div>

        <div className="drawer-footer">
          <button
            className="secondary-button"
            onClick={() => setVisibleSteps((count) => Math.max(1, count - 1))}
            disabled={visibleSteps === 1}
          >
            <ChevronLeft size={17} /> 上一步
          </button>
          {allVisible ? (
            <button className="primary-button" onClick={close}>我理解了</button>
          ) : (
            <button className="primary-button" onClick={() => setVisibleSteps((count) => count + 1)}>
              展开下一步 <ChevronRight size={17} />
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
