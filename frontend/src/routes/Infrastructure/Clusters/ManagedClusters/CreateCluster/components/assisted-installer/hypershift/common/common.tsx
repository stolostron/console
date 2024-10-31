/* Copyright Contributors to the Open Cluster Management project */

import { ClipboardCopyButton, CodeBlockAction, Text, TextVariants } from '@patternfly/react-core'
import { Fragment, useState } from 'react'
import { Trans, useTranslation } from '../../../../../../../../../lib/acm-i18next'

export function Actions(code: string, id: string) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

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

export function GetOCLogInCommand() {
  return (
    <Text component={TextVariants.p}>
      <Trans i18nKey="copy.login.command.instructions" components={{ bold: <strong />, code: <code /> }} />
    </Text>
  )
}
