/* Copyright Contributors to the Open Cluster Management project */

import { StatusIcons } from '../../../components/StatusIcons'
import { IPolicyRisks } from '../useGovernanceData'

export function ClusterPolicyViolationIcons(props: { risks: IPolicyRisks }) {
    const { risks } = props
    const violations = risks.high + risks.medium + risks.low
    return (
        <StatusIcons
            compliant={risks.synced}
            compliantTooltip={
                risks.synced == 1
                    ? '1 cluster in compliance'
                    : '{0} clusters in compliance'.replace('{0}', risks.synced.toString())
            }
            violations={violations}
            violationsTooltip={
                violations == 1
                    ? '1 cluster with violations'
                    : '{0} clusters with violations'.replace('{0}', violations.toString())
            }
            unknown={risks.unknown}
            unknownTooltip={
                risks.unknown == 1
                    ? '1 cluster with unknown status'
                    : '{0} clusters with unknown status'.replace('{0}', risks.unknown.toString())
            }
        />
    )
}

export function ClusterPolicyViolationIcons2(props: { compliant: number; noncompliant: number }) {
    return (
        <StatusIcons
            compliant={props.compliant}
            compliantTooltip={
                props.compliant == 1
                    ? '1 cluster in compliance'
                    : '{0} clusters in compliance'.replace('{0}', props.compliant.toString())
            }
            violations={props.noncompliant}
            violationsTooltip={
                props.noncompliant == 1
                    ? '1 cluster with violations'
                    : '{0} clusters with violations'.replace('{0}', props.noncompliant.toString())
            }
        />
    )
}
