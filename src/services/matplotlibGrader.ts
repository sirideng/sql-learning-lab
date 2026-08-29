import type { MatplotlibExpectation } from '../types/problem'
import type { MatplotlibSemanticResult } from './matplotlibRuntime'

export interface ChartGrade {
  correct: boolean
  feedback: Array<{ passed: boolean; message: string }>
}

export function gradeMatplotlib(code: string, result: MatplotlibSemanticResult, expected: MatplotlibExpectation): ChartGrade {
  const feedback: ChartGrade['feedback'] = []
  const lower = code.toLowerCase()
  const axes = result.axes
  const first = axes[0]
  const add = (passed: boolean, success: string, failure: string) => feedback.push({ passed, message: passed ? success : failure })
  const allowedKinds = expected.kind === 'delivery' ? ['line', 'multi-line'] : [expected.kind]
  add(allowedKinds.includes(result.kind), `已正确创建${kindName(expected.kind)}。`, `图表类型应为${kindName(expected.kind)}，当前识别为${kindName(result.kind)}。`)

  const requiredColumns = [...new Set([...expected.xColumns, ...expected.yColumns])]
  requiredColumns.forEach((column) => add(lower.includes(column.toLowerCase()), `已使用字段 ${column}。`, `代码中缺少字段 ${column}。`))

  if (expected.axesCount) add(result.axesCount === expected.axesCount, `已创建 ${expected.axesCount} 个子图。`, `应创建 ${expected.axesCount} 个子图，当前为 ${result.axesCount} 个。`)

  const actualCounts = result.kind === 'scatter'
    ? [first?.collections[0]?.points.length ?? 0]
    : result.kind === 'bar' || result.kind === 'hist'
      ? [first?.patchCount ?? 0]
      : result.kind === 'subplots'
        ? axes.map((axis) => axis.lines[0]?.x.length ?? axis.patchCount)
        : (first?.lines.map((line) => line.x.length) ?? [])
  expected.pointCounts.forEach((count, index) => add(actualCounts[index] === count, `第 ${index + 1} 个系列包含 ${count} 个数据点。`, `第 ${index + 1} 个系列应包含 ${count} 个数据点，当前为 ${actualCounts[index] ?? 0} 个。`))

  if (expected.requiresTitle) add(axes.some((axis) => axis.title.trim()), '图表标题已设置。', '当前没有设置标题。')
  if (expected.requiresXLabel) add(axes.some((axis) => axis.xlabel.trim()), 'x 轴标签已设置。', '缺少 x 轴标签。')
  if (expected.requiresYLabel) add(axes.every((axis) => axis.ylabel.trim()), 'y 轴标签已设置。', '每个绘图区都需要 y 轴标签。')
  if (expected.requiresLegend) add(axes.some((axis) => axis.legend), '图例已添加。', '数据系列正确，但图例缺失。')
  if (expected.requiresAnnotation) add(axes.some((axis) => axis.texts.length > 0), '关键数据点已标注。', '还没有使用 annotate 标注指定数据点。')
  if (expected.requiresSave) add(result.savefigCalled, '已调用导出方法。', '还没有调用 fig.savefig() 导出图片。')
  if (expected.requiresMarker) add(axes.some((axis) => axis.lines.some((line) => line.marker && line.marker !== 'None' && line.marker !== 'none')), '折线数据点标记已添加。', "折线需要添加 marker，例如 marker='o'。")
  if (expected.requiresAlpha) add(axes.some((axis) => axis.collections.some((collection) => collection.alpha !== null && collection.alpha < 1)), '散点透明度已设置。', '散点图需要设置 alpha 以减少点重叠。')
  if (expected.requiresLayout) add(/tight_layout|constrained_layout/.test(lower), '已处理多元素布局。', '请使用 tight_layout 或 constrained_layout 避免元素重叠。')

  return { correct: feedback.every((item) => item.passed), feedback }
}

function kindName(kind: string) {
  return ({ line: '折线图', bar: '柱状图', hist: '直方图', scatter: '散点图', 'multi-line': '多系列折线图', subplots: '子图', delivery: '可交付分析图' } as Record<string, string>)[kind] ?? kind
}
