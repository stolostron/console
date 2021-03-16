/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { AcmAlert, AcmButton } from '@open-cluster-management/ui-components'
import { AlertVariant, ButtonVariant } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { useQuery } from '../../../../lib/useQuery'
import { getLatest } from '../../../../lib/utils'
import { ClusterProvision, listClusterProvisions } from '../../../../resources/cluster-provision'
import { getHivePod } from '../../../../resources/pod'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { configMapsState } from '../../../../atoms'
import { ConfigMap } from '../../../../resources/configmap'
import { useRecoilState } from 'recoil'

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

    const [configMaps] = useRecoilState(configMapsState)

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
                if (provisionFailedCondition?.status === 'True') {
                    setClusterProvisionStatus(provisionFailedCondition.message)
                }
            }
        } else {
            stopPolling()
            setClusterProvisionStatus(undefined)
        }
    }, [cluster?.status, data, startPolling, stopPolling, clusterProvisionStatus])

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
                        <AcmButton
                            onClick={() => launchLogs(cluster!, configMaps)}
                            variant={ButtonVariant.link}
                            role="link"
                            id="view-logs"
                            className={classes.logsButton}
                        >
                            {t('view.logs')}
                            <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </AcmButton>
                    </Fragment>
                }
                message={clusterProvisionStatus}
            />
        </div>
    )
}

export function launchLogs(cluster: Cluster, configMaps: ConfigMap[]) {
    const openShiftConsoleConfig = configMaps.find((configmap) => configmap.metadata.name === 'console-public')
    const openShiftConsoleUrl = openShiftConsoleConfig?.data?.consoleURL
    if (cluster && openShiftConsoleUrl) {
        const response = getHivePod(cluster.namespace!, cluster.name!, cluster.status!)
        response.then((job) => {
            const podName = job?.metadata.name
            podName &&
                window.open(`${openShiftConsoleUrl}/k8s/ns/${cluster.namespace!}/pods/${podName}/logs?container=hive`)
        })
    }
}
