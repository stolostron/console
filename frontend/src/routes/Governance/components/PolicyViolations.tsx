/* Copyright Contributors to the Open Cluster Management project */

import { StatusIcons } from '../../../components/StatusIcons'
import { useTranslation } from '../../../lib/acm-i18next'
import { IPolicyRisks } from '../useGovernanceData'

export function PolicyViolationIcons(props: {
    risks: IPolicyRisks
    compliantHref?: string
    violationHref?: string
    unknownHref?: string
}) {
    const { t } = useTranslation()
    const { risks, compliantHref, violationHref, unknownHref } = props
    const violations = risks.high + risks.medium + risks.low
    return (
        <StatusIcons
            compliant={risks.synced}
            compliantTooltip={t('policies.noviolations', { count: risks.synced })}
            compliantHref={compliantHref}
            violations={violations}
            violationsTooltip={t('policies.violations', { count: violations })}
            violationHref={violationHref}
            unknown={risks.unknown}
            unknownTooltip={t('policies.unknown', { count: risks.unknown })}
            unknownHref={unknownHref}
        />
    )
}

export function PolicyViolationIcons2(props: {
    compliant: number
    noncompliant: number
    compliantHref?: string
    violationHref?: string
}) {
    const { t } = useTranslation()
    return (
        <StatusIcons
            compliant={props.compliant}
            compliantTooltip={t('policy.noviolations', { count: props.compliant })}
            compliantHref={props.compliantHref}
            violations={props.noncompliant}
            violationsTooltip={t('policy.violations', { count: props.noncompliant })}
            violationHref={props.violationHref}
        />
    )
}
