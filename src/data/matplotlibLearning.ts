import type { DataTable, MatplotlibChapter, MatplotlibQuestion } from '../types/problem'

const table = (name: string, columns: string[], rows: DataTable['rows']): DataTable => ({ name, columns, rows })

const monthlySales = table('monthly_sales', ['month', 'sales'], [['1月', 120], ['2月', 168], ['3月', 145], ['4月', 210], ['5月', 245], ['6月', 228]])
const categorySales = table('category_sales', ['category', 'revenue'], [['食品', 320], ['服装', 460], ['家居', 285], ['数码', 540]])
const users = table('users', ['age'], [[18], [22], [24], [24], [27], [31], [35], [42], [46], [52]])
const customerValue = table('customer_value', ['order_count', 'total_amount'], [[1, 80], [2, 180], [3, 260], [5, 520], [7, 760], [9, 980]])
const monthlyMetrics = table('monthly_metrics', ['month', 'revenue', 'users'], [['1月', 120, 24], ['2月', 168, 31], ['3月', 145, 29], ['4月', 210, 38], ['5月', 245, 44], ['6月', 228, 42]])

export const matplotlibChapters: MatplotlibChapter[] = [
  {
    id: 'figure-axes', order: 1, title: 'Figure 与 Axes', subtitle: '先分清画布与真正的绘图区',
    why: { scenario: 'Pandas 已经得到 monthly_sales，但表格不便展示销售趋势。', question: '代码应该把数据画到哪里，图表又由谁保存？', reason: 'Figure 是完整画布，Axes 承担坐标、数据系列与标注；分清两者才能稳定组合和导出图表。' },
    concepts: [
      { title: 'Figure', what: '整张图像画布，负责尺寸、布局和导出。', when: '需要控制报告图片大小或多个子图时。' },
      { title: 'Axes', what: '真正绘制折线、柱形和坐标轴的区域。', when: '添加数据、标题、标签和图例时。' },
      { title: '面向对象 API', what: '用 fig, ax = plt.subplots() 后调用 ax.plot()。', when: '课程和实际分析中优先使用，结构更清楚。' },
    ],
    code: "import matplotlib.pyplot as plt\n\nfig, ax = plt.subplots()\nax.plot(monthly_sales['month'], monthly_sales['sales'])\nplt.show()",
    original: [monthlySales], finalTable: monthlySales,
    mistakes: [
      { title: '没有保存 fig 与 ax', problem: '连续使用 plt.* 时，多图项目很难确定正在修改哪张图。', fix: '使用 fig, ax = plt.subplots()，后续设置都调用 ax。' },
      { title: '重复创建空画布', problem: '先 plt.figure() 再 plt.subplots() 会产生额外空图。', fix: '大多数分析图直接从 fig, ax = plt.subplots() 开始。' },
    ],
    exercises: [
      { question: '哪一个对象代表完整画布？', hint: '负责保存整张图片。', answer: 'Figure。' },
      { question: '哪一个对象调用 plot？', hint: '实际绘图区。', answer: "ax.plot(x, y)。" },
      { question: '创建一张图和一个绘图区。', hint: '使用 subplots。', answer: 'fig, ax = plt.subplots()' },
    ], practiceIds: ['mpl-monthly-sales-line'],
  },
  {
    id: 'line-bar', order: 2, title: '折线图与柱状图', subtitle: '用图表类型表达趋势或类别差异',
    why: { scenario: '月销售额强调时间变化，商品类别销售额强调横向比较。', question: '什么时候应该连成线，什么时候应该画成柱？', reason: '图表类型决定读者首先看到的是趋势还是类别差异。' },
    concepts: [
      { title: '折线图', what: '用有顺序的数据点表达连续变化。', when: '月份、日期等时间趋势。' },
      { title: '柱状图', what: '用长度比较离散类别大小。', when: '商品、城市、渠道等类别比较。' },
      { title: '视觉编码', what: 'marker 强调点，color 与 linewidth 控制辨识度。', when: '增强可读性但不改变数据含义。' },
    ],
    code: "fig, ax = plt.subplots()\nax.plot(monthly_sales['month'], monthly_sales['sales'], marker='o', linewidth=2)\nax.set_title('月销售额趋势')",
    original: [monthlySales, categorySales], finalTable: monthlySales,
    mistakes: [
      { title: '类别数据强行连线', problem: '没有自然顺序的类别被连线，会暗示不存在的连续变化。', fix: '类别比较使用 ax.bar()。' },
      { title: '截断柱状图纵轴', problem: '柱长不再按数值比例呈现，差异会被夸大。', fix: '柱状图通常让 y 轴从 0 开始。' },
    ],
    exercises: [
      { question: '六个月销售趋势用什么图？', hint: '时间有顺序。', answer: '折线图。' },
      { question: '四个品类收入比较用什么图？', hint: '离散类别。', answer: '柱状图。' },
      { question: '为折线添加圆点。', hint: 'marker 参数。', answer: "ax.plot(x, y, marker='o')" },
    ], practiceIds: ['mpl-monthly-sales-line', 'mpl-category-revenue-bar'],
  },
  {
    id: 'scatter-hist', order: 3, title: '散点图与直方图', subtitle: '观察变量关系与单变量分布',
    why: { scenario: '分析师既想知道订单数与消费金额是否相关，也想了解用户年龄集中在哪些区间。', question: '关系和分布为什么不能用同一张折线图回答？', reason: '散点图比较两个数值变量，直方图把一个连续变量分箱计数。' },
    concepts: [
      { title: '散点图', what: '每个点代表一条观测，位置由两个数值变量决定。', when: '判断相关趋势、聚类或异常值。' },
      { title: '直方图', what: '把一个数值变量切成区间并统计频数。', when: '观察集中程度、偏态和长尾。' },
      { title: '透明度与分箱', what: 'alpha 减少遮挡，bins 控制分布细节。', when: '点较密或需要合理概括分布时。' },
    ],
    code: "fig, axes = plt.subplots(1, 2, figsize=(10, 4))\naxes[0].scatter(customer_value['order_count'], customer_value['total_amount'], alpha=.7)\naxes[1].hist(users['age'], bins=5)",
    original: [customerValue, users], finalTable: customerValue,
    mistakes: [
      { title: '用折线连接独立用户', problem: '连线暗示用户之间有先后连续关系。', fix: '两个数值变量关系使用 ax.scatter()。' },
      { title: 'bins 过多或过少', problem: '过少掩盖结构，过多会把随机波动当成模式。', fix: '从 5–15 个区间尝试，并结合样本量解释。' },
    ],
    exercises: [
      { question: '年龄分布使用什么图？', hint: '一个连续变量。', answer: '直方图。' },
      { question: '散点重叠时调整什么？', hint: '透明度。', answer: 'alpha。' },
      { question: '绘制订单数与金额关系。', hint: '两个数值变量。', answer: "ax.scatter(df['order_count'], df['total_amount'])" },
    ], practiceIds: ['mpl-age-histogram', 'mpl-orders-amount-scatter'],
  },
  {
    id: 'labels-annotations', order: 4, title: '标题、图例与标注', subtitle: '让图表脱离代码也能被理解',
    why: { scenario: '一张没有标题、单位和图例的图被贴进周报，读者无法判断曲线代表什么。', question: '怎样让图表自己说明业务问题和关键变化？', reason: '标题、轴标签、图例与少量关键标注共同构成图表的解释层。' },
    concepts: [
      { title: '标题与坐标轴', what: '说明问题、维度、指标和必要单位。', when: '每一张交付图都需要。' },
      { title: '图例', what: '把视觉系列映射回业务指标。', when: '存在两个及以上系列时。' },
      { title: '关键标注', what: '用 annotate 指出峰值、异常或事件。', when: '需要引导读者关注一个重要数据点时。' },
    ],
    code: "peak = monthly_sales.loc[monthly_sales['sales'].idxmax()]\nfig, ax = plt.subplots()\nax.plot(monthly_sales['month'], monthly_sales['sales'], marker='o', label='销售额')\nax.set(title='月销售额趋势', xlabel='月份', ylabel='销售额（万元）')\nax.annotate('峰值', xy=(peak['month'], peak['sales']))\nax.legend(); ax.grid(alpha=.2)",
    original: [monthlySales], finalTable: monthlySales,
    mistakes: [
      { title: '标题只写“折线图”', problem: '没有业务对象、指标和时间范围，读者仍不知道图在回答什么。', fix: '标题写成“2024上半年月销售额趋势”。' },
      { title: '每个点都加标注', problem: '文本互相遮挡，关键结论反而不突出。', fix: '只标注峰值、异常点或重要事件。' },
    ],
    exercises: [
      { question: '设置 y 轴名称用哪个方法？', hint: 'set_y...', answer: "ax.set_ylabel('销售额')" },
      { question: '多系列图缺什么会难以识别？', hint: '系列映射。', answer: '图例。' },
      { question: '标注峰值使用哪个 API？', hint: 'annotation。', answer: 'ax.annotate()。' },
    ], practiceIds: ['mpl-annotate-peak', 'mpl-multi-series'],
  },
  {
    id: 'subplots-export', order: 5, title: '子图、布局与导出', subtitle: '从分析结果完成可交付图片',
    why: { scenario: '销售额和活跃用户需要一起解释，但量纲不同，挤在同一坐标轴会误导。', question: '怎样并列展示互补指标，并输出适合报告的清晰图片？', reason: '子图保留各自量纲，布局与导出决定报告中的可读性。' },
    concepts: [
      { title: '多个 Axes', what: '在同一 Figure 中安排多个独立绘图区。', when: '展示同一时间轴上的互补指标。' },
      { title: '布局控制', what: 'tight_layout 或 constrained_layout 避免标题和标签重叠。', when: '存在多个子图或较长轴标签时。' },
      { title: '可靠导出', what: 'fig.savefig() 明确文件名、dpi 和边界。', when: '交付报告、演示文稿或归档分析时。' },
    ],
    code: "fig, axes = plt.subplots(2, 1, figsize=(8, 6), sharex=True)\naxes[0].plot(monthly_metrics['month'], monthly_metrics['revenue'], marker='o')\naxes[1].bar(monthly_metrics['month'], monthly_metrics['users'])\naxes[0].set_ylabel('销售额'); axes[1].set_ylabel('活跃用户')\nfig.tight_layout()\nfig.savefig('monthly_report.png', dpi=150, bbox_inches='tight')",
    original: [monthlyMetrics], finalTable: monthlyMetrics,
    mistakes: [
      { title: '不同量纲共用同一 y 轴', problem: '较小系列会被压平，视觉距离也无法正确比较。', fix: '使用上下子图并共享月份 x 轴。' },
      { title: '保存后标签被裁切', problem: '图像边界没有包含完整标题和轴标签。', fix: "先调整布局，并用 bbox_inches='tight' 导出。" },
    ],
    exercises: [
      { question: '创建上下两个子图。', hint: '2 行 1 列。', answer: 'fig, axes = plt.subplots(2, 1)' },
      { question: '自动减少元素重叠。', hint: 'tight layout。', answer: 'fig.tight_layout()' },
      { question: '导出报告图片。', hint: 'Figure 方法。', answer: "fig.savefig('report.png', dpi=150)" },
    ], practiceIds: ['mpl-sales-users-subplots', 'mpl-visual-delivery'],
  },
]

