/* Copyright Contributors to the Open Cluster Management project */
import { WizSelect } from '@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect'
import { Button } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { GranularityStepContent } from './GranularityStepContent'
import { ClusterSetsList } from './Scope/ClusterSets/ClusterSetsList'
import { ClusterList } from './Scope/Clusters/ClusterList'
import { GlobalScopeSelection } from './Scope/GlobalScopeSelection'
import { RoleAssignmentWizardFormData } from './types'

interface ScopeSelectionStepContentProps {
  isDrawerExpanded: boolean
  setIsDrawerExpanded: (expanded: boolean) => void
  onSelectClusterSets?: (clusterSets: any[]) => void
  onSelectClusters?: (clusters: any[]) => void
  selection: {
    scopeType: RoleAssignmentWizardFormData['scopeType']
    selectedClusters: RoleAssignmentWizardFormData['selectedClusters']
    selectedClusterSets: RoleAssignmentWizardFormData['selectedClusterSets']
  }
}

export const ScopeSelectionStepContent = ({
  isDrawerExpanded,
  setIsDrawerExpanded,
  onSelectClusterSets,
  onSelectClusters,
  selection,
}: ScopeSelectionStepContentProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <GranularityStepContent
        title={t('Scope')}
        description={[
          t('Define the scope of access by selecting which resources this role will apply to.'),
          t('Select one option:'),
        ]}
        action={
          <Button variant="link" onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}>
            {t('View examples')}
          </Button>
        }
      />
      <WizSelect
        pathValueToInputValue={(pathValue) => pathValue || 'Global access'}
        path="scopeType"
        label=""
        required
        options={[
          {
            label: t('Global access'),
            value: 'Global access',
            description: t('Grant access to all resources across all clusters registred in ACM'),
          },
          {
            label: t('Select cluster sets'),
            value: 'Select cluster sets',
            description: t(
              'Grant access to 1 or more cluster sets. Optionally, narrow this access to specific clusters and projects'
            ),
          },
          {
            label: t('Select clusters'),
            value: 'Select clusters',
            description: t('Grant access to 1 or more clusters. Optionally, narrow this access to projects'),
          },
        ]}
      />

      <div style={{ marginTop: '16px' }}>
        {(() => {
          switch (selection.scopeType) {
            case 'Global access':
              return <GlobalScopeSelection />
            case 'Select cluster sets':
              return (
                <ClusterSetsList
                  selectedClusterSets={selection.selectedClusterSets}
                  onSelectClusterSet={(clusterSets) => {
                    onSelectClusterSets?.(clusterSets)
                  }}
                />
              )
            case 'Select clusters':
              return (
                <ClusterList
                  selectedClusters={selection.selectedClusters}
                  onSelectCluster={(clusters) => {
                    onSelectClusters?.(clusters)
                  }}
                />
              )
            default:
              return null
          }
        })()}
      </div>
    </div>
  )
}
