/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageSection, ActionGroup, Title } from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import {
    AcmPage,
    AcmPageHeader,
    AcmPageContent,
    AcmForm,
    AcmTable,
    AcmInlineProvider,
    AcmButton,
    AcmAlertGroup,
    AcmEmptyState,
} from '@open-cluster-management/ui-components'
import { ClusterSetContext } from '../ClusterSetDetails'
import { NavigationPath } from '../../../../../NavigationPath'
import { Cluster } from '../../../../../lib/get-cluster'
import { StatusField } from '../../../Clusters/components/StatusField'
import { DistributionField } from '../../../Clusters/components/DistributionField'
import { useAllClusters } from '../../../Clusters/components/useAllClusters'
import { BulkActionModel } from '../../../../../components/BulkActionModel'
import { useCanJoinClusterSets } from '../../components/useCanJoinClusterSets'
import { patchClusterSetLabel } from '../../../../../lib/patch-cluster'

export function ClusterSetManageClustersPage() {
    const { t } = useTranslation(['cluster'])
    const { clusterSet } = useContext(ClusterSetContext)
    return (
        <AcmPage hasDrawer>
            <AcmPageHeader
                breadcrumb={[
                    { text: t('clusterSets'), to: NavigationPath.clusterSets },
                    {
                        text: clusterSet?.metadata.name!,
                        to: NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!),
                    },
                    { text: t('page.header.cluster-set.manage-clusters'), to: '' },
                ]}
                title={t('page.header.cluster-set.manage-clusters')}
            />
            <AcmPageContent id="create-cluster-set">
                <PageSection variant="light" isFilled={true}>
                    <ClusterSetManageClustersContent />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

export function ClusterSetManageClustersContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const history = useHistory()
    // const alertContext = useContext(AcmAlertContext)
    const allClusters = useAllClusters()
    const { canJoinClusterSets, isLoading } = useCanJoinClusterSets()
    const canJoinClusterSetList = canJoinClusterSets?.map((clusterSet) => clusterSet.metadata.name)
    const { clusterSet, clusters } = useContext(ClusterSetContext)
    const [clusterSetClusters] = useState<Cluster[]>(clusters ?? [])
    const [selectedClusters, setSelectedClusters] = useState<Cluster[]>(clusterSetClusters!)
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

    useEffect(() => {
        if (canJoinClusterSets !== undefined) {
            setSelectedClusters(clusters ?? [])
        }
    }, [canJoinClusterSets, clusters])

    const availableClusters = allClusters.filter((cluster) => {
        return cluster?.clusterSet === undefined || canJoinClusterSetList?.includes(cluster?.clusterSet)
    })

    const unchangedClusters = selectedClusters.filter((selectedCluster) =>
        clusterSetClusters?.find((clusterSetCluster) => clusterSetCluster.name === selectedCluster.name)
    )
    const addedClusters = selectedClusters.filter(
        (selectedCluster) =>
            clusterSetClusters?.find((clusterSetCluster) => clusterSetCluster.name === selectedCluster.name) ===
            undefined
    )
    const removedClusters =
        clusterSetClusters?.filter(
            (clusterSetCluster) =>
                selectedClusters.find((selectedCluster) => selectedCluster.name === clusterSetCluster.name) ===
                undefined
        ) ?? []

    const transferredClusters = selectedClusters?.filter(
        (selectedCluster) =>
            selectedCluster?.clusterSet !== undefined && selectedCluster?.clusterSet !== clusterSet?.metadata.name
    )

    return (
        <>
            {/* TODO: Convert modal to page in Wizard */}
            <BulkActionModel<Cluster>
                open={showConfirmModal}
                title={t('manageClusterSet.form.modal.title')}
                action={t('common:save')}
                processing={t('common:saving')}
                resources={[...addedClusters, ...removedClusters]}
                description={
                    <ManageClustersSummary
                        addedClusters={addedClusters}
                        removedClusters={removedClusters}
                        unchangedClusters={unchangedClusters}
                        transferredClusters={transferredClusters}
                    />
                }
                onCancel={() => setShowConfirmModal(false)}
                close={() => history.push(NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!))}
                actionFn={(cluster: Cluster) => {
                    const isTransferred = transferredClusters.find(
                        (transferredCluster) => transferredCluster.name === cluster.name
                    )
                    const isAdded = addedClusters.find((addedCluster) => addedCluster.name === cluster.name)
                    let op: 'remove' | 'replace' | 'add' = 'remove'
                    if (isAdded) op = 'add'
                    if (isTransferred) op = 'replace'
                    return patchClusterSetLabel(cluster.name!, op, clusterSet!.metadata.name!)
                }}
            />
            <AcmForm>
                <Title headingLevel="h4" size="xl">
                    {t('manageClusterSet.form.section.table')}
                </Title>
                <div>{t('manageClusterSet.form.section.table.description')}</div>
                <AcmTable<Cluster>
                    gridBreakPoint={TableGridBreakpoint.none}
                    plural="clusters"
                    items={isLoading ? undefined : availableClusters}
                    initialSelectedItems={clusterSetClusters}
                    onSelect={(clusters: Cluster[]) => setSelectedClusters(clusters)}
                    keyFn={(cluster: Cluster) => cluster.name!}
                    key="clusterSetManageClustersTable"
                    columns={[
                        {
                            header: t('table.name'),
                            sort: 'displayName',
                            search: 'displayName',
                            cell: (cluster) => <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>,
                        },
                        {
                            header: t('table.assignedToSet'),
                            cell: (cluster) => cluster?.clusterSet ?? '-',
                        },
                        {
                            header: t('table.status'),
                            sort: 'status',
                            search: 'status',
                            cell: (cluster) => (
                                <span style={{ whiteSpace: 'nowrap' }}>
                                    <StatusField cluster={cluster} />
                                </span>
                            ),
                        },
                        {
                            header: t('table.provider'),
                            sort: 'provider',
                            search: 'provider',
                            cell: (cluster) =>
                                cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
                        },
                        {
                            header: t('table.distribution'),
                            sort: 'distribution.displayVersion',
                            search: 'distribution.displayVersion',
                            cell: (cluster) => <DistributionField cluster={cluster} />,
                        },
                    ]}
                    emptyState={
                        <AcmEmptyState
                            key="mcEmptyState"
                            title={t('managed.emptyStateHeader')}
                            message={t('createClusterSet.form.section.clusters.emptyMessage')}
                            action={
                                <AcmButton onClick={() => history.push(NavigationPath.clusterSets)} role="link">
                                    {t('managedClusterSet.form.emptyStateButton')}
                                </AcmButton>
                            }
                        />
                    }
                />

                <AcmAlertGroup isInline canClose padTop />
                {availableClusters.length > 0 && (
                    <ActionGroup>
                        <AcmButton id="save" variant="primary" onClick={() => setShowConfirmModal(true)}>
                            {t('common:save')}
                        </AcmButton>
                        <AcmButton
                            variant="link"
                            onClick={() =>
                                history.push(
                                    NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!)
                                )
                            }
                        >
                            {t('common:cancel')}
                        </AcmButton>
                    </ActionGroup>
                )}
            </AcmForm>
        </>
    )
}

