/* Copyright Contributors to the Open Cluster Management project */

import {
  AnsibleJob,
  Cluster,
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorDefinition,
  ClusterStatus,
  CuratorCondition,
  getLatestAnsibleJob,
  NodePool,
} from '../../../../../resources'
import { AcmButton, AcmInlineStatus, StatusType } from '../../../../../ui-components'
import { Button, ButtonVariant } from '@patternfly/react-core'
import { ArrowCircleUpIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { RbacButton } from '../../../../../components/Rbac'
import { rbacCreate, rbacPatch } from '../../../../../lib/rbac-util'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import { useAgentClusterInstall } from '../CreateCluster/components/assisted-installer/utils'
import { CIM } from 'openshift-assisted-ui-lib'
import { HypershiftUpgradeModal } from './HypershiftUpgradeModal'
import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import { useSharedAtoms, useSharedRecoil, useRecoilState, useRecoilValue } from '../../../../../shared-recoil'
import { Link } from 'react-router-dom'
import { getSearchLink } from '../../../../Applications/helpers/resource-helper'

const { getVersionFromReleaseImage } = CIM

export function DistributionField(props: {
  cluster?: Cluster
  clusterCurator?: ClusterCurator | undefined
  nodepool?: NodePool
  hostedCluster?: HostedClusterK8sResource
  resource?: string
}) {
  const { t } = useTranslation()
  const [open, toggleOpen] = useState<boolean>(false)
  const toggle = () => toggleOpen(!open)
  const { ansibleJobState, clusterImageSetsState, agentMachinesState, agentsState } = useSharedAtoms()
  const [ansibleJobs] = useRecoilState(ansibleJobState)
  const [agents] = useRecoilState(agentsState)
  const [agentMachines] = useRecoilState(agentMachinesState)
  const { waitForAll } = useSharedRecoil()
  const [clusterImageSets] = useRecoilValue(waitForAll([clusterImageSetsState]))
  const agentClusterInstall = useAgentClusterInstall({
    name: props.cluster?.name,
    namespace: props.cluster?.namespace,
  })

  const openshiftText = 'OpenShift'

  const isUpdateVersionAcceptable = (currentVersion: string, newVersion: string) => {
    const currentVersionParts = currentVersion.split('.')
    const newVersionParts = newVersion.split('.')

    if (newVersionParts[0] !== currentVersionParts[0]) {
      return false
    }

    if (newVersionParts[0] === currentVersionParts[0] && Number(newVersionParts[1]) > Number(currentVersionParts[1])) {
      return true
    }

    if (
      newVersionParts[0] === currentVersionParts[0] &&
      Number(newVersionParts[1]) === Number(currentVersionParts[1]) &&
      Number(newVersionParts[2]) > Number(currentVersionParts[2])
    ) {
      return true
    }

    return false
  }

  const hypershiftAvailableUpdates: Record<string, string> = useMemo(() => {
    if (!(props.cluster?.isHypershift || props.cluster?.isHostedCluster)) {
      return {}
    }
    const updates: any = {}
    clusterImageSets.forEach((cis) => {
      const releaseImageVersion = getVersionFromReleaseImage(cis.spec?.releaseImage)
      if (
        releaseImageVersion &&
        isUpdateVersionAcceptable(props.cluster?.distribution?.ocp?.version || '', releaseImageVersion)
      ) {
        updates[releaseImageVersion] = cis.spec?.releaseImage
      }
    })

    return updates
  }, [
    clusterImageSets,
    props.cluster?.distribution?.ocp?.version,
    props.cluster?.isHostedCluster,
    props.cluster?.isHypershift,
  ])

  const isUpdateAvailable: boolean = useMemo(() => {
    //if nodepool table
    if (props.resource != null && props.resource === 'nodepool') {
      if ((props.nodepool?.status?.version || '') < (props.cluster?.distribution?.ocp?.version || '')) {
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
    props.cluster?.distribution?.ocp?.version,
    props.cluster?.hypershift?.nodePools,
    hypershiftAvailableUpdates,
    props.nodepool?.status?.version,
    props.resource,
  ])

  let latestAnsibleJob: { prehook: AnsibleJob | undefined; posthook: AnsibleJob | undefined }
  if (props.cluster?.namespace && ansibleJobs)
    latestAnsibleJob = getLatestAnsibleJob(ansibleJobs, props.cluster?.namespace)
  else latestAnsibleJob = { prehook: undefined, posthook: undefined }

  if (!props.cluster?.distribution) {
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
        ? t('upgrade.ansible.posthookjob.title')
        : t('upgrade.ansible.prehookjob.title')
    let statusMessage: ReactNode | string =
      props.cluster?.distribution?.upgradeInfo?.latestJob?.step === CuratorCondition.posthook
        ? t('upgrade.ansible.posthook')
        : t('upgrade.ansible.prehook')

    const jobUrl =
      props.cluster?.distribution?.upgradeInfo?.latestJob?.step === CuratorCondition.posthook
        ? latestAnsibleJob.posthook?.status?.ansibleJobResult?.url
        : latestAnsibleJob.prehook?.status?.ansibleJobResult?.url

    const footerContent: ReactNode = (
      <AcmButton
        onClick={() => window.open(latestAnsibleJob.prehook?.status?.ansibleJobResult?.url)}
        variant="link"
        isSmall
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
        statusTitle = t('upgrade.ansible.prehookjob.title')
        statusMessage = (
          <Fragment>
            {t('upgrade.ansible.prehook.failure')}
            <div>{props.cluster?.distribution?.upgradeInfo?.latestJob?.conditionMessage}</div>
          </Fragment>
        )
      } else {
        statusTitle = t('upgrade.ansible.posthookjob.title')
        statusMessage = (
          <Fragment>
            {t('upgrade.ansible.posthook.failure')}
            <div>{props.cluster?.distribution?.upgradeInfo?.latestJob?.conditionMessage}</div>
          </Fragment>
        )
      }
    }
    return (
      <>
        <div>{props.cluster?.distribution.displayVersion}</div>
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
    return <>{props.cluster?.distribution.displayVersion ?? '-'}</>
  }
  if (props.cluster?.distribution.upgradeInfo?.upgradeFailed) {
    // OCP UPGRADE FAILED
    return (
      <>
        <div>{props.cluster?.distribution.displayVersion}</div>
        <AcmInlineStatus
          type={StatusType.danger}
          status={t('upgrade.upgradefailed')}
          popover={
            props.cluster?.consoleURL
              ? {
                  headerContent: t('upgrade.upgradefailed'),
                  bodyContent: t('upgrade.upgradefailed.message', {
                    clusterName: props.cluster?.name,
                    version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                  }),
                  footerContent: (
                    <a href={`${props.cluster?.consoleURL}/settings/cluster`} target="_blank" rel="noreferrer">
                      {t('upgrade.upgrading.link')} <ExternalLinkAltIcon />
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
        <div>{props.cluster?.distribution.displayVersion}</div>
        <AcmInlineStatus
          type={StatusType.progress}
          status={
            versionNum
              ? t('upgrade.upgrading.version', {
                  version: versionNum,
                })
              : t('upgrade.upgrading')
          }
          popover={
            props.cluster?.consoleURL
              ? {
                  headerContent: t('upgrade.upgrading'),
                  bodyContent: t('upgrade.upgrading.message', {
                    clusterName: props.cluster?.name,
                    version: versionNum,
                  }),
                  footerContent: (
                    <a href={`${props.cluster?.consoleURL}/settings/cluster`} target="_blank" rel="noreferrer">
                      {t('upgrade.upgrading.link')} <ExternalLinkAltIcon />
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
        <div>{props.cluster?.distribution.displayVersion}</div>
        <AcmInlineStatus
          type={StatusType.progress}
          status={
            t('upgrade.upgrading.version', {
              version: props.cluster?.distribution.upgradeInfo.desiredVersion,
            }) +
            (props.cluster?.distribution.upgradeInfo.upgradePercentage
              ? ' (' + props.cluster?.distribution.upgradeInfo.upgradePercentage + ')'
              : '')
          }
          popover={
            props.cluster?.consoleURL
              ? {
                  headerContent: t('upgrade.upgrading'),
                  bodyContent: props.cluster?.distribution.upgradeInfo.upgradePercentage
                    ? t('upgrade.upgrading.message.percentage', {
                        clusterName: props.cluster?.name,
                        version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                        percentage: props.cluster?.distribution.upgradeInfo.upgradePercentage,
                      })
                    : t('upgrade.upgrading.message', {
                        clusterName: props.cluster?.name,
                        version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                      }),
                  footerContent: (
                    <a href={`${props.cluster?.consoleURL}/settings/cluster`} target="_blank" rel="noreferrer">
                      {t('upgrade.upgrading.link')} <ExternalLinkAltIcon />
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
        <div>{props.cluster?.distribution.displayVersion}</div>
        <AcmInlineStatus
          type={StatusType.danger}
          status={t('upgrade.upgradefailed')}
          popover={{
            headerContent: t('upgrade.upgradefailed'),
            bodyContent: t('Upgrade posthook was not run.'),
            footerContent: (
              <Link to={targetLink} target={'_blank'}>
                <Button variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right" isInline>
                  {t('upgrade.upgrading.link')}
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
            onClick={toggle}
            icon={<ArrowCircleUpIcon />}
            variant={ButtonVariant.link}
            style={{ padding: 0, margin: 0, fontSize: 'inherit' }}
            rbac={[
              rbacCreate(ClusterCuratorDefinition, props.cluster?.namespace),
              rbacPatch(ClusterCuratorDefinition, props.cluster?.namespace),
            ]}
          >
            {t('upgrade.available')}
          </RbacButton>
          <BatchUpgradeModal clusters={[props.cluster]} open={open} close={toggle} />
        </span>
      </>
    )
  } else if ((props.cluster?.isHostedCluster || props.cluster?.isHypershift) && isUpdateAvailable) {
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
            {t('upgrade.available')}
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
    // NO UPGRADE, JUST VERSION
    return <>{props.cluster?.distribution.displayVersion ?? '-'}</>
  }
}
