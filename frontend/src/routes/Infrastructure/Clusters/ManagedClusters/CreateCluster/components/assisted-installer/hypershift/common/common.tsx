/* Copyright Contributors to the Open Cluster Management project */

import { ClipboardCopyButton, CodeBlockAction } from '@patternfly/react-core'
import { Fragment, useState } from 'react'
import { useTranslation } from '../../../../../../../../../lib/acm-i18next'

export function Actions(code: string, id: string) {
  const [copied, setCopied] = useState(false)

  const { t } = useTranslation()

  const onClick = (text: string) => {
    navigator.clipboard.writeText(text.toString())
    setCopied(true)
  }

  return (
    <Fragment>
      <CodeBlockAction>
        <ClipboardCopyButton
          id={`${id}-copy`}
          textId={id}
          aria-label={t('Copy to clipboard')}
          onClick={() => onClick(code)}
          exitDelay={copied ? 1500 : 600}
          maxWidth="110px"
          variant="plain"
        >
          {copied ? t('Successfully copied to clipboard!') : t('Copy to clipboard')}
        </ClipboardCopyButton>
      </CodeBlockAction>
    </Fragment>
  )
}
