import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import type { DataTable } from '../types/problem'
import { SyntaxHighlightedCode } from './SyntaxHighlightedCode'

export function CodeBlock({ code, tables, language = 'auto' }: { code: string; tables?: DataTable[]; language?: 'auto' | 'sql' | 'python' }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="code-block">
      <button className="copy-button" onClick={copy} aria-label="复制代码">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? '已复制' : '复制'}
      </button>
      <pre><code><SyntaxHighlightedCode code={code} tables={tables} language={language} /></code></pre>
    </div>
  )
}
