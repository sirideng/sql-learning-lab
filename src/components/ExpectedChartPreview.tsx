import type { MatplotlibChartKind } from '../types/problem'

interface Props {
  kind: MatplotlibChartKind
  title: string
  summary: string
  ariaLabel: string
  labels?: string[]
}

const months = ['1月', '2月', '3月', '4月', '5月', '6月']

export function ExpectedChartPreview({ kind, title, summary, ariaLabel, labels: customLabels }: Props) {
  const normalized = kind === 'delivery' ? 'line' : kind
  const labels = customLabels ?? (normalized === 'bar' ? ['食品','服装','家居','数码'] : normalized === 'hist' ? ['18','25','32','39','46','53'] : normalized === 'scatter' ? ['1','2','3','5','7','9'] : months)
  const barWidth = Math.min(42, 360 / Math.max(labels.length, 1))
  const barGap = 18
  const barStart = 88
  const barStep = barWidth + barGap
  const showPeak = kind === 'delivery' || /峰值/.test(`${title}${summary}`)
  return <figure className="expected-chart" role="img" aria-label={ariaLabel}>
    <figcaption><strong>{title}</strong><span>{summary}</span></figcaption>
    <svg viewBox="0 0 620 270" aria-hidden="true">
      <line className="axis" x1="62" y1="218" x2="590" y2="218"/><line className="axis" x1="62" y1="28" x2="62" y2="218"/>
      {normalized === 'bar' && labels.map((label,index)=>{
        const height = [106,148,92,176,126,158][index % 6]
        return <rect key={label} x={barStart + barStep * index} y={218-height} width={barWidth} height={height} rx="5" className="chart-bar"/>
      })}
      {normalized === 'hist' && [86,138,190,242,294].map((x,index)=><rect key={x} x={x} y={[154,96,62,122,170][index]} width="48" height={[64,122,156,96,48][index]} className="chart-bar histogram"/>)}
      {normalized === 'scatter' && [[105,184],[178,163],[245,142],[350,104],[458,70],[548,42]].map(([x,y])=><circle key={x} cx={x} cy={y} r="7" className="chart-point"/>)}
      {(normalized === 'line' || normalized === 'multi-line') && <>
        <polyline points="88,178 182,135 276,155 370,92 464,55 558,72" className="chart-line"/>
        {[['88','178'],['182','135'],['276','155'],['370','92'],['464','55'],['558','72']].map(([x,y])=><circle key={x} cx={x} cy={y} r="6" className="chart-point"/>)}
        {normalized === 'multi-line' && <polyline points="88,192 182,170 276,176 370,145 464,122 558,128" className="chart-line secondary"/>}
        {normalized === 'multi-line' && <><line x1="430" y1="30" x2="460" y2="30" className="chart-line"/><text x="468" y="34">销售额</text><line x1="515" y1="30" x2="545" y2="30" className="chart-line secondary"/><text x="553" y="34">用户</text></>}
        {showPeak && <><line x1="464" y1="55" x2="495" y2="35" className="chart-annotation"/><text x="500" y="35">峰值</text></>}
      </>}
      {normalized === 'subplots' && <>
        <line className="sub-axis" x1="62" y1="118" x2="590" y2="118"/><polyline points="88,102 182,79 276,91 370,58 464,40 558,49" className="chart-line"/>
        {[88,182,276,370,464,558].map((x,index)=><rect key={x} x={x-12} y={150-[18,28,25,37,44,41][index]} width="24" height={[18,28,25,37,44,41][index]} className="chart-bar"/>)}
      </>}
      {labels.map((label,index)=><text key={label} x={normalized==='bar'?barStart+barWidth/2+barStep*index:88+94*index} y="244" textAnchor="middle">{label}</text>)}
    </svg>
  </figure>
}
