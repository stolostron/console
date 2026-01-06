/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { Button } from '@patternfly/react-core'
import { WizSelect } from '@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect'
import { useItem } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { ClusterSetsList } from './Scope/ClusterSets/ClusterSetsList'
import { ClusterList } from './Scope/Clusters/ClusterList'
import { GlobalScopeSelection } from './Scope/GlobalScopeSelection'
import { GranularityStepContent } from './GranularityStepContent'

interface ScopeSelectionStepContentProps {
  isDrawerExpanded: boolean
  setIsDrawerExpanded: (expanded: boolean) => void
  onSelectClusterSets?: (clusterSets: any[]) => void
  onSelectClusters?: (clusters: any[]) => void
}

export const ScopeSelectionStepContent = ({
  isDrawerExpanded,
  setIsDrawerExpanded,
  onSelectClusterSets,
  onSelectClusters,
}: ScopeSelectionStepContentProps) => {
  const { t } = useTranslation()
  const item = useItem()
  const selectedScope = item?.scopeType
  const selectedClusterSets = item?.selectedClusterSets
  const selectedClusters = item?.selectedClusters

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
            label: 'Global access',
            value: 'Global access',
            description: 'Grant access to all resources across all clusters registred in ACM',
          },
          {
            label: 'Select cluster sets',
            value: 'Select cluster sets',
            description:
              'Grant access to 1 or more cluster sets. Optionally, narrow this access to specific clusters and projects',
          },
          {
            label: 'Select clusters',
            value: 'Select clusters',
            description: 'Grant access to 1 or more clusters. Optionally, narrow this access to projects',
          },
        ]}
      />
      {selectedScope === 'Global access' && (
        <div style={{ marginTop: '16px' }}>
          <GlobalScopeSelection />
        </div>
      )}
      {selectedScope === 'Select cluster sets' && (
        <div style={{ marginTop: '16px' }}>
          <ClusterSetsList
            selectedClusterSets={selectedClusterSets}
            onSelectClusterSet={(clusterSets) => {
              onSelectClusterSets?.(clusterSets)
            }}
          />
        </div>
      )}
      {selectedScope === 'Select clusters' && (
        <div style={{ marginTop: '16px' }}>
          <ClusterList
            selectedClusters={selectedClusters}
            onSelectCluster={(clusters) => {
              onSelectClusters?.(clusters)
            }}
          />
        </div>
      )}
    </div>
  )
}
