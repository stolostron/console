/* Copyright Contributors to the Open Cluster Management project */
import { ElementRef, ReactNode, useEffect, useRef } from 'react'
import hljs from 'highlight.js'
import diff from 'highlight.js/lib/languages/diff'
import './github.min.css'

export const CodeBlock = ({ children }: { children: ReactNode }) => {
  const codeRef = useRef<ElementRef<'code'>>(null)

  useEffect(() => {
    if (codeRef?.current) {
      hljs.registerLanguage('diff', diff)
      hljs.highlightBlock(codeRef.current)
    }
  }, [])

  return (
    <div>
      <pre>
        <code className="language-diff" ref={codeRef}>
          {children}
        </code>
      </pre>
    </div>
  )
}
