import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="code-block">
      <button className="copy-button" onClick={copy} aria-label="复制 SQL">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? '已复制' : '复制'}
      </button>
      <pre><code>{code}</code></pre>
    </div>
  )
}
