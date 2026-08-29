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

function validTable(table, label) {
  if (!table?.name || !Array.isArray(table.columns) || !Array.isArray(table.rows)) return fail(`${label} 数据表无效`)
  table.rows.forEach((row, index) => { if (row.length !== table.columns.length) fail(`${label} 第${index + 1}行字段数量错误`) })
}

const { matplotlibChapters, matplotlibQuestions } = await importTypescript('src/data/matplotlibLearning.ts')

if (matplotlibChapters.length !== 5) fail(`Matplotlib 短课应为5节，当前${matplotlibChapters.length}节`)
if (matplotlibQuestions.length !== 8) fail(`Matplotlib 练习应为8题，当前${matplotlibQuestions.length}题`)
if (new Set(matplotlibChapters.map((item) => item.id)).size !== 5) fail('Matplotlib 章节 id 重复')
if (new Set(matplotlibQuestions.map((item) => item.id)).size !== 8) fail('Matplotlib 题目 id 重复')

matplotlibChapters.forEach((chapter, index) => {
  if (chapter.order !== index + 1) fail(`${chapter.id} 章节顺序错误`)
  if (!chapter.why?.scenario || !chapter.why?.question || !chapter.why?.reason) fail(`${chapter.id} 缺少真实场景`)
  if (chapter.concepts?.length !== 3 || chapter.mistakes?.length !== 2 || chapter.exercises?.length !== 3) fail(`${chapter.id} 教学结构不是3概念/2错误/3检查`)
  if (!chapter.code || !chapter.practiceIds?.length) fail(`${chapter.id} 缺少代码或配套练习`)
  chapter.original?.forEach((table, tableIndex) => validTable(table, `${chapter.id} 输入表${tableIndex + 1}`))
  chapter.practiceIds.forEach((id) => { if (!matplotlibQuestions.some((question) => question.id === id)) fail(`${chapter.id} 引用不存在的练习 ${id}`) })
})

matplotlibQuestions.forEach((question, index) => {
  for (const field of ['id','title','source','chapter','language','difficulty','tags','description','tables','sampleData','expectedOutput','hints','solution','explanation','visualizationSteps','expectedChart']) {
    if (question[field] == null || (Array.isArray(question[field]) && !question[field].length)) fail(`Matplotlib 题目${index + 1}缺少${field}`)
  }
  if (question.language !== 'matplotlib') fail(`${question.id} language 必须为 matplotlib`)
  if (question.number !== index + 31) fail(`${question.id} 题号应为${index + 31}`)
  question.tables.forEach((table, tableIndex) => validTable(table, `${question.id} 输入表${tableIndex + 1}`))
  validTable(question.expectedOutput, `${question.id} expected output`)
  const source = question.solution.toLowerCase()
  for (const column of [...question.expectedChart.expectation.xColumns, ...question.expectedChart.expectation.yColumns]) if (!source.includes(column.toLowerCase())) fail(`${question.id} 参考答案未使用字段 ${column}`)
})

const pythonProgram = String.raw`
import io, json, sys
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.figure import Figure

questions=json.load(sys.stdin)
failures=[]
for q in questions:
    env={'pd':pd,'plt':plt}
    for table in q['tables']:
        env[table['name']]=pd.DataFrame(table['rows'],columns=table['columns'])
    plt.close('all')
    called=[False]
    original=Figure.savefig
    def tracked(self,*args,**kwargs):
        called[0]=True
        return original(self,io.BytesIO(),format='png')
    Figure.savefig=tracked
    try:
        exec(compile(q['solution'],'solution.py','exec'),env)
        nums=plt.get_fignums()
        if not nums: raise AssertionError('没有创建 Figure')
        fig=plt.figure(nums[-1]); axes=fig.axes; expected=q['expectedChart']['expectation']
        if expected.get('axesCount') and len(axes)!=expected['axesCount']: raise AssertionError(f"子图数量 {len(axes)}")
        if expected.get('requiresTitle') and not any(ax.get_title().strip() for ax in axes): raise AssertionError('缺少标题')
        if expected.get('requiresXLabel') and not any(ax.get_xlabel().strip() for ax in axes): raise AssertionError('缺少x轴标签')
        if expected.get('requiresYLabel') and not all(ax.get_ylabel().strip() for ax in axes): raise AssertionError('缺少y轴标签')
        if expected.get('requiresLegend') and not any(ax.get_legend() for ax in axes): raise AssertionError('缺少图例')
        if expected.get('requiresAnnotation') and not any(ax.texts for ax in axes): raise AssertionError('缺少标注')
        if expected.get('requiresSave') and not called[0]: raise AssertionError('缺少导出')
        buffer=io.BytesIO(); original(fig,buffer,format='png',dpi=80)
        if len(buffer.getvalue())<1000: raise AssertionError('图像输出无效')
    except Exception as error:
        failures.append(f"{q['id']}: {error}")
    finally:
        Figure.savefig=original
        plt.close('all')
if failures:
    print('\n'.join(failures),file=sys.stderr);sys.exit(1)
print(len(questions))
`

const python = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'python' : 'python3')
const dependencyProbe = spawnSync(python, ['-X', 'utf8', '-c', 'import pandas, matplotlib'], { encoding: 'utf8' })
let runtimeAudited = false
if (dependencyProbe.status === 0) {
  const run = spawnSync(python, ['-X', 'utf8', '-c', pythonProgram], { input: JSON.stringify(matplotlibQuestions), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  if (run.status !== 0) fail(`Matplotlib 参考答案真实运行失败：${run.stderr.trim() || run.error?.message || '未知错误'}`)
  else runtimeAudited = true
}

if (errors.length) {
  console.error(`Matplotlib 内容校验失败（${errors.length}项）：`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}
console.log('Matplotlib 内容校验通过：5节短课，8道练习。')
console.log(runtimeAudited ? '8道参考答案已在真实 Pandas / Matplotlib 环境中执行，并成功生成图像。' : '本机未安装 Matplotlib；参考答案已完成静态字段与结构校验，浏览器真实运行由 Pyodide 集成测试覆盖。')
