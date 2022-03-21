/* Copyright Contributors to the Open Cluster Management project */

import { StatusIcons } from '../../../components/StatusIcons'
import { useTranslation } from '../../../lib/acm-i18next'
import { IPolicyRisks } from '../useGovernanceData'

export function ClusterPolicyViolationIcons(props: {
    risks: IPolicyRisks
    compliantHref?: string
    violationHref?: string
    unknownHref?: string
}) {
    const { risks, compliantHref, violationHref, unknownHref } = props
    const violations = risks.high + risks.medium + risks.low
    const { t } = useTranslation()
    return (
        <StatusIcons
            compliant={risks.synced}
            compliantTooltip={t('{{count}} clusters without violations', { count: risks.synced })}
            compliantHref={compliantHref}
            violations={violations}
            violationsTooltip={t('{{count}} clusters with violations', { count: violations })}
            violationHref={violationHref}
            unknown={risks.unknown}
            unknownTooltip={t('{{count}} clusters with unknown status', { count: risks.unknown })}
            unknownHref={unknownHref}
        />
    )
}

export function ClusterPolicyViolationIcons2(props: {
    compliant: number
    noncompliant: number
    compliantHref?: string
    violationHref?: string
}) {
    const { t } = useTranslation()
    return (
        <StatusIcons
            compliant={props.compliant}
            compliantTooltip={t('{{count}} clusters without violations', { count: props.compliant })}
            compliantHref={props.compliantHref}
            violations={props.noncompliant}
            violationsTooltip={t('{{count}} clusters with violations', { count: props.noncompliant })}
            violationHref={props.violationHref}
        />
    )
}
