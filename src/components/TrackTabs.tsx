import type { KeyboardEvent } from 'react'

export type LearningTrack = 'sql' | 'pandas'

interface TrackTabsProps {
  value: LearningTrack
  onChange: (track: LearningTrack) => void
  label?: string
}

export function TrackTabs({ value, onChange, label = '学习轨道' }: TrackTabsProps) {
  const selectFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next: LearningTrack = event.key === 'ArrowLeft' || event.key === 'Home' ? 'sql' : 'pandas'
    onChange(next)
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-track="${next}"]`)?.focus()
  }

  return <div className={`language-local-switch track-${value}`} role="tablist" aria-label={label} onKeyDown={selectFromKeyboard}>
    {(['sql', 'pandas'] as const).map((track) => <button
      key={track}
      type="button"
      role="tab"
      data-track={track}
      aria-selected={value === track}
      tabIndex={value === track ? 0 : -1}
      className={value === track ? 'active' : ''}
      onClick={() => onChange(track)}
    >{track === 'sql' ? 'SQL' : 'Pandas'}</button>)}
  </div>
}
