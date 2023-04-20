/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import {
  Cluster,
  ClusterDeploymentKind,
  ClusterPoolKind,
  ClusterProvision,
  ClusterStatus,
  ConfigMap,
  getHivePod,
  getLatest,
  getProvisionNotification,
} from '../../../../../resources'
import { AcmAlert, AcmButton, Provider } from '../../../../../ui-components'
import { AlertVariant, ButtonVariant } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, useContext } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'

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
  const { clusterProvisionsState, configMapsState } = useSharedAtoms()
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

  if (cluster?.isHypershift) {
    return null
  }

  if (!provisionStatuses.includes(/* istanbul ignore next */ cluster?.status ?? '')) {
    return null
  }

  if (cluster!.statusMessage) {
    return null
  }

  if (
    cluster?.provider === Provider.hostinventory &&
    (cluster?.status === ClusterStatus.provisionfailed || cluster?.status === ClusterStatus.deprovisionfailed)
  ) {
    return null
  }

  return (
    <div style={{ marginBottom: '1rem' }} id={`hive-notification-${cluster?.status}`}>
      <AcmAlert
        isInline
        variant={
          cluster?.status === ClusterStatus.provisionfailed || cluster?.status === ClusterStatus.deprovisionfailed
            ? AlertVariant.danger
            : AlertVariant.info
        }
        title={
          <Fragment>
            {getProvisionNotification(cluster?.status, t)}
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
  if (cluster && cluster.name && cluster.namespace && openShiftConsoleUrl) {
    const response = getHivePod(cluster.namespace, cluster.name, cluster.status)
    response.then((job) => {
      const podName = job?.metadata.name || ''
      const containerName = podName.includes('uninstall') ? 'deprovision' : 'hive'
      podName &&
        window.open(
          `${openShiftConsoleUrl}/k8s/ns/${cluster.namespace}/pods/${podName}/logs?container=${containerName}`
        )
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
