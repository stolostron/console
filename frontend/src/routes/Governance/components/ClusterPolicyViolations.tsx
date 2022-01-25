/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, CardTitle } from '@patternfly/react-core'
import { Fragment } from 'react'
import { useHistory } from 'react-router-dom'
import { StatusIcons } from '../../../components/StatusIcons'
import { StatusLabeledIcons } from '../../../components/StatusLabeledIcons'
import { NavigationPath } from '../../../NavigationPath'
import { IPolicyRisks } from '../useGovernanceData'

export function ClusterPolicyViolationCard(props: { risks: IPolicyRisks }) {
    const history = useHistory()
    // TODO - use real cluster total from cluster view
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
                history.push(NavigationPath.clusters)
            }}
        >
            <CardTitle>{count === 1 ? `${count} Cluster` : `${count} Clusters`}</CardTitle>
            <CardBody>
                <ClusterPolicyViolationLabeledIcons risks={props.risks} clusterTotal={count} />
            </CardBody>
        </Card>
    )
}

export function ClusterPolicyViolationLabeledIcons(props: { risks: IPolicyRisks; clusterTotal: number }) {
    const { risks } = props
    const unknownCount = props.clusterTotal - risks.low - risks.medium - risks.high - risks.synced
    return (
        <StatusLabeledIcons
            ready={risks.synced}
            readyStatus={`${risks.synced} compliant`}
            readySubtitle={risks.synced === 1 ? 'cluster' : 'clusters'}
            low={risks.low}
            lowStatus={`${risks.low} low risk`}
            lowSubtitle={`${risks.low === 1 ? 'cluster' : 'clusters'}`}
            medium={risks.medium}
            mediumStatus={`${risks.medium} medium risk`}
            mediumSubtitle={`${risks.medium === 1 ? 'cluster' : 'clusters'}`}
            high={risks.high}
            highStatus={`${risks.high} high risk`}
            highSubtitle={`${risks.high === 1 ? 'cluster' : 'clusters'}`}
            unknown={risks.unknown}
            unknownStatus={`${unknownCount} ungoverned`}
            unknownSubtitle={`${unknownCount === 1 ? 'cluster' : 'clusters'}`}
        />
    )
}

export function ClusterPolicyViolationIcons(props: { risks: IPolicyRisks }) {
    const { risks } = props
    return (
        <StatusIcons
            ready={risks.synced}
            readyTooltip={
                risks.synced == 1
                    ? '{0} cluster in compliance'.replace('{0}', risks.synced.toString())
                    : '{0} clusters in compliance'.replace('{0}', risks.synced.toString())
            }
            low={risks.low}
            lowTooltip={
                risks.low == 1
                    ? '{0} low risk cluster'.replace('{0}', risks.low.toString())
                    : '{0} low risk clusters'.replace('{0}', risks.low.toString())
            }
            medium={risks.medium}
            mediumTooltip={
                risks.medium == 1
                    ? '{0} medium risk cluster'.replace('{0}', risks.medium.toString())
                    : '{0} medium risk clusters'.replace('{0}', risks.medium.toString())
            }
            high={risks.high}
            highTooltip={
                risks.high == 1
                    ? '{0} high risk cluster'.replace('{0}', risks.high.toString())
                    : '{0} high risk clusters'.replace('{0}', risks.high.toString())
            }
            unknown={risks.unknown}
            unknownTooltip={
                risks.unknown == 1
                    ? '{0} cluster with unknown risk status'.replace('{0}', risks.unknown.toString())
                    : '{0} clusters with unknown risk status'.replace('{0}', risks.unknown.toString())
            }
        />
    )
}
