/* Copyright Contributors to the Open Cluster Management project */
import { Alert, SelectOption } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmSelect } from '../../ui-components'
import { GranularityStepContent } from './GranularityStepContent'
import { ProjectsList } from './ProjectsList'
import { RoleAssignmentWizardFormData } from './types'
import { Cluster } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { ManagedClusterSet } from '../../resources'

interface ClusterSetGranularityWizardStepProps {
  selectedClustersets: (ManagedClusterSet | string)[]
  clustersFromClusterSets: Cluster[]
  selectedNamespaces?: string[]
  onNamespacesChange: (namespaces: string[]) => void
  clustersetsAccessLevel: RoleAssignmentWizardFormData['clustersetsAccessLevel']
  onClustersetsAccessLevelChange: (
    clustersetsAccessLevel?: RoleAssignmentWizardFormData['clustersetsAccessLevel']
  ) => void
}

export const ClusterSetGranularityWizardStep = ({
  clustersFromClusterSets,
  selectedClustersets,
  selectedNamespaces,
  onNamespacesChange,
  clustersetsAccessLevel,
  onClustersetsAccessLevelChange,
}: ClusterSetGranularityWizardStepProps) => {
  const { t } = useTranslation()

  const handleClustersetsAccessLevelChange = (value?: string) =>
    onClustersetsAccessLevelChange?.(value as RoleAssignmentWizardFormData['clustersetsAccessLevel'])
  const isProjectRoleAssignment = clustersetsAccessLevel === 'Project role assignment'
  const multipleSelectedClusters: boolean = selectedClustersets.length > 1

  return (
    <>
      <GranularityStepContent
        title={t('Define cluster set granularity')}
        description={
          multipleSelectedClusters
            ? t('Define the level of access for the selected cluster sets.')
            : t('Define the level of access for the selected cluster set.')
        }
      />
      <div style={{ margin: '16px 0' }}>
        <AcmSelect
          id="clusters-set-access-level"
          value={clustersetsAccessLevel}
          onChange={handleClustersetsAccessLevelChange}
          isRequired
          label={t('Access level for selected cluster sets')}
        >
          {[
            {
              label: t('Cluster set role assignment'),
              value: 'Cluster set role assignment',
              description: t('Grant access to all current and future resources on the selected cluster sets.'),
            },
            {
              label: t('Project role assignment'),
              value: 'Project role assignment',
              description: t(
                'Grant access to specific projects on all current and future clusters in the selected sets.'
              ),
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
            selectedClusters={clustersFromClusterSets}
            selectedNamespaces={selectedNamespaces}
            onSelectionChange={onNamespacesChange}
          />
        ) : (
          <Alert
            variant="info"
            isInline
            title={
              multipleSelectedClusters
                ? t('This role assignment will apply to all current and future resources on the selected cluster sets.')
                : t('This role assignment will apply to all current and future resources on the selected cluster set.')
            }
          />
        )}
      </div>
    </>
  )
}
