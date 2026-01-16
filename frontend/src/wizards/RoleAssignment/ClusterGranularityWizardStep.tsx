/* Copyright Contributors to the Open Cluster Management project */
import { SelectOption } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmSelect } from '../../ui-components'
import { GranularityStepContent } from './GranularityStepContent'
import { ProjectsList } from './ProjectsList'
import { RoleAssignmentWizardFormData } from './types'

interface ClusterGranularityStepContentProps {
  description: string
  selectedClusters: any[]
  selectedNamespaces?: string[]
  onNamespacesChange: (namespaces: string[]) => void
  selectedClustersAccessLevel: RoleAssignmentWizardFormData['selectedClustersAccessLevel']
  onClustersAccessLevelChange: (
    clustersAccessLevel?: RoleAssignmentWizardFormData['selectedClustersAccessLevel']
  ) => void
}

export const ClusterGranularityStepContent = ({
  description,
  selectedClusters,
  selectedNamespaces,
  onNamespacesChange,
  selectedClustersAccessLevel,
  onClustersAccessLevelChange,
}: ClusterGranularityStepContentProps) => {
  const { t } = useTranslation()

  const handleClustersAccessLevelChange = (value?: string) =>
    onClustersAccessLevelChange?.(value as RoleAssignmentWizardFormData['selectedClustersAccessLevel'])

  return (
    <>
      <GranularityStepContent title={t('Define cluster granularity')} description={description} />
      <div style={{ margin: '16px 0' }}>
        <AcmSelect
          id="clusters-access-level"
          value={selectedClustersAccessLevel}
          onChange={handleClustersAccessLevelChange}
          isRequired
          label={t('Access level for selected clusters')}
        >
          {[
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
          ].map((option) => (
            <SelectOption key={option.value} value={option.value} description={option.description}>
              {option.label}
            </SelectOption>
          ))}
        </AcmSelect>
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
