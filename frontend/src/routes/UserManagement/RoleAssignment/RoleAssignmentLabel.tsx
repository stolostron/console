/* Copyright Contributors to the Open Cluster Management project */
import { Label, LabelGroup } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'

type RoleAssignmentLabelProps = {
  elements?: string[]
  numLabel: number
}
const RoleAssignmentLabel = ({ elements, numLabel }: RoleAssignmentLabelProps) => {
  const { t } = useTranslation()

  return elements !== undefined && elements.length > 0 ? (
    <LabelGroup
      collapsedText={t('show.more', { count: elements.length - numLabel })}
      expandedText={t('Show less')}
      numLabels={numLabel}
    >
      {elements?.map((e) => (
        <Label key={e} style={{ fontSize: '14px' }}>
          {e}
        </Label>
      ))}
    </LabelGroup>
  ) : (
    'All namespaces'
  )
}

export { RoleAssignmentLabel }
