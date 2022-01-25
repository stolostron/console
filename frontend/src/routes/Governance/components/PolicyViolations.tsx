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
    return (
        <StatusLabeledIcons
            ready={risks.synced}
            readyStatus={`${risks.synced} compliant`}
            readySubtitle={risks.synced === 1 ? 'policy' : 'policies'}
            low={risks.low}
            lowStatus={`${risks.low} low risk`}
            lowSubtitle={`${risks.low === 1 ? 'violation' : 'violations'}`}
            medium={risks.medium}
            mediumStatus={`${risks.medium} medium risk`}
            mediumSubtitle={`${risks.medium === 1 ? 'violation' : 'violations'}`}
            high={risks.high}
            highStatus={`${risks.high} high risk`}
            highSubtitle={`${risks.high === 1 ? 'violation' : 'violations'}`}
            unknown={risks.unknown}
            unknownStatus={`${risks.unknown} unknown`}
            unknownSubtitle={`${risks.unknown === 1 ? 'violation' : 'violations'}`}
        />
    )
}

export function PolicyViolationIcons(props: { risks: IPolicyRisks }) {
    const { risks } = props
    return (
        <StatusIcons
            ready={risks.synced}
            readyTooltip={
                risks.synced == 1
                    ? '{0} policy in compliance'.replace('{0}', risks.synced.toString())
                    : '{0} policies in compliance'.replace('{0}', risks.synced.toString())
            }
            low={risks.low}
            lowTooltip={
                risks.low == 1
                    ? '{0} low violation policy'.replace('{0}', risks.low.toString())
                    : '{0} low violation policies'.replace('{0}', risks.low.toString())
            }
            medium={risks.medium}
            mediumTooltip={
                risks.medium == 1
                    ? '{0} medium violation policy'.replace('{0}', risks.medium.toString())
                    : '{0} medium violation policies'.replace('{0}', risks.medium.toString())
            }
            high={risks.high}
            highTooltip={
                risks.high == 1
                    ? '{0} high violation policy'.replace('{0}', risks.high.toString())
                    : '{0} high violation policies'.replace('{0}', risks.high.toString())
            }
            unknown={risks.unknown}
            unknownTooltip={
                risks.unknown == 1
                    ? '{0} unknown violation policy'.replace('{0}', risks.unknown.toString())
                    : '{0} unknown violation policies'.replace('{0}', risks.unknown.toString())
            }
        />
    )
}