function ManageClustersSummary(props: {
    addedClusters: Cluster[]
    removedClusters: Cluster[]
    unchangedClusters: Cluster[]
    transferredClusters: Cluster[]
}) {
    const { t } = useTranslation(['cluster'])
    return (
        <>
            <div style={{ marginBottom: '12px' }}>{t('manageClusterSet.form.review.description')}</div>
            <AcmTable<Cluster>
                gridBreakPoint={TableGridBreakpoint.none}
                plural="clusters"
                items={[...props.addedClusters, ...props.removedClusters, ...props.unchangedClusters]}
                keyFn={(cluster: Cluster) => cluster.name!}
                key="clusterSetManageClustersTable"
                autoHidePagination
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'name',
                        search: 'name',
                        cell: (cluster) => <span style={{ whiteSpace: 'nowrap' }}>{cluster.name}</span>,
                    },
                    {
                        header: t('table.change'),
                        cell: (cluster) => {
                            const isAdded = props.addedClusters.find(
                                (addedCluster) => addedCluster.name === cluster.name
                            )
                            const isRemoved = props.removedClusters.find(
                                (removedCluster) => removedCluster.name === cluster.name
                            )
                            const isTransferred = props.transferredClusters.find(
                                (transferredCluster) => transferredCluster.name === cluster.name
                            )
                            if (isTransferred) {
                                return t('managedClusterSet.form.transferred')
                            } else if (isRemoved) {
                                return t('managedClusterSet.form.removed')
                            } else if (isAdded) {
                                return t('managedClusterSet.form.added')
                            } else {
                                return t('managedClusterSet.form.unchanged')
                            }
                        },
                    },
                    {
                        header: t('table.assignedToSet'),
                        cell: (cluster) => cluster?.clusterSet ?? '-',
                    },
                ]}
            />
        </>
    )
}
