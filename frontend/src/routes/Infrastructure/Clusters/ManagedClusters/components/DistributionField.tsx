/* Copyright Contributors to the Open Cluster Management project */

import {
    AnsibleJob,
    Cluster,
    ClusterCurator,
    ClusterCuratorDefinition,
    ClusterStatus,
    CuratorCondition,
    getLatestAnsibleJob,
    NodePool,
} from '../../../../../resources'
import { AcmButton, AcmInlineStatus, StatusType } from '../../../../../ui-components'
import { ButtonVariant } from '@patternfly/react-core'
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

const { getVersionFromReleaseImage } = CIM

export function DistributionField(props: {
    cluster?: Cluster
    clusterCurator?: ClusterCurator | undefined
    nodepool?: NodePool
    hostedCluster?: HostedClusterK8sResource
}) {
    const { t } = useTranslation()
    const [open, toggleOpen] = useState<boolean>(false)
    const toggle = () => toggleOpen(!open)
    const { ansibleJobState, clusterImageSetsState, agentMachinesState, agentsState, nodePoolsState } = useSharedAtoms()
    const [ansibleJobs] = useRecoilState(ansibleJobState)
    const [nodePools] = useRecoilState(nodePoolsState)
    const [agents] = useRecoilState(agentsState)
    const [agentMachines] = useRecoilState(agentMachinesState)
    const { waitForAll } = useSharedRecoil()
    const [clusterImageSets] = useRecoilValue(waitForAll([clusterImageSetsState]))
    const agentClusterInstall = useAgentClusterInstall({
        name: props.cluster?.name,
        namespace: props.cluster?.namespace,
    })

    const clusterNodePools = nodePools.filter(
        (np) =>
            np.metadata.namespace === props.cluster?.hypershift?.hostingNamespace &&
            np.spec.clusterName === props.cluster?.name
    )
    const openshiftText = 'OpenShift'

    const isUpdateVersionAcceptable = (currentVersion: string, newVersion: string) => {
        const currentVersionParts = currentVersion.split('.')
        const newVersionParts = newVersion.split('.')

        if (newVersionParts[0] !== currentVersionParts[0]) {
            return false
        }

        if (
            newVersionParts[0] === currentVersionParts[0] &&
            Number(newVersionParts[1]) > Number(currentVersionParts[1])
        ) {
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
            if (isUpdateVersionAcceptable(props.cluster?.distribution?.ocp?.version || '', releaseImageVersion)) {
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
        (props.cluster?.distribution?.upgradeInfo?.hooksInProgress ||
            props.cluster?.distribution?.upgradeInfo?.hookFailed)
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
                statusTitle = 'upgrade.ansible.prehookjob.title'
                statusMessage = (
                    <Fragment>
                        {t('upgrade.ansible.prehook.failure')}
                        <div>{props.cluster?.distribution?.upgradeInfo?.latestJob?.conditionMessage}</div>
                    </Fragment>
                )
            } else {
                statusTitle = 'upgrade.ansible.posthookjob.title'
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
                    status={t(statusTitle)}
                    popover={{
                        headerContent: t(statusTitle),
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
                    status={t('upgrade.upgradefailed', {
                        version: props.cluster?.consoleURL
                            ? ''
                            : props.cluster?.distribution.upgradeInfo.desiredVersion,
                    })}
                    popover={
                        props.cluster?.consoleURL
                            ? {
                                  headerContent: t('upgrade.upgradefailed', {
                                      version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                                  }),
                                  bodyContent: t('upgrade.upgradefailed.message', {
                                      clusterName: props.cluster?.name,
                                      version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                                  }),
                                  footerContent: (
                                      <a
                                          href={`${props.cluster?.consoleURL}/settings/cluster`}
                                          target="_blank"
                                          rel="noreferrer"
                                      >
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
                                  headerContent: t('upgrade.upgrading', {
                                      version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                                  }),
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
                                      <a
                                          href={`${props.cluster?.consoleURL}/settings/cluster`}
                                          target="_blank"
                                          rel="noreferrer"
                                      >
                                          {t('upgrade.upgrading.link')} <ExternalLinkAltIcon />
                                      </a>
                                  ),
                              }
                            : undefined
                    }
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
    } else if (
        (props.cluster?.isHostedCluster || props.cluster?.isHypershift) &&
        Object.keys(hypershiftAvailableUpdates).length > 0
    ) {
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
                        nodepools={clusterNodePools}
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
