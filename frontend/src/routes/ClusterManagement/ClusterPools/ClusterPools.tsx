/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmExpandableCard,
    AcmInlineProvider,
    AcmPageContent,
    AcmTable,
    IAcmTableAction,
    Provider,
} from '@open-cluster-management/ui-components'
import { Flex, FlexItem, PageSection, Stack, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent, TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import { clusterImageSetsState, clusterPoolsState } from '../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { RbacButton, RbacDropdown } from '../../../components/Rbac'
import { DOC_LINKS } from '../../../lib/doc-util'
import { Cluster, ClusterStatus } from '../../../lib/get-cluster'
import { canUser, rbacCreate, rbacDelete, rbacPatch } from '../../../lib/rbac-util'
import { deleteResource, ResourceErrorCode } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import { ClusterClaimDefinition } from '../../../resources/cluster-claim'
import { ClusterPool, ClusterPoolDefinition } from '../../../resources/cluster-pool'
import { StatusField } from '../Clusters/components/StatusField'
import { useAllClusters } from '../Clusters/components/useAllClusters'
import { ClusterStatuses } from '../ClusterSets/components/ClusterStatuses'
import { ClusterClaimModal, ClusterClaimModalProps } from './components/ClusterClaimModal'
import { ScaleClusterPoolModal, ScaleClusterPoolModalProps } from './components/ScaleClusterPoolModal'
import { UpdateReleaseImageModal, UpdateReleaseImageModalProps } from './components/UpdateReleaseImageModal'

export default function ClusterPoolsPage() {
    const alertContext = useContext(AcmAlertContext)
    const history = useHistory()
    const { t } = useTranslation(['cluster', 'common'])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    const [clusterPools] = useRecoilValue(waitForAll([clusterPoolsState, clusterImageSetsState]))

    const [canCreateClusterPool, setCanCreateClusterPool] = useState<boolean>(false)
    useEffect(() => {
        const canCreateClusterPool = canUser('create', ClusterPoolDefinition)
        canCreateClusterPool.promise
            .then((result) => setCanCreateClusterPool(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateClusterPool.abort()
    }, [])

    return (
        <AcmPageContent id="clusters">
            <PageSection>
                <Stack hasGutter style={{ height: 'unset' }}>
                    <AcmExpandableCard title={t('common:learn.terminology')} id="cluster-pools-learn">
                        <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <TextContent>
                                    <Text component={TextVariants.h4}>{t('clusterPools')}</Text>
                                    <Text component={TextVariants.p}>{t('learn.clusterPools')}</Text>
                                </TextContent>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <TextContent>
                                    <Text component={TextVariants.h4}>{t('clusterClaims')}</Text>
                                    <Text component={TextVariants.p}>{t('learn.clusterClaims')}</Text>
                                </TextContent>
                            </FlexItem>
                        </Flex>
                        <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                            <FlexItem>
                                <AcmButton
                                    onClick={() => window.open(DOC_LINKS.CLUSTER_SETS, '_blank')}
                                    variant="link"
                                    role="link"
                                >
                                    {t('common:view.documentation')}
                                    <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                                </AcmButton>
                            </FlexItem>
                        </Flex>
                    </AcmExpandableCard>
                    <Stack>
                        <ClusterPoolsTable
                            clusterPools={clusterPools}
                            tableActions={[
                                {
                                    id: 'createClusterPool',
                                    title: t('managed.createClusterPool'),
                                    click: () => history.push(NavigationPath.createClusterPool),
                                    isDisabled: !canCreateClusterPool,
                                    tooltip: t('common:rbac.unauthorized'),
                                },
                            ]}
                            emptyState={
                                <AcmEmptyState
                                    key="mcEmptyState"
                                    title={t('managed.clusterPools.emptyStateHeader')}
                                    message={
                                        <Trans
                                            i18nKey={'cluster:managed.clusterPools.emptyStateMsg'}
                                            components={{ bold: <strong />, p: <p /> }}
                                        />
                                    }
                                    action={
                                        <AcmButton
                                            role="link"
                                            onClick={() => history.push(NavigationPath.createClusterPool)}
                                            disabled={!canCreateClusterPool}
                                            tooltip={t('common:rbac.unauthorized')}
                                        >
                                            {t('managed.createClusterPool')}
                                        </AcmButton>
                                    }
                                />
                            }
                        />
                    </Stack>
                </Stack>
            </PageSection>
        </AcmPageContent>
    )
}

function ClusterPoolProvider(props: { clusterPool: ClusterPool }) {
    let provider: Provider | undefined
    if (props.clusterPool.spec?.platform?.aws) provider = Provider.aws
    if (props.clusterPool.spec?.platform?.gcp) provider = Provider.gcp
    if (props.clusterPool.spec?.platform?.azure) provider = Provider.azure

    if (!provider) return <>-</>

    return <AcmInlineProvider provider={provider} />
}

export function ClusterPoolsTable(props: {
    clusterPools: ClusterPool[]
    emptyState: React.ReactNode
    canCreateClusterPool?: boolean
    tableActions?: IAcmTableAction[]
}) {
    const [clusterImageSets] = useRecoilValue(waitForAll([clusterImageSetsState]))
    const { clusterPools } = props
    const { t } = useTranslation(['cluster'])
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ClusterPool> | { open: false }>({
        open: false,
    })
    const [clusterClaimModalProps, setClusterClaimModalProps] = useState<ClusterClaimModalProps | undefined>()
    const [scaleClusterPoolModalProps, setScaleClusterPoolModalProps] = useState<
        ScaleClusterPoolModalProps | undefined
    >()
    const [updateReleaseImageModalProps, setUpdateReleaseImageModalProps] = useState<
        UpdateReleaseImageModalProps | undefined
    >()

    const clusters = useAllClusters()

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (clusterPool: ClusterPool) => (
                    <span style={{ whiteSpace: 'nowrap' }}>{clusterPool.metadata.name}</span>
                ),
                sort: 'metadata.name',
            },
            {
                header: t('table.namespace'),
                sort: 'metadata.namespace',
                search: 'metadata.namespace',
                cell: (clusterPool: ClusterPool) => {
                    return clusterPool.metadata.namespace
                },
            },
            {
                header: t('table.provider'),
                cell: (clusterPool: ClusterPool) => {
                    return <ClusterPoolProvider clusterPool={clusterPool} />
                },
            },
        ],
        [t]
    )

    function mckeyFn(clusterPool: ClusterPool) {
        return clusterPool.metadata.uid!
    }

    return (
        <Fragment>
            <BulkActionModel<ClusterPool> {...modalProps} />
            <ClusterClaimModal {...clusterClaimModalProps} />
            <ScaleClusterPoolModal {...scaleClusterPoolModalProps} />
            <UpdateReleaseImageModal {...updateReleaseImageModalProps} />
            <AcmTable<ClusterPool>
                gridBreakPoint={TableGridBreakpoint.gridLg}
                plural="clusterPools"
                items={clusterPools}
                addSubRows={(clusterPool: ClusterPool) => {
                    const clusterPoolClusters = clusters.filter(
                        (cluster) =>
                            cluster.hive.clusterPool === clusterPool.metadata.name &&
                            cluster.hive.clusterClaimName === undefined
                    )
                    if (clusterPoolClusters.length === 0) {
                        return undefined
                    } else {
                        const available = clusterPoolClusters.filter((cpc) => cpc.hive.clusterClaimName === undefined)
                        return [
                            {
                                cells: [
                                    {
                                        title: (
                                            <>
                                                {available.length > 0 && (
                                                    <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                                                        <TextContent>
                                                            <Text component={TextVariants.h3}>
                                                                {t('clusterPool.clusters')}
                                                            </Text>
                                                        </TextContent>
                                                        <ClusterPoolClustersTable clusters={available} />
                                                    </div>
                                                )}
                                            </>
                                        ),
                                    },
                                ],
                            },
                        ]
                    }
                }}
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (clusterPool: ClusterPool) => {
                            return clusterPool.metadata.name
                        },
                    },
                    {
                        header: t('table.namespace'),
                        sort: 'metadata.namespace',
                        search: 'metadata.namespace',
                        cell: (clusterPool: ClusterPool) => {
                            return clusterPool.metadata.namespace
                        },
                    },
                    {
                        header: t('table.clusters'),
                        cell: (clusterPool: ClusterPool) => {
                            return <ClusterStatuses clusterPool={clusterPool} />
                        },
                    },
                    {
                        header: t('table.available'),
                        cell: (clusterPool: ClusterPool) => {
                            return (
                                <span style={{ whiteSpace: 'nowrap', display: 'block' }}>
                                    {t('common:outOf', {
                                        firstNumber: clusterPool?.status?.ready,
                                        secondNumber: clusterPool.spec!.size,
                                    })}
                                </span>
                            )
                        },
                    },
                    {
                        header: t('table.provider'),
                        cell: (clusterPool: ClusterPool) => {
                            return <ClusterPoolProvider clusterPool={clusterPool} />
                        },
                    },
                    {
                        header: t('table.distribution'),
                        sort: 'spec.imageSetRef.name',
                        search: 'spec.imageSetRef.name',
                        cell: (clusterPool: ClusterPool) => {
                            const imageSetRef = clusterPool.spec!.imageSetRef.name
                            const imageSet = clusterImageSets.find((cis) => cis.metadata.name === imageSetRef)
                            const releaseImage = imageSet?.spec?.releaseImage
                            const tagStartIndex = releaseImage?.indexOf(':') ?? 0
                            const version = releaseImage?.slice(
                                tagStartIndex + 1,
                                releaseImage.indexOf('-', tagStartIndex)
                            )
                            return `OpenShift ${version}`
                        },
                    },
                    {
                        header: '',
                        cellTransforms: [fitContent],
                        cell: (clusterPool: ClusterPool) => {
                            if (clusterPool?.status?.ready !== 0) {
                                return (
                                    <RbacButton
                                        onClick={() => {
                                            setClusterClaimModalProps({
                                                clusterPool,
                                                onClose: () => setClusterClaimModalProps(undefined),
                                            })
                                        }}
                                        variant="link"
                                        style={{ padding: 0, margin: 0, fontSize: 'inherit' }}
                                        rbac={[rbacCreate(ClusterClaimDefinition, clusterPool.metadata.namespace)]}
                                    >
                                        {t('clusterPool.claim')}
                                    </RbacButton>
                                )
                            } else {
                                return null
                            }
                        },
                    },
                    {
                        header: '',
                        cell: (clusterPool: ClusterPool) => {
                            let actions = [
                                {
                                    id: 'claimCluster',
                                    text: t('clusterPool.claim'),
                                    isDisabled: true,
                                    rbac: [rbacCreate(ClusterClaimDefinition, clusterPool.metadata.namespace)],
                                    click: (clusterPool: ClusterPool) => {
                                        setClusterClaimModalProps({
                                            clusterPool,
                                            onClose: () => setClusterClaimModalProps(undefined),
                                        })
                                    },
                                },
                                {
                                    id: 'scaleClusterPool',
                                    text: t('clusterPool.scale'),
                                    isDisabled: true,
                                    rbac: [rbacPatch(clusterPool)],
                                    click: (clusterPool: ClusterPool) => {
                                        setScaleClusterPoolModalProps({
                                            clusterPool,
                                            onClose: () => setScaleClusterPoolModalProps(undefined),
                                        })
                                    },
                                },
                                {
                                    id: 'updateReleaseImage',
                                    text: t('clusterPool.updateReleaseImage'),
                                    isDisabled: true,
                                    rbac: [rbacPatch(clusterPool)],
                                    click: (clusterPool: ClusterPool) => {
                                        return setUpdateReleaseImageModalProps({
                                            clusterPools: [clusterPool],
                                            close: () => setUpdateReleaseImageModalProps(undefined),
                                        })
                                    },
                                },
                                {
                                    id: 'destroy',
                                    text: t('clusterPool.destroy'),
                                    isDisabled: true,
                                    click: (clusterPool: ClusterPool) => {
                                        setModalProps({
                                            open: true,
                                            title: t('bulk.title.destroyClusterPool'),
                                            action: t('common:destroy'),
                                            processing: t('common:destroying'),
                                            resources: [clusterPool],
                                            description: t('bulk.message.destroyClusterPool'),
                                            columns: modalColumns,
                                            keyFn: mckeyFn,
                                            actionFn: deleteResource,
                                            confirmText: clusterPool.metadata.name!,
                                            close: () => setModalProps({ open: false }),
                                            isDanger: true,
                                        })
                                    },
                                    rbac: [rbacDelete(clusterPool)],
                                },
                            ]

                            if (clusterPool.status?.ready === 0) {
                                actions = actions.filter((action) => action.id !== 'claimCluster')
                            }

                            return (
                                <RbacDropdown<ClusterPool>
                                    id={`${clusterPool.metadata.name}-actions`}
                                    item={clusterPool}
                                    isKebab={true}
                                    text={`${clusterPool.metadata.name}-actions`}
                                    actions={actions}
                                />
                            )
                        },
                        cellTransforms: [fitContent],
                    },
                ]}
                keyFn={mckeyFn}
                key="clusterPoolsTable"
                bulkActions={[
                    {
                        id: 'destroyClusterPools',
                        title: t('bulk.destroy.clusterPools'),
                        click: (clusterPools: ClusterPool[]) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.destroy.clusterPools'),
                                action: t('common:destroy'),
                                processing: t('common:destroying'),
                                resources: clusterPools,
                                description: t('bulk.message.destroyClusterPool'),
                                columns: modalColumns,
                                keyFn: mckeyFn,
                                actionFn: deleteResource,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                confirmText: t('confirm').toLowerCase(),
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                    },
                ]}
                tableActions={props.tableActions}
                rowActions={[]}
                emptyState={props.emptyState}
            />
        </Fragment>
    )
}

