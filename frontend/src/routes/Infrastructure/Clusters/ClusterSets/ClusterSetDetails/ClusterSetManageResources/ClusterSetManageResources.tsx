/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterDeployment,
    ManagedCluster,
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
} from '@stolostron/ui-components'
import { ActionGroup, PageSection, Title } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import { managedClusterSetsState, managedClustersState } from '../../../../../../atoms'
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

    const [managedClusters, managedClusterSets] = useRecoilValue(
        waitForAll([managedClustersState, managedClusterSetsState])
    )
    const { canJoinClusterSets, isLoading } = useCanJoinClusterSets()
    const canJoinClusterSetList = canJoinClusterSets?.map((clusterSet) => clusterSet.metadata.name)
    const [selectedResources, setSelectedResources] = useState<ManagedCluster[]>(
        [...managedClusters].filter(
            (resource) => resource.metadata.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name
        )
    )
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

    const availableResources = [...managedClusters].filter((resource) => {
        const clusterSet = resource.metadata.labels?.[managedClusterSetLabel]
        return (
            // check deployment for a clusterpool claim reference, as we cannot change the set of claimed clusters
            deploymentDictionary.get(resource.metadata.name)?.spec?.clusterPoolRef?.claimName == undefined &&
            (clusterSet === undefined ||
                canJoinClusterSetList?.includes(clusterSet) ||
                // hack because controller does not remove clusterset labels when a ManagedClusterSet is deleted
                // since we query the rbac list against the actual available ManagedClusterSets
                // the cluster set specified in the label is not among the list
                (!canJoinClusterSetList?.includes(clusterSet) &&
                    !managedClusterSets.find(
                        (mcs) => mcs.metadata.name === resource.metadata.labels?.[managedClusterSetLabel]
                    )))
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
                    {t('manageClusterSet.form.section.table')}
                </Title>

                <div>{t('manageClusterSet.form.section.table.description')}</div>
                <div>
                    <Trans
                        i18nKey={'manageClusterSet.form.section.table.description.second'}
                        components={{ bold: <strong />, p: <p /> }}
                    />
                </div>
                <AcmTable<ManagedCluster>
                    plural="resources"
                    items={isLoading ? undefined : availableResources}
                    initialSelectedItems={selectedResources}
                    onSelect={(resources: ManagedCluster[]) => setSelectedResources(resources)}
                    keyFn={(resource: ManagedCluster) => resource.metadata!.uid!}
                    key="clusterSetManageClustersTable"
                    columns={[
                        {
                            header: t('table.name'),
                            sort: 'metadata.name',
                            search: 'metadata.name',
                            cell: (resource: ManagedCluster) => (
                                <span style={{ whiteSpace: 'nowrap' }}>{resource.metadata!.name}</span>
                            ),
                        },
                        {
                            header: t('table.kind'),
                            sort: 'kind',
                            search: 'kind',
                            cell: (resource: ManagedCluster) => resource.kind,
                        },
                        {
                            header: t('table.assignedToSet'),
                            sort: (a: ManagedCluster, b: ManagedCluster) =>
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
            <BulkActionModel<ManagedCluster>
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
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'metadata.name',
                        cell: (resource) => <span style={{ whiteSpace: 'nowrap' }}>{resource.metadata!.name}</span>,
                    },
                    {
                        header: t('table.kind'),
                        sort: 'kind',
                        cell: (resource: ManagedCluster) => resource.kind,
                    },
                    {
                        header: t('table.change'),
                        cell: (resource) => {
                            if (
                                removedResources.find(
                                    (removedResource) => removedResource.metadata!.uid === resource.metadata!.uid
                                )
                            ) {
                                return t('managedClusterSet.form.removed')
                            } else if (
                                resource.metadata!.labels?.[managedClusterSetLabel] === clusterSet?.metadata.name
                            ) {
                                return t('managedClusterSet.form.unchanged')
                            } else {
                                return resource.metadata!.labels?.[managedClusterSetLabel] === undefined
                                    ? t('managedClusterSet.form.added')
                                    : t('managedClusterSet.form.transferred')
                            }
                        },
                    },
                    {
                        header: t('table.assignedToSet'),
                        sort: (a: ManagedCluster, b: ManagedCluster) =>
                            compareStrings(
                                a?.metadata!.labels?.[managedClusterSetLabel],
                                b?.metadata!.labels?.[managedClusterSetLabel]
                            ),
                        cell: (resource) => resource?.metadata!.labels?.[managedClusterSetLabel] ?? '-',
                    },
                ]}
                keyFn={(item) => item.metadata!.uid!}
                actionFn={(resource: ManagedCluster) => {
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
