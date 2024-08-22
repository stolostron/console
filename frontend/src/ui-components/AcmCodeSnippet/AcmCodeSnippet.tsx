/* Copyright Contributors to the Open Cluster Management project */

import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import { useState, useEffect } from 'react'
import { TooltipPosition } from '@patternfly/react-core'
import { ClipboardCopyButton } from '@patternfly/react-core/dist/js/components/ClipboardCopy/ClipboardCopyButton'
import { onCopy } from '../utils'
import { useTranslation } from '../../lib/acm-i18next'

export function AcmCodeSnippet(props: {
  id: string
  fakeCommand?: string
  command: string
  copyTooltipText: string
  copySuccessText: string
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState<boolean>(false)
  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 2000)
    }
  }, [copied])
  return (
    <div className="pf-v5-c-code-editor pf-m-read-only" style={{ display: 'flex' }} id={props.id}>
      <div className="pf-v5-c-code-editor__main" style={{ width: '100%' }}>
        <div className="pf-v5-c-code-editor__code">
          <pre className="pf-v5-c-code-editor__code-pre">{props.fakeCommand ?? props.command}</pre>
        </div>
      </div>
      <ClipboardCopyButton
        exitDelay={500}
        entryDelay={100}
        maxWidth={'150px'}
        position={TooltipPosition.auto}
        id={`copy-button-${props.id}`}
        textId={`text-input-${props.id}`}
        aria-label={t('Copy button')}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick={(event: any) => {
          setCopied(true)
          onCopy(event, props.command)
        }}
      >
        {copied ? props.copySuccessText : props.copyTooltipText}
      </ClipboardCopyButton>
    </div>
  )
}
