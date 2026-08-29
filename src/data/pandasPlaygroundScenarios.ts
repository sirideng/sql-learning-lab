import type { DataTable, PandasPlaygroundScenario } from '../types/problem'

const table = (name: string, columns: string[], rows: DataTable['rows']): DataTable => ({ name, columns, rows })

export const pandasPlaygroundScenarios: PandasPlaygroundScenario[] = [
  {
    id: 'filter', title: '条件筛选实验', concept: 'Boolean Filtering', code: "result = users.loc[users['age'] > 20]", requiredPatterns: ['loc', 'age'], explanation: '布尔 Series 与原索引对齐，True 行保留，False 行消失。',
    tables: [table('users', ['id', 'name', 'age'], [[1, 'A', 18], [2, 'B', 22], [3, 'C', 25]])],
    steps: [{ title: '布尔条件', goal: "计算 users['age'] > 20", detail: '逐行得到 False、True、True。', table: table('mask', ['row', 'result'], [[0, 'False'], [1, 'True'], [2, 'True']]) }, { title: '应用 mask', goal: '只保留 True 行', detail: 'id=1 的 False 行被移除。', table: table('filtered', ['id', 'name', 'age'], [[2, 'B', 22], [3, 'C', 25]]) }],
    result: table('result', ['id', 'name', 'age'], [[2, 'B', 22], [3, 'C', 25]]),
  },
  {
    id: 'groupby', title: 'groupby 聚合实验', concept: 'groupby + mean', code: "result = employees.groupby('department', as_index=False).agg(avg_salary=('salary','mean'))", requiredPatterns: ['groupby', 'mean'], explanation: '先把行拆进部门桶，再对每个桶独立求平均。',
    tables: [table('employees', ['id', 'department', 'salary'], [[1, 'A', 8000], [2, 'A', 10000], [3, 'B', 9000]])],
    steps: [{ title: '按部门分组', goal: '明确每组包含哪些行', detail: 'A组两行，B组一行。', table: table('groups', ['department', 'salaries'], [['A', '8000,10000'], ['B', '9000']]) }, { title: '每组求 mean', goal: '从明细变为部门粒度', detail: 'A=(8000+10000)/2。', table: table('aggregated', ['department', 'avg_salary'], [['A', 9000], ['B', 9000]]) }],
    result: table('result', ['department', 'avg_salary'], [['A', 9000], ['B', 9000]]),
  },
  {
    id: 'merge', title: 'left merge 实验', concept: 'merge', code: "result = users.merge(scores, on='id', how='left')", requiredPatterns: ['merge', 'left'], explanation: '逐个读取左表 id；一对多会扩行，未匹配会生成 NaN。',
    tables: [table('users', ['id', 'name'], [[1, 'Ada'], [2, 'Bo'], [3, 'Chen']]), table('scores', ['id', 'score'], [[1, 80], [1, 95], [2, 88]])],
    steps: [{ title: '逐行匹配连接键', goal: '比较 users.id 与 scores.id', detail: 'id=1匹配两行，id=3没有匹配。', table: table('matching', ['left.id', 'left.name', 'right.rows'], [[1, 'Ada', '80,95'], [2, 'Bo', '88'], [3, 'Chen', null]]) }, { title: '展开完整结果', goal: '保留左表全部行', detail: 'Ada扩成两行，Chen右侧为NaN。', table: table('merged', ['left.id', 'left.name', 'right.id', 'right.score'], [[1, 'Ada', 1, 80], [1, 'Ada', 1, 95], [2, 'Bo', 2, 88], [3, 'Chen', null, null]]) }],
    result: table('result', ['id', 'name', 'score'], [[1, 'Ada', 80], [1, 'Ada', 95], [2, 'Bo', 88], [3, 'Chen', null]]),
  },
  {
    id: 'diff', title: 'shift / diff 实验', concept: 'diff', code: "result = weather.assign(change=weather['temperature'].diff())", requiredPatterns: ['diff', 'temperature'], explanation: 'diff 等于当前行减去 shift(1) 后的上一行。',
    tables: [table('weather', ['day', 'temperature'], [[1, 10], [2, 25], [3, 20], [4, 30]])],
    steps: [{ title: '生成上一行', goal: 'temperature.shift(1)', detail: '第一行没有上一行，因此是 NaN。', table: table('shifted', ['current', 'previous'], [[10, null], [25, 10], [20, 25], [30, 20]]) }, { title: '当前行减上一行', goal: '计算 change', detail: '25-10=15，20-25=-5。', table: table('diff', ['temperature', 'change'], [[10, null], [25, 15], [20, -5], [30, 10]]) }],
    result: table('result', ['day', 'temperature', 'change'], [[1, 10, null], [2, 25, 15], [3, 20, -5], [4, 30, 10]]),
  },
  {
    id: 'transform', title: 'transform 广播实验', concept: 'groupby + transform', code: "result = employees.assign(dept_avg=employees.groupby('department')['salary'].transform('mean'))", requiredPatterns: ['groupby', 'transform'], explanation: '先得到部门平均值，再按原索引广播，结果行数不变。',
    tables: [table('employees', ['id', 'department', 'salary'], [[1, 'A', 8000], [2, 'A', 10000], [3, 'B', 9000]])],
    steps: [{ title: '计算组平均值', goal: '每部门得到一个值', detail: 'A与B的平均值均为9000。', table: table('group means', ['department', 'mean'], [['A', 9000], ['B', 9000]]) }, { title: '广播回原行', goal: '保持员工粒度', detail: 'A组均得到9000，原来3行仍是3行。', table: table('broadcast', ['id', 'department', 'salary', 'dept_avg'], [[1, 'A', 8000, 9000], [2, 'A', 10000, 9000], [3, 'B', 9000, 9000]]) }],
    result: table('result', ['id', 'department', 'salary', 'dept_avg'], [[1, 'A', 8000, 9000], [2, 'A', 10000, 9000], [3, 'B', 9000, 9000]]),
  },
]
