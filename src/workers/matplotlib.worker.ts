import type { DataTable } from '../types/problem'

const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'
const PYODIDE_MODULE = `${PYODIDE_BASE}pyodide.mjs`

type PyodideRuntime = {
  loadPackage: (packages: string[]) => Promise<void>
  globals: { set: (name: string, value: unknown) => void }
  runPythonAsync: (code: string) => Promise<unknown>
}

let runtime: PyodideRuntime | null = null
let initialization: Promise<void> | null = null

const workerScope = self as unknown as {
  postMessage: (message: unknown) => void
  onmessage: ((event: MessageEvent<{ type: 'init' } | { type: 'run'; id: number; code: string; tables: DataTable[] }>) => void) | null
}

function initialize() {
  if (initialization) return initialization
  initialization = (async () => {
    workerScope.postMessage({ type: 'status', message: '正在加载 Python 运行环境…' })
    const module = await import(/* @vite-ignore */ PYODIDE_MODULE) as { loadPyodide: (options: { indexURL: string }) => Promise<PyodideRuntime> }
    runtime = await module.loadPyodide({ indexURL: PYODIDE_BASE })
    workerScope.postMessage({ type: 'status', message: '正在加载 Pandas 与 Matplotlib…' })
    await runtime.loadPackage(['pandas', 'matplotlib'])
    workerScope.postMessage({ type: 'ready' })
  })()
  return initialization
}

const PYTHON_RUNNER = String.raw`
import base64, contextlib, io, json, traceback
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.figure import Figure

payload = json.loads(_dll_payload)
for table in payload['tables']:
    globals()[table['name']] = pd.DataFrame(table['rows'], columns=table['columns'])

code = payload['code']
blocked = ['requests', 'urllib', 'httpx', 'aiohttp', 'socket', 'pyodide.http', 'import js', 'from js']
if any(token in code.lower() for token in blocked):
    raise PermissionError('练习环境禁止代码发起外部网络请求。')

plt.close('all')
_dll_save_called = False
_dll_original_savefig = Figure.savefig
def _dll_tracked_savefig(self, *args, **kwargs):
    global _dll_save_called
    _dll_save_called = True
    return _dll_original_savefig(self, *args, **kwargs)
Figure.savefig = _dll_tracked_savefig

stdout = io.StringIO()
try:
    with contextlib.redirect_stdout(stdout):
        exec(compile(code, 'solution.py', 'exec'), globals())
finally:
    Figure.savefig = _dll_original_savefig

figure_numbers = plt.get_fignums()
if not figure_numbers:
    raise ValueError('没有检测到图表。请先使用 plt.subplots() 或其他 Matplotlib 绘图 API 创建 Figure。')
fig = plt.figure(figure_numbers[-1])

def scalar(value):
    if hasattr(value, 'item'):
        value = value.item()
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)

axes_meta = []
for ax in fig.axes:
    lines = []
    for line in ax.lines:
        lines.append({
            'x': [scalar(v) for v in line.get_xdata()],
            'y': [scalar(v) for v in line.get_ydata()],
            'label': line.get_label(),
            'marker': line.get_marker(),
        })
    collections = []
    for collection in ax.collections:
        offsets = collection.get_offsets()
        collections.append({'points': [[scalar(x), scalar(y)] for x, y in offsets], 'alpha': collection.get_alpha()})
    axes_meta.append({
        'title': ax.get_title(),
        'xlabel': ax.get_xlabel(),
        'ylabel': ax.get_ylabel(),
        'lines': lines,
        'collections': collections,
        'patchCount': len(ax.patches),
        'texts': [text.get_text() for text in ax.texts if text.get_text()],
        'legend': ax.get_legend() is not None,
    })

lower_code = code.lower()
if len(fig.axes) > 1:
    kind = 'subplots'
elif '.hist(' in lower_code or 'plt.hist(' in lower_code:
    kind = 'hist'
elif '.bar(' in lower_code or 'plt.bar(' in lower_code:
    kind = 'bar'
elif fig.axes and fig.axes[0].collections:
    kind = 'scatter'
elif fig.axes and len(fig.axes[0].lines) > 1:
    kind = 'multi-line'
else:
    kind = 'line'

buffer = io.BytesIO()
_dll_original_savefig(fig, buffer, format='png', dpi=120, bbox_inches='tight')
image = base64.b64encode(buffer.getvalue()).decode('ascii')
_dll_result = json.dumps({
    'imageDataUrl': 'data:image/png;base64,' + image,
    'stdout': stdout.getvalue(),
    'semantic': {
        'kind': kind,
        'axesCount': len(fig.axes),
        'axes': axes_meta,
        'savefigCalled': _dll_save_called,
    },
})
plt.close('all')
_dll_result
`

workerScope.onmessage = async (event: MessageEvent<{ type: 'init' } | { type: 'run'; id: number; code: string; tables: DataTable[] }>) => {
  try {
    if (event.data.type === 'init') {
      await initialize()
      return
    }
    await initialize()
    runtime!.globals.set('_dll_payload', JSON.stringify({ code: event.data.code, tables: event.data.tables }))
    const raw = await runtime!.runPythonAsync(PYTHON_RUNNER)
    workerScope.postMessage({ type: 'result', id: event.data.id, result: JSON.parse(String(raw)) })
  } catch (error) {
    workerScope.postMessage({ type: 'error', id: event.data.type === 'run' ? event.data.id : 0, error: error instanceof Error ? error.message : String(error) })
  }
}
