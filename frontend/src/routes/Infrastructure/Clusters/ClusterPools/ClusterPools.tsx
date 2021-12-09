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
    IAcmTableButtonAction,
    Provider,
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
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import { clusterImageSetsState, clusterPoolsState } from '../../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { RbacButton, RbacDropdown } from '../../../../components/Rbac'
import { TechPreviewAlert } from '../../../../components/TechPreviewAlert'
import { DOC_LINKS } from '../../../../lib/doc-util'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../lib/rbac-util'
import { NavigationPath } from '../../../../NavigationPath'
import {
    Cluster,
    ClusterClaimDefinition,
    ClusterPool,
    ClusterStatus,
    deleteResource,
    ResourceErrorCode,
} from '../../../../resources'
import { ClusterStatuses } from '../ClusterSets/components/ClusterStatuses'
import { StatusField } from '../ManagedClusters/components/StatusField'
import { useAllClusters } from '../ManagedClusters/components/useAllClusters'
import { ClusterClaimModal, ClusterClaimModalProps } from './components/ClusterClaimModal'
import { ScaleClusterPoolModal, ScaleClusterPoolModalProps } from './components/ScaleClusterPoolModal'
import { UpdateReleaseImageModal, UpdateReleaseImageModalProps } from './components/UpdateReleaseImageModal'

export default function ClusterPoolsPage() {
    const alertContext = useContext(AcmAlertContext)
    const history = useHistory()
    const { t } = useTranslation()
    useEffect(() => alertContext.clearAlerts, [])

    const [clusterPools] = useRecoilValue(waitForAll([clusterPoolsState, clusterImageSetsState]))

    return (
        <AcmPageContent id="clusters">
            <PageSection>
                <TechPreviewAlert i18nKey="preview.clusterPools" docHref={DOC_LINKS.CLUSTER_POOLS} />
                <Stack hasGutter style={{ height: 'unset' }}>
                    <AcmExpandableCard title={t('learn.terminology')} id="cluster-pools-learn">
                        <Flex style={{ flexWrap: 'inherit' }}>
                            <Flex style={{ maxWidth: '50%' }}>
                                <FlexItem>
                                    <TextContent>
                                        <Text component={TextVariants.h4}>{t('clusterPools')}</Text>
                                        <Text component={TextVariants.p}>{t('learn.clusterPools')}</Text>
                                    </TextContent>
                                </FlexItem>
                                <FlexItem align={{ default: 'alignRight' }}>
                                    <AcmButton
                                        onClick={() => window.open(DOC_LINKS.CLUSTER_POOLS, '_blank')}
                                        variant="link"
                                        role="link"
                                        icon={<ExternalLinkAltIcon />}
                                        iconPosition="right"
                                    >
                                        {t('view.documentation')}
                                    </AcmButton>
                                </FlexItem>
                            </Flex>
                            <Flex>
                                <FlexItem>
                                    <TextContent>
                                        <Text component={TextVariants.h4}>{t('clusterClaims')}</Text>
                                        <Text component={TextVariants.p}>{t('learn.clusterClaims')}</Text>
                                    </TextContent>
                                </FlexItem>
                                <FlexItem align={{ default: 'alignRight' }}>
                                    <AcmButton
                                        onClick={() => window.open(DOC_LINKS.CLUSTER_CLAIMS, '_blank')}
                                        variant="link"
                                        role="link"
                                        icon={<ExternalLinkAltIcon />}
                                        iconPosition="right"
                                    >
                                        {t('view.documentation')}
                                    </AcmButton>
                                </FlexItem>
                            </Flex>
                        </Flex>
                    </AcmExpandableCard>
                    <Stack>
                        <ClusterPoolsTable
                            clusterPools={clusterPools}
                            tableActionButtons={[
                                {
                                    id: 'createClusterPool',
                                    title: t('managed.createClusterPool'),
                                    click: () => history.push(NavigationPath.createClusterPool),
                                    variant: ButtonVariant.primary,
                                },
                            ]}
                            emptyState={
                                <AcmEmptyState
                                    key="mcEmptyState"
                                    title={t('managed.clusterPools.emptyStateHeader')}
                                    message={
                                        <Trans
                                            i18nKey={'managed.clusterPools.emptyStateMsg'}
                                            components={{ bold: <strong />, p: <p /> }}
                                        />
                                    }
                                    action={
                                        <AcmButton
                                            role="link"
                                            onClick={() => history.push(NavigationPath.createClusterPool)}
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
    tableActionButtons?: IAcmTableButtonAction[]
}) {
    const [clusterImageSets] = useRecoilValue(waitForAll([clusterImageSetsState]))
    const { clusterPools } = props
    const { t } = useTranslation()
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
                plural="clusterPools"
                items={clusterPools}
                addSubRows={(clusterPool: ClusterPool) => {
                    const clusterPoolClusters = clusters.filter(
                        (cluster) =>
                            cluster.hive.clusterPool === clusterPool.metadata.name &&
                            cluster.hive.clusterPoolNamespace === clusterPool.metadata.namespace &&
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
                                    {t('outOf', {
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
                        cellTransforms: [fitContent],
                        cell: (clusterPool: ClusterPool) => {
                            const actions = [
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
                                            action: t('destroy'),
                                            processing: t('destroying'),
                                            resources: [clusterPool],
                                            description: t('bulk.message.destroyClusterPool'),
                                            columns: modalColumns,
                                            keyFn: mckeyFn,
                                            actionFn: deleteResource,
                                            confirmText: clusterPool.metadata.name!,
                                            close: () => setModalProps({ open: false }),
                                            isDanger: true,
                                            icon: 'warning',
                                        })
                                    },
                                    rbac: [rbacDelete(clusterPool)],
                                },
                            ]

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
                    },
                ]}
                keyFn={mckeyFn}
                key="clusterPoolsTable"
                tableActions={[
                    {
                        id: 'updateReleaseImages',
                        title: t('bulk.updateReleaseImages.clusterPools'),
                        click: (clusterPools: ClusterPool[]) => {
                            setUpdateReleaseImageModalProps({
                                clusterPools,
                                close: () => setUpdateReleaseImageModalProps(undefined),
                            })
                        },
                        variant: 'bulk-action',
                    },
                    { id: 'seperator', variant: 'action-seperator' },
                    {
                        id: 'destroyClusterPools',
                        title: t('bulk.destroy.clusterPools'),
                        click: (clusterPools: ClusterPool[]) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.destroy.clusterPools'),
                                action: t('destroy'),
                                processing: t('destroying'),
                                resources: clusterPools,
                                description: t('bulk.message.destroyClusterPool'),
                                columns: modalColumns,
                                keyFn: mckeyFn,
                                actionFn: deleteResource,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                icon: 'warning',
                                confirmText: t('confirm').toLowerCase(),
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                        variant: 'bulk-action',
                    },
                ]}
                tableActionButtons={props.tableActionButtons}
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
    const { t } = useTranslation()
    const classes = useStyles()
    return (
        <div className={classes.table}>
            <AcmTable<Cluster>
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
                        cell: (cluster) => (
                            <>
                                <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
                                {cluster.hive.clusterClaimName && (
                                    <TextContent>
                                        <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
                                    </TextContent>
                                )}
                            </>
                        ),
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
                            return <span style={{ whiteSpace: 'nowrap' }}>{t(`${isAvailable ? 'Yes' : 'No'}`)}</span>
                        },
                    },
                ]}
            />
        </div>
    )
}
