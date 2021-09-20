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
import { useContext, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
import AIClusterDetails from '../../components/cim/AIClusterDetails'
import AIClusterErrors from '../../components/cim/AIClusterErrors'

export function ClusterOverviewPageContent(props: { canGetSecret?: boolean }) {
    const { cluster, clusterCurator } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster', 'common'])
    const [showEditLabels, setShowEditLabels] = useState<boolean>(false)
    const [showChannelSelectModal, setShowChannelSelectModal] = useState<boolean>(false)

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
            value: cluster?.distribution?.displayVersion && (
                <DistributionField cluster={cluster} clusterCurator={clusterCurator} />
            ),
        },
        {
            filterKey: 'channel',
            key: t('table.channel'),
            value: (
                <span>
                    {cluster?.distribution?.upgradeInfo?.isSelectingChannel ? (
                        <AcmInlineStatus
                            type={StatusType.progress}
                            status={t('upgrade.selecting.channel', {
                                channel: cluster?.distribution?.upgradeInfo.desiredChannel,
                            })}
                        ></AcmInlineStatus>
                    ) : (
                        cluster!.distribution?.upgradeInfo?.currentChannel || ''
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
            keyAction: cluster?.isManaged && cluster.distribution?.upgradeInfo?.isReadySelectChannels && (
                <RbacButton
                    onClick={() => {
                        if (cluster) {
                            setShowChannelSelectModal(true)
                        }
                    }}
                    variant={ButtonVariant.plain}
                    aria-label={t('cluster:bulk.title.selectChannel')}
                    rbac={[
                        rbacPatch(ClusterCuratorDefinition, cluster?.namespace, cluster?.name),
                        rbacCreate(ClusterCuratorDefinition, cluster?.namespace, cluster?.name),
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

    const isHybrid = cluster?.provider === Provider.hybrid
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
                            value: cluster?.clusterSet! && (
                                <Link to={NavigationPath.clusterSetOverview.replace(':id', cluster?.clusterSet!)}>
                                    {cluster?.clusterSet}
                                </Link>
                            ),
                        },
                        {
                            key: t('table.clusterPool'),
                            value: cluster?.hive?.clusterPool,
                        },
                    ]}
                />
                {isHybrid && <AIClusterDetails />}
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
