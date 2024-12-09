/* Copyright Contributors to the Open Cluster Management project */

import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { AcmTable, compareStrings } from '../../../ui-components'
import { useEffect, useMemo, useState } from 'react'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { ManagedCluster } from '../../../resources'
import { ClusterPolicies, getPolicyForCluster } from '../common/util'
import { useSharedAtoms } from '../../../shared-recoil'
import { body, sectionSeparator } from '../common/policySidebarStyles'
import { Icon } from '@patternfly/react-core'

export function ClusterPolicySummarySidebar(props: { cluster: ManagedCluster; compliance: string }) {
  const { cluster, compliance } = props
  const { t } = useTranslation()
  const { usePolicies } = useSharedAtoms()
  const policies = usePolicies()
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | undefined>(
    compliance === 'compliant' ? 'asc' : 'desc'
  )

  useEffect(() => {
    setSortDirection(compliance === 'compliant' ? 'asc' : 'desc')
  }, [compliance])

  const clusterPolicies = useMemo(() => getPolicyForCluster(cluster, policies), [cluster, policies])

  const policyColumnDefs = useMemo(
    () => [
      {
        header: t('Policy name'),
        search: 'policyName',
        sort: (a: ClusterPolicies, b: ClusterPolicies) =>
          /* istanbul ignore next */
          compareStrings(a.policyName, b.policyName),
        cell: (policy: ClusterPolicies) => {
          return (
            <Link
              to={generatePath(NavigationPath.policyDetailsResults, {
                namespace: policy.policyNamespace,
                name: policy.policyName,
              })}
            >
              {policy.policyName}
            </Link>
          )
        },
        exportContent: (policy: ClusterPolicies) => policy.policyName,
      },
      {
        header: t('Cluster violation'),
        sort: (a: ClusterPolicies, b: ClusterPolicies) => compareStrings(a.compliance, b.compliance),
        cell: (policy: ClusterPolicies) => {
          switch (policy?.compliance?.toLowerCase()) {
            case 'compliant':
              return (
                <div>
                  <Icon status="success">
                    <CheckCircleIcon />
                  </Icon>
                </div>
              )
            case 'noncompliant':
              return (
                <div>
                  <Icon status="danger">
                    <ExclamationCircleIcon />
                  </Icon>
                </div>
              )
            default:
              return (
                <div>
                  <Icon status="warning">
                    <ExclamationTriangleIcon />
                  </Icon>
                </div>
              )
          }
        },
        exportContent: (policy: ClusterPolicies) => policy?.compliance?.toLowerCase(),
      },
    ],
    [t]
  )

  return (
    <div className={body}>
      <div className={sectionSeparator} />
      <AcmTable<ClusterPolicies>
        showExportButton
        exportFilePrefix="clusterpolicysummary"
        items={clusterPolicies}
        emptyState={undefined} // only shown when clusterPolicies count > 0
        initialSort={{
          index: 1, // default to sorting by violation count
          direction: sortDirection,
        }}
        columns={policyColumnDefs}
        keyFn={(item: ClusterPolicies) => item.policyName!}
        tableActions={[]}
        rowActions={[]}
        gridBreakPoint={TableGridBreakpoint.none}
        autoHidePagination={true}
        searchPlaceholder={t('Find by name')}
      />
    </div>
  )
}
