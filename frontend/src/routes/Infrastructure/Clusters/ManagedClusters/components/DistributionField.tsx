/* Copyright Contributors to the Open Cluster Management project */

import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node/dist/gen/model/v1CustomResourceDefinitionCondition'
import { AcmInlineStatus, StatusType } from '@open-cluster-management/ui-components'
import { ButtonVariant } from '@patternfly/react-core'
import { ArrowCircleUpIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { ansibleJobState, clusterCuratorsState } from '../../../../../atoms'
import { RbacButton } from '../../../../../components/Rbac'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { useContext } from 'react'

import {
    checkCuratorConditionDone,
    checkCuratorConditionFailed,
    checkCuratorLatestOperation,
    Cluster,
    ClusterStatus,
    CuratorCondition,
} from '../../../../../lib/get-cluster'
import { rbacCreate, rbacPatch } from '../../../../../lib/rbac-util'
import { AnsibleJob, getLatestAnsibleJob } from '../../../../../resources/ansible-job'
import { ClusterCurator, ClusterCuratorDefinition } from '../../../../../resources/cluster-curator'
import { BatchUpgradeModal } from './BatchUpgradeModal'
export const backendUrl = `${process.env.REACT_APP_BACKEND_PATH}`

export function DistributionField(props: {
    cluster?: Cluster
    clusterCuratorList?: ClusterCurator[] | undefined
    ansibleJobs?: AnsibleJob[] | undefined
}) {
    const { t } = useTranslation(['cluster'])
    const [open, toggleOpen] = useState<boolean>(false)
    const toggle = () => toggleOpen(!open)
    const { cluster } = useContext(ClusterContext)

    // const [ansibleJobs] = useRecoilState(ansibleJobState)
    // const [clusterCurators] = useRecoilState(clusterCuratorsState)
    const clusterCurator = props.clusterCuratorList?.find((curator) => curator.metadata.name === props.cluster?.name)

    const ccConditions: V1CustomResourceDefinitionCondition[] = clusterCurator?.status?.conditions ?? []

    let latestAnsibleJob: { prehook: AnsibleJob | undefined; posthook: AnsibleJob | undefined }
    if (props.cluster?.namespace && props.ansibleJobs)
        latestAnsibleJob = getLatestAnsibleJob(props.ansibleJobs, props.cluster?.namespace)
    else latestAnsibleJob = { prehook: undefined, posthook: undefined }

    let activeJob: AnsibleJob | undefined
    if (props.ansibleJobs)
        activeJob = props.ansibleJobs.find(
            (job) => job.status?.ansibleJobResult?.started && !job.status.ansibleJobResult?.finished
        )

    if (!props.cluster?.distribution) return <>-</>
    // use display version directly for non-online clusters

    if (
        checkCuratorLatestOperation('DesiredCuration: upgrade', ccConditions) && !props.cluster?.distribution?.upgradeInfo?.isUpgrading
    ) {
            // hook state
            const prehooks = clusterCurator?.spec?.install?.prehook?.length
            const posthooks = clusterCurator?.spec?.install?.posthook?.length
            let prehookStatus = StatusType.pending
            let posthookStatus: StatusType | undefined = undefined
            let upgradeStatus = StatusType.pending
            let statusText = ''
            let statusType = StatusType.pending


            switch (cluster?.status) {
                case ClusterStatus.prehookjob:
                    statusType = StatusType.progress
                    statusText = 'upgrade.ansible.prehook'
                    break
                case ClusterStatus.prehookfailed:
                    statusType = StatusType.progress
                    statusText = 'upgrade.ansible.prehook'
                    break
                case ClusterStatus.posthookjob:
                    //importStatus = StatusType.progress
                    break
                case ClusterStatus.posthookfailed:
                    //importStatus = StatusType.danger
                    break
                default: {
                    // if (posthookStatus === StatusType.progress || posthookStatus === StatusType.danger) {
                    //     importStatus = StatusType.healthy
                    // } else {
                    //     importStatus = StatusType.empty
                    // }
                }
            }

            return (
                <>
                    <div>{props.cluster?.distribution.displayVersion}</div>
                    <AcmInlineStatus
                        type={statusType}
                        status={t(statusText)}
                        popover={
                            latestAnsibleJob.prehook?.status?.ansibleJobResult?.url
                                ? {
                                      headerContent: t('upgrade.ansible.prehook'),
                                      bodyContent: t('upgrade.ansible.prehook.message', {
                                          clusterName: props.cluster?.name,
                                      }),
                                      footerContent: (
                                          <a
                                              href={latestAnsibleJob.prehook?.status?.ansibleJobResult?.url}
                                              target="_blank"
                                              rel="noreferrer"
                                          >
                                              {t('upgrade.ansible.link')} <ExternalLinkAltIcon />
                                          </a>
                                      ),
                                  }
                                : undefined
                        }
                    />
                </>
            )

    }

    if (
        !checkCuratorConditionDone(CuratorCondition.prehook, ccConditions) ||
        !checkCuratorConditionDone(CuratorCondition.posthook, ccConditions)
    ) {
        if (
            !checkCuratorConditionDone(CuratorCondition.prehook, ccConditions) &&
            activeJob?.metadata?.annotations?.['generateName'] === 'prehookjob-' &&
            !checkCuratorConditionFailed('prehook-ansiblejob', ccConditions) &&
            checkCuratorLatestOperation('DesiredCuration: upgrade', ccConditions)
        ) {
            return (
                <>
                    <div>{props.cluster?.distribution.displayVersion}</div>
                    <AcmInlineStatus
                        type={StatusType.progress}
                        status={t('upgrade.ansible.prehook')}
                        popover={
                            latestAnsibleJob.prehook?.status?.ansibleJobResult?.url
                                ? {
                                      headerContent: t('upgrade.ansible.prehook'),
                                      bodyContent: t('upgrade.ansible.prehook.message', {
                                          clusterName: props.cluster?.name,
                                      }),
                                      footerContent: (
                                          <a
                                              href={latestAnsibleJob.prehook?.status?.ansibleJobResult?.url}
                                              target="_blank"
                                              rel="noreferrer"
                                          >
                                              {t('upgrade.ansible.link')} <ExternalLinkAltIcon />
                                          </a>
                                      ),
                                  }
                                : undefined
                        }
                    />
                </>
            )
        }

        if (
            !checkCuratorConditionDone(CuratorCondition.posthook, ccConditions) &&
            activeJob?.metadata?.annotations?.['generateName'] === 'posthookjob-'
        ) {
            console.log('checing posthook url: ', latestAnsibleJob.posthook?.status?.ansibleJobResult?.url)
            console.log('checking curator conditions: ', ccConditions)
            return (
                <>
                    <div>{props.cluster?.distribution.displayVersion}</div>
                    <AcmInlineStatus
                        type={StatusType.progress}
                        status={t('upgrade.ansible.posthook')}
                        popover={
                            latestAnsibleJob.posthook?.status?.ansibleJobResult?.url
                                ? {
                                      headerContent: t('upgrade.ansible.posthook'),
                                      bodyContent: t('upgrade.ansible.posthook.message', {
                                          clusterName: props.cluster?.name,
                                      }),
                                      footerContent: (
                                          <a
                                              href={latestAnsibleJob.posthook?.status?.ansibleJobResult?.url}
                                              target="_blank"
                                              rel="noreferrer"
                                          >
                                              {t('upgrade.ansible.link')} <ExternalLinkAltIcon />
                                          </a>
                                      ),
                                  }
                                : undefined
                        }
                    />
                </>
            )
        }
    }

    if (props.cluster?.status !== ClusterStatus.ready) {
        return <>{props.cluster?.distribution.displayVersion ?? '-'}</>
    }
    if (props.cluster?.distribution.upgradeInfo.upgradeFailed) {
        // UPGRADE FAILED
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
    } else if (props.cluster?.distribution.upgradeInfo.isUpgrading) {
        // UPGRADE IN PROGRESS
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
    } else if (props.cluster?.distribution.upgradeInfo.isReadyUpdates) {
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
    } else {
        // NO UPGRADE, JUST VERSION
        return <>{props.cluster?.distribution.displayVersion ?? '-'}</>
    }
}
