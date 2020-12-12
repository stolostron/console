import React from 'react'
import { useTranslation } from 'react-i18next'
import { AcmInlineStatus, StatusType, AcmButton } from '@open-cluster-management/ui-components'
import { ButtonVariant } from '@patternfly/react-core'
import { ClusterStatus, DistributionInfo } from '../lib/get-cluster'

export function StatusField(props: { status: ClusterStatus }) {
    const { t } = useTranslation(['cluster'])
    let type: StatusType
    switch (props.status) {
        case ClusterStatus.ready:
            type = StatusType.healthy
            break
        case ClusterStatus.needsapproval:
            type = StatusType.warning
            break
        case ClusterStatus.failed:
        case ClusterStatus.notaccepted:
        case ClusterStatus.offline:
            type = StatusType.danger
            break
        case ClusterStatus.creating:
        case ClusterStatus.destroying:
        case ClusterStatus.detaching:
            type = StatusType.progress
            break
        case ClusterStatus.pending:
        case ClusterStatus.pendingimport:
        case ClusterStatus.detached:
        default:
            type = StatusType.unknown
    }

    return <AcmInlineStatus type={type} status={t(`status.${props.status}`)} />
}

export function DistributionField(props: { data: DistributionInfo | undefined }) {
    const { t } = useTranslation(['cluster'])
    if (!props.data) return <>-</>
    if (props.data.ocp?.availableUpdates && props.data.ocp.availableUpdates.length > 0) {
        return (
            <span>
                {props.data.displayVersion}{' '}
                <span style={{ whiteSpace: 'nowrap' }}>
                    (
                    <AcmButton variant={ButtonVariant.link} style={{ padding: 0, margin: 0, fontSize: '14px' }}>
                        {t('upgrade.available')}
                    </AcmButton>
                    )
                </span>
            </span>
        )
    } else {
        return <>{props.data.displayVersion ?? '-'}</>
    }
}
