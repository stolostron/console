/* Copyright Contributors to the Open Cluster Management project */
import { Button, SelectOption } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmSelect } from '../../ui-components'
import { GranularityStepContent } from './GranularityStepContent'
import { ClusterSetsList } from './Scope/ClusterSets/ClusterSetsList'
import { ClusterList } from './Scope/Clusters/ClusterList'
import { GlobalScopeSelection } from './Scope/GlobalScopeSelection'
import { RoleAssignmentWizardFormData } from './types'

interface ScopeSelectionStepContentProps {
  isDrawerExpanded: boolean
  setIsDrawerExpanded: (expanded: boolean) => void
  selectedClusterSets: any[]
  selectedClusters: any[]
  selectedScope: RoleAssignmentWizardFormData['scopeType']
  onSelectClusterSets?: (clusterSets: any[]) => void
  onSelectClusters?: (clusters: any[]) => void
  onSelectScopeType?: (scopeType?: RoleAssignmentWizardFormData['scopeType']) => void
}

export const ScopeSelectionStepContent = ({
  isDrawerExpanded,
  setIsDrawerExpanded,
  selectedClusterSets,
  selectedClusters,
  onSelectClusterSets,
  onSelectClusters,
  onSelectScopeType,
  selectedScope,
}: ScopeSelectionStepContentProps) => {
  const { t } = useTranslation()

  const handleScopeTypeChange = (value?: string) =>
    onSelectScopeType?.(value as RoleAssignmentWizardFormData['scopeType'])

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
      <AcmSelect id="scope-type" value={selectedScope} onChange={handleScopeTypeChange} isRequired label="">
        {[
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
        ].map((option) => (
          <SelectOption key={option.value} value={option.value} description={option.description}>
            {option.label}
          </SelectOption>
        ))}
      </AcmSelect>

      <div style={{ marginTop: '16px' }}>
        {(() => {
          switch (selectedScope) {
            case 'Global access':
              return <GlobalScopeSelection />
            case 'Select cluster sets':
              return (
                <ClusterSetsList
                  selectedClusterSets={selectedClusterSets}
                  onSelectClusterSet={(clusterSets) => {
                    onSelectClusterSets?.(clusterSets)
                  }}
                />
              )
            case 'Select clusters':
              return (
                <ClusterList
                  selectedClusters={selectedClusters}
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
