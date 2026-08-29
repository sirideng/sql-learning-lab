import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/services/storage.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

const oldProgress = {
  'next-day-retention': {
    completed: false,
    attempts: 3,
    incorrectAttempts: 2,
    draft: 'SELECT ...',
    lastIncorrectSql: 'SELECT wrong',
  },
}
const values = new Map([
  ['sql-learning-lab:progress:v1', JSON.stringify(oldProgress)],
  ['sql-learning-lab:activity:v1', JSON.stringify(['2026-08-27'])],
  ['sql-learning-lab:schema-version', '1'],
])
const localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
}
const module = { exports: {} }
vm.runInNewContext(compiled, { module, exports: module.exports, localStorage, console, Date, Intl })

const storage = module.exports
const migrated = storage.loadProgress()
assert.equal(migrated['next-day-retention'].draft, 'SELECT ...')
assert.equal(migrated['next-day-retention'].lastIncorrectCode, 'SELECT wrong')
assert.equal(migrated['next-day-retention'].language, 'sql')
assert.equal(values.get('sql-learning-lab:schema-version'), '2')

const activity = storage.loadActivity(migrated)
assert.equal(activity['2026-08-27'], 1)
assert.equal(values.get('sql-learning-lab:activity-counts-migrated:v2'), '1')

console.log('localStorage 兼容校验通过：旧 SQL 进度、草稿、错题和活动记录均完成无损迁移。')
