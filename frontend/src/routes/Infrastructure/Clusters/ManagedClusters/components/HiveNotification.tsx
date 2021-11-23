/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { Cluster, ClusterProvision, ClusterStatus, ConfigMap, getHivePod, getLatest } from '../../../../../resources'
import { AcmAlert, AcmButton } from '@open-cluster-management/ui-components'
import { AlertVariant, ButtonVariant } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { clusterProvisionsState, configMapsState } from '../../../../../atoms'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'

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
    const { t } = useTranslation()
    const classes = useStyles()

    const [clusterProvisions] = useRecoilState(clusterProvisionsState)
    const [configMaps] = useRecoilState(configMapsState)

    const clusterProvisionList = clusterProvisions.filter((cp) => cp.metadata.namespace === cluster?.namespace)
    const latestClusterProvision = getLatest<ClusterProvision>(clusterProvisionList, 'metadata.creationTimestamp')
    const provisionFailedCondition = latestClusterProvision?.status?.conditions.find(
        (c) => c.type === 'ClusterProvisionFailed'
    )
    const clusterProvisionStatus =
        provisionFailedCondition?.status === 'True' ? provisionFailedCondition.message : cluster!.statusMessage

    const provisionStatuses: string[] = [
        ClusterStatus.destroying,
        ClusterStatus.provisionfailed,
        ClusterStatus.deprovisionfailed,
    ]

    if (!provisionStatuses.includes(/* istanbul ignore next */ cluster?.status ?? '')) {
        return null
    }

    if (cluster!.statusMessage) {
        return null
    }

    function getProvisionNotification(clusterStatus: ClusterStatus, t: (string: String) => string) {
        switch (clusterStatus) {
            case 'creating':
                return t('Cluster creation is in progress:')
            case 'deprovisionfailed':
                return t('Cluster destroy failed:')
            case 'provisionfailed':
                return t('Cluster creation failed:')
            case 'destroying':
                return t('Cluster creating is in progress:')
            default:
                break
        }
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
                        {getProvisionNotification(cluster!.status, t)}
                        <AcmButton
                            onClick={() => launchLogs(cluster!, configMaps)}
                            variant={ButtonVariant.link}
                            role="link"
                            id="view-logs"
                            className={classes.logsButton}
                        >
                            {t('View logs')}
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
