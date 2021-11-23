/* Copyright Contributors to the Open Cluster Management project */

import {
    AnsibleJob,
    Cluster,
    ClusterCurator,
    ClusterCuratorDefinition,
    ClusterStatus,
    CuratorCondition,
    getLatestAnsibleJob,
} from '../../../../../resources'
import { AcmButton, AcmInlineStatus, StatusType } from '@open-cluster-management/ui-components'
import { ButtonVariant } from '@patternfly/react-core'
import { ArrowCircleUpIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { ansibleJobState } from '../../../../../atoms'
import { RbacButton } from '../../../../../components/Rbac'
import { rbacCreate, rbacPatch } from '../../../../../lib/rbac-util'
import { BatchUpgradeModal } from './BatchUpgradeModal'

export function DistributionField(props: { cluster?: Cluster; clusterCurator?: ClusterCurator | undefined }) {
    const { t } = useTranslation()
    const [open, toggleOpen] = useState<boolean>(false)
    const toggle = () => toggleOpen(!open)
    const [ansibleJobs] = useRecoilState(ansibleJobState)
    let latestAnsibleJob: { prehook: AnsibleJob | undefined; posthook: AnsibleJob | undefined }
    if (props.cluster?.namespace && ansibleJobs)
        latestAnsibleJob = getLatestAnsibleJob(ansibleJobs, props.cluster?.namespace)
    else latestAnsibleJob = { prehook: undefined, posthook: undefined }

    if (!props.cluster?.distribution) return <>-</>
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
                ? t('Upgrade posthook')
                : t('Upgrade prehook')
        let statusMessage: ReactNode | string =
            props.cluster?.distribution?.upgradeInfo?.latestJob?.step === CuratorCondition.posthook
                ? t('Upgrade posthook jobs are running')
                : t('Upgrade prehook jobs are running')

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
                {t('View logs')}
            </AcmButton>
        )

        // if pre/post failed
        if (props.cluster?.distribution?.upgradeInfo?.hookFailed) {
            statusType = StatusType.warning
            if (props.cluster?.distribution?.upgradeInfo?.prehooks?.failed) {
                statusTitle = 'Upgrade prehook'
                statusMessage = (
                    <Fragment>
                        {t('Upgrade prehook jobs have failed:')}
                        <div>{props.cluster?.distribution?.upgradeInfo?.latestJob?.conditionMessage}</div>
                    </Fragment>
                )
            } else {
                statusTitle = 'Upgrade posthook'
                statusMessage = (
                    <Fragment>
                        {t('Upgrade posthook jobs have failed:')}
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
                    status={t('Upgrade failing', {
                        version: props.cluster?.consoleURL
                            ? ''
                            : props.cluster?.distribution.upgradeInfo.desiredVersion,
                    })}
                    popover={
                        props.cluster?.consoleURL
                            ? {
                                  headerContent: t('Upgrade failing', {
                                      version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                                  }),
                                  bodyContent: t('Upgrading {{clusterName}} to OpenShift {{version}} is failing.', {
                                      clusterName: props.cluster?.name,
                                      version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                                  }),
                                  footerContent: (
                                      <a
                                          href={`${props.cluster?.consoleURL}/settings/cluster`}
                                          target="_blank"
                                          rel="noreferrer"
                                      >
                                          {t('View upgrade details')} <ExternalLinkAltIcon />
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
                        // TODO - Handle interpolation
                        t('Upgrading to {{version}}', {
                            version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                        }) +
                        (props.cluster?.distribution.upgradeInfo.upgradePercentage
                            ? ' (' + props.cluster?.distribution.upgradeInfo.upgradePercentage + ')'
                            : '')
                    }
                    popover={
                        props.cluster?.consoleURL
                            ? {
                                  // TODO - Handle interpolation
                                  headerContent: t('Upgrading cluster', {
                                      version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                                  }),
                                  bodyContent: props.cluster?.distribution.upgradeInfo.upgradePercentage
                                      ? t(
                                            //   TODO - Handle interpolation
                                            'Upgrading {{clusterName}} to OpenShift {{version}}: {{percentage}} complete.',
                                            {
                                                clusterName: props.cluster?.name,
                                                version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                                                percentage: props.cluster?.distribution.upgradeInfo.upgradePercentage,
                                            }
                                        )
                                      : // TODO - Handle interpolation
                                        t('Upgrading {{clusterName}} to OpenShift {{version}}.', {
                                            clusterName: props.cluster?.name,
                                            version: props.cluster?.distribution.upgradeInfo.desiredVersion,
                                        }),
                                  footerContent: (
                                      <a
                                          href={`${props.cluster?.consoleURL}/settings/cluster`}
                                          target="_blank"
                                          rel="noreferrer"
                                      >
                                          {/* TODO : Handle interolation */}
                                          {t('View upgrade details')} <ExternalLinkAltIcon />
                                      </a>
                                  ),
                              }
                            : undefined
                    }
                />
            </>
        )
    } else if (props.cluster?.distribution.upgradeInfo?.isReadyUpdates) {
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
                        {t('Upgrade available')}
                    </RbacButton>
                    <BatchUpgradeModal clusters={[props.cluster]} open={open} close={toggle} />
                </span>
            </>
        )
    } else {
        // NO UPGRADE, JUST VERSION
        return <>{props.cluster?.distribution.displayVersion ?? '-'}</>
    }
}
