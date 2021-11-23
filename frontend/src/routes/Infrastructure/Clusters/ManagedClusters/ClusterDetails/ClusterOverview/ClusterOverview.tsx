/* Copyright Contributors to the Open Cluster Management project */

import { ClusterCuratorDefinition, ClusterStatus, ManagedClusterDefinition } from '../../../../../../resources'
import {
    AcmButton,
    AcmDescriptionList,
    AcmInlineCopy,
    AcmInlineProvider,
    AcmInlineStatus,
    AcmLabels,
    AcmPageContent,
    StatusType,
    Provider,
} from '@open-cluster-management/ui-components'
import { ButtonVariant, PageSection, Popover } from '@patternfly/react-core'
import { ExternalLinkAltIcon, OutlinedQuestionCircleIcon, PencilAltIcon } from '@patternfly/react-icons'
import React, { useContext, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CIM } from 'openshift-assisted-ui-lib'
import { RbacButton } from '../../../../../../components/Rbac'
import { rbacCreate, rbacPatch } from '../../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../../NavigationPath'
import { BatchChannelSelectModal } from '../../components/BatchChannelSelectModal'
import { ClusterStatusMessageAlert } from '../../components/ClusterStatusMessageAlert'
import { DistributionField } from '../../components/DistributionField'
import { EditLabels } from '../../components/EditLabels'
import { HiveNotification } from '../../components/HiveNotification'
import { ImportCommandContainer } from '../../components/ImportCommand'
import { LoginCredentials } from '../../components/LoginCredentials'
import { ProgressStepBar } from '../../components/ProgressStepBar'
import { StatusField } from '../../components/StatusField'
import { StatusSummaryCount } from '../../components/StatusSummaryCount'
import { ClusterContext } from '../ClusterDetails'
import AIClusterProgress from '../../components/cim/AIClusterProgress'
import AIClusterErrors from '../../components/cim/AIClusterErrors'

const { getClusterProperties } = CIM

