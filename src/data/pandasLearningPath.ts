import type { DataTable, PandasChapter } from '../types/problem'

const table = (name: string, columns: string[], rows: DataTable['rows']): DataTable => ({ name, columns, rows })

interface ChapterSpec {
  id: string
  title: string
  subtitle: string
  visualType: PandasChapter['visualType']
  scenario: string
  question: string
  reason: string
  concepts: Array<[string, string, string]>
  code: string
  sql: string
  original: DataTable[]
  middle: DataTable
  final: DataTable
  middleTitle: string
  middleDetail: string
  pitfalls: Array<[string, string]>
  exercises: Array<[string, string, string]>
  checklist: string[]
}

function buildChapter(spec: ChapterSpec, index: number): PandasChapter {
  return {
    id: spec.id,
    order: index + 1,
    title: spec.title,
    subtitle: spec.subtitle,
    why: { scenario: spec.scenario, question: spec.question, reason: spec.reason },
    concepts: spec.concepts.map(([title, what, when]) => ({ title, what, when })),
    code: spec.code,
    sqlComparison: spec.sql,
    original: spec.original,
    steps: [
      { title: spec.middleTitle, description: spec.middleDetail, code: spec.code.split('\n').slice(0, -1).join('\n') || spec.code, table: spec.middle },
      { title: '形成最终 DataFrame', description: '核对结果的字段、索引、行数与业务粒度。', code: spec.code, table: spec.final },
    ],
    finalTable: spec.final,
    mistakes: spec.pitfalls.map(([title, fix]) => ({ title, problem: title, fix })),
    exercises: spec.exercises.map(([question, hint, answer]) => ({ question, hint, answer })),
    checklist: spec.checklist,
    visualType: spec.visualType,
  }
}

const people = table('people', ['user_id', 'name', 'city', 'age'], [[1, 'Ada', '上海', 22], [2, 'Bo', '北京', 19], [3, 'Chen', '上海', 27]])
const orders = table('orders', ['order_id', 'user_id', 'date', 'amount'], [[1, 1, '2024-01-01', 100], [2, 1, '2024-01-02', 80], [3, 2, '2024-01-02', 120], [4, 3, '2024-01-03', 160]])

