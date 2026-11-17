/* Copyright Contributors to the Open Cluster Management project */

import { Icon } from '@patternfly/react-core'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  QuestionCircleIcon,
} from '@patternfly/react-icons'
import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { generatePath, Link } from 'react-router'
import { NavigationPath } from '~/NavigationPath'
import { getPolicySeverity, Policy, PolicySeverity } from '~/resources/policy'
import type { DependencySummary } from './policyDependencySummary'

export function getDependencySummaryText(summary: DependencySummary | undefined, t: TFunction): string {
  if (!summary) return t('Dependency status unavailable')
  if (summary.unavailable) return t('Dependency status unavailable')
  if (!summary.notEvaluated && summary.met + summary.notMet + summary.unknown + summary.invalid !== summary.total)
    return t('Dependency status unavailable')
  if (summary.total === 0) return '-'
  if (summary.notEvaluated) return t('{{count}} dependencies · not evaluated', { count: summary.total })

  const parts: string[] = []
  if (summary.invalid > 0) parts.push(t('{{count}} invalid', { count: summary.invalid }))
  if (summary.notMet > 0) parts.push(t('{{count}} not met', { count: summary.notMet }))
  if (summary.met > 0) parts.push(t('{{count}} met', { count: summary.met }))
  if (summary.unknown > 0) parts.push(t('{{count}} unknown', { count: summary.unknown }))
  return parts.length > 0 ? parts.join(', ') : t('Dependency status unavailable')
}

export function PolicyDependenciesCell({
  policy,
  summary,
  t,
}: Readonly<{ policy: Policy; summary: DependencySummary | undefined; t: TFunction }>) {
  const text = getDependencySummaryText(summary, t)
  if (text === '-') return <span>-</span>

  let icon: ReactNode = <QuestionCircleIcon />
  let status: 'success' | 'warning' | 'danger' | undefined
  if (summary && !summary.notEvaluated && !summary.unavailable) {
    if (summary.invalid > 0) {
      status = 'danger'
      icon = <ExclamationCircleIcon />
    } else if (summary.notMet > 0) {
      const enforce = policy.remediationResult?.toLowerCase().includes('enforce') ?? false
      status = enforce || getPolicySeverity(policy) >= PolicySeverity.High ? 'danger' : 'warning'
      icon = status === 'danger' ? <ExclamationCircleIcon /> : <ExclamationTriangleIcon />
    } else if (summary.unknown === 0) {
      status = 'success'
      icon = <CheckCircleIcon />
    }
  }

  return (
    <Link
      to={generatePath(NavigationPath.policyDetailsResults, {
        namespace: policy.metadata.namespace!,
        name: policy.metadata.name!,
      })}
      aria-label={t('View dependency results for {{policy}}: {{summary}}', {
        policy: policy.metadata.name,
        summary: text,
      })}
      title={t('Dependency counts reflect observed resource status and may lag policy evaluation')}
    >
      <Icon status={status} aria-hidden="true" size="sm">
        {icon}
      </Icon>{' '}
      {text}
    </Link>
  )
}
