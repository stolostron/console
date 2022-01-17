import React, { Fragment, useContext, useEffect, useState, useCallback } from 'react'
import { AcmAlert, AcmButton } from '@stolostron/ui-components'
import { AlertVariant, ButtonVariant } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { makeStyles } from '@material-ui/styles'
import { useTranslation } from 'react-i18next'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { getHivePod } from '../../../../resources/pod'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { useQuery } from '../../../../lib/useQuery'
import { getLatest } from '../../../../lib/utils'
import { ClusterProvision, listClusterProvisions } from '../../../../resources/cluster-provision'

const useStyles = makeStyles({
    logsButton: {
        padding: 0,
        fontSize: '14px',
        marginLeft: '4px',
        '& svg': {
            width: '12px',
        },
    },
})

export function HiveNotification() {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster'])
    const classes = useStyles()

    const { data, startPolling, stopPolling } = useQuery(
        useCallback(() => listClusterProvisions(/* istanbul ignore next */ cluster?.namespace ?? ''), [
            cluster?.namespace,
        ])
    )

    const [clusterProvisionStatus, setClusterProvisionStatus] = useState<string | undefined>()
    useEffect(() => {
        if (cluster?.status === ClusterStatus.provisionfailed) {
            startPolling()
            /* istanbul ignore else */
            if (data) {
                const latestProvision = getLatest<ClusterProvision>(data, 'metadata.creationTimestamp')
                const provisionFailedCondition = latestProvision?.status?.conditions.find(
                    (c) => c.type === 'ClusterProvisionFailed'
                )
                /* istanbul ignore else */
                if (cluster.statusMessage) {
                    // invalid image set is only statusMessage in 2.2
                    return setClusterProvisionStatus(cluster.statusMessage)
                } else if (provisionFailedCondition?.status === 'True') {
                    return setClusterProvisionStatus(provisionFailedCondition.message)
                }
            }
        } else {
            stopPolling()
            setClusterProvisionStatus(undefined)
        }
    }, [cluster?.status, cluster?.statusMessage, data, startPolling, stopPolling, clusterProvisionStatus])

    const provisionStatuses: string[] = [
        ClusterStatus.creating,
        ClusterStatus.destroying,
        ClusterStatus.provisionfailed,
        ClusterStatus.deprovisionfailed,
    ]

    if (!provisionStatuses.includes(/* istanbul ignore next */ cluster?.status ?? '')) {
        return null
    }

    return (
        <div style={{ marginBottom: '1rem' }} id={`hive-notification-${cluster?.status}`}>
            <AcmAlert
                isInline
                variant={
                    cluster?.status === ClusterStatus.provisionfailed ||
                    cluster?.status === ClusterStatus.deprovisionfailed
                        ? AlertVariant.danger
                        : AlertVariant.info
                }
                title={
                    <Fragment>
                        {t(`provision.notification.${cluster?.status}`)}
                        {!cluster?.statusMessage && (
                            <AcmButton
                                onClick={() => launchLogs(cluster)}
                                variant={ButtonVariant.link}
                                role="link"
                                id="view-logs"
                                className={classes.logsButton}
                            >
                                {t('view.logs')}
                                <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                            </AcmButton>
                        )}
                    </Fragment>
                }
                message={clusterProvisionStatus}
            />
        </div>
    )
}

export function launchLogs(cluster?: Cluster) {
    if (cluster) {
        const openShiftConsoleUrlNode: HTMLInputElement | null = document.querySelector('#openshift-console-url')
        /* istanbul ignore next */
        const openShiftConsoleUrl = openShiftConsoleUrlNode ? openShiftConsoleUrlNode.value : ''
        /* istanbul ignore next */
        const name = cluster?.name ?? ''
        /* istanbul ignore next */
        const namespace = cluster?.namespace ?? ''
        /* istanbul ignore next */
        const status = cluster?.status ?? ''
        /* istanbul ignore else */
        if (name && namespace) {
            const response = getHivePod(namespace, name, status)
            response.then((job) => {
                const podName = job?.metadata.name
                podName && window.open(`${openShiftConsoleUrl}/k8s/ns/${namespace}/pods/${podName}/logs?container=hive`)
            })
        }
    }
}
