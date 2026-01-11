/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { WizSelect } from '@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect'
import { useItem } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { GranularityStepContent } from './GranularityStepContent'
import { ProjectsList } from './ProjectsList'

interface ClusterGranularityStepContentProps {
  description: string
  selectedClusters: any[]
}

export const ClusterGranularityStepContent = ({
  description,
  selectedClusters,
}: ClusterGranularityStepContentProps) => {
  const { t } = useTranslation()
  const item = useItem()

  return (
    <>
      <GranularityStepContent title={t('Define cluster granularity')} description={description} />
      <div style={{ margin: '16px 0' }}>
        <WizSelect
          pathValueToInputValue={(pathValue) => pathValue || 'Cluster role assignment'}
          path="selectedClustersAccessLevel"
          label={t('Access level for selected clusters')}
          required
          options={[
            {
              label: t('Cluster role assignment'),
              value: 'Cluster role assignment',
              description: t('Grant access to all current and future resources on the cluster'),
            },
            {
              label: t('Project role assignment'),
              value: 'Project role assignment',
              description: t('Grant access to specific projects on the cluster'),
            },
          ]}
        />
      </div>
      {item?.selectedClustersAccessLevel === 'Project role assignment' && (
        <div style={{ marginTop: '16px' }}>
          <ProjectsList selectedClusters={selectedClusters} />
        </div>
      )}
    </>
  )
}