const specs: ChapterSpec[] = [
  {
    id: 'pandas-dataframe-series', title: 'DataFrame 与 Series', subtitle: '理解二维表、单列与索引', visualType: 'dataframe',
    scenario: '业务数据通常以用户表、订单表等二维结构交付，但单个指标计算常围绕一列展开。', question: 'DataFrame、Series 与索引分别代表什么？', reason: '理解容器和标签，是后续筛选、对齐、聚合不出错的基础。',
    concepts: [['DataFrame', '带行列标签的二维数据容器。', '处理一张业务表时。'], ['Series', '带索引的一维数据，可视为 DataFrame 的一列。', '对单字段计算或转换时。'], ['Index', '用于行对齐的标签，不一定等于数据库主键。', '合并、赋值和结果检查时。']],
    code: "age = people['age']\nresult = people[['user_id', 'age']]", sql: 'SELECT user_id, age FROM people;', original: [people], middle: table("people['age']", ['index', 'age'], [[0, 22], [1, 19], [2, 27]]), final: table('result', ['user_id', 'age'], [[1, 22], [2, 19], [3, 27]]), middleTitle: '取出 age Series', middleDetail: '单中括号得到一维 Series，索引仍与原表对齐。',
    pitfalls: [['把索引当作 user_id', '业务键应使用明确字段，不依赖默认 0、1、2 索引。'], ['混淆一层与两层中括号', "df['age'] 是 Series，df[['age']] 是 DataFrame。"], ['忽略 dtype', '先用 dtypes 检查类型，再进行数值或日期运算。']],
    exercises: [['如何查看 DataFrame 的行列数？', '查看 shape 属性。', 'people.shape'], ['如何得到只含 city 的 DataFrame？', '使用双中括号。', "people[['city']]"], ['索引与主键有什么区别？', '一个用于对齐，一个表示业务唯一性。', '索引不保证业务唯一，user_id 才是业务键。']], checklist: ['能区分 DataFrame 与 Series', '理解索引对齐', '会检查 shape 与 dtypes', '知道业务主键不等于索引'],
  },
  {
    id: 'pandas-view-select', title: '数据查看与基础选择', subtitle: '先认识数据，再选择分析字段', visualType: 'dataframe',
    scenario: '接到陌生数据时，分析师先检查字段、样本、类型和缺失情况，而不是马上写复杂代码。', question: '如何安全快速地理解一张新表？', reason: '早期数据审计能避免用错字段和错误粒度。',
    concepts: [['head / sample', '查看少量代表性行。', '首次接触数据时。'], ['列选择', '明确保留分析真正需要的字段。', '缩小数据范围时。'], ['info / describe', '检查类型、缺失和统计分布。', '正式分析前。']],
    code: "preview = people.head(2)\nresult = people[['user_id', 'name', 'city']]", sql: 'SELECT user_id, name, city FROM people;', original: [people], middle: table('preview', ['user_id', 'name', 'city', 'age'], [[1, 'Ada', '上海', 22], [2, 'Bo', '北京', 19]]), final: table('result', ['user_id', 'name', 'city'], [[1, 'Ada', '上海'], [2, 'Bo', '北京'], [3, 'Chen', '上海']]), middleTitle: '预览前两行', middleDetail: 'head 只用于认识数据，不改变原 DataFrame。',
    pitfalls: [['只看 head 就判断分布', '结合 sample、describe 和缺失统计。'], ['链式选择后误修改原表', '需要修改时显式 copy。'], ['一次保留全部列', '根据业务问题只选择必要字段。']], exercises: [['随机查看3行用什么？', '使用 sample。', 'people.sample(3)'], ['查看字段类型用什么？', '使用 dtypes 或 info。', 'people.dtypes'], ['为什么不建议分析全程保留全部列？', '考虑可读性和性能。', '无关字段增加认知负担与内存占用。']], checklist: ['会预览数据', '会选择多列', '会检查类型', '能描述结果粒度'],
  },
  {
    id: 'pandas-loc-filter', title: 'loc / iloc / 条件筛选', subtitle: '让布尔条件决定哪些行保留', visualType: 'filter',
    scenario: '运营只关心上海且年龄不低于20岁的用户，需要从全量用户中保留目标人群。', question: '布尔条件如何逐行变成 True / False 并筛掉记录？', reason: '筛选是数据清洗、分群和指标口径的第一道门。',
    concepts: [['loc', '按标签和布尔条件选择行列。', '业务筛选首选。'], ['iloc', '按整数位置选择。', '取固定位置样本时。'], ['布尔掩码', '与原索引对齐的 True/False Series。', '组合多个条件时。']],
    code: "mask = (people['city'] == '上海') & (people['age'] >= 20)\nresult = people.loc[mask, ['user_id', 'name', 'age']]", sql: "SELECT user_id, name, age FROM people WHERE city='上海' AND age>=20;", original: [people], middle: table('mask', ['row', 'city_match', 'age_match', 'keep'], [[0, true, true, true], [1, false, false, false], [2, true, true, true]]), final: table('result', ['user_id', 'name', 'age'], [[1, 'Ada', 22], [3, 'Chen', 27]]), middleTitle: '计算布尔掩码', middleDetail: '只有两个条件都为 True 的行会被 loc 保留。',
    pitfalls: [['用 and 连接 Series', '使用 & / |，并为每个条件加括号。'], ['混淆 loc 与 iloc', 'loc 看标签，iloc 看位置。'], ['筛选后直接链式赋值', '先 .copy() 再修改，避免 SettingWithCopy 问题。']], exercises: [['筛选 age>20 怎么写？', '构造布尔 Series。', "people.loc[people['age'] > 20]"], ['取前两行前两列怎么写？', '使用 iloc。', 'people.iloc[:2, :2]'], ['多个条件为什么要括号？', '& 优先级容易产生错误。', "(cond1) & (cond2)"]], checklist: ['会构造布尔掩码', '会组合多个条件', '能区分 loc/iloc', '知道筛选后何时 copy'],
  },
  {
    id: 'pandas-columns', title: '新增、修改与删除列', subtitle: '把业务规则变成新变量', visualType: 'dataframe',
    scenario: '订单表只有 amount，需要计算含税金额并生成高价值标记。', question: '怎样在保持原行粒度的前提下新增分析字段？', reason: '数据分析经常需要特征工程和口径字段。',
    concepts: [['assign', '返回带新列的新 DataFrame。', '链式转换时。'], ['列赋值', '按索引对齐修改或新增列。', '清晰的单步变换时。'], ['drop', '按轴删除不需要的列。', '交付结果前精简字段时。']],
    code: "enriched = orders.assign(tax_amount=orders['amount'] * 1.06)\nresult = enriched.drop(columns='date')", sql: 'SELECT order_id,user_id,amount,amount*1.06 tax_amount FROM orders;', original: [orders], middle: table('enriched', ['order_id', 'user_id', 'date', 'amount', 'tax_amount'], [[1, 1, '2024-01-01', 100, 106], [2, 1, '2024-01-02', 80, 84.8], [3, 2, '2024-01-02', 120, 127.2], [4, 3, '2024-01-03', 160, 169.6]]), final: table('result', ['order_id', 'user_id', 'amount', 'tax_amount'], [[1, 1, 100, 106], [2, 1, 80, 84.8], [3, 2, 120, 127.2], [4, 3, 160, 169.6]]), middleTitle: '计算 tax_amount', middleDetail: '向量化运算逐行计算，同时保持订单粒度。',
    pitfalls: [['错误覆盖原始字段', '新口径先使用新列名，验证后再替换。'], ['赋值 Series 索引不一致', '重置或对齐索引后再赋值。'], ['drop 忘记 columns', "明确写 drop(columns='date')。"]], exercises: [['新增 amount 的平方列？', '直接进行向量化。', "orders.assign(amount_sq=orders['amount'] ** 2)"], ['重命名 amount 为 revenue？', '使用 rename。', "orders.rename(columns={'amount':'revenue'})"], ['为什么优先向量化？', '避免逐行 Python 循环。', '更快、更简洁且语义清楚。']], checklist: ['会新增列', '会修改和重命名列', '会安全删除列', '理解索引对齐'],
  },
  {
    id: 'pandas-missing', title: '缺失值处理', subtitle: '区分缺失、零与未知', visualType: 'cleaning',
    scenario: '客户评分缺失可能表示未评价，不能随意当成0分。', question: '缺失值应该删除、填补还是保留？', reason: '错误处理缺失值会改变样本和业务结论。',
    concepts: [['isna', '逐元素识别 NaN/None。', '量化缺失范围时。'], ['fillna', '按口径填补缺失。', '有明确业务替代值时。'], ['dropna', '删除含缺失的行或列。', '缺失样本不适合分析且影响有限时。']],
    code: "missing = scores['score'].isna()\nresult = scores.assign(score=scores['score'].fillna(scores['score'].median()))", sql: 'SELECT student_id, COALESCE(score, median_score) score FROM scores;', original: [table('scores', ['student_id', 'score'], [[1, 80], [2, null], [3, 100]])], middle: table('missing mask', ['row', 'is_missing'], [[0, false], [1, true], [2, false]]), final: table('result', ['student_id', 'score'], [[1, 80], [2, 90], [3, 100]]), middleTitle: '定位缺失行', middleDetail: 'isna 只标记缺失，不自动决定处理策略。',
    pitfalls: [['把所有缺失填0', '先理解业务含义，再选择填充值。'], ['dropna 后不检查样本量', '比较处理前后行数和群体分布。'], ['字符串“NA”未识别', '读取数据时配置 na_values。']], exercises: [['统计每列缺失数？', 'isna 后 sum。', 'scores.isna().sum()'], ['用中位数填分数？', '先计算 median。', "scores['score'].fillna(scores['score'].median())"], ['缺失为什么不等于0？', '0可能是有效观测。', '缺失表示未知，0表示已知值。']], checklist: ['会识别缺失', '能选择填补策略', '会评估删除影响', '区分缺失与业务零值'],
  },
  {
    id: 'pandas-sort-dedup-types', title: '排序 / 去重 / 类型转换', subtitle: '建立稳定顺序与可信唯一键', visualType: 'cleaning',
    scenario: '行为日志存在重复事件，时间还是字符串，直接分析会重复计数和排序错误。', question: '怎样得到唯一、顺序正确、类型可靠的数据？', reason: '这三步决定后续窗口、日期和聚合是否可信。',
    concepts: [['sort_values', '按一个或多个字段建立顺序。', '排名、shift 和时间序列前。'], ['drop_duplicates', '按业务键删除重复行。', '事件去重时。'], ['astype/to_datetime', '把字段转成正确语义类型。', '计算前的数据准备。']],
    code: "clean = events.drop_duplicates('event_id').copy()\nclean['date'] = pd.to_datetime(clean['date'])\nresult = clean.sort_values('date')", sql: 'SELECT DISTINCT event_id,user_id,CAST(date AS DATE) date FROM events ORDER BY date;', original: [table('events', ['event_id', 'user_id', 'date'], [[2, 1, '2024-01-02'], [1, 1, '2024-01-01'], [1, 1, '2024-01-01']])], middle: table('deduplicated', ['event_id', 'user_id', 'date'], [[2, 1, '2024-01-02'], [1, 1, '2024-01-01']]), final: table('result', ['event_id', 'user_id', 'date'], [[1, 1, '2024-01-01'], [2, 1, '2024-01-02']]), middleTitle: '按 event_id 去重', middleDetail: '先确认 event_id 是业务唯一键，再删除重复。',
    pitfalls: [['没有 subset 就去重', '明确业务唯一键，不依赖整行相同。'], ['字符串日期直接排序', '先转 datetime，避免格式差异。'], ['排序后忘记索引', '需要展示时 reset_index(drop=True)。']], exercises: [['按 amount 降序？', 'ascending=False。', "orders.sort_values('amount', ascending=False)"], ['按两列去重？', 'subset 接收列表。', "df.drop_duplicates(['user_id','date'])"], ['为什么 shift 前必须排序？', '上一行取决于当前顺序。', '先按实体键和时间排序。']], checklist: ['会多列排序', '会按业务键去重', '会转换日期类型', '理解排序对行间运算的影响'],
  },
  {
    id: 'pandas-groupby', title: 'groupby 与聚合', subtitle: '分组 → 每组计算 → 合并结果', visualType: 'groupby',
    scenario: '明细订单每笔一行，业务需要每位用户的订单数与总消费。', question: 'groupby 怎样把明细粒度变成用户粒度？', reason: '分组聚合是指标计算最常用的 Pandas 能力。',
    concepts: [['split', '按键把行分入不同组。', '任何 groupby 的第一步。'], ['apply aggregate', '每组独立执行 sum/mean/count。', '生成组级指标时。'], ['combine', '把各组结果组合为新 DataFrame。', '形成最终指标表时。']],
    code: "groups = orders.groupby('user_id')\nresult = groups.agg(order_count=('order_id','size'), total_amount=('amount','sum')).reset_index()", sql: 'SELECT user_id,COUNT(*) order_count,SUM(amount) total_amount FROM orders GROUP BY user_id;', original: [orders], middle: table('groups', ['group', 'order_ids', 'amounts'], [['user_id=1', '1,2', '100,80'], ['user_id=2', '3', '120'], ['user_id=3', '4', '160']]), final: table('result', ['user_id', 'order_count', 'total_amount'], [[1, 2, 180], [2, 1, 120], [3, 1, 160]]), middleTitle: '拆成 user_id 分组', middleDetail: '此时尚未求和，只是确定每组包含哪些原始行。',
    pitfalls: [['用 count 忽略缺失', '明确要统计行数 size 还是非空值 count。'], ['忘记结果粒度变化', '聚合后通常每组一行。'], ['多指标列名不清', '使用命名聚合给指标稳定名称。']], exercises: [['按城市算平均年龄？', 'groupby city 后 mean。', "people.groupby('city',as_index=False).agg(avg_age=('age','mean'))"], ['size 和 count 区别？', 'count 跳过缺失。', 'size 数行，count 数非空。'], ['为什么 as_index=False？', '让分组键保留为普通列。', '便于继续 merge 和展示。']], checklist: ['理解 split-apply-combine', '会命名聚合', '能控制结果索引', '会解释聚合粒度'],
  },
  {
    id: 'pandas-merge', title: 'merge / join / concat', subtitle: '沿连接键组合多张业务表', visualType: 'merge',
    scenario: '订单只有 user_id，需要连接用户表才能分析不同城市的消费。', question: '一对多连接为什么会扩行，未匹配记录为什么出现 NaN？', reason: '表连接决定分析宽表的粒度，也是最常见的数据重复来源。',
    concepts: [['merge', '按连接键横向匹配字段。', '关系表连接时。'], ['join', '常按索引连接的便捷方法。', '索引已设计为连接键时。'], ['concat', '沿行或列拼接同构数据。', '合并月份文件或特征列时。']],
    code: "matched = people.merge(orders, on='user_id', how='left', suffixes=('_left','_right'))\nresult = matched[['user_id','name','order_id','amount']]", sql: 'SELECT p.user_id,p.name,o.order_id,o.amount FROM people p LEFT JOIN orders o ON p.user_id=o.user_id;', original: [people, orders], middle: table('row matching', ['left.user_id', 'left.name', 'right.order_ids'], [[1, 'Ada', '1,2'], [2, 'Bo', '3'], [3, 'Chen', '4']]), final: table('result', ['user_id', 'name', 'order_id', 'amount'], [[1, 'Ada', 1, 100], [1, 'Ada', 2, 80], [2, 'Bo', 3, 120], [3, 'Chen', 4, 160]]), middleTitle: '逐个连接键寻找匹配', middleDetail: 'user_id=1 匹配两笔订单，因此左表的一行扩成两行。',
    pitfalls: [['连接键不唯一导致爆炸', '连接前检查两侧键的唯一性和预期关系。'], ['left merge 后过滤右表', '对 NaN 的过滤可能把 left 语义变成 inner。'], ['同名列后缀未处理', '显式设置 suffixes 并选择最终字段。']], exercises: [['未匹配用户如何保留？', 'how=left。', "people.merge(orders,on='user_id',how='left')"], ['怎样检查键重复？', 'value_counts 或 duplicated。', "orders['user_id'].value_counts()"], ['merge 与 concat 区别？', '一个按键匹配，一个按轴拼接。', 'merge 用关系键；concat 组合同构块。']], checklist: ['能判断连接关系', '会选择 how', '能解释一对多扩行', '会检查 NaN 与重复'],
  },
  {
    id: 'pandas-datetime', title: '日期时间处理', subtitle: '从字符串到周期、间隔和观察窗口', visualType: 'date',
    scenario: '增长分析需要月销售趋势和注册后第7天活跃，字符串日期无法可靠计算。', question: '日期如何从文本变成可运算的时间对象？', reason: '时间维度是留存、趋势和生命周期分析的核心。',
    concepts: [['to_datetime', '解析为 datetime64。', '读取或清洗日期字段后。'], ['dt accessor', '提取年、月、日和周期。', '构造时间维度时。'], ['Timedelta', '表示两个时间点的间隔。', '留存和间隔分析时。']],
    code: "dated = orders.assign(date=pd.to_datetime(orders['date']))\ndated['month'] = dated['date'].dt.to_period('M').astype(str)\nresult = dated[['order_id','month']]", sql: "SELECT order_id,DATE_FORMAT(date,'%Y-%m') month FROM orders;", original: [orders], middle: table('datetime parsed', ['order_id', 'date', 'dtype'], [[1, '2024-01-01', 'datetime64'], [2, '2024-01-02', 'datetime64'], [3, '2024-01-02', 'datetime64'], [4, '2024-01-03', 'datetime64']]), final: table('result', ['order_id', 'month'], [[1, '2024-01'], [2, '2024-01'], [3, '2024-01'], [4, '2024-01']]), middleTitle: '解析 datetime', middleDetail: '值看起来相同，但 dtype 已从 object 变成可计算的 datetime64。',
    pitfalls: [['直接对字符串日期做减法', '先 pd.to_datetime。'], ['忽略时区', '跨地区日志应先统一 timezone。'], ['用天差==1代表昨天但未去重', '同时检查用户、自然日和事件去重。']], exercises: [['提取星期几？', '使用 dt.day_name。', "df['date'].dt.day_name()"], ['计算两个日期天数？', '相减后 dt.days。', "(df['end']-df['start']).dt.days"], ['Period 与 datetime 区别？', '一个表示周期，一个表示时间点。', '月度聚合常用 Period。']], checklist: ['会解析日期', '会提取日期部件', '会计算 Timedelta', '理解留存观察窗口'],
  },
  {
    id: 'pandas-strings', title: '字符串处理', subtitle: '清洗、提取与标准化文本维度', visualType: 'string',
    scenario: '城市和邮箱存在大小写、空格与格式差异，相同实体被拆成多个类别。', question: '怎样用向量化字符串方法稳定清洗文本？', reason: '分类字段标准化直接影响去重与分组统计。',
    concepts: [['str methods', '对整列执行 strip/lower/replace。', '批量文本清洗时。'], ['extract', '用正则提取结构化片段。', '邮箱域名和编码拆分时。'], ['contains', '产生布尔掩码。', '关键词筛选时。']],
    code: "clean = accounts.assign(email=accounts['email'].str.strip().str.lower())\nclean['domain'] = clean['email'].str.extract(r'@(.+)$')\nresult = clean", sql: 'SELECT LOWER(TRIM(email)), SUBSTRING_INDEX(email,"@",-1) domain FROM accounts;', original: [table('accounts', ['user_id', 'email'], [[1, ' Ada@Example.COM '], [2, 'bo@test.cn']])], middle: table('normalized', ['user_id', 'email'], [[1, 'ada@example.com'], [2, 'bo@test.cn']]), final: table('result', ['user_id', 'email', 'domain'], [[1, 'ada@example.com', 'example.com'], [2, 'bo@test.cn', 'test.cn']]), middleTitle: '标准化大小写与空格', middleDetail: '先统一文本，再进行提取和分组。',
    pitfalls: [['直接使用 Python 字符串方法', 'Series 使用 .str 访问器。'], ['正则特殊字符未转义', '明确 regex=True/False。'], ['缺失字符串报错', '先处理 NaN 或使用支持缺失的方法。']], exercises: [['取手机号前3位？', 'str.slice。', "df['phone'].str[:3]"], ['替换连字符？', 'str.replace。', "s.str.replace('-','',regex=False)"], ['为什么先清洗再 groupby？', '避免同类被分开。', '标准化后类别键才稳定。']], checklist: ['会标准化文本', '会提取子串', '会构造文本筛选', '理解清洗对分组的影响'],
  },
  {
    id: 'pandas-apply-transform', title: 'apply / lambda / transform', subtitle: '区分逐元素规则与组内广播', visualType: 'transform',
    scenario: '需要生成用户分层，同时把部门平均工资标回每位员工。', question: 'apply 与 transform 为什么返回不同粒度？', reason: '选择正确工具能避免慢速循环和结果错位。',
    concepts: [['apply', '沿行或列应用自定义函数。', '规则难以向量化时。'], ['lambda', '短小的匿名函数。', '局部简单规则时。'], ['transform', '组级计算广播回原始行。', '需要保留明细粒度时。']],
    code: "avg = employees.groupby('department')['salary'].transform('mean')\nresult = employees.assign(department_avg=avg)", sql: 'SELECT *,AVG(salary) OVER(PARTITION BY department) department_avg FROM employees;', original: [table('employees', ['id', 'department', 'salary'], [[1, 'A', 8000], [2, 'A', 10000], [3, 'B', 9000]])], middle: table('group means', ['department', 'mean_salary'], [['A', 9000], ['B', 9000]]), final: table('result', ['id', 'department', 'salary', 'department_avg'], [[1, 'A', 8000, 9000], [2, 'A', 10000, 9000], [3, 'B', 9000, 9000]]), middleTitle: '计算每组平均值', middleDetail: 'groupby 得到组级值，transform 再按原索引广播。',
    pitfalls: [['能向量化却使用 axis=1 apply', '优先列运算、map 或 np.select。'], ['用 agg 期望保持原行数', '需要广播时使用 transform。'], ['lambda 过长难测试', '复杂逻辑改为命名函数。']], exercises: [['组内最大值标回原行？', 'transform max。', "df.groupby('group')['value'].transform('max')"], ['apply axis=1 表示什么？', '逐行传入 Series。', '每次函数接收一行。'], ['transform 与窗口函数关系？', '都保留原粒度。', 'SQL AVG OVER 对应 groupby.transform(mean)。']], checklist: ['会区分 apply/agg/transform', '能优先向量化', '理解广播回原行', '会对照 SQL 窗口函数'],
  },
  {
    id: 'pandas-shift-diff-rank', title: 'shift / diff / rank / cumulative', subtitle: '理解行间比较、排名与累计', visualType: 'diff',
    scenario: '时间序列要比较上一日、计算增量、累计销售和组内排名。', question: '当前行如何引用上一行或之前所有行？', reason: '这些操作对应数据分析中高频的 SQL 窗口函数。',
    concepts: [['shift', '按当前顺序移动值。', '上一期对比时。'], ['diff', '当前值减前一期值。', '计算变化量时。'], ['rank/cumsum', '生成排名或累计值。', '榜单和累计指标时。']],
    code: "ordered = daily.sort_values('date')\nordered['previous'] = ordered['value'].shift(1)\nordered['change'] = ordered['value'].diff()\nresult = ordered", sql: 'SELECT date,value,LAG(value) OVER(ORDER BY date) previous,value-LAG(value) OVER(ORDER BY date) change FROM daily;', original: [table('daily', ['date', 'value'], [['01-01', 10], ['01-02', 25], ['01-03', 20], ['01-04', 30]])], middle: table('shifted', ['date', 'current', 'previous'], [['01-01', 10, null], ['01-02', 25, 10], ['01-03', 20, 25], ['01-04', 30, 20]]), final: table('result', ['date', 'value', 'previous', 'change'], [['01-01', 10, null, null], ['01-02', 25, 10, 15], ['01-03', 20, 25, -5], ['01-04', 30, 20, 10]]), middleTitle: '把原列向下移动一行', middleDetail: 'shift 后的 previous 与当前行并排，第一行没有上一行所以是 NaN。',
    pitfalls: [['未排序就 shift', '先按实体键和时间建立稳定顺序。'], ['多用户数据未 groupby', '每个用户应独立 shift/cumsum。'], ['rank 并列规则不明确', '根据业务选择 dense/min/first。']], exercises: [['计算增长率？', 'pct_change。', "df['value'].pct_change()"], ['每用户累计金额？', 'groupby 后 cumsum。', "df.groupby('user_id')['amount'].cumsum()"], ['diff 为什么首行 NaN？', '没有上一行可相减。', '首行缺少前一期基准。']], checklist: ['理解 shift 对齐', '能手算 diff', '会组内累计', '会选择排名规则'],
  },
  {
    id: 'pandas-reshape', title: 'pivot / pivot_table / melt', subtitle: '在长表与宽表之间转换', visualType: 'pivot',
    scenario: '绘图需要月×品类矩阵，建模又常需要一行一个观测的长表。', question: '怎样改变数据形状而不改变业务事实？', reason: '重塑让同一数据适配报表、绘图和建模。',
    concepts: [['pivot', '唯一组合下的长转宽。', '键组合无重复时。'], ['pivot_table', '允许重复并聚合。', '制作交叉指标表时。'], ['melt', '把多列还原为变量和值。', '宽转长时。']],
    code: "wide = sales.pivot_table(index='city', columns='product', values='amount', aggfunc='sum', fill_value=0)\nresult = wide.reset_index()", sql: "SELECT city,SUM(CASE WHEN product='A' THEN amount ELSE 0 END) A,... FROM sales GROUP BY city;", original: [table('sales', ['city', 'product', 'amount'], [['上海', 'A', 100], ['上海', 'B', 80], ['北京', 'A', 60]])], middle: table('groups', ['city-product', 'amounts'], [['上海-A', '100'], ['上海-B', '80'], ['北京-A', '60']]), final: table('result', ['city', 'A', 'B'], [['上海', 100, 80], ['北京', 60, 0]]), middleTitle: '建立行列组合', middleDetail: 'city 成为行键，product 成为列键，重复组合先聚合。',
    pitfalls: [['pivot 遇到重复键报错', '有重复时使用 pivot_table 并指定 aggfunc。'], ['透视后多层索引难用', 'reset_index 并整理列名。'], ['fill_value 改变缺失含义', '确认空组合是否真的应当为0。']], exercises: [['宽转长使用什么？', 'melt。', 'df.melt(id_vars=...)'], ['pivot 与 pivot_table 区别？', '后者支持聚合。', '重复键时用 pivot_table。'], ['透视结果为什么常 reset_index？', '让索引键恢复普通列。', '便于 merge 和导出。']], checklist: ['会判断长宽结构', '会选择 pivot/pivot_table', '会使用 melt', '会处理透视后的索引'],
  },
  {
    id: 'pandas-cleaning-project', title: '综合数据清洗', subtitle: '把脏数据变成可信分析表', visualType: 'cleaning',
    scenario: '原始销售文件包含重复订单、空金额、城市空格和错误日期。', question: '如何设计可检查、可复现的清洗流水线？', reason: '真实工作的大部分时间用于把输入变成可信数据。',
    concepts: [['审计', '先量化缺失、重复、类型和极值。', '修改任何数据前。'], ['分步清洗', '每步只处理一类问题并检查行数。', '复杂清洗任务。'], ['质量断言', '验证唯一键、非空和范围。', '交付分析表前。']],
    code: "clean = raw.drop_duplicates('order_id').copy()\nclean['city'] = clean['city'].str.strip()\nclean['amount'] = clean['amount'].fillna(0)\nresult = clean", sql: 'WITH clean AS (SELECT DISTINCT order_id,TRIM(city),COALESCE(amount,0) FROM raw) SELECT * FROM clean;', original: [table('raw', ['order_id', 'city', 'amount'], [[1, ' 上海 ', 100], [1, ' 上海 ', 100], [2, '北京', null], [3, '深圳 ', 80]])], middle: table('deduplicated', ['order_id', 'city', 'amount'], [[1, ' 上海 ', 100], [2, '北京', null], [3, '深圳 ', 80]]), final: table('result', ['order_id', 'city', 'amount'], [[1, '上海', 100], [2, '北京', 0], [3, '深圳', 80]]), middleTitle: '按业务键去重', middleDetail: '行数从4变3，并保留每个 order_id 一行。',
    pitfalls: [['清洗前不保留原始数据', '使用 copy 并记录每步变化。'], ['同时做太多转换', '拆分步骤，逐步验证。'], ['没有质量断言', '检查唯一键、非空率和取值范围。']], exercises: [['检查重复订单数？', 'duplicated 后 sum。', "raw.duplicated('order_id').sum()"], ['验证 order_id 唯一？', 'nunique 与行数比较。', "clean['order_id'].nunique() == len(clean)"], ['为什么记录行数变化？', '发现意外丢行或扩行。', '每步记录 before/after rows。']], checklist: ['会先审计再清洗', '会分步转换', '会记录行数变化', '会编写质量断言'],
  },
  {
    id: 'pandas-analysis-case', title: '综合数据分析案例', subtitle: '从业务问题到指标与结论', visualType: 'analysis',
    scenario: '管理者想知道销售规模、活跃用户、复购和城市差异，需要把多张表组织成分析流程。', question: '怎样从模糊需求得到可复核的数据结论？', reason: '真正的数据能力是定义口径、构建中间表、验证结果并解释业务。',
    concepts: [['定义指标', '写清分子、分母、时间范围和粒度。', '动手编码前。'], ['构建分析层', '清洗→明细→指标→报告。', '多步骤项目。'], ['解释与验证', '把数值转成结论并说明限制。', '交付分析时。']],
    code: "paid = orders.query(\"amount > 0\")\nmetrics = paid.groupby('user_id',as_index=False).agg(orders=('order_id','size'),revenue=('amount','sum'))\nresult = metrics.merge(people,on='user_id',how='left')", sql: 'WITH metrics AS (SELECT user_id,COUNT(*) orders,SUM(amount) revenue FROM orders WHERE amount>0 GROUP BY user_id) SELECT * FROM metrics JOIN people USING(user_id);', original: [people, orders], middle: table('metrics', ['user_id', 'orders', 'revenue'], [[1, 2, 180], [2, 1, 120], [3, 1, 160]]), final: table('result', ['user_id', 'orders', 'revenue', 'name', 'city', 'age'], [[1, 2, 180, 'Ada', '上海', 22], [2, 1, 120, 'Bo', '北京', 19], [3, 1, 160, 'Chen', '上海', 27]]), middleTitle: '建立用户指标层', middleDetail: '订单明细聚合为一位用户一行，为后续画像连接确定粒度。',
    pitfalls: [['需求没有明确口径', '先写指标定义和结果粒度。'], ['只检查最终表', '每个中间 DataFrame 都检查行数、键和缺失。'], ['把相关当因果', '结论中区分描述、相关与因果。']], exercises: [['客单价如何定义？', '先明确分母是订单。', 'GMV / 有效订单数'], ['复购率分母是什么？', '所有购买用户。', '订单数>=2用户 / 购买用户'], ['怎样交付可复核结果？', '保留代码、输入版本和质量检查。', '分析流程、指标表、结论与限制一起交付。']], checklist: ['能定义业务指标', '会构建分层 DataFrame', '会验证中间结果', '能解释结论与限制'],
  },
]

export const pandasChapters = specs.map(buildChapter)
