/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { TableGridBreakpoint } from '@patternfly/react-table'
import { AcmTable, compareStrings } from '../../../ui-components'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { ManagedCluster } from '../../../resources'
import { ClusterPolicies, getPolicyForCluster } from '../common/util'
import { useSharedAtoms } from '../../../shared-recoil'

const useStyles = makeStyles({
  body: {
    position: 'relative',
    top: '-35px',
    padding: '0 8px',
    '& section': {
      paddingTop: 'var(--pf-global--spacer--lg)',
    },
  },
  titleText: {
    paddingBottom: 'var(--pf-global--spacer--xl)',
    '& h4': {
      color: 'var(--pf-global--Color--200)',
    },
  },
  sectionSeparator: {
    borderBottom: '1px solid #D2D2D2',
    margin: '0 -2rem 1rem -2rem',
    paddingTop: '2rem',
  },
  toggleContainer: {
    position: 'relative',
    zIndex: 1,
    top: '16px',
    width: 'fit-content',
    height: 0,
    marginLeft: 'auto',
  },
  tableTitle: {
    paddingBottom: 'var(--pf-global--spacer--md)',
  },
  backAction: {
    paddingBottom: 'var(--pf-global--spacer--lg)',
  },
  subDetailComponents: {
    paddingBottom: 'var(--pf-global--spacer--xl)',
    '& small': {
      color: 'inherit',
      paddingBottom: 'var(--pf-global--spacer--sm)',
    },
  },
  riskSubDetail: {
    paddingLeft: 'var(--pf-global--spacer--lg)',
    '& p': {
      fontSize: 'var(--pf-global--FontSize--xs)',
      color: '#5A6872',
    },
  },
})

export function ClusterPolicySummarySidebar(props: { cluster: ManagedCluster; compliance: string }) {
  const { cluster, compliance } = props
  const classes = useStyles()
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
              to={{
                pathname: NavigationPath.policyDetailsResults
                  .replace(':namespace', policy.policyNamespace)
                  .replace(':name', policy.policyName),
              }}
            >
              {policy.policyName}
            </Link>
          )
        },
      },
      {
        header: t('Cluster violation'),
        sort: (a: ClusterPolicies, b: ClusterPolicies) => compareStrings(a.compliance, b.compliance),
        cell: (policy: ClusterPolicies) => {
          switch (policy?.compliance?.toLowerCase()) {
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
      },
    ],
    [t]
  )

  return (
    <div className={classes.body}>
      <div className={classes.sectionSeparator} />
      <AcmTable<ClusterPolicies>
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
