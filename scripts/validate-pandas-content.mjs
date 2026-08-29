import fs from 'node:fs'
import path from 'node:path'
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
  if (chapter.concepts?.length < 3 || chapter.steps?.length < 2 || chapter.mistakes?.length < 3 || chapter.exercises?.length < 3 || chapter.checklist?.length < 4) fail(`${chapter.id} 教学结构不完整`)
  if (!chapter.code || !chapter.sqlComparison) fail(`${chapter.id} 缺少 Pandas/SQL 对照`)
  chapter.original?.forEach((table, tableIndex) => validateTable(table, `${chapter.id} 原始表${tableIndex + 1}`))
  chapter.steps?.forEach((step, stepIndex) => validateTable(step.table, `${chapter.id} 中间表${stepIndex + 1}`))
  validateTable(chapter.finalTable, `${chapter.id} 最终表`)
})

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

if (dualAnalysisCases.length !== 3) fail(`双语言案例应为3个，当前${dualAnalysisCases.length}个`)
dualAnalysisCases.forEach((item) => {
  if (item.stages?.length !== 3) fail(`${item.id} 应有3个分析阶段`)
  item.stages?.forEach((stage, index) => {
    if (!stage.sql || !stage.pandas || !stage.conclusion) fail(`${item.id} 阶段${index + 1}不完整`)
    validateTable(stage.result, `${item.id} 阶段${index + 1}结果`)
  })
})

if (errors.length) {
  console.error(`Pandas 内容校验失败（${errors.length}项）：`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}
console.log('Pandas 内容校验通过：15章，30题（简单10 / 中等16 / 困难4）。')
console.log(`SQL ↔ Pandas 对照 ${crossLanguageMappings.length} 组，核心可视化 ${pandasPlaygroundScenarios.length} 个，双语言案例 ${dualAnalysisCases.length} 个。`)
