/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { AcmInlineStatus, StatusType, AcmButton } from '@open-cluster-management/ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useRecoilState } from 'recoil'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { launchLogs } from './HiveNotification'
import { configMapsState } from '../../../../atoms'

export function StatusField(props: { cluster: Cluster }) {
    const { t } = useTranslation(['cluster'])
    const [configMaps] = useRecoilState(configMapsState)

    let type: StatusType

    switch (props.cluster?.status) {
        case ClusterStatus.ready:
            type = StatusType.healthy
            break
        case ClusterStatus.needsapproval:
            type = StatusType.warning
            break
        case ClusterStatus.failed:
        case ClusterStatus.provisionfailed:
        case ClusterStatus.deprovisionfailed:
        case ClusterStatus.notaccepted:
        case ClusterStatus.offline:
            type = StatusType.danger
            break
        case ClusterStatus.creating:
        case ClusterStatus.destroying:
        case ClusterStatus.detaching:
        case ClusterStatus.stopping:
        case ClusterStatus.resuming:
            type = StatusType.progress
            break
        case ClusterStatus.detached:
            type = StatusType.detached
            break
        case ClusterStatus.hibernating:
            type = StatusType.sleep
            break
        case ClusterStatus.pending:
        case ClusterStatus.pendingimport:
        default:
            type = StatusType.pending
    }

    let hasAction = false
    let Action = () => <></>
    switch (props.cluster?.status) {
        case ClusterStatus.creating:
        case ClusterStatus.destroying:
        case ClusterStatus.provisionfailed:
            hasAction = true
            Action = () => (
                <AcmButton
                    style={{ padding: 0, fontSize: 'inherit' }}
                    key={props.cluster.name}
                    onClick={() => launchLogs(props.cluster, configMaps)}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                >
                    {t('view.logs')}
                </AcmButton>
            )
            break
    }

    return (
        <AcmInlineStatus
            type={type}
            status={t(`status.${props.cluster?.status}`)}
            popover={{
                hasAutoWidth: hasAction,
                bodyContent: (
                    <Trans
                        i18nKey={`cluster:status.${props.cluster?.status}.message`}
                        components={{ bold: <strong /> }}
                    />
                ),
                footerContent: hasAction && <Action />,
            }}
        />
    )
}
