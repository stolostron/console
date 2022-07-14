/* Copyright Contributors to the Open Cluster Management project */

import {
    Cluster,
    ClusterDeployment,
    ManagedClusterKind,
    managedClusterSetLabel,
    patchResource,
    ResourceErrorCode,
} from '../../../../../../resources'
import {
    AcmAlertGroup,
    AcmButton,
    AcmEmptyState,
    AcmForm,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmTable,
    compareStrings,
    IAcmTableColumn,
} from '../../../../../../ui-components'
import { ActionGroup, PageSection, Title } from '@patternfly/react-core'
import { useContext, useState, useMemo } from 'react'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilState, useRecoilValue } from 'recoil'
import { clusterCuratorsState, managedClusterSetsState, managedClustersState } from '../../../../../../atoms'
import { BulkActionModel, errorIsNot } from '../../../../../../components/BulkActionModel'
import { patchClusterSetLabel } from '../../../../../../lib/patch-cluster'
import { NavigationPath } from '../../../../../../NavigationPath'
import { useCanJoinClusterSets } from '../../components/useCanJoinClusterSets'
import { ClusterSetContext } from '../ClusterSetDetails'
import { useAllClusters } from '../../../ManagedClusters/components/useAllClusters'
import {
    useClusterDistributionColumn,
    useClusterLabelsColumn,
    useClusterNameColumn,
    useClusterNodesColumn,
    useClusterProviderColumn,
} from '../../../ManagedClusters/ManagedClusters'

export function ClusterSetManageResourcesPage() {
    const { t } = useTranslation()
    const { clusterSet } = useContext(ClusterSetContext)
    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    breadcrumb={[
                        { text: t('clusterSets'), to: NavigationPath.clusterSets },
                        {
                            text: clusterSet?.metadata.name!,
                            to: NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!),
                        },
                        { text: t('page.header.cluster-set.manage-assignments'), to: '' },
                    ]}
                    title={t('page.header.cluster-set.manage-assignments')}
                />
            }
        >
            <AcmPageContent id="manage-cluster-set">
                <PageSection variant="light" isFilled={true}>
                    <ClusterSetManageResourcesContent />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

