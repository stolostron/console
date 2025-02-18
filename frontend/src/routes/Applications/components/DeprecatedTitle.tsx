/* Copyright Contributors to the Open Cluster Management project */

import { Label, Split, SplitItem } from '@patternfly/react-core'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../lib/acm-i18next'
import { ReactNode } from 'react'

export function DeprecatedTitle({ title }: { title: ReactNode }) {
  const { t } = useTranslation()
  return (
    <Split hasGutter>
      <SplitItem>{title}</SplitItem>
      <SplitItem>
        <Label icon={<ExclamationTriangleIcon />} color="orange" isCompact>
          {t('deprecated')}
        </Label>
      </SplitItem>
    </Split>
  )
}
