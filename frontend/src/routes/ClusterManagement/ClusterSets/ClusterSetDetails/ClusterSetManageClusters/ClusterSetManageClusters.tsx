/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useState } from 'react'
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
import { ManagedCluster, ManagedClusterDefinition } from '../../../../../resources/managed-cluster'
import { managedClusterSetLabel } from '../../../../../resources/managed-cluster-set'
import { patchResource } from '../../../../../lib/resource-request'
import { StatusField } from '../../../Clusters/components/StatusField'
import { DistributionField } from '../../../Clusters/components/DistributionField'
import { useAllClusters } from '../../../Clusters/components/useAllClusters'
import { BulkActionModel } from '../../../../../components/BulkActionModel'

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
    const { clusterSet, clusters } = useContext(ClusterSetContext)
    const [clusterSetClusters] = useState<Cluster[]>(clusters ?? [])
    const [selectedClusters, setSelectedClusters] = useState<Cluster[]>(clusterSetClusters!)
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

    const availableClusters = allClusters.filter((cluster) => {
        return (
            cluster.isManaged &&
            (cluster.labels?.[managedClusterSetLabel] === undefined ||
                cluster.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name!)
        )
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
                    />
                }
                onCancel={() => setShowConfirmModal(false)}
                close={() => history.push(NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!))}
                actionFn={(cluster: Cluster) => {
                    const isAdded = addedClusters.find((addedCluster) => addedCluster.name === cluster.name)
                    return patchResource(
                        {
                            apiVersion: ManagedClusterDefinition.apiVersion,
                            kind: ManagedClusterDefinition.kind,
                            metadata: {
                                name: cluster.name!,
                            },
                        } as ManagedCluster,
                        [
                            {
                                op: isAdded ? 'add' : 'remove',
                                path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
                                value: isAdded ? clusterSet!.metadata.name! : undefined,
                            },
                        ]
                    )
                }}
            />
            <AcmForm>
                <Title headingLevel="h4" size="xl">
                    {t('manageClusterSet.form.section.table')}
                </Title>
                <div>
                    Clusters already assigned to the cluster set and any currently unassigned clusters will be
                    displayed.
                </div>
                <AcmTable<Cluster>
                    gridBreakPoint={TableGridBreakpoint.none}
                    plural="clusters"
                    items={availableClusters}
                    initialSelectedItems={clusterSetClusters}
                    onSelect={(clusters: Cluster[]) => setSelectedClusters(clusters)}
                    keyFn={(cluster: Cluster) => cluster.name!}
                    key="clusterSetManageClustersTable"
                    columns={[
                        {
                            header: t('table.name'),
                            sort: 'name',
                            search: 'name',
                            cell: (cluster) => <span style={{ whiteSpace: 'nowrap' }}>{cluster.name}</span>,
                        },
                        {
                            header: t('table.assignedToSet'),
                            cell: (cluster) =>
                                clusterSetClusters?.find((clusterSetCluster) => clusterSetCluster.name === cluster.name)
                                    ? t('managedClusterSet.form.assigned')
                                    : t('managedClusterSet.form.unassigned'),
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
                            if (isAdded) {
                                return t('managedClusterSet.form.added')
                            } else if (isRemoved) {
                                return t('managedClusterSet.form.removed')
                            } else {
                                return t('managedClusterSet.form.unchanged')
                            }
                        },
                    },
                ]}
            />
        </>
    )
}
