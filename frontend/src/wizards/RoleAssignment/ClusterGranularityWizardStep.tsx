/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { WizardStep } from '@patternfly/react-core'
import { WizSelect } from '@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect'
import { GranularityStepContent } from './GranularityStepContent'
import { ProjectsList } from './ProjectsList'

interface ClusterGranularityWizardStepProps {
  stepKey: string
  id: string
  isHidden: boolean
  description: string
  selectedClusters: any[]
  selectedClustersAccessLevel?: string
}

export const ClusterGranularityWizardStep = ({
  stepKey,
  id,
  isHidden,
  description,
  selectedClusters,
  selectedClustersAccessLevel,
}: ClusterGranularityWizardStepProps) => {
  const { t } = useTranslation()

  return (
    <WizardStep key={stepKey} name={t('Define cluster granularity')} id={id} isHidden={isHidden}>
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
      {selectedClustersAccessLevel === 'Project role assignment' && (
        <div style={{ marginTop: '16px' }}>
          <ProjectsList selectedClusters={selectedClusters} />
        </div>
      )}
    </WizardStep>
  )
}
