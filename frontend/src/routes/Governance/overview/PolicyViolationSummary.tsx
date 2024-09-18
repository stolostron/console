/* Copyright Contributors to the Open Cluster Management project */
import { Card } from '@patternfly/react-core'
import { useLocation } from 'react-router-dom-v5-compat'
import { AcmDonutChart, colorThemes } from '../../../ui-components'
import { useMemo } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Policy } from '../../../resources'
import { NavigationPath } from '../../../NavigationPath'

export function PolicyViolationsCard(props: Readonly<{ policyViolationSummary: ViolationSummary }>) {
  const { t } = useTranslation()
  return (
    <ViolationsCard
      title={t('Policy violations')}
      description={t('Overview of policy violations')}
      noncompliant={props.policyViolationSummary.noncompliant}
      compliant={props.policyViolationSummary.compliant}
      pending={props.policyViolationSummary.pending}
      unknown={props.policyViolationSummary.unknown}
    />
  )
}

export interface ViolationSummary {
  noncompliant: number
  compliant: number
  pending: number
  unknown: number
}

export function usePolicyViolationSummary(policies: Policy[]): ViolationSummary {
  const violations = useMemo(() => {
    let compliant = 0
    let noncompliant = 0
    let pending = 0
    let unknown = 0
    for (const policy of policies) {
      if (policy.spec.disabled) continue
      switch (policy.status?.compliant) {
        case 'Compliant':
          compliant++
          break
        case 'NonCompliant':
          noncompliant++
          break
        case 'Pending':
          pending++
          break
        default:
          unknown++
          break
      }
    }
    return { noncompliant, compliant, pending, unknown }
  }, [policies])
  return violations
}

export function ViolationsCard(
  props: Readonly<{
    title: string
    description: string
    noncompliant: number
    compliant: number
    pending: number
    unknown?: number
  }>
) {
  const { t } = useTranslation()
  const locationPath = useLocation().pathname
  const navPath = locationPath.startsWith(NavigationPath.discoveredPolicies) ? locationPath : NavigationPath.policies

  return (
    <Card>
      <AcmDonutChart
        title={props.title}
        description={props.description}
        donutLabel={{
          title: props.noncompliant.toString(),
          subTitle: t('Violation', { count: props.noncompliant }),
        }}
        data={[
          {
            key: t('with violations', { count: props.noncompliant }),
            value: props.noncompliant,
            isPrimary: true,
            useForTitleCount: true,
            link: props.noncompliant > 0 ? `${navPath}?violations=violations` : undefined,
          },
          {
            key: t('pending'),
            value: props.pending,
            link: props.pending > 0 ? `${navPath}?violations=pending` : undefined,
          },
          {
            key: t('with no violations'),
            value: props.compliant,
            link: props.compliant > 0 ? `${navPath}?violations=no-violations` : undefined,
          },
        ]}
        colorScale={colorThemes.criticalLowSuccess}
      />
    </Card>
  )
}

export type PolicyClusterViolationSummaryMap = Record<string, ViolationSummary>

export function usePolicyClusterViolationSummaryMap(policies: Policy[]): PolicyClusterViolationSummaryMap {
  const violations = useMemo(() => {
    const map: Record<string, ViolationSummary> = {}
    for (const policy of policies) {
      const clusterViolationSummary: ViolationSummary = {
        compliant: 0,
        noncompliant: 0,
        pending: 0,
        unknown: 0,
      }
      map[policy.metadata.uid ?? ''] = clusterViolationSummary
      if (policy.spec.disabled) continue
      for (const clusterStatus of policy.status?.status ?? []) {
        switch (clusterStatus.compliant) {
          case 'Compliant':
            clusterViolationSummary.compliant++
            break
          case 'NonCompliant':
            clusterViolationSummary.noncompliant++
            break
          case 'Pending':
            clusterViolationSummary.pending++
            break
          default:
            clusterViolationSummary.unknown++
            break
        }
      }
    }
    return map
  }, [policies])
  return violations
}