type QuestionSpec = Omit<MatplotlibQuestion, 'number' | 'source' | 'language' | 'sampleData' | 'visualizationSteps'>

const specs: QuestionSpec[] = [
  {
    id: 'mpl-monthly-sales-line', title: '月销售额折线图', chapter: '可视化', difficulty: '简单', tags: ['Matplotlib', '折线图', 'plot'],
    description: '把月销售额转换为清晰的时间趋势图。', challenge: 'month 作为 x，sales 作为 y，添加圆点、标题和两个坐标轴名称。', tables: [monthlySales], expectedOutput: monthlySales,
    hints: ['先用 plt.subplots() 得到 ax。', "调用 ax.plot(..., marker='o')，再设置标题和轴标签。"], starterCode: '',
    solution: "import matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.plot(monthly_sales['month'], monthly_sales['sales'], marker='o')\nax.set_title('月销售额趋势')\nax.set_xlabel('月份')\nax.set_ylabel('销售额')\nplt.show()",
    explanation: '折线图强调月份顺序中的销售变化，圆点帮助读者定位每个月的实际观测。',
    expectedChart: { title: '月销售额趋势', summary: '一条带圆点的折线，从1月120上升到5月245，6月略回落。', ariaLabel: '折线图，横轴为月份，纵轴为销售额，5月销售额最高。', expectation: { kind: 'line', xColumns: ['month'], yColumns: ['sales'], pointCounts: [6], requiresTitle: true, requiresXLabel: true, requiresYLabel: true, requiresMarker: true } },
  },
  {
    id: 'mpl-category-revenue-bar', title: '商品类别销售额柱状图', chapter: '可视化', difficulty: '简单', tags: ['Matplotlib', '柱状图', 'bar'],
    description: '比较不同商品类别的销售额。', challenge: 'category 作为 x，revenue 作为 y，并设置准确标题。', tables: [categorySales], expectedOutput: categorySales,
    hints: ['类别比较使用 ax.bar()。', '标题应说明比较的业务指标。'], starterCode: '',
    solution: "import matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.bar(category_sales['category'], category_sales['revenue'], color='#625bf6')\nax.set_title('商品类别销售额')\nax.set_xlabel('商品类别')\nax.set_ylabel('销售额')\nplt.show()",
    explanation: '柱形长度适合比较离散类别，纵轴从0开始避免夸大差异。',
    expectedChart: { title: '商品类别销售额', summary: '四根柱形，数码540最高，家居285最低。', ariaLabel: '柱状图，比较食品、服装、家居和数码的销售额。', expectation: { kind: 'bar', xColumns: ['category'], yColumns: ['revenue'], pointCounts: [4], requiresTitle: true, requiresXLabel: true, requiresYLabel: true } },
  },
  {
    id: 'mpl-age-histogram', title: '用户年龄直方图', chapter: '可视化', difficulty: '简单', tags: ['Matplotlib', '直方图', 'hist'],
    description: '查看用户年龄的集中区间和整体分布。', challenge: '使用 age 绘制直方图，设置合理 bins 并标注两个坐标轴。', tables: [users], expectedOutput: users,
    hints: ['一个连续变量的分布使用 ax.hist()。', '本题可从5个分箱开始。'], starterCode: '',
    solution: "import matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.hist(users['age'], bins=5, color='#31a987', edgecolor='white')\nax.set_title('用户年龄分布')\nax.set_xlabel('年龄')\nax.set_ylabel('用户数')\nplt.show()",
    explanation: '直方图把年龄分箱后统计频数，不应把每位用户按顺序连成折线。',
    expectedChart: { title: '用户年龄分布', summary: '年龄主要集中在20至35岁，右侧仍有少量较高年龄用户。', ariaLabel: '直方图，横轴为年龄区间，纵轴为用户数。', expectation: { kind: 'hist', xColumns: ['age'], yColumns: [], pointCounts: [5], requiresTitle: true, requiresXLabel: true, requiresYLabel: true } },
  },
  {
    id: 'mpl-orders-amount-scatter', title: '订单数与消费金额散点图', chapter: '可视化', difficulty: '简单', tags: ['Matplotlib', '散点图', 'scatter'],
    description: '观察订单数量与累计消费金额之间的关系。', challenge: 'order_count 作为 x，total_amount 作为 y，设置透明度、标题和轴标签。', tables: [customerValue], expectedOutput: customerValue,
    hints: ['两个数值变量使用 ax.scatter()。', 'alpha 应大于0且小于等于1。'], starterCode: '',
    solution: "import matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.scatter(customer_value['order_count'], customer_value['total_amount'], alpha=.7)\nax.set_title('订单数与消费金额关系')\nax.set_xlabel('订单数')\nax.set_ylabel('消费金额')\nplt.show()",
    explanation: '每个点代表一位客户，点的位置同时表达订单数与消费金额。',
    expectedChart: { title: '订单数与消费金额关系', summary: '六个点整体向右上方分布，订单数较高的客户消费金额也更高。', ariaLabel: '散点图，横轴为订单数，纵轴为累计消费金额。', expectation: { kind: 'scatter', xColumns: ['order_count'], yColumns: ['total_amount'], pointCounts: [6], requiresTitle: true, requiresXLabel: true, requiresYLabel: true, requiresAlpha: true } },
  },
  {
    id: 'mpl-annotate-peak', title: '标注销售峰值', chapter: '可视化', difficulty: '中等', tags: ['Matplotlib', 'annotate', '峰值'],
    description: '在销售趋势图上找出并标注最高月份。', challenge: '绘制折线、找出最大销售额，并用 annotate 标出峰值。', tables: [monthlySales], expectedOutput: monthlySales,
    hints: ['先用 idxmax() 找出峰值行。', 'annotate 的 xy 应指向峰值坐标。'], starterCode: '',
    solution: "import matplotlib.pyplot as plt\npeak = monthly_sales.loc[monthly_sales['sales'].idxmax()]\nfig, ax = plt.subplots()\nax.plot(monthly_sales['month'], monthly_sales['sales'], marker='o')\nax.annotate('峰值', xy=(peak['month'], peak['sales']), xytext=(0, 12), textcoords='offset points', ha='center', arrowprops={'arrowstyle': '->'})\nax.set(title='月销售额趋势', xlabel='月份', ylabel='销售额')\nplt.show()",
    explanation: '标注只强调5月峰值，让读者快速定位最值得解释的数据点。',
    expectedChart: { title: '销售峰值', summary: '月销售折线图在5月245的位置显示“峰值”标注和箭头。', ariaLabel: '带峰值标注的月销售额折线图，5月最高。', expectation: { kind: 'line', xColumns: ['month'], yColumns: ['sales'], pointCounts: [6], requiresTitle: true, requiresXLabel: true, requiresYLabel: true, requiresAnnotation: true } },
  },
  {
    id: 'mpl-multi-series', title: '多系列折线图与图例', chapter: '可视化', difficulty: '中等', tags: ['Matplotlib', '多系列', 'legend'],
    description: '在一张图中展示销售额与活跃用户的变化。', challenge: '绘制两个系列，分别设置 label，并显示清晰图例。', tables: [monthlyMetrics], expectedOutput: monthlyMetrics,
    hints: ['调用两次 ax.plot()。', '每个系列设置 label，最后调用 ax.legend()。'], starterCode: '',
    solution: "import matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.plot(monthly_metrics['month'], monthly_metrics['revenue'], marker='o', label='销售额')\nax.plot(monthly_metrics['month'], monthly_metrics['users'], marker='s', label='活跃用户')\nax.set(title='销售额与活跃用户趋势', xlabel='月份', ylabel='指标值')\nax.legend()\nplt.show()",
    explanation: '两个系列必须通过不同标记和图例区分；若量纲差异过大，应改用子图。',
    expectedChart: { title: '多系列趋势', summary: '同一月份轴上有销售额和活跃用户两条折线，并有图例区分。', ariaLabel: '双折线图，显示销售额与活跃用户的月度趋势。', expectation: { kind: 'multi-line', xColumns: ['month', 'month'], yColumns: ['revenue', 'users'], pointCounts: [6, 6], requiresTitle: true, requiresXLabel: true, requiresYLabel: true, requiresLegend: true } },
  },
  {
    id: 'mpl-sales-users-subplots', title: '销售与用户子图', chapter: '可视化', difficulty: '中等', tags: ['Matplotlib', 'subplots', '布局'],
    description: '使用上下两个子图分别展示销售趋势和活跃用户。', challenge: '创建两个 Axes，保持月份一致，并调整布局避免重叠。', tables: [monthlyMetrics], expectedOutput: monthlyMetrics,
    hints: ['使用 plt.subplots(2, 1)。', 'axes[0] 与 axes[1] 分别绘图，最后 tight_layout。'], starterCode: '',
    solution: "import matplotlib.pyplot as plt\nfig, axes = plt.subplots(2, 1, figsize=(8, 6), sharex=True)\naxes[0].plot(monthly_metrics['month'], monthly_metrics['revenue'], marker='o')\naxes[0].set_title('月销售额趋势'); axes[0].set_ylabel('销售额')\naxes[1].bar(monthly_metrics['month'], monthly_metrics['users'])\naxes[1].set_xlabel('月份'); axes[1].set_ylabel('活跃用户')\nfig.tight_layout()\nplt.show()",
    explanation: '上下子图保留各自量纲，同时共享月份顺序，避免把两个不可直接比较的指标挤在同一纵轴。',
    expectedChart: { title: '销售与用户子图', summary: '上方折线显示销售额，下方柱状图显示活跃用户，两图月份对齐。', ariaLabel: '上下两个子图，上方为销售折线，下方为活跃用户柱状图。', expectation: { kind: 'subplots', xColumns: ['month', 'month'], yColumns: ['revenue', 'users'], pointCounts: [6, 6], axesCount: 2, requiresTitle: true, requiresXLabel: true, requiresYLabel: true, requiresLayout: true } },
  },
  {
    id: 'mpl-visual-delivery', title: '综合可视化交付', chapter: '可视化', difficulty: '中等', tags: ['Matplotlib', '分析交付', 'savefig'],
    description: '把 Pandas 聚合结果转成可放进报告的业务图表。', challenge: '选择合适图表，设置标题、坐标轴和图例，标注关键结论并调用 savefig 导出。', tables: [monthlyMetrics], expectedOutput: monthlyMetrics,
    hints: ['可用折线图展示 revenue 趋势。', '标注峰值，并使用 fig.savefig()。'], starterCode: '',
    solution: "import matplotlib.pyplot as plt\npeak = monthly_metrics.loc[monthly_metrics['revenue'].idxmax()]\nfig, ax = plt.subplots(figsize=(8, 4))\nax.plot(monthly_metrics['month'], monthly_metrics['revenue'], marker='o', label='销售额')\nax.set(title='上半年销售额趋势', xlabel='月份', ylabel='销售额')\nax.annotate('5月峰值', xy=(peak['month'], peak['revenue']), xytext=(-20, 18), textcoords='offset points', arrowprops={'arrowstyle': '->'})\nax.legend(); ax.grid(alpha=.2)\nfig.tight_layout()\nfig.savefig('sales_report.png', dpi=150, bbox_inches='tight')\nplt.show()",
    explanation: '最终交付不仅要有正确图形，还要让读者理解峰值、指标口径和导出用途。业务结论：销售额在5月达到峰值，6月小幅回落，应进一步核对活动结束或季节因素。',
    expectedChart: { title: '可视化交付', summary: '带标题、轴标签、图例和峰值标注的销售额折线图，并执行图片导出。', ariaLabel: '可交付的销售额趋势图，5月峰值被标注。', expectation: { kind: 'delivery', xColumns: ['month'], yColumns: ['revenue'], pointCounts: [6], requiresTitle: true, requiresXLabel: true, requiresYLabel: true, requiresLegend: true, requiresAnnotation: true, requiresSave: true, requiresLayout: true } },
  },
]

export const matplotlibQuestions: MatplotlibQuestion[] = specs.map((spec, index) => ({
  ...spec,
  number: index + 31,
  source: 'Data Learning Lab · Matplotlib 可视化交付',
  language: 'matplotlib',
  sampleData: spec.tables,
  visualizationSteps: [
    { title: '确认绘图数据', goal: '检查字段与观测数', detail: `输入 ${spec.tables[0].name}，共 ${spec.tables[0].rows.length} 行。`, table: spec.tables[0] },
    { title: '构建图表结构', goal: '选择图表类型和字段关系', detail: spec.expectedChart.summary },
    { title: '补齐解释层', goal: '让图表可以独立阅读', detail: '核对标题、坐标轴、图例、标注和导出要求。' },
  ],
}))
