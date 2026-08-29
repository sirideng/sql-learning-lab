import type { DataTable } from '../types/problem'

export interface MatplotlibSemanticResult {
  kind: string
  axesCount: number
  axes: Array<{
    title: string
    xlabel: string
    ylabel: string
    lines: Array<{ x: unknown[]; y: unknown[]; label: string; marker: string }>
    collections: Array<{ points: unknown[][]; alpha: number | null }>
    patchCount: number
    texts: string[]
    legend: boolean
  }>
  savefigCalled: boolean
}

export interface MatplotlibRunResult {
  imageDataUrl: string
  stdout: string
  semantic: MatplotlibSemanticResult
}

let worker: Worker | null = null
let readyPromise: Promise<void> | null = null
let readyResolve: (() => void) | null = null
let readyReject: ((error: Error) => void) | null = null
let initializationTimer: number | null = null
let requestId = 0
const requests = new Map<number, { resolve: (result: MatplotlibRunResult) => void; reject: (error: Error) => void; timer: number }>()
const statusListeners = new Set<(message: string) => void>()

function emitStatus(message: string) {
  statusListeners.forEach((listener) => listener(message))
}

function destroyWorker(error?: Error) {
  if (error) readyReject?.(error)
  worker?.terminate()
  worker = null
  readyPromise = null
  readyResolve = null
  readyReject = null
  if (initializationTimer !== null) window.clearTimeout(initializationTimer)
  initializationTimer = null
  requests.forEach((request) => {
    window.clearTimeout(request.timer)
    request.reject(error ?? new Error('Matplotlib 运行环境已重置。'))
  })
  requests.clear()
}

function ensureWorker() {
  if (worker && readyPromise) return readyPromise
  worker = new Worker(new URL('../workers/matplotlib.worker.ts', import.meta.url), { type: 'module', name: 'matplotlib-runtime' })
  readyPromise = new Promise<void>((resolve, reject) => { readyResolve = resolve; readyReject = reject })
  worker.onmessage = (event: MessageEvent) => {
    const message = event.data
    if (message.type === 'status') emitStatus(message.message)
    if (message.type === 'ready') { if (initializationTimer !== null) window.clearTimeout(initializationTimer); initializationTimer = null; emitStatus('运行环境已就绪'); readyResolve?.() }
    if (message.type === 'error' && message.id === 0) {
      const error = new Error(message.error)
      readyReject?.(error)
      destroyWorker(error)
      return
    }
    if (message.type === 'result' || message.type === 'error') {
      const request = requests.get(message.id)
      if (!request) return
      window.clearTimeout(request.timer)
      requests.delete(message.id)
      if (message.type === 'result') request.resolve(message.result)
      else request.reject(new Error(message.error))
    }
  }
  worker.onerror = (event) => {
    const error = new Error(event.message || '无法加载 Matplotlib 运行环境。')
    readyReject?.(error)
    destroyWorker(error)
  }
  worker.postMessage({ type: 'init' })
  initializationTimer = window.setTimeout(() => {
    destroyWorker(new Error('运行环境加载超时。请检查网络是否允许访问 cdn.jsdelivr.net，然后重试。'))
  }, 90_000)
  return readyPromise
}

export async function runMatplotlib(code: string, tables: DataTable[], onStatus?: (message: string) => void): Promise<MatplotlibRunResult> {
  if (onStatus) statusListeners.add(onStatus)
  try {
    await ensureWorker()
    const id = ++requestId
    return await new Promise<MatplotlibRunResult>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        destroyWorker(new Error('代码运行超过 12 秒，环境已自动停止。请检查是否存在死循环。'))
      }, 12_000)
      requests.set(id, { resolve, reject, timer })
      worker!.postMessage({ type: 'run', id, code, tables })
    })
  } finally {
    if (onStatus) statusListeners.delete(onStatus)
  }
}

export function warmMatplotlib(onStatus?: (message: string) => void) {
  if (onStatus) statusListeners.add(onStatus)
  return ensureWorker().finally(() => { if (onStatus) statusListeners.delete(onStatus) })
}
