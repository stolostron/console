/* Copyright Contributors to the Open Cluster Management project */
import {
  AnsibleJob,
  Cluster,
  ClusterStatus,
  getClusterStatusLabel,
  getClusterStatusType,
  getLatestAnsibleJob,
} from '../../../../../resources'
import { AcmButton, AcmInlineStatus, Provider } from '../../../../../ui-components'
import { ExternalLinkAltIcon, DownloadIcon } from '@patternfly/react-icons'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { Link, useLocation } from 'react-router-dom'
import { getClusterNavPath, NavigationPath } from '../../../../../NavigationPath'
import { ClusterStatusMessageAlert } from './ClusterStatusMessageAlert'
import { launchLogs, launchToYaml } from './HiveNotification'
import { CIM } from 'openshift-assisted-ui-lib'
import { ButtonVariant, Button } from '@patternfly/react-core'
import { useAgentClusterInstall } from '../CreateCluster/components/assisted-installer/utils'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'
import { launchToOCP } from '../../../../../lib/ocp-utils'
import { isPosthookLinkDisabled, isPrehookLinkDisabled, jobPodsStillAvailable, launchJobLogs } from './ProgressStepBar'

const { LogsDownloadButton } = CIM

export function StatusField(props: { cluster: Cluster }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { ansibleJobState, configMapsState, clusterCuratorsState } = useSharedAtoms()
  const [configMaps] = useRecoilState(configMapsState)
  const [ansibleJobs] = useRecoilState(ansibleJobState)
  const latestJob = getLatestAnsibleJob(ansibleJobs, props.cluster?.name!)
  const agentClusterInstall = useAgentClusterInstall({
    name: props.cluster?.name!,
    namespace: props.cluster?.namespace!,
  })
  const [curators] = useRecoilState(clusterCuratorsState)
  const curator = curators.find(
    (curator) => curator.metadata.name === props.cluster?.name && curator.metadata.namespace == props.cluster?.namespace
  )
  const prehooks = curator?.spec?.install?.prehook?.length
  const posthooks = curator?.spec?.install?.posthook?.length

  const isHybrid = props.cluster?.provider === Provider.hostinventory && !props.cluster?.isHypershift
  const type = getClusterStatusType(props.cluster.status)

  let hasAction = false
  let Action = () => <></>
  let header = ''

  const launchToLogs = (hookJob: AnsibleJob | undefined) => {
    if (hookJob?.status?.ansibleJobResult.status === 'error' && jobPodsStillAvailable(curator)) {
      return launchJobLogs(curator)
    } else {
      return window.open(latestJob.prehook?.status?.ansibleJobResult.url)
    }
  }

  switch (props.cluster?.status) {
    case ClusterStatus.notstarted:
      hasAction = true
      Action = () => (
        <AcmButton
          style={{ padding: 0, fontSize: 'inherit' }}
          key={props.cluster.name}
          onClick={() => launchToYaml(props.cluster, configMaps)}
          variant="link"
          role="link"
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
        >
          {t('view.yaml')}
        </AcmButton>
      )
      break
    case ClusterStatus.prehookjob:
    case ClusterStatus.prehookfailed:
      hasAction = true
      Action = () => (
        <AcmButton
          style={{ padding: 0, fontSize: 'inherit' }}
          key={props.cluster.name}
          onClick={() => launchToLogs(latestJob.prehook)}
          variant="link"
          role="link"
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
          isDisabled={isPrehookLinkDisabled(prehooks, posthooks, latestJob, curator)}
        >
          {t('view.logs')}
        </AcmButton>
      )
      break
    case ClusterStatus.posthookjob:
    case ClusterStatus.posthookfailed:
      hasAction = true
      Action = () => (
        <AcmButton
          style={{ padding: 0, fontSize: 'inherit' }}
          key={props.cluster.name}
          onClick={() => launchToLogs(latestJob.posthook)}
          variant="link"
          role="link"
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
          isDisabled={isPosthookLinkDisabled(latestJob, curator)}
        >
          {t('view.logs')}
        </AcmButton>
      )
      break
    case ClusterStatus.creating:
    case ClusterStatus.destroying:
    case ClusterStatus.provisionfailed:
      hasAction = true
      if (isHybrid) {
        Action = () => (
          <LogsDownloadButton
            Component={(props) => <Button {...props} icon={<DownloadIcon />} iconPosition="right" isInline />}
            id="cluster-logs-button"
            agentClusterInstall={agentClusterInstall}
            variant={ButtonVariant.link}
          />
        )
      } else if (props.cluster.isHypershift) {
        const url = `k8s/ns/${props.cluster.hypershift?.hostingNamespace}-${props.cluster.name}/pods`
        Action = () => (
          <AcmButton
            style={{ padding: 0, fontSize: 'inherit' }}
            key={props.cluster.name}
            onClick={() => launchToOCP(url)}
            variant="link"
            role="link"
            icon={<ExternalLinkAltIcon />}
            iconPosition="right"
          >
            {t('view.logs')}
          </AcmButton>
        )
      } else {
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
      }

      break
    case ClusterStatus.degraded:
      hasAction = true
      Action = () => (
        <Link to={getClusterNavPath(NavigationPath.clusterSettings, props.cluster)}>{t('view.addons')}</Link>
      )
      break
    case ClusterStatus.draft:
      hasAction = true
      Action = () => (
        <Link
          to={`${NavigationPath.editCluster
            .replace(':namespace', props.cluster?.namespace!)
            .replace(':name', props.cluster?.name!)}`}
        >
          {t('Continue cluster configuration')}
        </Link>
      )
      break
    case ClusterStatus.pendingimport:
      header = t('Cluster is pending import')
      if (!location.pathname.endsWith('/overview')) {
        hasAction = true
        Action = () => (
          <Link
            to={`${NavigationPath.clusterOverview
              .replace(':namespace', props.cluster?.namespace!)
              .replace(':name', props.cluster?.name!)}`}
          >
            {t('Go to Overview')}
          </Link>
        )
      }

      break
  }

  /*
        t('status.creating.message')
        t('status.degraded.message')
        t('status.deprovisionfailed.message')
        t('status.destroying.message')
        t('status.detached.message')
        t('status.detaching.message')
        t('status.draft.message')
        t('status.failed.message')
        t('status.hibernating.message')
        t('status.importfailed.message')
        t('status.importing.message')
        t('status.needsapproval.message')
        t('status.notaccepted.message')
        t('status.notstarted.message')
        t('status.offline.message')
        t('status.pending.message')
        t('status.pendingimport.message')
        t('status.posthookfailed.message')
        t('status.posthookjob.message')
        t('status.prehookfailed.message')
        t('status.prehookjob.message')
        t('status.provisionfailed.message')
        t('status.ready.message')
        t('status.resuming.message')
        t('status.running.message')
        t('status.stopping.message')
        t('status.unknown.message')
        t('status.upgradefailed.message')
    */

  return (
    <AcmInlineStatus
      type={type}
      status={getClusterStatusLabel(props.cluster?.status, t)}
      popover={{
        maxWidth: '448px',
        bodyContent: (
          <>
            <Trans i18nKey={`status.${props.cluster?.status}.message`} components={{ bold: <strong /> }} />
            <ClusterStatusMessageAlert cluster={props.cluster!} padTop />
          </>
        ),
        footerContent: hasAction && <Action />,
        headerContent: header,
        showClose: false,
      }}
    />
  )
}
