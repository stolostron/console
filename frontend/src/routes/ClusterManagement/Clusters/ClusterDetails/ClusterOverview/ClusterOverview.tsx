/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmDescriptionList,
    AcmDrawerContext,
    AcmInlineCopy,
    AcmInlineProvider,
    AcmLabels,
    AcmPageContent,
    AcmAlert,
    AcmButton,
} from '@open-cluster-management/ui-components'
import { ButtonVariant, PageSection, Popover } from '@patternfly/react-core'
import { ExternalLinkAltIcon, PencilAltIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { useContext } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { RbacButton } from '../../../../../components/Rbac'
import { ClusterStatus, clusterDangerStatuses } from '../../../../../lib/get-cluster'
import { rbacPatch } from '../../../../../lib/rbac-util'
import { ManagedClusterDefinition } from '../../../../../resources/managed-cluster'
import { ImportCommandContainer } from '../../../Clusters/components/ImportCommand'
import { DistributionField } from '../../components/DistributionField'
import { EditLabels } from '../../components/EditLabels'
import { HiveNotification } from '../../components/HiveNotification'
import { LoginCredentials } from '../../components/LoginCredentials'
import { StatusField } from '../../components/StatusField'
import { StatusSummaryCount } from '../../components/StatusSummaryCount'
import { ClusterContext } from '../ClusterDetails'

export function ClusterOverviewPageContent(props: { canGetSecret?: boolean }) {
    const { cluster } = useContext(ClusterContext)
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const { t } = useTranslation(['cluster', 'common'])
    return (
        <AcmPageContent id="overview">
            <PageSection>
                {cluster!.statusMessage && (
                    <AcmAlert
                        isInline
                        title={t(`status.${cluster?.status}.alert.title`)}
                        message={cluster?.statusMessage}
                        variant={clusterDangerStatuses.includes(cluster!.status) ? 'danger' : 'info'}
                        noClose
                        style={{ marginBottom: '12px' }}
                    />
                )}
                <HiveNotification />
                <ImportCommandContainer />
                <AcmDescriptionList
                    title={t('table.details')}
                    leftItems={[
                        {
                            key: t('table.clusterName'),
                            value: (
                                <span>
                                    {cluster!.name}
                                    <Popover
                                        bodyContent={
                                            <Trans
                                                i18nKey="cluster:table.clusterName.helperText"
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
                        {
                            key: t('table.clusterClaim'),
                            value: cluster?.hive?.clusterClaimName && (
                                <span>
                                    {cluster?.hive?.clusterClaimName}
                                    <Popover
                                        bodyContent={
                                            <Trans
                                                i18nKey="cluster:table.clusterClaim.helperText"
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
                            key: t('table.labels'),
                            value: cluster?.labels && <AcmLabels labels={cluster?.labels} />,
                            keyAction: cluster?.isManaged && (
                                <RbacButton
                                    onClick={() => {
                                        if (cluster) {
                                            setDrawerContext({
                                                isExpanded: true,
                                                title: t('labels.edit.title'),
                                                onCloseClick: () => setDrawerContext(undefined),
                                                panelContent: (
                                                    <EditLabels
                                                        displayName={cluster.displayName!}
                                                        resource={{
                                                            ...ManagedClusterDefinition,
                                                            metadata: { name: cluster.name, labels: cluster.labels },
                                                        }}
                                                        close={() => setDrawerContext(undefined)}
                                                    />
                                                ),
                                                panelContentProps: { minSize: '600px' },
                                            })
                                        }
                                    }}
                                    variant={ButtonVariant.plain}
                                    aria-label={t('common:labels.edit.title')}
                                    rbac={[rbacPatch(ManagedClusterDefinition, undefined, cluster?.name)]}
                                >
                                    <PencilAltIcon />
                                </RbacButton>
                            ),
                        },
                    ]}
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
                    ]}
                />
                {cluster?.status === ClusterStatus.ready && <StatusSummaryCount />}
            </PageSection>
        </AcmPageContent>
    )
}
