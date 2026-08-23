import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectDirectory = resolve(scriptDirectory, '..')
const outputDirectory = join(projectDirectory, 'dist')
const builtHtmlPath = join(outputDirectory, 'app.html')

let html = await readFile(builtHtmlPath, 'utf8')

html = await replaceAsync(
  html,
  /<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  async (_tag, assetPath) => {
    const css = await readAsset(assetPath)
    return `<style>\n${css.replaceAll('</style', '<\\/style')}\n</style>`
  },
)

html = await replaceAsync(
  html,
  /<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
  async (_tag, assetPath) => {
    const javascript = await readAsset(assetPath)
    return `<script type="module">\n${javascript.replaceAll('</script', '<\\/script')}\n</script>`
  },
)

html = html.replace(
  '<head>',
  '<head>\n    <!-- 可直接双击打开；由 npm run build 自动生成，请勿手动编辑。 -->',
)

await writeFile(join(projectDirectory, 'index.html'), html, 'utf8')
await writeFile(join(outputDirectory, 'index.html'), html, 'utf8')

async function readAsset(assetPath) {
  const relativePath = assetPath.replace(/^\.?\//, '').replace(/^\//, '')
  return readFile(join(outputDirectory, relativePath), 'utf8')
}

async function replaceAsync(source, pattern, replacer) {
  const matches = [...source.matchAll(pattern)]
  const replacements = await Promise.all(matches.map((match) => replacer(...match)))
  let index = 0
  return source.replace(pattern, () => replacements[index++])
}
