/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRecoilValue, waitForAll } from 'recoil'
import { PageSection, ActionGroup, Title } from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
import {
    AcmPage,
    AcmPageHeader,
    AcmPageContent,
    AcmForm,
    AcmTable,
    AcmButton,
    AcmAlertGroup,
    AcmEmptyState,
    compareStrings,
} from '@open-cluster-management/ui-components'
import { ClusterSetContext } from '../ClusterSetDetails'
import { NavigationPath } from '../../../../../NavigationPath'
import { BulkActionModel, errorIsNot } from '../../../../../components/BulkActionModel'
import { useCanJoinClusterSets } from '../../components/useCanJoinClusterSets'
import { patchClusterSetLabel } from '../../../../../lib/patch-cluster'
import { patchResource, ResourceErrorCode } from '../../../../../lib/resource-request'
import { IResource } from '../../../../../resources/resource'
import { ManagedClusterKind } from '../../../../../resources/managed-cluster'
import { managedClusterSetLabel } from '../../../../../resources/managed-cluster-set'
import { managedClustersState, clusterPoolsState } from '../../../../../atoms'

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
                    { text: t('page.header.cluster-set.manage-assignments'), to: '' },
                ]}
                title={t('page.header.cluster-set.manage-assignments')}
            />
            <AcmPageContent id="manage-cluster-set">
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
    const { clusterSet } = useContext(ClusterSetContext)
    const [managedClusters, clusterPools] = useRecoilValue(waitForAll([managedClustersState, clusterPoolsState]))
    const { canJoinClusterSets, isLoading } = useCanJoinClusterSets()
    const canJoinClusterSetList = canJoinClusterSets?.map((clusterSet) => clusterSet.metadata.name)
    const [selectedResources, setSelectedResources] = useState<IResource[]>([])
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

    useEffect(() => {
        if (canJoinClusterSets !== undefined) {
            setSelectedResources(
                [...managedClusters, ...clusterPools].filter(
                    (resource) => resource.metadata.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name
                )
            )
        }
    }, [canJoinClusterSets, managedClusters, clusterPools, clusterSet?.metadata.name])

    const availableResources = [...managedClusters, ...clusterPools].filter((resource) => {
        const clusterSet = resource.metadata.labels?.[managedClusterSetLabel]
        return clusterSet === undefined || canJoinClusterSetList?.includes(clusterSet)
    })

    const notSelectedResources = availableResources.filter(
        (ar) => selectedResources.find((sr) => sr.metadata!.uid === ar.metadata!.uid) === undefined
    )
    const removedResources = notSelectedResources.filter(
        (resource) => resource.metadata!.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name
    )

    return (
        <>
            <AcmForm>
                <Title headingLevel="h4" size="xl">
                    {t('manageClusterSet.form.section.table')}
                </Title>
                <div>{t('manageClusterSet.form.section.table.description')}</div>
                <AcmTable<IResource>
                    gridBreakPoint={TableGridBreakpoint.none}
                    plural="resources"
                    items={isLoading ? undefined : availableResources}
                    initialSelectedItems={selectedResources}
                    onSelect={(resources: IResource[]) => setSelectedResources(resources)}
                    keyFn={(resource: IResource) => resource.metadata!.uid!}
                    key="clusterSetManageClustersTable"
                    columns={[
                        {
                            header: t('table.name'),
                            sort: 'name',
                            search: 'name',
                            cell: (resource: IResource) => (
                                <span style={{ whiteSpace: 'nowrap' }}>{resource.metadata!.name}</span>
                            ),
                        },
                        {
                            header: t('table.kind'),
                            sort: 'kind',
                            search: 'kind',
                            cell: (resource: IResource) => resource.kind,
                        },
                        {
                            header: t('table.assignedToSet'),
                            sort: (a: IResource, b: IResource) =>
                                compareStrings(
                                    a?.metadata!.labels?.[managedClusterSetLabel],
                                    b?.metadata!.labels?.[managedClusterSetLabel]
                                ),
                            search: (resource) => resource?.metadata!.labels?.[managedClusterSetLabel] ?? '-',
                            cell: (resource) => resource?.metadata!.labels?.[managedClusterSetLabel] ?? '-',
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
                {availableResources.length > 0 && (
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
            <BulkActionModel<IResource>
                open={showConfirmModal}
                title={t('manageClusterSet.form.modal.title')}
                action={t('common:save')}
                processing={t('common:saving')}
                onCancel={() => setShowConfirmModal(false)}
                close={() => history.push(NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!))}
                isValidError={errorIsNot([ResourceErrorCode.NotFound])}
                resources={[
                    ...removedResources,
                    ...selectedResources.filter(
                        (sr) => sr.metadata!.labels?.[managedClusterSetLabel] !== clusterSet?.metadata.name
                    ),
                ]}
                actionFn={(resource: IResource) => {
                    const isSelected = selectedResources.find(
                        (selectedResource) => selectedResource.metadata!.uid === resource.metadata!.uid
                    )
                    const isRemoved = removedResources.find(
                        (removedResource) => removedResource.metadata!.uid === resource.metadata!.uid
                    )
                    let op: 'remove' | 'replace' | 'add' = 'remove'
                    if (isRemoved) op = 'remove'
                    if (isSelected) {
                        op = resource.metadata!.labels?.[managedClusterSetLabel] === undefined ? 'add' : 'replace'
                    }

                    if (resource.kind === ManagedClusterKind) {
                        return patchClusterSetLabel(resource.metadata!.name!, op, clusterSet!.metadata.name)
                    } else {
                        return patchResource(resource, [{ op, path: `/metadata/labels/${managedClusterSetLabel}` }])
                    }
                }}
                description={
                    <>
                        <div style={{ marginBottom: '12px' }}>{t('manageClusterSet.form.review.description')}</div>
                        <AcmTable<IResource>
                            gridBreakPoint={TableGridBreakpoint.none}
                            plural="clusters"
                            items={[...selectedResources, ...removedResources]}
                            keyFn={(resource: IResource) => resource.metadata!.uid!}
                            key="clusterSetManageClustersTable"
                            autoHidePagination
                            columns={[
                                {
                                    header: t('table.name'),
                                    sort: 'metadata.name',
                                    search: 'metadata.name',
                                    cell: (resource) => (
                                        <span style={{ whiteSpace: 'nowrap' }}>{resource.metadata!.name}</span>
                                    ),
                                },
                                {
                                    header: t('table.kind'),
                                    sort: 'kind',
                                    search: 'kind',
                                    cell: (resource: IResource) => resource.kind,
                                },
                                {
                                    header: t('table.change'),
                                    cell: (resource) => {
                                        const isSelected = selectedResources.find(
                                            (selectedResource) =>
                                                selectedResource.metadata!.uid === resource.metadata!.uid
                                        )
                                        const isRemoved = removedResources.find(
                                            (removedResource) =>
                                                removedResource.metadata!.uid === resource.metadata!.uid
                                        )
                                        if (isSelected) {
                                            return resource.metadata!.labels?.[managedClusterSetLabel] === undefined
                                                ? t('managedClusterSet.form.added')
                                                : t('managedClusterSet.form.transferred')
                                        } else if (isRemoved) {
                                            return t('managedClusterSet.form.removed')
                                        } else {
                                            return t('managedClusterSet.form.unchanged')
                                        }
                                    },
                                },
                                {
                                    header: t('table.assignedToSet'),
                                    sort: (a: IResource, b: IResource) =>
                                        compareStrings(
                                            a?.metadata!.labels?.[managedClusterSetLabel],
                                            b?.metadata!.labels?.[managedClusterSetLabel]
                                        ),
                                    search: (resource) => resource?.metadata!.labels?.[managedClusterSetLabel] ?? '-',
                                    cell: (resource) => resource?.metadata!.labels?.[managedClusterSetLabel] ?? '-',
                                },
                            ]}
                        />
                    </>
                }
            />
        </>
    )
}
