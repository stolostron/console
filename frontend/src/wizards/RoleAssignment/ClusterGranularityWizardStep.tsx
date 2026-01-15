/* Copyright Contributors to the Open Cluster Management project */
import { WizSelect } from '@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect'
import { useTranslation } from '../../lib/acm-i18next'
import { GranularityStepContent } from './GranularityStepContent'
import { ProjectsList } from './ProjectsList'
import { RoleAssignmentWizardFormData } from './types'

interface ClusterGranularityStepContentProps {
  description: string
  selectedClusters: any[]
  selectedNamespaces?: string[]
  onNamespacesChange: (namespaces: string[]) => void
  selectedClustersAccessLevel: RoleAssignmentWizardFormData['selectedClustersAccessLevel']
}

export const ClusterGranularityStepContent = ({
  description,
  selectedClusters,
  selectedNamespaces,
  onNamespacesChange,
  selectedClustersAccessLevel,
}: ClusterGranularityStepContentProps) => {
  const { t } = useTranslation()

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
      {selectedClustersAccessLevel === 'Project role assignment' && (
        <div style={{ marginTop: '16px' }}>
          <ProjectsList
            selectedClusters={selectedClusters}
            selectedNamespaces={selectedNamespaces}
            onSelectionChange={onNamespacesChange}
          />
        </div>
      )}
    </>
  )
}
