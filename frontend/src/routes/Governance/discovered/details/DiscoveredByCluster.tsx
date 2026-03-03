/* Copyright Contributors to the Open Cluster Management project */
import { DiscoveredPolicyItem } from '../useFetchPolicies'
import {
  AcmDonutChart,
  AcmEmptyState,
  AcmTable,
  IAcmTableColumn,
  ITableFilter,
  colorThemes,
} from '../../../../ui-components'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import {
  byClusterCols,
  convertYesNoCell,
  getResponseActionFilter,
  getSeverityFilter,
  getSourceFilterOptions,
  DiscoveredViolationsCard,
  getTotalViolationsCompliance,
  policyViolationSummary,
} from './common'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'
import { useDiscoveredDetailsContext } from './DiscoveredPolicyDetailsPage'
import { EmptyState, PageSection, Spinner } from '@patternfly/react-core'

export default function DiscoveredByCluster() {
  const { policyKind, apiGroup, ...details } = useDiscoveredDetailsContext()
  const policies = details.policyItems?.[0]?.policies

  const { t } = useTranslation()
  const { channelsState, helmReleaseState, subscriptionsState } = useSharedAtoms()
  const helmReleases = useRecoilValue(helmReleaseState)
  const subscriptions = useRecoilValue(subscriptionsState)
  const channels = useRecoilValue(channelsState)
  const locationPath = useLocation().pathname
  const kindHead = policyKind.split('Policy')[0].toLowerCase()
  const policyName = policies?.[0]?.name ?? ''
  const isVapb = ['admissionregistration.k8s.io'].includes(policies?.[0]?.apigroup ?? '')
  const isGatekeeperMutation = apiGroup === 'mutations.gatekeeper.sh'
  const cols = useMemo(() => {
    let extraColumns: IAcmTableColumn<DiscoveredPolicyItem>[] = []

    if (kindHead === 'operator') {
      extraColumns = [
        {
          header: t('Deployment available'),
          cell: (item: DiscoveredPolicyItem) => convertYesNoCell(item.deploymentAvailable, t),
          sort: 'deploymentAvailable',
          search: 'deploymentAvailable',
          id: 'deploymentAvailable',
          exportContent: (item: DiscoveredPolicyItem) => convertYesNoCell(item.deploymentAvailable, t),
        },
        {
          header: t('Update available'),
          cell: (item: DiscoveredPolicyItem) => convertYesNoCell(item.upgradeAvailable, t),
          sort: 'upgradeAvailable',
          search: 'upgradeAvailable',
          id: 'upgradeAvailable',
          exportContent: (item: DiscoveredPolicyItem) => convertYesNoCell(item.upgradeAvailable, t),
        },
      ]
    } else if (apiGroup === 'kyverno.io' && policyKind === 'Policy') {
      extraColumns = [
        {
          header: t('Namespace'),
          cell: (item: DiscoveredPolicyItem) => item.namespace ?? '-',
          sort: 'namespace',
          search: 'namespace',
          id: 'namespace',
          exportContent: (item: DiscoveredPolicyItem) => item.namespace ?? '-',
        },
      ]
    }

    let cols = byClusterCols(t, helmReleases, subscriptions, channels, policyKind, isVapb, extraColumns)

    if (isGatekeeperMutation) {
      cols = cols.filter((col) => {
        // remove violation, response action columns
        return col.id == 'cluster' || col.id == 'source' || col.id == 'severity'
      })
    }

    return cols
  }, [channels, helmReleases, kindHead, subscriptions, policyKind, apiGroup, t, isGatekeeperMutation, isVapb])

  const operatorPolicyStats: any = useMemo(() => {
    if (policyKind !== 'OperatorPolicy') {
      return {}
    }

    let deploymentsAvailable = 0
    let deploymentsUnavailable = 0
    let deploymentsUnknown = 0

    let upgradesAvailable = 0
    let upgradesUnavailable = 0
    let upgradesUnknown = 0

    for (const policy of policies || []) {
      if (policy.deploymentAvailable === true) {
        deploymentsAvailable++
      } else if (policy.deploymentAvailable === false) {
        deploymentsUnavailable++
      } else {
        deploymentsUnknown++
      }

      if (policy.upgradeAvailable === true) {
        upgradesAvailable++
      } else if (policy.upgradeAvailable === false) {
        upgradesUnavailable++
      } else {
        upgradesUnknown++
      }
    }

    return {
      deploymentsAvailable,
      deploymentsUnavailable,
      deploymentsUnknown,
      upgradesAvailable,
      upgradesUnavailable,
      upgradesUnknown,
    }
  }, [policies, policyKind])

  const filters = useMemo<ITableFilter<DiscoveredPolicyItem>[]>(() => {
    let filters = [
      ...(policyKind !== 'ValidatingAdmissionPolicyBinding'
        ? [
            {
              id: 'violations',
              label: t('Cluster violations'),
              options: [
                {
                  label: t('No violations'),
                  value: 'no-violations',
                },
                {
                  label: t('Violations'),
                  value: 'violations',
                },
                {
                  label: t('No status'),
                  value: 'no-status',
                },
              ],
              tableFilterFn: (selectedValues: string[], item: DiscoveredPolicyItem): boolean => {
                let compliant: string
                if (['constraints.gatekeeper.sh', 'kyverno.io'].includes(item.apigroup)) {
                  compliant = getTotalViolationsCompliance(item?.totalViolations)
                } else {
                  compliant = item?.compliant?.toLowerCase() ?? ''
                }

                for (const value of selectedValues) {
                  if (value === 'no-violations' && compliant === 'compliant') {
                    return true
                  }

                  if (value === 'violations' && compliant === 'noncompliant') {
                    return true
                  }

                  if (value === 'no-status' && (!compliant || compliant === 'pending')) {
                    return true
                  }
                }

                return false
              },
            },
          ]
        : []),
      getResponseActionFilter(t),
      getSeverityFilter(t),
      {
        id: 'source',
        label: t('Source'),
        options: policies ? getSourceFilterOptions(policies) : [],
        tableFilterFn: (selectedValues: string[], item: DiscoveredPolicyItem) => {
          return item.source?.type ? selectedValues.includes(item.source?.type) : false
        },
      },
    ] as ITableFilter<DiscoveredPolicyItem>[]

    if (policyKind === 'OperatorPolicy') {
      filters = filters.concat([
        {
          id: 'deploymentAvailable',
          label: t('Deployment available'),
          options: [
            {
              label: t('yes'),
              value: 'yes',
            },
            {
              label: t('no'),
              value: 'no',
            },
          ],
          tableFilterFn: (selectedValues: string[], item: DiscoveredPolicyItem): boolean => {
            return selectedValues.includes(item.deploymentAvailable ? 'yes' : 'no')
          },
        },
        {
          id: 'upgradeAvailable',
          label: t('Update available'),
          options: [
            {
              label: t('yes'),
              value: 'yes',
            },
            {
              label: t('no'),
              value: 'no',
            },
          ],
          tableFilterFn: (selectedValues: string[], item: DiscoveredPolicyItem): boolean => {
            return selectedValues.includes(item.upgradeAvailable ? 'yes' : 'no')
          },
        },
      ])
    }

    if (isGatekeeperMutation) {
      filters = filters.filter((col) => {
        // remove violation column
        return col.id == 'cluster' || col.id == 'source' || col.id == 'severity'
      })
    }
    return filters
  }, [t, policyKind, policies, isGatekeeperMutation])

  if (details.isFetching && !details.policyItems) {
    return (
      <PageSection hasBodyWrapper={false}>
        <EmptyState headingLevel="h4" icon={Spinner} titleText={t('Loading')}></EmptyState>
      </PageSection>
    )
  }

  return (
    <>
      {policies &&
        policies.length > 0 &&
        policyKind !== 'ValidatingAdmissionPolicyBinding' &&
        !isGatekeeperMutation && (
          <PageSection hasBodyWrapper={false} style={{ paddingBottom: '0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', flexShrink: '0' }}>
              <DiscoveredViolationsCard
                policyKind={policyKind}
                policyViolationSummary={policyViolationSummary(policies ?? [])}
                title={policyKind + ' ' + t('cluster violations')}
              />
              {policyKind === 'OperatorPolicy' && (
                <>
                  <AcmDonutChart
                    title={t('Deployments unavailable')}
                    description={t('Overview of unavailable deployments')}
                    donutLabel={{
                      title: operatorPolicyStats['deploymentsUnavailable'],
                      subTitle: t('Unavailable'),
                    }}
                    data={[
                      {
                        key: t('unavailable'),
                        value: operatorPolicyStats['deploymentsUnavailable'],
                        isPrimary: true,
                        useForTitleCount: true,
                        link: locationPath + '?deploymentAvailable=no',
                      },
                      {
                        key: t('with no status'),
                        value: operatorPolicyStats['deploymentsUnknown'],
                      },
                      {
                        key: t('available'),
                        value: operatorPolicyStats['deploymentsAvailable'],
                        link: locationPath + '?deploymentAvailable=yes',
                      },
                    ]}
                    colorScale={colorThemes.criticalLowSuccess}
                  />
                  <AcmDonutChart
                    title={t('Update availability')}
                    description={t('Overview of available updates')}
                    donutLabel={{
                      title: operatorPolicyStats['upgradesAvailable'],
                      subTitle: t('Available'),
                    }}
                    data={[
                      {
                        key: t('available'),
                        value: operatorPolicyStats['upgradesAvailable'],
                        isPrimary: true,
                        useForTitleCount: true,
                        link: locationPath + '?upgradeAvailable=yes',
                      },
                      {
                        key: t('with no status'),
                        value: operatorPolicyStats['upgradesUnknown'],
                      },
                      {
                        key: t('unavailable'),
                        value: operatorPolicyStats['upgradesUnavailable'],
                        link: locationPath + '?upgradeAvailable=no',
                      },
                    ]}
                    colorScale={colorThemes.criticalLowSuccess}
                  />
                </>
              )}
            </div>
          </PageSection>
        )}
      <PageSection hasBodyWrapper={false}>
        <AcmTable<DiscoveredPolicyItem>
          id={`${policyKind}ByCluster`}
          columns={cols}
          keyFn={(item) => item.cluster}
          items={policies ?? []}
          filters={filters}
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
    </>
  )
}
