import type { DataTable, DualAnalysisCase } from '../types/problem'

const table = (name: string, columns: string[], rows: DataTable['rows']): DataTable => ({ name, columns, rows })

export const dualAnalysisCases: DualAnalysisCase[] = [
  {
    id: 'commerce', title: '电商销售分析', description: '从订单清洗到 GMV、客单价和复购用户，建立可复核的销售指标层。',
    tables: [table('orders', ['order_id', 'user_id', 'amount', 'status'], [[1, 10, 120, 'paid'], [2, 10, 80, 'paid'], [3, 11, 200, 'cancelled'], [4, 12, 160, 'paid']])],
    stages: [
      { title: '清洗有效订单', purpose: '统一只使用 paid 订单。', sql: "SELECT * FROM orders WHERE status='paid'", pandas: "paid = orders.query(\"status == 'paid'\")", result: table('paid', ['order_id', 'user_id', 'amount'], [[1, 10, 120], [2, 10, 80], [4, 12, 160]]), conclusion: '取消订单不进入收入指标。' },
      { title: '计算用户指标', purpose: '建立一位用户一行的消费层。', sql: 'SELECT user_id,COUNT(*) orders,SUM(amount) revenue FROM paid GROUP BY user_id', pandas: "metrics=paid.groupby('user_id',as_index=False).agg(orders=('order_id','size'),revenue=('amount','sum'))", result: table('metrics', ['user_id', 'orders', 'revenue'], [[10, 2, 200], [12, 1, 160]]), conclusion: '用户10产生复购，贡献200收入。' },
      { title: '汇总业务指标', purpose: '输出 GMV、订单数、客单价和复购用户。', sql: 'SELECT SUM(revenue) gmv,SUM(orders) order_count,SUM(revenue)/SUM(orders) aov,SUM(orders>=2) repeat_buyers FROM metrics', pandas: "summary=pd.DataFrame({'gmv':[metrics.revenue.sum()],'order_count':[metrics.orders.sum()],'aov':[metrics.revenue.sum()/metrics.orders.sum()],'repeat_buyers':[(metrics.orders>=2).sum()]})", result: table('summary', ['gmv', 'order_count', 'aov', 'repeat_buyers'], [[360, 3, 120, 1]]), conclusion: 'GMV为360，客单价120，1位用户发生复购。' },
      { title: '生成销售分析图', purpose: '把 Pandas 汇总结果转换为可交付图表。', sql: "SELECT user_id,SUM(amount) revenue FROM orders WHERE status='paid' GROUP BY user_id ORDER BY user_id", pandas: "user_revenue=paid.groupby('user_id',as_index=False).agg(revenue=('amount','sum'))", matplotlib: "fig, ax = plt.subplots()\nax.bar(user_revenue['user_id'].astype(str), user_revenue['revenue'])\nax.set(title='购买用户销售贡献', xlabel='用户', ylabel='销售额')\nfig.tight_layout()", chartSummary: '柱状图显示用户10贡献200销售额，用户12贡献160销售额。', relatedMatplotlibLesson: 'line-bar', result: table('user_revenue', ['user_id', 'revenue'], [[10, 200], [12, 160]]), conclusion: '用户10贡献更高且发生复购，可进一步分析其商品偏好。' },
    ],
  },
  {
    id: 'retention', title: '用户留存分析', description: '从活动日志定义 DAU、首日和次日留存，理解日期对齐。',
    tables: [table('activity', ['user_id', 'event_date'], [[1, '2024-01-01'], [1, '2024-01-02'], [2, '2024-01-01'], [2, '2024-01-03'], [3, '2024-01-02']])],
    stages: [
      { title: '计算 DAU', purpose: '每天对 user_id 去重。', sql: 'SELECT event_date,COUNT(DISTINCT user_id) dau FROM activity GROUP BY event_date', pandas: "dau=activity.groupby('event_date',as_index=False).agg(dau=('user_id','nunique'))", result: table('dau', ['event_date', 'dau'], [['2024-01-01', 2], ['2024-01-02', 2], ['2024-01-03', 1]]), conclusion: '1月1日和2日各有2位活跃用户。' },
      { title: '定位每位用户首日', purpose: '得到留存观察起点。', sql: 'SELECT user_id,MIN(event_date) first_date FROM activity GROUP BY user_id', pandas: "first=activity.groupby('user_id',as_index=False).agg(first_date=('event_date','min'))", result: table('first', ['user_id', 'first_date'], [[1, '2024-01-01'], [2, '2024-01-01'], [3, '2024-01-02']]), conclusion: '留存分母为3位首日用户。' },
      { title: '计算次日留存', purpose: '首日+1天与活动日志对齐。', sql: 'SELECT ROUND(COUNT(a.user_id)/COUNT(*),3) retention FROM first f LEFT JOIN activity a ON ...', pandas: "matched=first.merge(activity,left_on=['user_id','next_date'],right_on=['user_id','event_date'],how='left')", result: table('result', ['retained_users', 'cohort_users', 'retention_rate'], [[1, 3, 0.333]]), conclusion: '只有用户1次日回来，次日留存率33.3%。' },
    ],
  },
  {
    id: 'students', title: '学生成绩分析', description: '清洗缺失成绩，计算班级均分和学生排名。',
    tables: [table('scores', ['student_id', 'class_id', 'subject', 'score'], [[1, 'A', 'math', 90], [2, 'A', 'math', 80], [3, 'B', 'math', null], [4, 'B', 'math', 70]])],
    stages: [
      { title: '处理缺失成绩', purpose: '缺失记录不进入均分，但保留质量统计。', sql: 'SELECT * FROM scores WHERE score IS NOT NULL', pandas: "valid=scores.dropna(subset=['score'])", result: table('valid', ['student_id', 'class_id', 'subject', 'score'], [[1, 'A', 'math', 90], [2, 'A', 'math', 80], [4, 'B', 'math', 70]]), conclusion: '学生3缺失成绩，需要单独反馈数据质量。' },
      { title: '计算班级均分', purpose: '从学生粒度聚合到班级粒度。', sql: 'SELECT class_id,AVG(score) avg_score FROM valid GROUP BY class_id', pandas: "class_avg=valid.groupby('class_id',as_index=False).agg(avg_score=('score','mean'))", result: table('class_avg', ['class_id', 'avg_score'], [['A', 85], ['B', 70]]), conclusion: 'A班均分85，高于B班。' },
      { title: '生成学生排名', purpose: '在班级内比较学生表现。', sql: 'SELECT *,RANK() OVER(PARTITION BY class_id ORDER BY score DESC) class_rank FROM valid', pandas: "valid['class_rank']=valid.groupby('class_id')['score'].rank(method='min',ascending=False)", result: table('ranked', ['student_id', 'class_id', 'score', 'class_rank'], [[1, 'A', 90, 1], [2, 'A', 80, 2], [4, 'B', 70, 1]]), conclusion: '排名必须在班级内计算，不能直接比较不同班级。' },
    ],
  },
  {
    id: 'cleaning', title: '综合数据清洗', description: '把格式不一致、字段缺失和重复的客户数据整理成可信分析表。',
    tables: [table('customers_raw', ['customer_id', 'city', 'phone', 'signup_date'], [[1, ' shanghai ', '13812345678', '2024/01/02'], [1, ' shanghai ', '13812345678', '2024/01/02'], [2, 'BEIJING', null, '2024-01-03'], [3, '', '13987654321', '2024/01/04']])],
    stages: [
      { title: '去重并统一文本', purpose: '先建立稳定主键，再标准化城市字段。', sql: "SELECT DISTINCT customer_id,UPPER(TRIM(city)) city,phone,signup_date FROM customers_raw", pandas: "clean=(customers_raw.drop_duplicates('customer_id').assign(city=lambda x:x.city.str.strip().str.upper()))", result: table('clean_step_1', ['customer_id', 'city', 'phone', 'signup_date'], [[1, 'SHANGHAI', '13812345678', '2024/01/02'], [2, 'BEIJING', null, '2024-01-03'], [3, '', '13987654321', '2024/01/04']]), conclusion: '重复客户被移除，城市值可以稳定分组。' },
      { title: '处理缺失与日期', purpose: '区分未知值并把日期转为统一类型。', sql: "SELECT customer_id,COALESCE(NULLIF(city,''),'UNKNOWN') city,phone,STR_TO_DATE(REPLACE(signup_date,'/','-'),'%Y-%m-%d') signup_date FROM clean_step_1", pandas: "clean['city']=clean.city.replace('',pd.NA).fillna('UNKNOWN'); clean['signup_date']=pd.to_datetime(clean.signup_date)", result: table('clean_step_2', ['customer_id', 'city', 'phone', 'signup_date'], [[1, 'SHANGHAI', '13812345678', '2024-01-02'], [2, 'BEIJING', null, '2024-01-03'], [3, 'UNKNOWN', '13987654321', '2024-01-04']]), conclusion: '空城市被明确标记，日期可以参与时间计算。' },
      { title: '生成可交付字段', purpose: '对敏感手机号脱敏并输出质量状态。', sql: "SELECT customer_id,city,CONCAT(LEFT(phone,3),'****',RIGHT(phone,4)) phone_masked,IF(phone IS NULL,'missing','ok') quality FROM clean_step_2", pandas: "clean['phone_masked']=clean.phone.str[:3]+'****'+clean.phone.str[-4:]; clean['quality']=clean.phone.isna().map({True:'missing',False:'ok'})", result: table('customers_clean', ['customer_id', 'city', 'phone_masked', 'quality'], [[1, 'SHANGHAI', '138****5678', 'ok'], [2, 'BEIJING', null, 'missing'], [3, 'UNKNOWN', '139****4321', 'ok']]), conclusion: '最终表可安全用于地域分析，同时保留数据质量标记。' },
    ],
  },
]
