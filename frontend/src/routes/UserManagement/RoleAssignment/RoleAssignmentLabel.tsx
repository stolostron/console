/* Copyright Contributors to the Open Cluster Management project */
import { Label, LabelGroup } from '@patternfly/react-core'
import React from 'react'
import { useTranslation } from '../../../lib/acm-i18next'

type RoleAssignmentLabelProps = {
  elements?: string[]
  numLabel: number
  renderElement?: (element: string) => React.ReactNode
  emptyElementsText: string
}
const RoleAssignmentLabel = ({ elements, numLabel, renderElement, emptyElementsText }: RoleAssignmentLabelProps) => {
  const { t } = useTranslation()

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
    emptyElementsText
  )
}

export { RoleAssignmentLabel }
