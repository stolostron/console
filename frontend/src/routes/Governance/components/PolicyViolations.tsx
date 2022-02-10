/* Copyright Contributors to the Open Cluster Management project */

import { StatusIcons } from '../../../components/StatusIcons'
import { useTranslation } from '../../../lib/acm-i18next'
import { IPolicyRisks } from '../useGovernanceData'

export function PolicyViolationIcons(props: { risks: IPolicyRisks }) {
    const { risks } = props
    const violations = risks.high + risks.medium + risks.low
    return (
        <StatusIcons
            compliant={risks.synced}
            compliantTooltip={
                risks.synced == 1
                    ? '1 compliannt policy'
                    : '{0} compliannt policies'.replace('{0}', risks.synced.toString())
            }
            violations={violations}
            violationsTooltip={
                violations == 1
                    ? '1 policy with violations'
                    : '{0} policies with violations'.replace('{0}', violations.toString())
            }
            unknown={risks.unknown}
            unknownTooltip={
                risks.unknown == 1
                    ? '1 policy with unknown status'
                    : '{0} policies with unknown status'.replace('{0}', risks.unknown.toString())
            }
        />
    )
}

export function PolicyViolationIcons2(props: { compliant: number; noncompliant: number }) {
    const { t } = useTranslation()
    return (
        <StatusIcons
            compliant={props.compliant}
            compliantTooltip={
                props.compliant == 1
                    ? t('1 policy without violations')
                    : t('{0} policies without violations').replace('{0}', props.compliant.toString())
            }
            violations={props.noncompliant}
            violationsTooltip={
                props.noncompliant == 1
                    ? t('1 policy with violations')
                    : t('{0} policies with violations').replace('{0}', props.noncompliant.toString())
            }
        />
    )
}
