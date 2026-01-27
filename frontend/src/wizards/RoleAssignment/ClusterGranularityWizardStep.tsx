/* Copyright Contributors to the Open Cluster Management project */
import { Alert, SelectOption } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmSelect } from '../../ui-components'
import { GranularityStepContent } from './GranularityStepContent'
import { ProjectsList } from './ProjectsList'
import { RoleAssignmentWizardFormData } from './types'

interface ClusterGranularityStepContentProps {
  selectedClusters: any[]
  selectedNamespaces?: string[]
  onNamespacesChange: (namespaces: string[]) => void
  clustersAccessLevel: RoleAssignmentWizardFormData['clustersAccessLevel']
  onClustersAccessLevelChange: (
    clustersAccessLevel?: RoleAssignmentWizardFormData['clustersAccessLevel']
  ) => void
}

export const ClusterGranularityStepContent = ({
  selectedClusters,
  selectedNamespaces,
  onNamespacesChange,
  clustersAccessLevel,
  onClustersAccessLevelChange,
}: ClusterGranularityStepContentProps) => {
  const { t } = useTranslation()

  const handleClustersAccessLevelChange = (value?: string) =>
    onClustersAccessLevelChange?.(value as RoleAssignmentWizardFormData['clustersAccessLevel'])
  const isProjectRoleAssignment = clustersAccessLevel === 'Project role assignment'
  const multipleSelectedClusters: boolean = selectedClusters.length > 1
  return (
    <>
      <GranularityStepContent
        title={t('Define cluster granularity')}
        description={
          multipleSelectedClusters
            ? t('Define the level of access for the selected clusters.')
            : t('Define the level of access for the selected cluster.')
        }
      />
      <div style={{ margin: '16px 0' }}>
        <AcmSelect
          id="clusters-access-level"
          value={clustersAccessLevel}
          onChange={handleClustersAccessLevelChange}
          isRequired
          label={t('Access level for selected clusters')}
        >
          {[
            {
              label: t('Cluster role assignment'),
              value: 'Cluster role assignment',
              description: t('Grant access to all current and future resources on the clusters.'),
            },
            {
              label: t('Project role assignment'),
              value: 'Project role assignment',
              description: t('Grant access to specific projects on the clusters.'),
            },
          ].map((option) => (
            <SelectOption key={option.value} value={option.value} description={option.description}>
              {option.label}
            </SelectOption>
          ))}
        </AcmSelect>
      </div>
      <div style={{ marginTop: '16px' }}>
        {isProjectRoleAssignment ? (
          <ProjectsList
            selectedClusters={selectedClusters}
            selectedNamespaces={selectedNamespaces}
            onSelectionChange={onNamespacesChange}
          />
        ) : (
          <Alert
            variant="info"
            isInline
            title={
              multipleSelectedClusters
                ? t('This role assignment will apply to all current and future resources on the selected clusters.')
                : t('This role assignment will apply to all current and future resources on the selected cluster.')
            }
          />
        )}
      </div>
    </>
  )
}
