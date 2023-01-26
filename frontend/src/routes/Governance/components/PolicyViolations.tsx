/* Copyright Contributors to the Open Cluster Management project */

import { StatusIcons } from '../../../components/StatusIcons'
import { useTranslation } from '../../../lib/acm-i18next'
import { IPolicyRisks } from '../useGovernanceData'

export function PolicyViolationIcons(props: {
  risks: IPolicyRisks
  compliantHref?: string
  violationHref?: string
  unknownHref?: string
  compliantOnClick?: () => void
  violationOnClick?: () => void
  unknownOnClick?: () => void
}) {
  const { t } = useTranslation()
  const { risks, compliantHref, violationHref, unknownHref, compliantOnClick, violationOnClick, unknownOnClick } = props
  const violations = risks.high + risks.medium + risks.low
  return (
    <StatusIcons
      compliant={risks.synced}
      compliantTooltip={t('policies.noviolations', { count: risks.synced })}
      compliantHref={compliantHref}
      compliantOnClick={compliantOnClick}
      violations={violations}
      violationsTooltip={t('policy.violations', { count: violations })}
      violationHref={violationHref}
      violationOnClick={violationOnClick}
      unknown={risks.unknown}
      unknownTooltip={t('policies.unknown', { count: risks.unknown })}
      unknownHref={unknownHref}
      unknownOnClick={unknownOnClick}
    />
  )
}

export function PolicyViolationIcons2(props: {
  compliant: number
  compliantHref?: string
  compliantOnClick?: () => void
  pending: number
  pendingHref?: string
  pendingOnClick?: () => void
  noncompliant: number
  violationHref?: string
  violationOnClick?: () => void
  unknown?: number
  unknownHref?: string
  unknownOnClick?: () => void
}) {
  const { t } = useTranslation()
  return (
    <StatusIcons
      compliant={props.compliant}
      compliantTooltip={t('policies.noviolations', { count: props.compliant })}
      compliantHref={props.compliantHref}
      pending={props.pending}
      pendingTooltip={t('policies.pending', { count: props.pending })}
      pendingHref={props.pendingHref}
      pendingOnClick={props.pendingOnClick}
      violations={props.noncompliant}
      violationsTooltip={t('policy.violations', { count: props.noncompliant })}
      violationHref={props.violationHref}
      violationOnClick={props.violationOnClick}
      unknown={props.unknown}
      unknownTooltip={t('policies.unknown', { count: props.unknown })}
      unknownHref={props.unknownHref}
      unknownOnClick={props.unknownOnClick}
    />
  )
}
