/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageSection, ActionGroup, Tabs, Tab, TabTitleText, Title } from '@patternfly/react-core'
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
    // AcmAlertContext,
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
                                    ? 'Yes'
                                    : 'No',
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
                />

                <AcmAlertGroup isInline canClose padTop />
                <ActionGroup>
                    {/* <AcmSubmit
                    id="save"
                    variant="primary"
                    label={t('common:save')}
                    processingLabel={t('common:saving')}
                    onClick={() => {
                        alertContext.clearAlerts()
                    }}
                /> */}
                    <AcmButton id="save" variant="primary" onClick={() => setShowConfirmModal(true)}>
                        {t('common:save')}
                    </AcmButton>
                    <AcmButton
                        variant="link"
                        onClick={() =>
                            history.push(NavigationPath.clusterSetOverview.replace(':id', clusterSet?.metadata.name!))
                        }
                    >
                        {t('common:cancel')}
                    </AcmButton>
                </ActionGroup>
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
    const [activeTab, setActiveTab] = useState<number | string>(0)
    return (
        <>
            <div style={{ marginBottom: '12px' }}>{t('manageClusterSet.form.review.description')}</div>
            <Tabs activeKey={activeTab} onSelect={(e, tabIndex) => setActiveTab(tabIndex)} isFilled>
                <Tab eventKey={0} title={<TabTitleText>{t('manageClusterSet.form.modal.tab.added')}</TabTitleText>}>
                    <ClusterSummaryTable clusters={props.addedClusters} />
                </Tab>
                <Tab eventKey={1} title={<TabTitleText>{t('manageClusterSet.form.modal.tab.removed')}</TabTitleText>}>
                    <ClusterSummaryTable clusters={props.removedClusters} />
                </Tab>
                <Tab eventKey={2} title={<TabTitleText>{t('manageClusterSet.form.modal.tab.unchanged')}</TabTitleText>}>
                    <ClusterSummaryTable clusters={props.unchangedClusters} />
                </Tab>
            </Tabs>
        </>
    )
}

function ClusterSummaryTable(props: { clusters: Cluster[] }) {
    const { t } = useTranslation(['cluster', 'common'])
    return (
        <AcmTable<Cluster>
            gridBreakPoint={TableGridBreakpoint.none}
            plural="clusters"
            items={props.clusters}
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
                    cell: (cluster) => (cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-'),
                },
                {
                    header: t('table.distribution'),
                    sort: 'distribution.displayVersion',
                    search: 'distribution.displayVersion',
                    cell: (cluster) => <DistributionField cluster={cluster} />,
                },
            ]}
        />
    )
}
