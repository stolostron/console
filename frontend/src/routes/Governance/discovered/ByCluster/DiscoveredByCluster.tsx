/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { DiscoveredPolicyItem } from '../useFetchPolicies'
import { AcmEmptyState, AcmTable } from '../../../../ui-components'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { Box } from '@mui/material'
import { ByClusterCols, DiscoveredViolationsCard, policyViolationSummary } from './common'

export default function DiscoveredByCluster({
  policies = [],
  policyKind,
}: Readonly<{ policies: DiscoveredPolicyItem[] | undefined | null; policyKind: string }>) {
  const { t } = useTranslation()
  const { channelsState, helmReleaseState, subscriptionsState } = useSharedAtoms()
  const helmReleases = useRecoilValue(helmReleaseState)
  const subscriptions = useRecoilValue(subscriptionsState)
  const channels = useRecoilValue(channelsState)
  const kindHead = policyKind.split('Policy')[0].toLowerCase()
  const policyName = policies?.[0]?.name ?? ''
  const cols = ByClusterCols(
    t,
    helmReleases,
    subscriptions,
    channels,
    kindHead == 'operator'
      ? [
          {
            header: t('Deployment available'),
            cell: (item: DiscoveredPolicyItem) => {
              if (item.deploymentAvailable == null || item.deploymentAvailable == undefined) return '-'
              return item.deploymentAvailable ? 'yes' : 'no'
            },
            sort: 'deploymentAvailable',
            search: 'deploymentAvailable',
            id: 'deploymentAvailable',
            exportContent: (item: DiscoveredPolicyItem) => {
              if (item.deploymentAvailable == null || item.deploymentAvailable == undefined) return '-'
              return item.deploymentAvailable ? 'yes' : 'no'
            },
          },
          {
            header: t('Upgrade available'),
            cell: (item: DiscoveredPolicyItem) => {
              if (item.upgradeAvailable == null || item.upgradeAvailable == undefined) return '-'
              return item.upgradeAvailable ? 'yes' : 'no'
            },
            sort: 'upgradeAvailable',
            search: 'upgradeAvailable',
            id: 'upgradeAvailable',
            exportContent: (item: DiscoveredPolicyItem) => {
              if (item.upgradeAvailable == null || item.upgradeAvailable == undefined) return '-'
              return item.upgradeAvailable ? 'yes' : 'no'
            },
          },
        ]
      : []
  )

  return (
    <PageSection>
      {policies && policies.length > 0 && (
        <Box mb={3} maxWidth={500}>
          <DiscoveredViolationsCard
            policyKind={policyKind}
            policyViolationSummary={policyViolationSummary(policies ?? [])}
          />
        </Box>
      )}
      <AcmTable<DiscoveredPolicyItem>
        id={`${policyKind}ByCluster`}
        columns={cols}
        keyFn={(item) => item.cluster}
        items={policies ?? []}
        emptyState={
          <AcmEmptyState
            title={t(`You don't have any {{kindHead}} policies.`, { kindHead })}
            message={t('There are no search results for {{kindHead}} policies.', { kindHead })}
          />
        }
        showExportButton
        exportFilePrefix={`${policyKind}-${policyName}-all-clusters`}
      />
    </PageSection>
  )
}
