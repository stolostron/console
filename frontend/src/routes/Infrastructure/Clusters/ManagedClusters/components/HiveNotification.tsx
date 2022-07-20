/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import {
    Cluster,
    ClusterDeploymentKind,
    ClusterPoolKind,
    ClusterProvision,
    ClusterStatus,
    ConfigMap,
    getHivePod,
    getLatest,
} from '../../../../../resources'
import { AcmAlert, AcmButton, Provider } from '../../../../../ui-components'
import { AlertVariant, ButtonVariant } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, useContext } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
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

    const isHybrid = cluster?.provider === Provider.hybrid

    const provisionStatuses: string[] = [
        ClusterStatus.destroying,
        ClusterStatus.provisionfailed,
        ClusterStatus.deprovisionfailed,
    ]

    if (cluster?.provider === Provider.hypershift) {
        return null
    }

    if (!provisionStatuses.includes(/* istanbul ignore next */ cluster?.status ?? '')) {
        return null
    }

    if (cluster!.statusMessage) {
        return null
    }

    if (
        isHybrid &&
        (cluster?.status === ClusterStatus.provisionfailed || cluster?.status === ClusterStatus.deprovisionfailed)
    ) {
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

export function launchToYaml(cluster: Cluster, configMaps: ConfigMap[]) {
    let kind = ClusterDeploymentKind
    let namespace = cluster.namespace
    let name = cluster.name
    if (cluster.hive.clusterPool) {
        kind = ClusterPoolKind
        name = cluster.hive.clusterPool
        namespace = cluster.hive.clusterPoolNamespace
    }
    const openShiftConsoleConfig = configMaps.find((configmap) => configmap.metadata.name === 'console-public')
    const openShiftConsoleUrl = openShiftConsoleConfig?.data?.consoleURL
    window.open(`${openShiftConsoleUrl}/k8s/ns/${namespace}/hive.openshift.io~v1~${kind}/${name}/yaml`)
}
