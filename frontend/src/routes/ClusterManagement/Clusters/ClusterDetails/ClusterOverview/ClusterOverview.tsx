/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmDescriptionList,
    AcmInlineCopy,
    AcmInlineProvider,
    AcmLabels,
    AcmPageContent,
    AcmButton,
    AcmInlineStatus,
    StatusType,
} from '@open-cluster-management/ui-components'
import { ButtonVariant, PageSection, Popover } from '@patternfly/react-core'
import { ExternalLinkAltIcon, PencilAltIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { RbacButton } from '../../../../../components/Rbac'
import { ClusterStatus } from '../../../../../lib/get-cluster'
import { rbacCreate, rbacPatch } from '../../../../../lib/rbac-util'
import { ClusterCuratorDefinition } from '../../../../../resources/cluster-curator'
import { ManagedClusterDefinition } from '../../../../../resources/managed-cluster'
import { ImportCommandContainer } from '../../../Clusters/components/ImportCommand'
import { DistributionField } from '../../components/DistributionField'
import { HiveNotification } from '../../components/HiveNotification'
import { LoginCredentials } from '../../components/LoginCredentials'
import { StatusField } from '../../components/StatusField'
import { StatusSummaryCount } from '../../components/StatusSummaryCount'
import { EditLabels } from '../../components/EditLabels'
import { ClusterStatusMessageAlert } from '../../components/ClusterStatusMessageAlert'
import { ClusterContext } from '../ClusterDetails'
import { BatchChannelSelectModal } from '../../components/BatchChannelSelectModal'
import { ProgressStepBar } from '../../components/ProgressStepBar'

type StatusItems = {
    statusType: StatusType
    statusSubtitle: string
}

export function ClusterOverviewPageContent(props: { canGetSecret?: boolean }) {
    const { cluster, clusterCurator } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster', 'common'])
    const [showEditLabels, setShowEditLabels] = useState<boolean>(false)
    const [showChannelSelectModal, setShowChannelSelectModal] = useState<boolean>(false)
    const [installStepsComplete, setInstallStepsComplete] = useState(0)
    const [precreationStatus, setPrecreationStatus] = useState<StatusItems>({
        statusType: StatusType.pending,
        statusSubtitle: t('status.pending'),
    })
    const [installStatus, setInstallStatus] = useState<StatusItems>({
        statusType: StatusType.pending,
        statusSubtitle: t('status.pending'),
    })
    const [klusterletStatus, setKlusterletStatus] = useState<StatusItems>({
        statusType: StatusType.pending,
        statusSubtitle: t('status.pending'),
    })
    const [postcreationStatus, setPostcreationStatus] = useState<StatusItems>({
        statusType: StatusType.pending,
        statusSubtitle: t('status.pending'),
    })

    const installStatusSteps = useMemo(
        () => [
            {
                active: true,
                statusType: precreationStatus.statusType,
                statusText: t('status.job.precreation'),
                statusSubtitle: precreationStatus.statusSubtitle,
            },
            {
                active: true,
                statusType: installStatus.statusType,
                statusText: t('status.job.cluster.install'),
                statusSubtitle: installStatus.statusSubtitle,
            },
            {
                active: true,
                statusType: klusterletStatus.statusType,
                statusText: t('status.job.cluster.install'),
                statusSubtitle: klusterletStatus.statusSubtitle,
            },
            {
                active: true,
                statusType: postcreationStatus.statusType,
                statusText: t('status.job.klusterlet.install'),
                statusSubtitle: postcreationStatus.statusSubtitle,
            },
        ],
        [
            precreationStatus.statusType,
            precreationStatus.statusSubtitle,
            installStatus.statusType,
            installStatus.statusSubtitle,
            klusterletStatus.statusType,
            klusterletStatus.statusSubtitle,
            postcreationStatus.statusType,
            postcreationStatus.statusSubtitle,
        ]
    )
    const updateInstallStatusSteps = useCallback(() => {
        switch (cluster?.status) {
            case 'pending': {
                setPrecreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setInstallStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setKlusterletStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                break
            }
            case 'prehookjob': {
                setPrecreationStatus({ statusType: StatusType.progress, statusSubtitle: t('status.job.subtitle.progress') })
                setInstallStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setKlusterletStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                break
            }
            case 'prehookfailed': {
                setPrecreationStatus({ statusType: StatusType.danger, statusSubtitle: t('status.failed')  })
                setInstallStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setKlusterletStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                break
            }
            case 'creating': {
                setPrecreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setInstallStatus({ statusType: StatusType.progress, statusSubtitle: t('status.job.subtitle.progress') })
                setKlusterletStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                break
            }
            case 'provisionfailed': {
                setPrecreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setInstallStatus({ statusType: StatusType.danger, statusSubtitle: t('status.failed')  })
                setKlusterletStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                break
            }
            case 'importfailed': {
                setPrecreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setInstallStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setKlusterletStatus({ statusType: StatusType.danger, statusSubtitle: t('status.failed')  })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                break
            }
            case 'notaccepted': {
                setPrecreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setInstallStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setKlusterletStatus({ statusType: StatusType.warning, statusSubtitle: t('status.notaccepted') })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                break
            }
            case 'needsapproval': {
                setPrecreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setInstallStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setKlusterletStatus({ statusType: StatusType.progress, statusSubtitle: t('status.needsapproval') })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                break
            }
            case 'pendingimport': {
                setPrecreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setInstallStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setKlusterletStatus({ statusType: StatusType.progress, statusSubtitle: t('status.job.subtitle.progress') })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                break
            }
            case 'posthookjob': {
                setPrecreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setInstallStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setKlusterletStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setPostcreationStatus({ statusType: StatusType.progress, statusSubtitle: t('status.job.subtitle.progress') })
                break
            }
            case 'posthookfailed': {
                setPrecreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setInstallStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setKlusterletStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setPostcreationStatus({ statusType: StatusType.danger, statusSubtitle: t('status.failed')  })
                break
            }
            case 'ready': {
                setPrecreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setInstallStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setKlusterletStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                setPostcreationStatus({ statusType: StatusType.healthy, statusSubtitle: t('status.job.subtitle.complete') })
                break
            }
            // unsure of when failed will appear chronologically
            case 'failed': {
                setPrecreationStatus({ statusType: StatusType.danger, statusSubtitle: t('status.failed')  })
                setInstallStatus({ statusType: StatusType.danger, statusSubtitle: t('status.failed')  })
                setKlusterletStatus({ statusType: StatusType.pending, statusSubtitle: t('status.failed')  })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.failed') })
                break
            }
            case 'offline':
            case 'deprovisionfailed':
            case 'destroying':
            case 'detached':
            case 'detaching':
            case 'hibernating':
            case 'stopping':
            case 'resuming':
            case 'degraded':
            case 'unknown':
            default: {
                setPrecreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setInstallStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setKlusterletStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
                setPostcreationStatus({ statusType: StatusType.pending, statusSubtitle: t('status.pending') })
            }
        }
    }, [cluster?.status])

    useEffect(() => {
        if (clusterCurator?.spec?.desiredCuration === 'install') {
            updateInstallStatusSteps()
        }
    }, [cluster?.status, clusterCurator?.spec?.desiredCuration, updateInstallStatusSteps])

    useEffect(() => {
        if (clusterCurator?.spec?.desiredCuration === 'install') {
            let completedSteps = 0
            installStatusSteps.forEach((step) => {
                if (step.statusType === StatusType.healthy) {
                    completedSteps++
                }
            })
            setInstallStepsComplete(completedSteps)
        }
    }, [installStatusSteps, clusterCurator?.spec?.desiredCuration])

    let leftItems = [
        {
            key: t('table.clusterName'),
            value: (
                <span>
                    {cluster!.name}
                    <Popover
                        bodyContent={
                            <Trans i18nKey="cluster:table.clusterName.helperText" components={{ bold: <strong /> }} />
                        }
                    >
                        <AcmButton variant="link" style={{ paddingLeft: '6px' }}>
                            <OutlinedQuestionCircleIcon />
                        </AcmButton>
                    </Popover>
                </span>
            ),
        },
        {
            key: t('table.clusterClaim'),
            value: cluster?.hive?.clusterClaimName && (
                <span>
                    {cluster?.hive?.clusterClaimName}
                    <Popover
                        bodyContent={
                            <Trans i18nKey="cluster:table.clusterClaim.helperText" components={{ bold: <strong /> }} />
                        }
                    >
                        <AcmButton variant="link" style={{ paddingLeft: '6px' }}>
                            <OutlinedQuestionCircleIcon />
                        </AcmButton>
                    </Popover>
                </span>
            ),
        },
        {
            key: t('table.status'),
            value: cluster?.status && <StatusField cluster={cluster} />,
        },
        {
            key: t('table.provider'),
            value: cluster?.provider && <AcmInlineProvider provider={cluster.provider} />,
        },
        {
            key: t('table.distribution'),
            value: cluster?.distribution?.displayVersion && <DistributionField cluster={cluster} />,
        },
        {
            filterKey: 'channel',
            key: t('table.channel'),
            value: (
                <span>
                    {cluster?.distribution?.upgradeInfo.isSelectingChannel ? (
                        <AcmInlineStatus
                            type={StatusType.progress}
                            status={t('upgrade.selecting.channel', {
                                channel: cluster?.distribution?.upgradeInfo.desiredChannel,
                            })}
                        ></AcmInlineStatus>
                    ) : (
                        cluster!.distribution?.upgradeInfo.currentChannel || ''
                    )}
                    <Popover
                        bodyContent={
                            <Trans
                                i18nKey="cluster:table.clusterChannel.helperText"
                                components={{ bold: <strong /> }}
                            />
                        }
                    >
                        <AcmButton variant="link" style={{ paddingLeft: '6px' }}>
                            <OutlinedQuestionCircleIcon />
                        </AcmButton>
                    </Popover>
                </span>
            ),
            keyAction: cluster?.isManaged && cluster.distribution?.upgradeInfo.isReadySelectChannels && (
                <RbacButton
                    onClick={() => {
                        if (cluster) {
                            setShowChannelSelectModal(true)
                        }
                    }}
                    variant={ButtonVariant.plain}
                    aria-label={t('cluster:bulk.title.selectChannel')}
                    rbac={[
                        rbacPatch(ClusterCuratorDefinition, undefined, cluster?.name),
                        rbacCreate(ClusterCuratorDefinition, undefined, cluster?.name),
                    ]}
                >
                    <PencilAltIcon />
                </RbacButton>
            ),
        },

        {
            key: t('table.labels'),
            value: cluster?.labels && <AcmLabels labels={cluster?.labels} />,
            keyAction: cluster?.isManaged && (
                <RbacButton
                    onClick={() => setShowEditLabels(true)}
                    variant={ButtonVariant.plain}
                    aria-label={t('common:labels.edit.title')}
                    rbac={[rbacPatch(ManagedClusterDefinition, undefined, cluster?.name)]}
                >
                    <PencilAltIcon />
                </RbacButton>
            ),
        },
    ]
    // should only show channel for ocp clusters with version
    if (!cluster?.distribution?.ocp?.version) {
        leftItems = leftItems.filter((item) => item.filterKey !== 'channel')
    }
    return (
        <AcmPageContent id="overview">
            <PageSection>
                <ClusterStatusMessageAlert cluster={cluster!} padBottom />
                <HiveNotification />
                <ImportCommandContainer />
                <EditLabels
                    resource={
                        showEditLabels
                            ? {
                                  ...ManagedClusterDefinition,
                                  metadata: { name: cluster!.name, labels: cluster!.labels },
                              }
                            : undefined
                    }
                    displayName={cluster!.displayName}
                    close={() => setShowEditLabels(false)}
                />
                {clusterCurator?.spec?.desiredCuration === 'install' && (
                    <ProgressStepBar
                        title="Creating cluster"
                        subtitle={`${installStepsComplete} of ${installStatusSteps.length} complete`}
                        steps={installStatusSteps}
                        isCentered={true}
                    ></ProgressStepBar>
                )}
                <AcmDescriptionList
                    title={t('table.details')}
                    leftItems={leftItems}
                    rightItems={[
                        {
                            key: t('table.kubeApiServer'),
                            value: cluster?.kubeApiServer && (
                                <AcmInlineCopy text={cluster?.kubeApiServer} id="kube-api-server" />
                            ),
                        },
                        {
                            key: t('table.consoleUrl'),
                            value: cluster?.consoleURL && (
                                <AcmButton
                                    variant="link"
                                    isInline
                                    onClick={() => window.open(cluster.consoleURL!, '_blank')}
                                    isDisabled={cluster.status === ClusterStatus.hibernating}
                                    tooltip={t('hibernating.tooltip')}
                                    icon={<ExternalLinkAltIcon />}
                                    iconPosition="right"
                                >
                                    {cluster?.consoleURL}
                                </AcmButton>
                            ),
                        },
                        {
                            key: t('table.clusterId'),
                            value: cluster?.labels?.clusterID && (
                                <>
                                    <div>{cluster?.labels?.clusterID}</div>
                                    <a
                                        href={`https://cloud.redhat.com/openshift/details/${cluster?.labels?.clusterID}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {t('common:openshift.cluster.manager')} <ExternalLinkAltIcon />
                                    </a>
                                </>
                            ),
                        },
                        {
                            key: t('table.credentials'),
                            value: <LoginCredentials canGetSecret={props.canGetSecret} />,
                        },
                        {
                            key: cluster?.owner.claimedBy ? t('table.claimedBy') : t('table.createdBy'),
                            value: cluster?.owner.claimedBy ?? cluster?.owner.createdBy,
                        },
                        {
                            key: t('table.clusterSet'),
                            value: cluster?.clusterSet,
                        },
                        {
                            key: t('table.clusterPool'),
                            value: cluster?.hive?.clusterPool,
                        },
                    ]}
                />
                {cluster!.isManaged &&
                    [
                        ClusterStatus.ready,
                        ClusterStatus.degraded,
                        ClusterStatus.stopping,
                        ClusterStatus.resuming,
                        ClusterStatus.hibernating,
                        ClusterStatus.unknown,
                    ].includes(cluster!.status) && <StatusSummaryCount />}
                {cluster && (
                    <BatchChannelSelectModal
                        clusters={[cluster]}
                        open={showChannelSelectModal}
                        close={() => {
                            setShowChannelSelectModal(false)
                        }}
                    />
                )}
            </PageSection>
        </AcmPageContent>
    )
}
