/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmExpandableCard,
    AcmLabels,
    AcmLaunchLink,
    AcmPageContent,
    AcmTable,
} from '@open-cluster-management/ui-components'
import {
    ButtonVariant,
    Flex,
    FlexItem,
    PageSection,
    Stack,
    Text,
    TextContent,
    TextVariants,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import {
    agentClusterInstallsState,
    certificateSigningRequestsState,
    clusterDeploymentsState,
    clusterManagementAddonsState,
    clusterPoolsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClusterSetBindingsState,
    managedClusterSetsState,
    managedClustersState,
} from '../../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { TechPreviewAlert } from '../../../../components/TechPreviewAlert'
import { DOC_LINKS } from '../../../../lib/doc-util'
import { canUser } from '../../../../lib/rbac-util'
import { NavigationPath } from '../../../../NavigationPath'
import {
    Cluster,
    deleteResource,
    ManagedClusterSet,
    ManagedClusterSetDefinition,
    managedClusterSetLabel,
    mapAddons,
    mapClusters,
    ResourceErrorCode,
} from '../../../../resources'
import { usePageContext } from '../ClustersPage'
import { ClusterSetActionDropdown } from './components/ClusterSetActionDropdown'
import { ClusterStatuses } from './components/ClusterStatuses'
import { MultiClusterNetworkStatus } from './components/MultiClusterNetworkStatus'
import { CreateClusterSetModal } from './CreateClusterSet/CreateClusterSetModal'

export default function ClusterSetsPage() {
    const { t } = useTranslation()
    const alertContext = useContext(AcmAlertContext)
    useEffect(() => alertContext.clearAlerts, [])

    const [
        managedClusterSets,
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
        agentClusterInstalls,
    ] = useRecoilValue(
        waitForAll([
            managedClusterSetsState,
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
            clusterPoolsState,
            agentClusterInstallsState,
        ])
    )

    let clusters = mapClusters(
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusters,
        managedClusterAddons,
        undefined,
        undefined,
        agentClusterInstalls
    )
    clusters = clusters.filter((cluster) => cluster?.clusterSet)

    usePageContext(clusters.length > 0, PageActions)
    return (
        <AcmPageContent id="clusters">
            <PageSection>
                <TechPreviewAlert
                    i18nKey="<bold>Technology Preview</bold>: For more information, <a>view documentation</a> on Cluster sets"
                    docHref={DOC_LINKS.CLUSTER_SETS}
                />
                <Stack hasGutter style={{ height: 'unset' }}>
                    <AcmExpandableCard title={t('Learn more about the terminology')} id="cluster-sets-learn">
                        <Flex style={{ flexWrap: 'inherit' }}>
                            <Flex style={{ maxWidth: '50%' }}>
                                <FlexItem>
                                    <TextContent>
                                        <Text component={TextVariants.h4}>{t('Cluster sets')}</Text>
                                        <Text component={TextVariants.p}>
                                            {t(
                                                'ManagedClusterSet resources allow the grouping of cluster resources, which enables role-based access control management across all of the resources in the group.'
                                            )}
                                        </Text>
                                    </TextContent>
                                </FlexItem>
                                <FlexItem align={{ default: 'alignRight' }}>
                                    <AcmButton
                                        onClick={() => window.open(DOC_LINKS.CLUSTER_SETS, '_blank')}
                                        variant="link"
                                        role="link"
                                        icon={<ExternalLinkAltIcon />}
                                        iconPosition="right"
                                    >
                                        {t('View documentation')}
                                    </AcmButton>
                                </FlexItem>
                            </Flex>
                            <Flex>
                                <FlexItem>
                                    <TextContent>
                                        <Text component={TextVariants.h4}>{t('Submariner')}</Text>
                                        <Text component={TextVariants.p}>
                                            {t(
                                                'Submariner is an open-source tool that can be used to provide direct networking between two or more Kubernetes clusters in a given ManagedClusterSet, either on-premises or in the cloud.'
                                            )}
                                        </Text>
                                    </TextContent>
                                </FlexItem>
                                <FlexItem align={{ default: 'alignRight' }}>
                                    <AcmButton
                                        onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                                        variant="link"
                                        role="link"
                                        icon={<ExternalLinkAltIcon />}
                                        iconPosition="right"
                                    >
                                        {t('View documentation')}
                                    </AcmButton>
                                </FlexItem>
                            </Flex>
                        </Flex>
                    </AcmExpandableCard>
                    <Stack>
                        <ClusterSetsTable clusters={clusters} managedClusterSets={managedClusterSets} />
                    </Stack>
                </Stack>
            </PageSection>
        </AcmPageContent>
    )
}

const PageActions = () => {
    const [clusterManagementAddons] = useRecoilValue(waitForAll([clusterManagementAddonsState]))
    const addons = mapAddons(clusterManagementAddons)

    return (
        <AcmLaunchLink
            links={addons
                ?.filter((addon) => addon.launchLink)
                ?.map((addon) => ({
                    id: addon.launchLink?.displayText ?? '',
                    text: addon.launchLink?.displayText ?? '',
                    href: addon.launchLink?.href ?? '',
                }))}
        />
    )
}

export function ClusterSetsTable(props: { clusters?: Cluster[]; managedClusterSets?: ManagedClusterSet[] }) {
    const { t } = useTranslation()
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ManagedClusterSet> | { open: false }>({
        open: false,
    })
    const [createClusterSetModalOpen, setCreateClusterSetModalOpen] = useState<boolean>(false)
    const [canCreateClusterSet, setCanCreateClusterSet] = useState<boolean>(false)
    useEffect(() => {
        const canCreateManagedClusterSet = canUser('create', ManagedClusterSetDefinition)
        canCreateManagedClusterSet.promise
            .then((result) => setCanCreateClusterSet(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateManagedClusterSet.abort()
    }, [])

    const [clusterPools, managedClusterSetBindings] = useRecoilValue(
        waitForAll([clusterPoolsState, managedClusterSetBindingsState])
    )

    const modalColumns = useMemo(
        () => [
            {
                header: t('Name'),
                cell: (managedClusterSet: ManagedClusterSet) => (
                    <span style={{ whiteSpace: 'nowrap' }}>{managedClusterSet.metadata.name}</span>
                ),
                sort: 'name',
            },
            {
                header: t('Multi-cluster network status'),
                cell: (managedClusterSet: ManagedClusterSet) => {
                    return <MultiClusterNetworkStatus clusterSet={managedClusterSet} />
                },
            },
            {
                header: t('Clusters'),
                sort: 'status',
                cell: (managedClusterSet: ManagedClusterSet) => (
                    <ClusterStatuses managedClusterSet={managedClusterSet} />
                ),
            },
            {
                header: t('Cluster pools'),
                cell: (managedClusterSet: ManagedClusterSet) => {
                    const pools = clusterPools.filter(
                        (cp) => cp.metadata.labels?.[managedClusterSetLabel] === managedClusterSet.metadata.name
                    )
                    if (pools.length === 0) {
                        return '-'
                    } else {
                        return pools.length
                    }
                },
            },
        ],
        [t, clusterPools]
    )

    function mckeyFn(managedClusterSet: ManagedClusterSet) {
        return managedClusterSet.metadata.name!
    }

    return (
        <Fragment>
            <CreateClusterSetModal
                isOpen={createClusterSetModalOpen}
                onClose={() => setCreateClusterSetModalOpen(false)}
            />
            <BulkActionModel<ManagedClusterSet> {...modalProps} />
            <AcmTable<ManagedClusterSet>
                plural="clusterSets"
                items={props.managedClusterSets}
                columns={[
                    {
                        header: t('Name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (managedClusterSet: ManagedClusterSet) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <Link
                                    to={NavigationPath.clusterSetOverview.replace(
                                        ':id',
                                        managedClusterSet.metadata.name as string
                                    )}
                                >
                                    {managedClusterSet.metadata.name}
                                </Link>
                            </span>
                        ),
                    },
                    {
                        header: t('Multi-cluster network status'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            return <MultiClusterNetworkStatus clusterSet={managedClusterSet} />
                        },
                    },
                    {
                        header: t('Clusters'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            return <ClusterStatuses managedClusterSet={managedClusterSet} />
                        },
                    },
                    {
                        header: t('Cluster pools'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            const pools = clusterPools.filter(
                                (cp) => cp.metadata.labels?.[managedClusterSetLabel] === managedClusterSet.metadata.name
                            )
                            if (pools.length === 0) {
                                return '-'
                            } else {
                                return pools.length === 1
                                    ? t('1 pool')
                                    : // TODO - Handle interpolation
                                      t('{{number}} pools', { number: pools.length })
                            }
                        },
                    },
                    {
                        header: t('Namespace bindings'),
                        tooltip: t(
                            'A ManagedClusterSetBinding resource binds a ManagedClusterSet resource to a namespace. Placement resources that are created in the same namespace can only access managed clusters that are included in the bound ManagedClusterSet resource.'
                        ),
                        cell: (managedClusterSet) => {
                            const bindings = managedClusterSetBindings.filter(
                                (mcsb) => mcsb.spec.clusterSet === managedClusterSet.metadata.name!
                            )
                            const namespaces = bindings.map((mcsb) => mcsb.metadata.namespace!)
                            return namespaces.length ? (
                                <AcmLabels labels={namespaces} collapse={namespaces.filter((_ns, i) => i > 1)} />
                            ) : (
                                '-'
                            )
                        },
                    },
                    {
                        header: '',
                        cell: (managedClusterSet) => {
                            return <ClusterSetActionDropdown managedClusterSet={managedClusterSet} isKebab={true} />
                        },
                        cellTransforms: [fitContent],
                    },
                ]}
                keyFn={mckeyFn}
                key="clusterSetsTable"
                tableActions={[
                    {
                        id: 'deleteClusterSets',
                        title: t('Delete cluster sets'),
                        click: (managedClusterSets) => {
                            setModalProps({
                                open: true,
                                title: t('Delete cluster sets?'),
                                action: t('Delete'),
                                processing: t('Deleting'),
                                resources: managedClusterSets,
                                description: t(
                                    'Deleting a cluster set will remove all access control permissions to resources in this set for all assigned cluster set users. Resources currently in this cluster set will not be deleted.'
                                ),
                                columns: modalColumns,
                                keyFn: (managedClusterSet) => managedClusterSet.metadata.name as string,
                                actionFn: deleteResource,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                icon: 'warning',
                                confirmText: t('Confirm').toLowerCase(),
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                        variant: 'bulk-action',
                    },
                ]}
                tableActionButtons={[
                    {
                        id: 'createClusterSet',
                        title: t('Create cluster set'),
                        click: () => setCreateClusterSetModalOpen(true),
                        isDisabled: !canCreateClusterSet,
                        tooltip: t(
                            'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                        ),
                        variant: ButtonVariant.primary,
                    },
                ]}
                rowActions={[]}
                emptyState={
                    <AcmEmptyState
                        key="mcEmptyState"
                        title={t("You don't have any cluster sets.")}
                        message={
                            <Trans
                                i18nKey={'Select <bold>Create cluster set</bold> to create a cluster set.'}
                                components={{ bold: <strong />, p: <p /> }}
                            />
                        }
                        action={
                            <AcmButton
                                role="link"
                                onClick={() => setCreateClusterSetModalOpen(true)}
                                isDisabled={!canCreateClusterSet}
                                tooltip={t(
                                    'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                                )}
                            >
                                {t('Create cluster set')}
                            </AcmButton>
                        }
                    />
                }
            />
        </Fragment>
    )
}
