/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
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
import { Fragment } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import { useSharedAtoms, useRecoilValue } from '../../../../../shared-recoil'

const logsButton = css({
  padding: 0,
  fontSize: '14px',
  marginLeft: '4px',
  '& svg': {
    width: '12px',
  },
})

export function HiveNotification() {
  const { cluster } = useClusterDetailsContext()
  const { t } = useTranslation()
  const { clusterProvisionsState, configMapsState } = useSharedAtoms()
  const clusterProvisions = useRecoilValue(clusterProvisionsState)
  const configMaps = useRecoilValue(configMapsState)

  const clusterProvisionList = clusterProvisions.filter((cp) => cp.metadata.namespace === cluster?.namespace)
  const latestClusterProvision = getLatest<ClusterProvision>(clusterProvisionList, 'metadata.creationTimestamp')
  const provisionFailedCondition = latestClusterProvision?.status?.conditions.find(
    (c) => c.type === 'ClusterProvisionFailed'
  )
  const clusterProvisionStatus =
    provisionFailedCondition?.status === 'True' ? provisionFailedCondition.message : cluster.statusMessage

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

  if (cluster.statusMessage) {
    return null
  }

  if (
    cluster?.provider &&
    [Provider.hostinventory, Provider.nutanix].includes(cluster.provider) &&
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
              onClick={() => launchLogs(cluster, configMaps)}
              variant={ButtonVariant.link}
              role="link"
              id="view-logs"
              className={logsButton}
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
      podName && window.open(`${openShiftConsoleUrl}/k8s/ns/${cluster.namespace}/pods/${podName}/logs`)
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
