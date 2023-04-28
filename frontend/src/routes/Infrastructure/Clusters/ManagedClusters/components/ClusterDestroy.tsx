/* Copyright Contributors to the Open Cluster Management project */
import { useContext } from 'react'
import { Cluster, ClusterStatus } from '../../../../../resources'
import { AcmButton, AcmPageProcess, Provider } from '../../../../../ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../../NavigationPath'
import { AddCluster } from './AddCluster'
import { launchLogs } from './HiveNotification'
import * as CIM from '@openshift-assisted/ui-lib/cim'
import { ButtonVariant } from '@patternfly/react-core'
import { ClusterContext } from '../../../../../routes/Infrastructure/Clusters/ManagedClusters/ClusterDetails/ClusterDetails'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'

const { LogsDownloadButton } = CIM

export function ClusterDestroy(props: { isLoading: boolean; cluster: Cluster }) {
  const { t } = useTranslation()
  const history = useHistory()
  const { configMapsState } = useSharedAtoms()
  const [configMaps] = useRecoilState(configMapsState)
  const isHybrid = props.cluster?.provider === Provider.hostinventory && !props.cluster?.isHypershift
  const { agentClusterInstall } = useContext(ClusterContext)

  /*
        t('detaching.inprogress.message')
        t('detaching.success.message')
        t('destroying.inprogress.message')
        t('destroying.success.message')
    */
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
          i18nKey={`${props.cluster?.status}.inprogress.message`}
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
              <LogsDownloadButton
                id="cluster-logs-button"
                agentClusterInstall={agentClusterInstall}
                variant={ButtonVariant.link}
              />
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
