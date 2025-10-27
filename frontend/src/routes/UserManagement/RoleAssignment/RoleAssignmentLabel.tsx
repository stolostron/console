/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { Label, LabelGroup } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'

type RoleAssignmentLabelProps = {
  elements?: string[]
  numLabel: number
  renderElement?: (element: string) => React.ReactNode
}
const RoleAssignmentLabel = ({ elements, numLabel, renderElement }: RoleAssignmentLabelProps) => {
  const { t } = useTranslation()
  // TODO: trigger sonar issue
  return elements !== undefined && elements.length > 0 ? (
    <LabelGroup
      collapsedText={t('show.more', { count: elements.length - numLabel })}
      expandedText={t('Show less')}
      numLabels={numLabel}
    >
      {elements?.map((e) =>
        renderElement ? (
          renderElement(e)
        ) : (
          <Label key={e} style={{ fontSize: '14px' }}>
            {e}
          </Label>
        )
      )}
    </LabelGroup>
  ) : (
    'All namespaces'
  )
}

export { RoleAssignmentLabel }
