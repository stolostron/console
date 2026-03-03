/* Copyright Contributors to the Open Cluster Management project */

import { HostedClusterK8sResourceWithChannel } from '../../../../../resources/hosted-cluster'
import { Button, ButtonVariant, Icon } from '@patternfly/react-core'
import { ArrowCircleUpIcon, ExclamationTriangleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { RbacButton } from '../../../../../components/Rbac'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { rbacCreate, rbacPatch } from '../../../../../lib/rbac-util'
import {
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorDefinition,
  getLatestAnsibleJob,
  HostedClusterDefinition,
  NodePool,
} from '../../../../../resources'
import { Cluster, ClusterStatus, CuratorCondition } from '../../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { AcmButton, AcmInlineStatus, Provider, StatusType } from '../../../../../ui-components'
import { getSearchLink } from '../../../../Applications/helpers/resource-helper'
import { useAgentClusterInstall } from '../CreateCluster/components/assisted-installer/utils'
import { useHypershiftAvailableUpdates } from '../hooks/useHypershiftAvailableUpdates'
import { getVersionFromReleaseImage } from '../utils/utils'
import { BatchChannelSelectModal } from './BatchChannelSelectModal'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import { HypershiftUpgradeModal } from './HypershiftUpgradeModal'
import { getNodepoolStatus } from './NodePoolsTable'

export function DistributionField(props: {
  cluster?: Cluster
  clusterCurator?: ClusterCurator | undefined
  nodepool?: NodePool
  hostedCluster?: HostedClusterK8sResourceWithChannel
  resource?: string
}) {
  const { t } = useTranslation()
  const [open, toggleOpen] = useState<boolean>(false)
  const toggle = () => toggleOpen(!open)
  const [showChannelSelectModal, setShowChannelSelectModal] = useState<boolean>(false)
  const [channelSelectionPending, setChannelSelectionPending] = useState<boolean>(false)
  const { ansibleJobState, clusterImageSetsState, agentMachinesState, agentsState } = useSharedAtoms()
  const ansibleJobs = useRecoilValue(ansibleJobState)
  const agents = useRecoilValue(agentsState)
  const agentMachines = useRecoilValue(agentMachinesState)
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
  const agentClusterInstall = useAgentClusterInstall({
    name: props.cluster?.name,
    namespace: props.cluster?.namespace,
  })

  const openshiftText = 'OpenShift'
  const microshiftText = 'MicroShift'

  // Get the correct version based on resource type
  const displayVersion = useMemo(() => {
    if (props.resource === 'nodepool' && props.nodepool?.status?.version) {
      return `${openshiftText} ${props.nodepool.status.version}`
    }
    return props.cluster?.distribution?.displayVersion
  }, [props.resource, props.nodepool?.status?.version, props.cluster?.distribution?.displayVersion])

  const hypershiftAvailableUpdates = useHypershiftAvailableUpdates(props?.cluster)

  const isUpdateAvailable: boolean = useMemo(() => {
    //if nodepool table
    if (props.resource != null && props.resource === 'nodepool' && props.nodepool) {
      if (
        getNodepoolStatus(props.nodepool) == 'Ready' &&
        (props.nodepool?.status?.version || '') < (props.cluster?.distribution?.ocp?.version || '')
      ) {
        return true
      }
      return false
    }

    //if managed cluster page - cluster, cluster curator and hosted cluster
    if (props.resource != null && props.resource === 'managedclusterpage') {
      let updateAvailable = false
      if (props.cluster?.hypershift?.nodePools && props.cluster?.hypershift?.nodePools.length > 0) {
        for (let i = 0; i < props.cluster?.hypershift?.nodePools.length; i++) {
          if (
            getNodepoolStatus(props.cluster?.hypershift?.nodePools[i]) == 'Ready' &&
            (props.cluster?.hypershift?.nodePools[i].status?.version || '') <
              (props.cluster.distribution?.ocp?.version || '')
          ) {
            updateAvailable = true
            break
          }
        }
      }

      //if no nodepool has updates, still check if hcp has updates
      if (!updateAvailable) {
        return Object.keys(hypershiftAvailableUpdates).length > 0
      }

      return updateAvailable
    } else if (props.resource != null && props.resource === 'hostedcluster') {
      //if hosted cluster progress - cluster and hostedcluster
      return Object.keys(hypershiftAvailableUpdates).length > 0
    }

    return false
    //return updateAvailable
  }, [
    props.nodepool,
    props.cluster?.distribution?.ocp?.version,
    props.cluster?.hypershift?.nodePools,
    hypershiftAvailableUpdates,
    props.resource,
  ])

  // Track if curator is selecting channel (from cluster status or local pending state)
  const isSelectingChannel = props.cluster?.distribution?.upgradeInfo?.isSelectingChannel

  // Clear pending state when cluster status catches up
  useEffect(() => {
    if (isSelectingChannel) {
      setChannelSelectionPending(false)
    }
  }, [isSelectingChannel])

  // Don't show the Select channel button if curator is working on channel selection
  const isChannelSelectionInProgress = isSelectingChannel || channelSelectionPending

  const renderChannelWarning = (): JSX.Element | null => {
    // Check if curator already has a channel set (channel selection was initiated)
    const hasNoChannel =
      props.cluster?.isHypershift &&
      props.hostedCluster &&
      !props.hostedCluster.spec?.channel &&
      !isChannelSelectionInProgress &&
      props.resource !== 'nodepool'

    // Don't show warning if no channel issue or if channel selection is in progress
    if (!hasNoChannel || isChannelSelectionInProgress) return null

    return (
      <span style={{ whiteSpace: 'nowrap', display: 'block' }}>
        <Icon status="warning" size="sm">
          <ExclamationTriangleIcon />
        </Icon>{' '}
        <RbacButton
          onClick={() => setShowChannelSelectModal(true)}
          variant={ButtonVariant.link}
          style={{ padding: 0, margin: 0, fontSize: 'inherit' }}
          rbac={[
            rbacPatch(
              HostedClusterDefinition,
              props.hostedCluster?.metadata?.namespace,
              props.hostedCluster?.metadata?.name
            ),
          ]}
        >
          {t('managed.selectChannel')}
        </RbacButton>
        <BatchChannelSelectModal
          clusters={props.cluster ? [props.cluster] : []}
          open={showChannelSelectModal}
          close={() => setShowChannelSelectModal(false)}
          hostedClusters={
            props.hostedCluster && props.cluster?.name ? { [props.cluster.name]: props.hostedCluster } : undefined
          }
          onSuccess={() => setChannelSelectionPending(true)}
        />
      </span>
    )
  }

  if (props.cluster?.provider === Provider.microshift) {
    const version = props.cluster?.microshiftDistribution?.version
    return <>{version ? `${microshiftText} ${version}` : '-'}</>
  }

  const latestAnsibleJob =
    props.cluster?.namespace && ansibleJobs
      ? getLatestAnsibleJob(ansibleJobs, props.cluster?.namespace)
      : { prehook: undefined, posthook: undefined }

  if (!props.cluster?.distribution) {
    // For HostedClusters without channel, show the warning even without distribution
    const channelWarning = renderChannelWarning()
    if (channelWarning) {
      return (
        <>
          <div>{displayVersion ?? '-'}</div>
          {channelWarning}
        </>
      )
    }

    //we try to get version from clusterimage
    if (agentClusterInstall) {
      const clusterImage = clusterImageSets.find(
        (clusterImageSet) => clusterImageSet.metadata?.name === agentClusterInstall.spec?.imageSetRef?.name
      )
      const version = getVersionFromReleaseImage(clusterImage?.spec?.releaseImage)

      if (version) {
        return <>{version ? `${openshiftText} ${version}` : '-'}</>
      }
    }
    return <>-</>
  }
  // use display version directly for non-online clusters
  // Pre/Post hook
  if (
    props.cluster?.distribution?.upgradeInfo?.isUpgradeCuration &&
    (props.cluster?.distribution?.upgradeInfo?.hooksInProgress || props.cluster?.distribution?.upgradeInfo?.hookFailed)
  ) {
    // hook state
    let statusType = StatusType.progress
    let statusTitle =
      props.cluster?.distribution?.upgradeInfo?.latestJob?.step === CuratorCondition.posthook
        ? t('update.ansible.posthookjob.title')
        : t('update.ansible.prehookjob.title')
    let statusMessage: ReactNode | string =
      props.cluster?.distribution?.upgradeInfo?.latestJob?.step === CuratorCondition.posthook
        ? t('update.ansible.posthook')
        : t('update.ansible.prehook')

    const jobUrl =
      props.cluster?.distribution?.upgradeInfo?.latestJob?.step === CuratorCondition.posthook
        ? latestAnsibleJob.posthook?.status?.ansibleJobResult?.url
        : latestAnsibleJob.prehook?.status?.ansibleJobResult?.url

    const footerContent: ReactNode = (
      <AcmButton
        onClick={() => window.open(latestAnsibleJob.prehook?.status?.ansibleJobResult?.url)}
        variant="link"
        size="sm"
        isInline
        role="link"
        icon={<ExternalLinkAltIcon />}
        iconPosition="right"
        isDisabled={!jobUrl}
      >
        {t('view.logs')}
      </AcmButton>
    )

    // if pre/post failed
    if (props.cluster?.distribution?.upgradeInfo?.hookFailed) {
      statusType = StatusType.warning
      if (props.cluster?.distribution?.upgradeInfo?.prehooks?.failed) {
        statusTitle = t('update.ansible.prehookjob.title')
        statusMessage = (
          <Fragment>
            {t('update.ansible.prehook.failure')}
            <div>{props.cluster?.distribution?.upgradeInfo?.latestJob?.conditionMessage}</div>
          </Fragment>
        )
      } else {
        statusTitle = t('update.ansible.posthookjob.title')
        statusMessage = (
          <Fragment>
            {t('update.ansible.posthook.failure')}
            <div>{props.cluster?.distribution?.upgradeInfo?.latestJob?.conditionMessage}</div>
          </Fragment>
        )
      }
    }
    return (
      <>
        <div>{displayVersion}</div>
        <AcmInlineStatus
          type={statusType}
          status={statusTitle}
          popover={{
            headerContent: statusTitle,
            bodyContent: statusMessage || '',
            footerContent: footerContent,
          }}
        />
      </>
    )
  }
  if (props.cluster?.status !== ClusterStatus.ready) {
    return <>{displayVersion ?? '-'}</>
  }
  if (props.cluster?.distribution.upgradeInfo?.upgradeFailed) {
    // OCP UPGRADE FAILED
    return (
      <>
        <div>{displayVersion}</div>
        <AcmInlineStatus
          type={StatusType.danger}
          status={t('update.updatefailed')}
          popover={
            props.cluster?.consoleURL
              ? {
                  headerContent: t('update.updatefailed'),
                  bodyContent: t('update.updatefailed.message', {
                    clusterName: props.cluster?.name,
                    version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                  }),
                  footerContent: (
                    <a href={`${props.cluster?.consoleURL}/settings/cluster`} target="_blank" rel="noreferrer">
                      {t('update.updating.link')} <ExternalLinkAltIcon />
                    </a>
                  ),
                }
              : undefined
          }
        />
      </>
    )
  } else if (props.cluster.hypershift?.isUpgrading && props.resource !== 'nodepool') {
    // HYPERSHIFT UPGRADE IN PROGRESS
    const image = props.hostedCluster?.spec.release.image
    const versionNum = getVersionFromReleaseImage(image)
    return (
      <>
        <div>{displayVersion}</div>
        <AcmInlineStatus
          type={StatusType.progress}
          status={
            versionNum
              ? t('update.updating.version', {
                  version: versionNum,
                }) +
                (props.cluster.hypershift?.upgradePercentage ? ' ' + props.cluster.hypershift?.upgradePercentage : '')
              : t('update.updating')
          }
          popover={
            props.cluster?.consoleURL
              ? {
                  headerContent: t('update.updating'),
                  bodyContent: props.cluster.hypershift?.upgradePercentage
                    ? t('update.updating.message.percentage', {
                        clusterName: props.cluster?.name,
                        version: versionNum,
                        percentage: props.cluster.hypershift?.upgradePercentage,
                      })
                    : t('update.updating.message', {
                        clusterName: props.cluster?.name,
                        version: versionNum,
                      }),
                  footerContent: (
                    <a href={`${props.cluster?.consoleURL}/settings/cluster`} target="_blank" rel="noreferrer">
                      {t('update.updating.link')} <ExternalLinkAltIcon />
                    </a>
                  ),
                }
              : undefined
          }
        />
      </>
    )
  } else if (props.cluster?.distribution.upgradeInfo?.isUpgrading) {
    // OCP UPGRADE IN PROGRESS
    return (
      <>
        <div>{displayVersion}</div>
        <AcmInlineStatus
          type={StatusType.progress}
          status={
            t('update.updating.version', {
              version: props.cluster?.distribution.upgradeInfo.desiredVersion,
            }) +
            (props.cluster?.distribution.upgradeInfo.upgradePercentage
              ? ' (' + props.cluster?.distribution.upgradeInfo.upgradePercentage + ')'
              : '')
          }
          popover={
            props.cluster?.consoleURL
              ? {
                  headerContent: t('update.updating'),
                  bodyContent: props.cluster?.distribution.upgradeInfo.upgradePercentage
                    ? t('update.updating.message.percentage', {
                        clusterName: props.cluster?.name,
                        version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                        percentage: props.cluster?.distribution.upgradeInfo.upgradePercentage,
                      })
                    : t('update.updating.message', {
                        clusterName: props.cluster?.name,
                        version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                      }),
                  footerContent: (
                    <a href={`${props.cluster?.consoleURL}/settings/cluster`} target="_blank" rel="noreferrer">
                      {t('update.updating.link')} <ExternalLinkAltIcon />
                    </a>
                  ),
                }
              : undefined
          }
        />
      </>
    )
  } else if (props.cluster.distribution.upgradeInfo?.posthookDidNotRun) {
    // CURATOR POSTHOOK JOB DID NOT RUN
    const [apigroup, apiversion] = ClusterCuratorApiVersion.split('/')
    const targetLink = getSearchLink({
      properties: {
        name: props.cluster?.name,
        namespace: props.cluster?.namespace,
        kind: 'clustercurator',
        apigroup,
        apiversion,
      },
    })
    return (
      <>
        <div>{displayVersion}</div>
        <AcmInlineStatus
          type={StatusType.danger}
          status={t('update.updatefailed')}
          popover={{
            headerContent: t('update.updatefailed'),
            bodyContent: t('Update posthook was not run.'),
            footerContent: (
              <Link to={targetLink} target={'_blank'}>
                <Button variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right" isInline>
                  {t('update.updating.link')}
                </Button>
              </Link>
            ),
          }}
        />
      </>
    )
  } else if (props.cluster?.distribution.upgradeInfo?.isReadyUpdates && !props.cluster?.isHostedCluster) {
    // UPGRADE AVAILABLE
    return (
      <>
        <div>{props.cluster?.distribution?.displayVersion}</div>
        <span style={{ whiteSpace: 'nowrap', display: 'block' }}>
          <RbacButton
            role={'button'}
            onClick={toggle}
            icon={<ArrowCircleUpIcon />}
            variant={ButtonVariant.link}
            style={{ padding: 0, margin: 0, fontSize: 'inherit' }}
            rbac={[
              rbacCreate(ClusterCuratorDefinition, props.cluster?.namespace),
              rbacPatch(ClusterCuratorDefinition, props.cluster?.namespace),
            ]}
          >
            {t('update.available')}
          </RbacButton>
          <BatchUpgradeModal clusters={[props.cluster]} open={open} close={toggle} />
        </span>
      </>
    )
  } else if (props.cluster?.isHypershift && isUpdateAvailable) {
    // UPGRADE AVAILABLE HYPERSHIFT

    return (
      <>
        {props.nodepool ? (
          <div>
            {openshiftText} {props.nodepool.status?.version}
          </div>
        ) : (
          <div>{props.cluster?.distribution?.displayVersion}</div>
        )}
        <span style={{ whiteSpace: 'nowrap', display: 'block' }}>
          <RbacButton
            onClick={toggle}
            icon={<ArrowCircleUpIcon />}
            variant={ButtonVariant.link}
            style={{ padding: 0, margin: 0, fontSize: 'inherit' }}
            rbac={[
              rbacCreate(ClusterCuratorDefinition, props.cluster?.namespace),
              rbacPatch(ClusterCuratorDefinition, props.cluster?.namespace),
            ]}
          >
            {t('update.available')}
          </RbacButton>

          <HypershiftUpgradeModal
            controlPlane={props.cluster}
            nodepools={props.cluster.hypershift?.nodePools as NodePool[]}
            open={open}
            close={toggle}
            availableUpdates={hypershiftAvailableUpdates}
            agents={agents}
            agentMachines={agentMachines}
            hostedCluster={props.hostedCluster}
          />
        </span>
      </>
    )
  } else {
    // NO UPGRADE ACTIVITY - Show channel warning for HostedClusters without channel
    const channelWarning = renderChannelWarning()
    if (channelWarning) {
      return (
        <>
          <div>{displayVersion ?? '-'}</div>
          {channelWarning}
        </>
      )
    }
    // Default: just show version
    return <>{displayVersion ?? '-'}</>
  }
}