const useStyles = makeStyles({
    table: {
        '& .pf-c-table tr > *:first-child': {
            paddingLeft: '0 !important',
        },
    },
})

function ClusterPoolClustersTable(props: { clusters: Cluster[] }) {
    const { t } = useTranslation(['cluster'])
    const classes = useStyles()
    return (
        <div className={classes.table}>
            <AcmTable<Cluster>
                gridBreakPoint={TableGridBreakpoint.gridLg}
                noBorders
                keyFn={(cluster: Cluster) => cluster.name!}
                key="clusterPoolClustersTable"
                autoHidePagination
                showToolbar={false}
                plural="clusters"
                items={props.clusters}
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'displayName',
                        search: 'displayName',
                        cell: (cluster: Cluster) => <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>,
                    },
                    {
                        header: t('table.status'),
                        sort: 'status',
                        search: 'status',
                        cell: (cluster: Cluster) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <StatusField cluster={cluster} />
                            </span>
                        ),
                    },
                    {
                        header: t('table.availableToClaim'),
                        sort: 'hive',
                        search: 'status',
                        cell: (cluster: Cluster) => {
                            const availableStatuses = [
                                ClusterStatus.ready,
                                ClusterStatus.detached,
                                ClusterStatus.hibernating,
                                ClusterStatus.resuming,
                                ClusterStatus.stopping,
                            ]
                            const isAvailable =
                                !cluster.hive.clusterClaimName && availableStatuses.includes(cluster.status)
                            return (
                                <span style={{ whiteSpace: 'nowrap' }}>
                                    {t(`${isAvailable ? 'common:yes' : 'common:no'}`)}
                                </span>
                            )
                        },
                    },
                ]}
            />
        </div>
    )
}
