/* Copyright Contributors to the Open Cluster Management project */
import { LogsDownloadButton, AgentClusterInstallK8sResource } from '@openshift-assisted/ui-lib/cim'
import { Cluster, ClusterStatus } from '../../../../../resources'
import { AcmButton, AcmPageProcess, Provider } from '../../../../../ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { useNavigate } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../../NavigationPath'
import { AddCluster } from './AddCluster'
import { launchLogs } from './HiveNotification'
import { ButtonVariant } from '@patternfly/react-core'
import { useSharedAtoms, useRecoilValue } from '../../../../../shared-recoil'

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

export function ClusterDestroy({
  isLoading,
  cluster,
  agentClusterInstall,
}: {
  isLoading: boolean
  cluster: Cluster
  agentClusterInstall?: AgentClusterInstallK8sResource
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { configMapsState } = useSharedAtoms()
  const configMaps = useRecoilValue(configMapsState)
  const isHybrid =
    cluster?.provider &&
    [Provider.hostinventory, Provider.nutanix].includes(cluster?.provider) &&
    !cluster?.isHypershift

  const { loadingTitle, successTitle } =
    cluster.status === ClusterStatus.detaching
      ? {
          loadingTitle: t('detaching.inprogress', { clusterName: cluster?.displayName }),
          successTitle: t('detaching.success', { clusterName: cluster?.displayName }),
        }
      : {
          loadingTitle: t('destroying.inprogress', { clusterName: cluster?.displayName }),
          successTitle: t('destroying.success', { clusterName: cluster?.displayName }),
        }
  return (
    <AcmPageProcess
      isLoading={isLoading}
      loadingTitle={loadingTitle}
      loadingMessage={
        <Trans
          i18nKey={getLoadingMsgI18nKey(cluster, agentClusterInstall)}
          values={{ clusterName: cluster?.displayName }}
          components={{ bold: <strong /> }}
        />
      }
      successTitle={successTitle}
      successMessage={
        <Trans
          i18nKey={`${cluster?.status}.success.message`}
          values={{ clusterName: cluster?.displayName }}
          components={{ bold: <strong /> }}
        />
      }
      loadingPrimaryAction={
        <AcmButton role="link" onClick={() => navigate(NavigationPath.clusters)}>
          {t('button.backToClusters')}
        </AcmButton>
      }
      loadingSecondaryActions={
        <>
          {cluster?.status === ClusterStatus.destroying &&
            (!isHybrid ? (
              <AcmButton
                variant="link"
                icon={<ExternalLinkAltIcon />}
                iconPosition="right"
                onClick={() => launchLogs(cluster!, configMaps)}
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
        <AcmButton role="link" onClick={() => navigate(NavigationPath.clusters)}>
          {t('button.backToClusters')}
        </AcmButton>
      }
      secondaryActions={<AddCluster type="button" buttonType="link" />}
    />
  )
}
