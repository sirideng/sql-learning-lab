import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const fail = (message) => errors.push(message)

async function importTypescript(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)
}

function validateTable(table, label) {
  if (!table?.name || !Array.isArray(table.columns) || !Array.isArray(table.rows)) return fail(`${label} 不是有效数据表`)
  if (new Set(table.columns).size !== table.columns.length) fail(`${label} 存在重复字段`)
  table.rows.forEach((row, index) => { if (!Array.isArray(row) || row.length !== table.columns.length) fail(`${label} 第${index + 1}行字段数量错误`) })
}

function validatePandasReferences(chapter) {
  const knownVariables = new Set(['pd', 'np', ...chapter.original.map((table) => table.name.match(/^[A-Za-z_]\w*/)?.[0]).filter(Boolean)])
  const tableColumns = new Map(chapter.original.map((table) => [table.name.match(/^[A-Za-z_]\w*/)?.[0], new Set(table.columns)]))
  for (const [lineIndex, line] of chapter.code.split('\n').entries()) {
    for (const match of line.matchAll(/(?<!\.)\b([A-Za-z_]\w*)\s*(?:\.|\[)/g)) {
      const variable = match[1]
      if (!knownVariables.has(variable)) fail(`${chapter.id} 第${lineIndex + 1}行引用未定义 DataFrame 变量 ${variable}`)
    }
    for (const match of line.matchAll(/\b([A-Za-z_]\w*)\[['"]([^'"]+)['"]\]/g)) {
      const columns = tableColumns.get(match[1])
      if (columns && !columns.has(match[2])) fail(`${chapter.id} 引用不存在的字段 ${match[1]}.${match[2]}`)
    }
    const assigned = line.match(/^\s*([A-Za-z_]\w*)\s*=/)?.[1]
    if (assigned) knownVariables.add(assigned)
  }
  if (!knownVariables.has('result')) fail(`${chapter.id} 主示例没有生成 result`)
}

function findPython() {
  const requested = process.env.PYTHON_EXECUTABLE
  const candidates = requested ? [requested] : process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python']
  for (const command of candidates) {
    const args = command === 'py' ? ['-3', '--version'] : ['--version']
    const probe = spawnSync(command, args, { encoding: 'utf8' })
    if (!probe.error && probe.status === 0) return { command, prefix: command === 'py' ? ['-3'] : [] }
  }
  if (requested) fail(`PYTHON_EXECUTABLE 无法运行：${requested}`)
  return undefined
}

function auditPandasRuntime(chapters) {
  const python = findPython()
  if (!python) return 0
  const program = String.raw`
import json, sys
import numpy as np
import pandas as pd

def normalize(value):
    if value is None or pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.strftime('%Y-%m-%d') if value.time() == pd.Timestamp(value.date()).time() else value.isoformat()
    if isinstance(value, pd.Period):
        return str(value)
    if isinstance(value, np.generic):
        return value.item()
    return value

def equal(actual, expected):
    if actual is None or expected is None:
        return actual is expected
    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        return abs(float(actual) - float(expected)) < 1e-6
    return actual == expected

chapters = json.load(sys.stdin)
failures = []
for chapter in chapters:
    env = {'pd': pd, 'np': np}
    for table in chapter['original']:
        name = table['name'].split()[0]
        env[name] = pd.DataFrame(table['rows'], columns=table['columns'])
    try:
        exec(chapter['code'], env)
        result = env.get('result')
        if isinstance(result, pd.Series):
            result = result.to_frame()
        if not isinstance(result, pd.DataFrame):
            raise TypeError('result 不是 DataFrame')
        result = result.reset_index(drop=True)
        columns = [str(column) for column in result.columns]
        expected = chapter['finalTable']
        rows = [[normalize(value) for value in row] for row in result.itertuples(index=False, name=None)]
        if columns != expected['columns']:
            raise AssertionError(f"字段不一致：{columns} != {expected['columns']}")
        if len(rows) != len(expected['rows']):
            raise AssertionError(f"行数不一致：{len(rows)} != {len(expected['rows'])}")
        for index, (actual_row, expected_row) in enumerate(zip(rows, expected['rows'])):
            if len(actual_row) != len(expected_row) or not all(equal(a, b) for a, b in zip(actual_row, expected_row)):
                raise AssertionError(f"第 {index + 1} 行不一致：{actual_row} != {expected_row}")
    except Exception as error:
        failures.append(f"{chapter['id']}: {error}")
if failures:
    print('\n'.join(failures), file=sys.stderr)
    sys.exit(1)
print(len(chapters))
`
  const run = spawnSync(python.command, [...python.prefix, '-c', program], {
    input: JSON.stringify(chapters.map(({ id, code, original, finalTable }) => ({ id, code, original, finalTable }))),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  if (run.status !== 0) {
    fail(`Pandas 课程运行审计失败：${run.stderr.trim() || run.error?.message || '未知错误'}`)
    return 0
  }
  return Number(run.stdout.trim()) || 0
}

const [{ pandasQuestions }, { pandasChapters }, { crossLanguageMappings }, { pandasPlaygroundScenarios }, { dualAnalysisCases }] = await Promise.all([
  importTypescript('src/data/pandasQuestions.ts'),
  importTypescript('src/data/pandasLearningPath.ts'),
  importTypescript('src/data/crossLanguageMappings.ts'),
  importTypescript('src/data/pandasPlaygroundScenarios.ts'),
  importTypescript('src/data/dualAnalysisCases.ts'),
])

if (pandasQuestions.length !== 30) fail(`Pandas 题库应为30题，当前${pandasQuestions.length}题`)
if (new Set(pandasQuestions.map((item) => item.id)).size !== pandasQuestions.length) fail('Pandas 题目 id 重复')
const difficulty = Object.groupBy(pandasQuestions, (item) => item.difficulty)
if (difficulty['简单']?.length !== 10 || difficulty['中等']?.length !== 16 || difficulty['困难']?.length !== 4) fail(`难度分布错误：简单${difficulty['简单']?.length ?? 0} 中等${difficulty['中等']?.length ?? 0} 困难${difficulty['困难']?.length ?? 0}`)
pandasQuestions.forEach((item, index) => {
  const required = ['id', 'title', 'source', 'chapter', 'language', 'difficulty', 'tags', 'description', 'tables', 'sampleData', 'expectedOutput', 'hints', 'solution', 'explanation', 'visualizationSteps']
  required.forEach((field) => { if (item[field] == null || (Array.isArray(item[field]) && !item[field].length)) fail(`题目${index + 1}缺少${field}`) })
  if (item.language !== 'pandas') fail(`${item.id} language 必须为 pandas`)
  if (item.visualizationSteps?.length < 3) fail(`${item.id} 可视化步骤少于3步`)
  if (!item.validationPatterns?.length) fail(`${item.id} 缺少模拟器校验模式`)
  item.tables?.forEach((table, tableIndex) => validateTable(table, `${item.id} 输入表${tableIndex + 1}`))
  validateTable(item.expectedOutput, `${item.id} Expected Output`)
  item.visualizationSteps?.forEach((step, stepIndex) => { if (!step.title || !step.goal || !step.detail || !step.table) fail(`${item.id} 可视化步骤${stepIndex + 1}不完整`) })
})

if (pandasChapters.length !== 15) fail(`Pandas Learning Path 应为15章，当前${pandasChapters.length}章`)
pandasChapters.forEach((chapter, index) => {
  if (chapter.order !== index + 1) fail(`${chapter.id} 章节顺序错误`)
  if (!chapter.why?.scenario || !chapter.why?.question || !chapter.why?.reason) fail(`${chapter.id} 缺少为什么需要`)
  if (chapter.concepts?.length < 3 || chapter.steps?.length < 2 || chapter.mistakes?.length !== 2 || chapter.exercises?.length < 3 || chapter.checklist?.length < 4) fail(`${chapter.id} 教学结构不完整或常见错误不是恰好2个`)
  if (!chapter.code || !chapter.sqlComparison) fail(`${chapter.id} 缺少 Pandas/SQL 对照`)
  chapter.mistakes?.forEach((mistake, mistakeIndex) => {
    if (!mistake.title || !mistake.problem || !mistake.fix) fail(`${chapter.id} 常见错误${mistakeIndex + 1}字段不完整`)
    if (mistake.title.trim() === mistake.problem.trim()) fail(`${chapter.id} 常见错误${mistakeIndex + 1}标题与解释重复`)
    if (mistake.title.trim() === mistake.fix.trim()) fail(`${chapter.id} 常见错误${mistakeIndex + 1}标题与修正重复`)
  })
  validatePandasReferences(chapter)
  chapter.original?.forEach((table, tableIndex) => validateTable(table, `${chapter.id} 原始表${tableIndex + 1}`))
  chapter.steps?.forEach((step, stepIndex) => validateTable(step.table, `${chapter.id} 中间表${stepIndex + 1}`))
  validateTable(chapter.finalTable, `${chapter.id} 最终表`)
})

const runtimeAuditedChapters = auditPandasRuntime(pandasChapters)

if (crossLanguageMappings.length < 13) fail('SQL ↔ Pandas 对照少于13组')
crossLanguageMappings.forEach((item) => {
  if (!item.businessQuestion || !item.sql || !item.pandas || !item.relation) fail(`${item.id} 对照字段不完整`)
  item.tables.forEach((table, index) => validateTable(table, `${item.id} 输入表${index + 1}`))
  validateTable(item.sqlIntermediate, `${item.id} SQL中间表`)
  validateTable(item.pandasIntermediate, `${item.id} Pandas中间表`)
  validateTable(item.result, `${item.id} 最终结果`)
})

for (const id of ['filter', 'groupby', 'merge', 'diff', 'transform']) if (!pandasPlaygroundScenarios.some((item) => item.id === id)) fail(`Playground 缺少 ${id} 场景`)
pandasPlaygroundScenarios.forEach((item) => {
  if (!item.code || !item.requiredPatterns?.length || item.steps?.length < 2) fail(`${item.id} Playground 场景不完整`)
  item.tables.forEach((table, index) => validateTable(table, `${item.id} 输入表${index + 1}`))
  item.steps.forEach((step, index) => validateTable(step.table, `${item.id} 可视化${index + 1}`))
  validateTable(item.result, `${item.id} 结果`)
})

if (dualAnalysisCases.length !== 4) fail(`双语言案例应为4个，当前${dualAnalysisCases.length}个`)
dualAnalysisCases.forEach((item) => {
  const expectedStages = item.id === 'commerce' ? 4 : 3
  if (item.stages?.length !== expectedStages) fail(`${item.id} 应有${expectedStages}个分析阶段`)
  item.stages?.forEach((stage, index) => {
    if (!stage.sql || !stage.pandas || !stage.conclusion) fail(`${item.id} 阶段${index + 1}不完整`)
    validateTable(stage.result, `${item.id} 阶段${index + 1}结果`)
  })
  if (item.id === 'commerce' && !item.stages.at(-1)?.matplotlib) fail('电商案例缺少 Matplotlib 图表交付步骤')
})

if (errors.length) {
  console.error(`Pandas 内容校验失败（${errors.length}项）：`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}
console.log('Pandas 内容校验通过：15章，30题（简单10 / 中等16 / 困难4）。')
console.log(`${pandasChapters.length} 个 Pandas 主示例已检查变量、字段、result 与常见错误文案。`)
if (runtimeAuditedChapters) console.log(`${runtimeAuditedChapters} 个 Pandas 章节主示例已在真实 Pandas 环境中执行，并与输出表逐列一致。`)
console.log(`SQL ↔ Pandas 对照 ${crossLanguageMappings.length} 组，核心可视化 ${pandasPlaygroundScenarios.length} 个，双语言案例 ${dualAnalysisCases.length} 个。`)
