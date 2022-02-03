/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, CardTitle } from '@patternfly/react-core'
import { Fragment } from 'react'
import { useHistory } from 'react-router-dom'
import { StatusIcons } from '../../../components/StatusIcons'
import { StatusLabeledIcons } from '../../../components/StatusLabeledIcons'
import { NavigationPath } from '../../../NavigationPath'
import { IPolicyRisks } from '../useGovernanceData'

export function PolicyViolationsCard(props: { risks: IPolicyRisks }) {
    const history = useHistory()
    const count = props.risks.synced + props.risks.low + props.risks.medium + props.risks.high + props.risks.unknown
    if (count === 0) {
        return <Fragment />
    }
    return (
        <Card
            isRounded
            isHoverable
            style={{ transition: 'box-shadow 0.25s', cursor: 'pointer', height: '100%', textAlign: 'center' }}
            onClick={() => {
                history.push(NavigationPath.policies)
            }}
        >
            <CardTitle>{count === 1 ? `1 Policy` : `${count} Policies`}</CardTitle>
            <CardBody>
                <PolicyViolationLabeledIcons risks={props.risks} />
            </CardBody>
        </Card>
    )
}

export function PolicyViolationLabeledIcons(props: { risks: IPolicyRisks }) {
    const { risks } = props
    const violations = risks.high + risks.medium + risks.low
    return (
        <StatusLabeledIcons
            violations={violations}
            violationStatus={`${violations} ${violations === 1 ? 'policy' : 'policies'}`}
            violationSubtitle={`with cluster violations`}
            compliant={risks.synced}
            compliantStatus={`${risks.synced} ${violations === 1 ? 'policy' : 'policies'}`}
            compliantSubtitle={`without cluster violations`}
            unknown={risks.unknown}
            unknownStatus={`${risks.unknown} unknown`}
        />
    )
}

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
                risks.high == 1
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
