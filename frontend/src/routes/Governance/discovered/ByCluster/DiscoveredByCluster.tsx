/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { DiscoveredPolicyItem } from '../useFetchPolicies'
import { AcmEmptyState, AcmTable } from '../../../../ui-components'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { Box } from '@mui/material'
import { byClusterCols, convertYesNoCell, DiscoveredViolationsCard, policyViolationSummary } from './common'
import { useMemo } from 'react'

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
  const cols = useMemo(
    () =>
      byClusterCols(
        t,
        helmReleases,
        subscriptions,
        channels,
        kindHead == 'operator'
          ? [
              {
                header: t('Deployment available'),
                cell: (item: DiscoveredPolicyItem) => convertYesNoCell(item.deploymentAvailable),
                sort: 'deploymentAvailable',
                search: 'deploymentAvailable',
                id: 'deploymentAvailable',
                exportContent: (item: DiscoveredPolicyItem) => convertYesNoCell(item.deploymentAvailable),
              },
              {
                header: t('Upgrade available'),
                cell: (item: DiscoveredPolicyItem) => convertYesNoCell(item.upgradeAvailable),
                sort: 'upgradeAvailable',
                search: 'upgradeAvailable',
                id: 'upgradeAvailable',
                exportContent: (item: DiscoveredPolicyItem) => convertYesNoCell(item.upgradeAvailable),
              },
            ]
          : []
      ),
    [channels, helmReleases, kindHead, subscriptions, t]
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
