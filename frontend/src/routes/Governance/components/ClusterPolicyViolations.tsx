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
    const violations = risks.high + risks.medium + risks.low
    return (
        <StatusLabeledIcons
            violations={violations}
            violationStatus={`${violations} ${violations ? 'cluster' : 'clusters'}`}
            violationSubtitle={`with policy violations`}
            compliant={risks.synced}
            compliantStatus={`${risks.synced} ${risks.synced === 1 ? 'cluster' : 'clusters'}`}
            compliantSubtitle={`without policy violations`}
            unknown={risks.unknown}
            unknownStatus={`${unknownCount} ungoverned`}
            unknownSubtitle={`${unknownCount === 1 ? 'cluster' : 'clusters'}`}
        />
    )
}

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
