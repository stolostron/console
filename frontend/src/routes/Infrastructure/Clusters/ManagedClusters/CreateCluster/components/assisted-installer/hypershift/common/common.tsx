/* Copyright Contributors to the Open Cluster Management project */

import { ClipboardCopyButton, CodeBlockAction, Text, TextVariants } from '@patternfly/react-core'
import { Fragment, useState } from 'react'
import { useTranslation } from '../../../../../../../../../lib/acm-i18next'

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
  const { t } = useTranslation()
  return (
    <Fragment>
      <Text component={TextVariants.h4}>{t('How to log in to OpenShift Container Platform')}</Text>
      <Text
        component={TextVariants.a}
        onClick={() => {
          window.open(window.SERVER_FLAGS?.requestTokenURL)
        }}
        target="_blank"
      >
        {t('Use the oc login command.')}
      </Text>
    </Fragment>
  )
}
