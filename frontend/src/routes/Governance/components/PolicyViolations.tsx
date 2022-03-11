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
    const { risks, compliantHref, violationHref, unknownHref, compliantOnClick, violationOnClick, unknownOnClick } =
        props
    const violations = risks.high + risks.medium + risks.low
    return (
        <StatusIcons
            compliant={risks.synced}
            compliantTooltip={t('policies.noviolations', { count: risks.synced })}
            compliantHref={compliantHref}
            compliantOnClick={compliantOnClick}
            violations={violations}
            violationsTooltip={t('policies.violations', { count: violations })}
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
    noncompliant: number
    violationHref?: string
    violationOnClick?: () => void
}) {
    const { t } = useTranslation()
    return (
        <StatusIcons
            compliant={props.compliant}
            compliantTooltip={t('policies.noviolations', { count: props.compliant })}
            compliantHref={props.compliantHref}
            compliantOnClick={props.compliantOnClick}
            violations={props.noncompliant}
            violationsTooltip={t('policy.violations', { count: props.noncompliant })}
            violationHref={props.violationHref}
            violationOnClick={props.violationOnClick}
        />
    )
}
