/* Copyright Contributors to the Open Cluster Management project */

import {
    IResource,
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
} from '@open-cluster-management/ui-components'
import { ActionGroup, PageSection, Title } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import { clusterPoolsState, managedClusterSetsState, managedClustersState } from '../../../../../../atoms'
import { BulkActionModel, errorIsNot } from '../../../../../../components/BulkActionModel'
import { patchClusterSetLabel } from '../../../../../../lib/patch-cluster'
import { NavigationPath } from '../../../../../../NavigationPath'
import { useCanJoinClusterSets } from '../../components/useCanJoinClusterSets'
import { ClusterSetContext } from '../ClusterSetDetails'

export function ClusterSetManageResourcesPage() {
    const { t } = useTranslation()
    const { clusterSet } = useContext(ClusterSetContext)
    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    breadcrumb={[
                        { text: t('Cluster sets'), to: NavigationPath.clusterSets },
                        {
                            text: clusterSet?.metadata.name!,
                            to: NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!),
                        },
                        { text: t('Manage resource assignments'), to: '' },
                    ]}
                    title={t('Manage resource assignments')}
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
    const { clusterSet } = useContext(ClusterSetContext)
    const [managedClusters, clusterPools, managedClusterSets] = useRecoilValue(
        waitForAll([managedClustersState, clusterPoolsState, managedClusterSetsState])
    )
    const { canJoinClusterSets, isLoading } = useCanJoinClusterSets()
    const canJoinClusterSetList = canJoinClusterSets?.map((clusterSet) => clusterSet.metadata.name)
    const [selectedResources, setSelectedResources] = useState<IResource[]>(
        [...managedClusters, ...clusterPools].filter(
            (resource) => resource.metadata.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name
        )
    )
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

    const availableResources = [...managedClusters, ...clusterPools].filter((resource) => {
        const clusterSet = resource.metadata.labels?.[managedClusterSetLabel]
        return (
            clusterSet === undefined ||
            canJoinClusterSetList?.includes(clusterSet) ||
            // hack because controller does not remove clusterset labels when a ManagedClusterSet is deleted
            // since we query the rbac list against the actual available ManagedClusterSets
            // the cluster set specified in the label is not among the list
            (!canJoinClusterSetList?.includes(clusterSet) &&
                !managedClusterSets.find(
                    (mcs) => mcs.metadata.name === resource.metadata.labels?.[managedClusterSetLabel]
                ))
        )
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
                    {t('Select resources to toggle their assignments to the cluster set')}
                </Title>

                <div>
                    {t(
                        'Resources can be added, removed, and transferred from other cluster sets (if you have permissions to remove from them from their assigned set).'
                    )}
                </div>
                <div>
                    <Trans
                        i18nKey={
                            "<bold>Important:</bold> assigning a resource to the cluster set will give all cluster set users permissions to the resource's namespace."
                        }
                        components={{ bold: <strong />, p: <p /> }}
                    />
                </div>
                <AcmTable<IResource>
                    plural="resources"
                    items={isLoading ? undefined : availableResources}
                    initialSelectedItems={selectedResources}
                    onSelect={(resources: IResource[]) => setSelectedResources(resources)}
                    keyFn={(resource: IResource) => resource.metadata!.uid!}
                    key="clusterSetManageClustersTable"
                    columns={[
                        {
                            header: t('Name'),
                            sort: 'metadata.name',
                            search: 'metadata.name',
                            cell: (resource: IResource) => (
                                <span style={{ whiteSpace: 'nowrap' }}>{resource.metadata!.name}</span>
                            ),
                        },
                        {
                            header: t('Kind'),
                            sort: 'kind',
                            search: 'kind',
                            cell: (resource: IResource) => resource.kind,
                        },
                        {
                            header: t('Current cluster set'),
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
                            title={t('No assignable resources found')}
                            message={t(
                                "You don't have any clusters or cluster pools available to assign to this cluster set."
                            )}
                            action={
                                <AcmButton onClick={() => history.push(NavigationPath.clusterSets)} role="link">
                                    {t('Back to cluster sets')}
                                </AcmButton>
                            }
                        />
                    }
                />

                <AcmAlertGroup isInline canClose />
                {availableResources.length > 0 && (
                    <ActionGroup>
                        <AcmButton id="save" variant="primary" onClick={() => setShowConfirmModal(true)}>
                            {t('Review')}
                        </AcmButton>
                        <AcmButton
                            variant="link"
                            onClick={() =>
                                history.push(
                                    NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!)
                                )
                            }
                        >
                            {t('Cancel')}
                        </AcmButton>
                    </ActionGroup>
                )}
            </AcmForm>
            <BulkActionModel<IResource>
                open={showConfirmModal}
                title={t('Confirm changes')}
                action={t('Save')}
                processing={t('Saving')}
                onCancel={() => setShowConfirmModal(false)}
                close={() => history.push(NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!))}
                isValidError={errorIsNot([ResourceErrorCode.NotFound])}
                resources={[...removedResources, ...selectedResources]}
                hideTableAfterSubmit={true}
                description={
                    <div style={{ marginBottom: '12px' }}>
                        {t(
                            'Adding or removing resources from a cluster will affect access control permissions in this set for all assigned cluster set users. The clusters can be added or removed to the cluster set at any time.'
                        )}
                    </div>
                }
                columns={[
                    {
                        header: t('Name'),
                        sort: 'metadata.name',
                        cell: (resource) => <span style={{ whiteSpace: 'nowrap' }}>{resource.metadata!.name}</span>,
                    },
                    {
                        header: t('Kind'),
                        sort: 'kind',
                        cell: (resource: IResource) => resource.kind,
                    },
                    {
                        header: t('Change'),
                        cell: (resource) => {
                            if (
                                removedResources.find(
                                    (removedResource) => removedResource.metadata!.uid === resource.metadata!.uid
                                )
                            ) {
                                return t('Removed')
                            } else if (
                                resource.metadata!.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name
                            ) {
                                return t('No change')
                            } else {
                                return resource.metadata!.labels?.[managedClusterSetLabel] === undefined
                                    ? t('Added')
                                    : t('Transferred')
                            }
                        },
                    },
                    {
                        header: t('Current cluster set'),
                        sort: (a: IResource, b: IResource) =>
                            compareStrings(
                                a?.metadata!.labels?.[managedClusterSetLabel],
                                b?.metadata!.labels?.[managedClusterSetLabel]
                            ),
                        cell: (resource) => resource?.metadata!.labels?.[managedClusterSetLabel] ?? '-',
                    },
                ]}
                keyFn={(item) => item.metadata!.uid!}
                actionFn={(resource: IResource) => {
                    // return dummy promise if the resource is not changed
                    if (
                        selectedResources.find((sr) => sr.metadata!.uid === resource.metadata!.uid) &&
                        resource.metadata!.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name!
                    ) {
                        return { promise: new Promise((resolve) => resolve(undefined)), abort: () => {} }
                    }

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
                        return patchResource(resource, [
                            {
                                op,
                                path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
                                value: clusterSet?.metadata.name,
                            },
                        ])
                    }
                }}
            />
        </>
    )
}
