/* Copyright Contributors to the Open Cluster Management project */
import { useContext } from 'react'
import { LogsDownloadButton, AgentClusterInstallK8sResource } from '@openshift-assisted/ui-lib/cim'
import { Cluster, ClusterStatus } from '../../../../../resources'
import { AcmButton, AcmPageProcess, Provider } from '../../../../../ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../../NavigationPath'
import { AddCluster } from './AddCluster'
import { launchLogs } from './HiveNotification'
import { ButtonVariant } from '@patternfly/react-core'
import { ClusterContext } from '../../../../../routes/Infrastructure/Clusters/ManagedClusters/ClusterDetails/ClusterDetails'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'

const getLoadingMsgI18nKey = (
  cluster: Cluster | undefined,
  agentClusterInstall: AgentClusterInstallK8sResource | undefined
) => {
  const isHybrid =
    cluster?.provider &&
    [Provider.hostinventory, Provider.nutanix].includes(cluster?.provider) &&
    !cluster?.isHypershift
  if (cluster?.status === ClusterStatus.destroying && isHybrid) {
    /*
      t('destroying.ai.inprogress.message')
      t('destroying.ai.nologs.inprogress.message')
    */
    return agentClusterInstall?.status?.debugInfo?.logsURL
      ? 'destroying.ai.inprogress.message'
      : 'destroying.ai.nologs.inprogress.message'
  }
  /*
    t('detaching.inprogress.message')
    t('detaching.success.message')
    t('destroying.inprogress.message')
    t('destroying.success.message')
  */
  return `${cluster?.status}.inprogress.message`
}

export function ClusterDestroy(props: { isLoading: boolean; cluster: Cluster }) {
  const { t } = useTranslation()
  const history = useHistory()
  const { configMapsState } = useSharedAtoms()
  const [configMaps] = useRecoilState(configMapsState)
  const isHybrid =
    props.cluster?.provider &&
    [Provider.hostinventory, Provider.nutanix].includes(props.cluster?.provider) &&
    !props.cluster?.isHypershift
  const { agentClusterInstall } = useContext(ClusterContext)

  const { loadingTitle, successTitle } =
    props.cluster.status === ClusterStatus.detaching
      ? {
          loadingTitle: t('detaching.inprogress', { clusterName: props.cluster?.displayName }),
          successTitle: t('detaching.success', { clusterName: props.cluster?.displayName }),
        }
      : {
          loadingTitle: t('destroying.inprogress', { clusterName: props.cluster?.displayName }),
          successTitle: t('destroying.success', { clusterName: props.cluster?.displayName }),
        }
  return (
    <AcmPageProcess
      isLoading={props.isLoading}
      loadingTitle={loadingTitle}
      loadingMessage={
        <Trans
          i18nKey={getLoadingMsgI18nKey(props.cluster, agentClusterInstall)}
          values={{ clusterName: props.cluster?.displayName }}
          components={{ bold: <strong /> }}
        />
      }
      successTitle={successTitle}
      successMessage={
        <Trans
          i18nKey={`${props.cluster?.status}.success.message`}
          values={{ clusterName: props.cluster?.displayName }}
          components={{ bold: <strong /> }}
        />
      }
      loadingPrimaryAction={
        <AcmButton role="link" onClick={() => history.push(NavigationPath.clusters)}>
          {t('button.backToClusters')}
        </AcmButton>
      }
      loadingSecondaryActions={
        <>
          {props.cluster?.status === ClusterStatus.destroying &&
            (!isHybrid ? (
              <AcmButton
                variant="link"
                icon={<ExternalLinkAltIcon />}
                iconPosition="right"
                onClick={() => launchLogs(props.cluster!, configMaps)}
              >
                {t('view.logs')}
              </AcmButton>
            ) : (
              agentClusterInstall?.status?.debugInfo?.logsURL && (
                <LogsDownloadButton
                  id="cluster-logs-button"
                  agentClusterInstall={agentClusterInstall}
                  variant={ButtonVariant.link}
                />
              )
            ))}
        </>
      }
      primaryAction={
        <AcmButton role="link" onClick={() => history.push(NavigationPath.clusters)}>
          {t('button.backToClusters')}
        </AcmButton>
      }
      secondaryActions={<AddCluster type="button" buttonType="link" />}
    />
  )
}