export function ClusterSetManageResourcesContent() {
    const { t } = useTranslation()
    const history = useHistory()
    const { clusterSet, clusterDeployments } = useContext(ClusterSetContext)
    const deploymentDictionary = new Map<string | undefined, ClusterDeployment>()
    clusterDeployments?.forEach((deployment) => deploymentDictionary.set(deployment.metadata.name, deployment))

    const clusters = useAllClusters()
    const [managedClusterSets] = useRecoilValue([managedClustersState, managedClusterSetsState])
    const [clusterCurators] = useRecoilState(clusterCuratorsState)

    const { canJoinClusterSets, isLoading } = useCanJoinClusterSets()
    const canJoinClusterSetList = canJoinClusterSets?.map((clusterSet) => clusterSet.metadata.name)
    const [selectedResources, setSelectedResources] = useState<Cluster[]>(
        [...clusters].filter((resource) => resource.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name)
    )
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

    const availableResources = [...clusters].filter((resource) => {
        const clusterSet = resource.labels?.[managedClusterSetLabel]
        return (
            // check deployment for a clusterpool claim reference, as we cannot change the set of claimed clusters
            deploymentDictionary.get(resource.name)?.spec?.clusterPoolRef?.claimName == undefined &&
            (clusterSet === undefined ||
                canJoinClusterSetList?.includes(clusterSet) ||
                // hack because controller does not remove clusterset labels when a ManagedClusterSet is deleted
                // since we query the rbac list against the actual available ManagedClusterSets
                // the cluster set specified in the label is not among the list
                (!canJoinClusterSetList?.includes(clusterSet) &&
                    !managedClusterSets.find((mcs) => mcs.metadata.name === resource.labels?.[managedClusterSetLabel])))
        )
    })
    const notSelectedResources = availableResources.filter(
        (ar) => selectedResources.find((sr) => sr?.uid === ar?.uid) === undefined
    )
    const removedResources = notSelectedResources.filter(
        (resource) => resource.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name
    )

    const clusterNameColumn = useClusterNameColumn()
    const clusterProviderColumn = useClusterProviderColumn()
    const clusterDistributionColumn = useClusterDistributionColumn(clusterCurators)
    const clusterNodesColumn = useClusterNodesColumn()
    const clusterLabelsColumn = useClusterLabelsColumn()

    const columns = useMemo<IAcmTableColumn<Cluster>[]>(
        () => [
            clusterNameColumn,
            clusterProviderColumn,
            clusterDistributionColumn,
            clusterLabelsColumn,
            clusterNodesColumn,
            {
                header: t('table.assignedToSet'),
                sort: (a: Cluster, b: Cluster) =>
                    compareStrings(a?.labels?.[managedClusterSetLabel], b?.labels?.[managedClusterSetLabel]),
                search: (resource) => resource?.labels?.[managedClusterSetLabel] ?? '-',
                cell: (resource) => resource?.labels?.[managedClusterSetLabel] ?? '-',
            },
        ],
        [
            clusterNameColumn,
            clusterProviderColumn,
            clusterDistributionColumn,
            clusterLabelsColumn,
            clusterNodesColumn,
            t,
        ]
    )

    const columnsModal = useMemo<IAcmTableColumn<Cluster>[]>(
        () => [
            clusterNameColumn,
            {
                header: t('table.assignedToSet'),
                sort: (a: Cluster, b: Cluster) =>
                    compareStrings(a?.labels?.[managedClusterSetLabel], b?.labels?.[managedClusterSetLabel]),
                search: (resource) => resource?.labels?.[managedClusterSetLabel] ?? '-',
                cell: (resource) => resource?.labels?.[managedClusterSetLabel] ?? '-',
            },
            {
                header: t('table.change'),
                cell: (resource) => {
                    if (removedResources.find((removedResource) => removedResource!.uid === resource!.uid)) {
                        return t('managedClusterSet.form.removed')
                    } else if (resource!.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name) {
                        return t('managedClusterSet.form.unchanged')
                    } else {
                        return resource!.labels?.[managedClusterSetLabel] === undefined
                            ? t('managedClusterSet.form.added')
                            : t('managedClusterSet.form.transferred')
                    }
                },
            },
        ],
        [clusterNameColumn, clusterSet, removedResources, t]
    )

    return (
        <>
            <AcmForm>
                <Title headingLevel="h4" size="xl">
                    {t('manageClusterSet.form.section.table')}
                </Title>

                <div>{t('manageClusterSet.form.section.table.description')}</div>
                <div>
                    <Trans
                        i18nKey={'manageClusterSet.form.section.table.description.second'}
                        components={{ bold: <strong />, p: <p /> }}
                    />
                </div>
                <AcmTable<Cluster>
                    plural="resources"
                    items={isLoading ? undefined : availableResources}
                    initialSelectedItems={selectedResources}
                    onSelect={(resources: Cluster[]) => setSelectedResources(resources)}
                    keyFn={(resource: Cluster) => resource?.uid!}
                    key="clusterSetManageClustersTable"
                    columns={columns}
                    emptyState={
                        <AcmEmptyState
                            key="mcEmptyState"
                            title={t('createClusterSet.form.section.clusters.emptyTitle')}
                            message={t('createClusterSet.form.section.clusters.emptyMessage')}
                            action={
                                <AcmButton onClick={() => history.push(NavigationPath.clusterSets)} role="link">
                                    {t('managedClusterSet.form.emptyStateButton')}
                                </AcmButton>
                            }
                        />
                    }
                />

                <AcmAlertGroup isInline canClose />
                {availableResources.length > 0 && (
                    <ActionGroup>
                        <AcmButton id="save" variant="primary" onClick={() => setShowConfirmModal(true)}>
                            {t('review')}
                        </AcmButton>
                        <AcmButton
                            variant="link"
                            onClick={() =>
                                history.push(
                                    NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!)
                                )
                            }
                        >
                            {t('cancel')}
                        </AcmButton>
                    </ActionGroup>
                )}
            </AcmForm>
            <BulkActionModel<Cluster>
                open={showConfirmModal}
                title={t('manageClusterSet.form.modal.title')}
                action={t('save')}
                processing={t('saving')}
                onCancel={() => setShowConfirmModal(false)}
                close={() => history.push(NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!))}
                isValidError={errorIsNot([ResourceErrorCode.NotFound])}
                resources={[...removedResources, ...selectedResources]}
                hideTableAfterSubmit={true}
                description={
                    <div style={{ marginBottom: '12px' }}>{t('manageClusterSet.form.review.description')}</div>
                }
                columns={columnsModal}
                keyFn={(item) => item.uid!}
                actionFn={(resource: Cluster) => {
                    // return dummy promise if the resource is not changed
                    if (
                        selectedResources.find((sr) => sr.uid === resource.uid) &&
                        resource.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name!
                    ) {
                        return { promise: new Promise((resolve) => resolve(undefined)), abort: () => {} }
                    }

                    const isSelected = selectedResources.find(
                        (selectedResource) => selectedResource.uid === resource.uid
                    )
                    const isRemoved = removedResources.find((removedResource) => removedResource.uid === resource.uid)
                    let op: 'remove' | 'replace' | 'add' = 'remove'
                    if (isRemoved) op = 'remove'
                    if (isSelected) {
                        op = resource.labels?.[managedClusterSetLabel] === undefined ? 'add' : 'replace'
                    }

                    if (resource?.managedCluster?.kind === ManagedClusterKind) {
                        return patchClusterSetLabel(resource.name!, op, clusterSet!.metadata.name)
                    } else if (resource?.managedCluster) {
                        return patchResource(resource?.managedCluster, [
                            {
                                op,
                                path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
                                value: clusterSet?.metadata.name,
                            },
                        ])
                    } else {
                        return {
                            promise: Promise.resolve(),
                            abort: () => {},
                        }
                    }
                }}
            />
        </>
    )
}
