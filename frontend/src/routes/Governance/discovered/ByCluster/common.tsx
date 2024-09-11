/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { ViolationsCard, ViolationSummary } from '../../overview/PolicyViolationSummary'
import { DiscoveredPolicyItem, DiscoverdPolicyTableItem, ISourceType } from '../useFetchPolicies'
import { compareStrings, IAcmTableColumn } from '../../../../ui-components'
import { TFunction } from 'react-i18next'
import { getPolicySource } from '../../common/util'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import { Channel, HelmRelease, Subscription } from '../../../../resources'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../../lib/acm-i18next'

export const policyViolationSummary = (discoveredPolicyItems: DiscoveredPolicyItem[]): ViolationSummary => {
  let compliant = 0
  let noncompliant = 0
  let pending = 0
  let unknown = 0
  for (const policy of discoveredPolicyItems) {
    if (policy.disabled || !policy?.compliant) continue
    switch (policy?.compliant?.toLowerCase()) {
      case 'compliant':
        compliant++
        break
      case 'noncompliant':
        noncompliant++
        break
      case 'pending':
        pending++
        break
      default:
        unknown++
        break
    }
  }
  return { noncompliant, compliant, pending, unknown }
}

export const ByClusterCols = (
  t: TFunction<string, undefined>,
  helmReleases: HelmRelease[],
  subscriptions: Subscription[],
  channels: Channel[],
  moreCols?: IAcmTableColumn<DiscoveredPolicyItem>[]
): IAcmTableColumn<DiscoveredPolicyItem>[] =>
  useMemo(() => {
    return [
      {
        header: t('Cluster'),
        cell: (item: DiscoveredPolicyItem) => {
          return (
            <Link
              to={generatePath(NavigationPath.discoveredPolicyDetails, {
                clusterName: item.cluster,
                apiVersion: item.apiversion,
                apiGroup: item.apigroup,
                kind: item.kind,
                // discovered policy name
                templateName: item.name,
                templateNamespace: item.namespace,
              })}
            >
              {item.cluster}
            </Link>
          )
        },
        sort: 'cluster',
        search: 'cluster',
        id: 'cluster',
        exportContent: (item) => item.cluster,
      },
      ...(moreCols ?? []),
      {
        header: t('Response action'),
        cell: 'remediationAction',
        sort: 'remediationAction',
        search: 'remediationAction',
        id: 'responseAction',
        exportContent: (item: DiscoveredPolicyItem) => item.remediationAction,
      },
      {
        header: t('Severity'),
        // TODO Add severity icon
        cell: severityCell,
        sort: 'severity',
        id: 'severity',
        exportContent: (item) => item.severity,
      },
      {
        header: t('Violations'),
        cell: (item: DiscoveredPolicyItem) => {
          const compliant = item?.compliant?.toLowerCase()
          switch (compliant) {
            case 'compliant':
              return (
                <div>
                  <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {t('No violations')}
                </div>
              )
            case 'noncompliant':
              return (
                <div>
                  <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> {t('Violations')}
                </div>
              )
            case 'pending':
              return (
                <div>
                  <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('Pending')}
                </div>
              )
            default:
              return (
                <div>
                  <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('No status')}
                </div>
              )
          }
        },
        sort: 'compliant',
        id: 'violations',
        exportContent: (item: DiscoveredPolicyItem) => item.compliant || '-',
      },
      {
        header: t('Source'),
        cell: (item: DiscoveredPolicyItem) => {
          if (item.source?.type === 'Policy') {
            return discoveredSourceCell(t, item.source)
          }
          return getPolicySource(item, helmReleases, channels, subscriptions, t)
        },
        sort: (a: DiscoveredPolicyItem, b: DiscoveredPolicyItem) => compareStrings(a.source?.type, b.source?.type),
        search: (item: DiscoveredPolicyItem) => item.source?.type ?? '',
        id: 'source',
        exportContent: (item) => item.source?.type ?? '-',
      },
    ]
  }, [channels, helmReleases, moreCols, subscriptions, t])

export function DiscoveredViolationsCard(
  props: Readonly<{ policyKind: string; policyViolationSummary: ViolationSummary }>
) {
  const { t } = useTranslation()
  return (
    <ViolationsCard
      title={props.policyKind + ' ' + t('violations')}
      description={t('Overview of policy violations')}
      noncompliant={props.policyViolationSummary.noncompliant}
      compliant={props.policyViolationSummary.compliant}
      pending={props.policyViolationSummary.pending}
      unknown={props.policyViolationSummary.unknown}
    />
  )
}

export function discoveredSourceCell(t: TFunction, source: ISourceType | undefined) {
  if (source && source.type === 'Policy' && source.parentName) {
    return (
      <>
        <span
          style={{
            padding: '1px 5px',
            backgroundColor: '#009596',
            color: 'var(--pf-global--BackgroundColor--light-100)',
            borderRadius: '20px',
            fontSize: '0.75rem',
            marginRight: '10px',
            width: 20,
            textAlign: 'center',
          }}
        >
          P
        </span>
        <Link
          to={generatePath(NavigationPath.policyDetails, {
            namespace: source.parentNs,
            name: source.parentName,
          })}
          state={{
            from: NavigationPath.policies,
          }}
        >
          {source.parentName}
        </Link>
      </>
    )
  }

  return source?.type ? translateSource(source.type, t) : '-'
}

export function severityCell(item: Readonly<DiscoverdPolicyTableItem | DiscoveredPolicyItem>) {
  const { severity } = item

  if (!severity || severity == 'unknown') return <>-</>
  return <>{severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase()}</>
}

export function translateSource(source: string, t: TFunction): any {
  switch (source) {
    case 'Policy':
      return t('Policy')
    case 'Local':
      return t('Local')
    case 'Managed externally':
      return t('Managed externally')
    case 'External':
      return t('External')
    default:
      return source
  }
}