export function ClusterOverviewPageContent(props: { canGetSecret?: boolean }) {
    const { cluster, clusterCurator, clusterDeployment, agentClusterInstall } = useContext(ClusterContext)
    const { t } = useTranslation()
    const [showEditLabels, setShowEditLabels] = useState<boolean>(false)
    const [showChannelSelectModal, setShowChannelSelectModal] = useState<boolean>(false)

    const clusterProperties: { [key: string]: { key: string; value?: React.ReactNode; keyAction?: React.ReactNode } } =
        {
            clusterName: {
                key: t('Cluster resource name'),
                value: (
                    <span>
                        {cluster!.name}
                        <Popover
                            bodyContent={
                                <Trans
                                    i18nKey="Channels help to control the pace of upgrades and recommend the approporiate release versions. Update channels are tied to a minor version of Openshift Container Platform, for example 4.6."
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
            },
            clusterClaim: {
                key: t('Cluster claim name'),
                value: cluster?.hive?.clusterClaimName && (
                    <span>
                        {cluster?.hive?.clusterClaimName}
                        <Popover
                            bodyContent={
                                <Trans
                                    i18nKey="The name of the <bold>ClusterClaim</bold> resource used to claim this cluster from a cluster pool. For any direct interactions with underlying cluster resources, such as command line actions, use the <bold>Cluster resource name</bold> for those operations."
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
            },
            status: {
                key: t('Status'),
                value: cluster?.status && <StatusField cluster={cluster} />,
            },
            provider: {
                key: t('Infrastructure provider'),
                value: cluster?.provider && <AcmInlineProvider provider={cluster.provider} />,
            },
            distribution: {
                key: t('Distribution version'),
                value: cluster?.distribution?.displayVersion && (
                    <DistributionField cluster={cluster} clusterCurator={clusterCurator} />
                ),
            },
            channel: {
                key: t('Channel'),
                value: (
                    <span>
                        {cluster?.distribution?.upgradeInfo?.isSelectingChannel ? (
                            <AcmInlineStatus
                                type={StatusType.progress}
                                // TODO - Handle interpolation
                                status={t('Selecting {{channel}}', {
                                    channel: cluster?.distribution?.upgradeInfo.desiredChannel,
                                })}
                            ></AcmInlineStatus>
                        ) : (
                            cluster!.distribution?.upgradeInfo?.currentChannel || ''
                        )}
                        <Popover
                            bodyContent={
                                <Trans
                                    i18nKey="Channels help to control the pace of upgrades and recommend the approporiate release versions. Update channels are tied to a minor version of Openshift Container Platform, for example 4.6."
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
                keyAction: cluster?.isManaged && cluster.distribution?.upgradeInfo?.isReadySelectChannels && (
                    <RbacButton
                        onClick={() => {
                            if (cluster) {
                                setShowChannelSelectModal(true)
                            }
                        }}
                        variant={ButtonVariant.plain}
                        aria-label={t('Select channels')}
                        rbac={[
                            rbacPatch(ClusterCuratorDefinition, cluster?.namespace, cluster?.name),
                            rbacCreate(ClusterCuratorDefinition, cluster?.namespace, cluster?.name),
                        ]}
                    >
                        <PencilAltIcon />
                    </RbacButton>
                ),
            },
            labels: {
                key: t('Labels'),
                value: cluster?.labels && <AcmLabels labels={cluster?.labels} />,
                keyAction: cluster?.isManaged && (
                    <RbacButton
                        onClick={() => setShowEditLabels(true)}
                        variant={ButtonVariant.plain}
                        aria-label={t('Edit labels')}
                        rbac={[rbacPatch(ManagedClusterDefinition, undefined, cluster?.name)]}
                    >
                        <PencilAltIcon />
                    </RbacButton>
                ),
            },
            kubeApiServer: {
                key: t('Cluster API address'),
                value: cluster?.kubeApiServer && <AcmInlineCopy text={cluster?.kubeApiServer} id="kube-api-server" />,
            },
            consoleUrl: {
                key: t('Console URL'),
                value: cluster?.consoleURL && (
                    <AcmButton
                        variant="link"
                        isInline
                        onClick={() => window.open(cluster.consoleURL!, '_blank')}
                        isDisabled={cluster.status === ClusterStatus.hibernating}
                        tooltip={t('This action is currently unavailable because the cluster is powered down.')}
                        icon={<ExternalLinkAltIcon />}
                        iconPosition="right"
                    >
                        {cluster?.consoleURL}
                    </AcmButton>
                ),
            },
            clusterId: {
                key: t('Cluster ID'),
                value: cluster?.labels?.clusterID && (
                    <>
                        <div>{cluster?.labels?.clusterID}</div>
                        <a
                            href={`https://cloud.redhat.com/openshift/details/${cluster?.labels?.clusterID}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {t('OpenShift Cluster Manager')} <ExternalLinkAltIcon />
                        </a>
                    </>
                ),
            },
            credentials: {
                key: t('Credentials'),
                value: <LoginCredentials canGetSecret={props.canGetSecret} />,
            },
            claimedBy: {
                key: cluster?.owner.claimedBy ? t('Claimed by') : t('Created by'),
                value: cluster?.owner.claimedBy ?? cluster?.owner.createdBy,
            },
            clusterSet: {
                key: t('Cluster set'),
                value: cluster?.clusterSet! && (
                    <Link to={NavigationPath.clusterSetOverview.replace(':id', cluster?.clusterSet!)}>
                        {cluster?.clusterSet}
                    </Link>
                ),
            },
            clusterPool: {
                key: t('Cluster pool'),
                value: cluster?.hive?.clusterPool,
            },
        }

    let leftItems = [
        clusterProperties.clusterName,
        clusterProperties.clusterClaim,
        clusterProperties.status,
        clusterProperties.provider,
        clusterProperties.distribution,
        clusterProperties.labels,
    ]
    let rightItems = [
        clusterProperties.kubeApiServer,
        clusterProperties.consoleUrl,
        clusterProperties.clusterId,
        clusterProperties.credentials,
        clusterProperties.claimedBy,
        clusterProperties.clusterSet,
        clusterProperties.clusterPool,
    ]

    // should only show channel for ocp clusters with version
    if (cluster?.distribution?.ocp?.version) {
        leftItems.splice(5, 0, clusterProperties.channel)
    }

    const isHybrid = cluster?.provider === Provider.hybrid

    if (isHybrid && !!(clusterDeployment && agentClusterInstall)) {
        const aiClusterProperties = getClusterProperties(clusterDeployment, agentClusterInstall)

        leftItems = [
            ...leftItems,
            clusterProperties.claimedBy,
            clusterProperties.clusterSet,
            clusterProperties.clusterPool,
        ]
        rightItems = [
            clusterProperties.kubeApiServer,
            clusterProperties.consoleUrl,
            clusterProperties.clusterId,
            clusterProperties.credentials,
            aiClusterProperties.baseDnsDomain,
            aiClusterProperties.apiVip,
            aiClusterProperties.ingressVip,
            aiClusterProperties.clusterNetworkCidr,
            aiClusterProperties.clusterNetworkHostPrefix,
            aiClusterProperties.serviceNetworkCidr,
        ]
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
                {isHybrid && <AIClusterErrors />}
                {isHybrid ? <AIClusterProgress /> : <ProgressStepBar />}
                <AcmDescriptionList title={t('Details')} leftItems={leftItems} rightItems={rightItems} />
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
