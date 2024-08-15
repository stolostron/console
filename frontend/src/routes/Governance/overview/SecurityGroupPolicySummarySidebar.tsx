/* Copyright Contributors to the Open Cluster Management project */

import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { AcmTable, compareStrings } from '../../../ui-components'
import { useEffect, useMemo, useState } from 'react'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { Policy } from '../../../resources'
import { SecurityGroupViolations } from './Overview'
import { useSharedAtoms } from '../../../shared-recoil'
import { body, sectionSeparator } from '../common/policySidebarStyles'

export function SecurityGroupPolicySummarySidebar(props: {
  violation: SecurityGroupViolations
  secGroupName: string
  compliance: string
}) {
  const { compliance, secGroupName, violation } = props
  const { t } = useTranslation()
  const { usePolicies } = useSharedAtoms()
  const policies = usePolicies()
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | undefined>(
    compliance === 'compliant' ? 'asc' : 'desc'
  )

  useEffect(() => {
    setSortDirection(compliance === 'compliant' ? 'asc' : 'desc')
  }, [compliance])

  const secGroupPolicies: Policy[] = useMemo(() => {
    return policies.filter((policy) => {
      const annotation = policy.metadata.annotations?.[`policy.open-cluster-management.io/${secGroupName}`]
      if (!annotation) {
        return false
      }
      const names = annotation.split(',')
      for (const name of names) {
        if (name === violation.name && policy.status?.compliant) {
          return true
        }
      }
      return false
    })
  }, [policies, secGroupName, violation.name])

  const policyColumnDefs = useMemo(
    () => [
      {
        header: t('Policy name'),
        search: 'metadata.name',
        sort: (a: Policy, b: Policy) =>
          /* istanbul ignore next */
          compareStrings(a.metadata.name, b.metadata.name),
        cell: (policy: Policy) => {
          return (
            <Link
              to={generatePath(NavigationPath.policyDetailsResults, {
                namespace: policy.metadata.namespace!,
                name: policy.metadata.name!,
              })}
            >
              {policy.metadata.name}
            </Link>
          )
        },
        exportContent: (policy: Policy) => policy.metadata.name,
      },
      {
        header: t('Cluster violation'),
        sort: (a: Policy, b: Policy) => compareStrings(a.status?.compliant, b.status?.compliant),
        cell: (policy: Policy) => {
          switch (policy.status?.compliant?.toLowerCase()) {
            case 'compliant':
              return (
                <div>
                  <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                </div>
              )
            case 'noncompliant':
              return (
                <div>
                  <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
                </div>
              )
            default:
              return (
                <div>
                  <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />
                </div>
              )
          }
        },
        exportContent: (policy: Policy) => policy.status?.compliant?.toLowerCase(),
      },
    ],
    [t]
  )

  return (
    <div className={body}>
      <div className={sectionSeparator} />
      <AcmTable<Policy>
        showExportButton
        exportFilePrefix="securitygrouppolicysummary"
        items={secGroupPolicies}
        emptyState={undefined} // only shown when secGroupPolicies count > 0
        initialSort={{
          index: 1, // default to sorting by violation count
          direction: sortDirection,
        }}
        columns={policyColumnDefs}
        keyFn={(item: Policy) => `${item.metadata.namespace}/${item.metadata.name}`}
        tableActions={[]}
        rowActions={[]}
        gridBreakPoint={TableGridBreakpoint.none}
        autoHidePagination={true}
        searchPlaceholder={t('Find by name')}
      />
    </div>
  )
}
