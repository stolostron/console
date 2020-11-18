import {
    AcmEmptyState,
    AcmLabels,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core'
import CaretDownIcon from '@patternfly/react-icons/dist/js/icons/caret-down-icon'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { deleteResource } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { listManagedClusters, ManagedCluster } from '../../../resources/managed-cluster'
import { usePageContext } from '../../ClusterManagement/ClusterManagement'

const managedClusterCols: IAcmTableColumn<ManagedCluster>[] = [
    {
        header: 'Name',
        sort: 'metadata.name',
        search: 'metadata.name',
        cell: (managedCluster) => (
            <Link to={NavigationPath.clusterDetails.replace(':id', managedCluster.metadata.name as string)}>
                {managedCluster.metadata.name}
            </Link>
        ),
    },
    {
        header: 'Status',
        sort: 'displayStatus',
        search: 'displayStatus',
        cell: (managedCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="2">
                -
                {/* {managedCluster.displayStatus === 'Ready' ? (
                    <CheckIcon color="green" key="ready-icon" />
                ) : (
                    <Fragment key="ready-icon"></Fragment>
                )}
                {managedCluster.displayStatus === 'Pending import' ? (
                    <MinusCircleIcon color="grey" key="pending-icon" />
                ) : (
                    <Fragment key="pending-icon"></Fragment>
                )}
                {managedCluster.displayStatus === 'Offline' ? (
                    <ExclamationIcon color="red" key="offline-icon" />
                ) : (
                    <Fragment key="offline-icon"></Fragment>
                )}
                <span key="status">&nbsp; {managedCluster.displayStatus}</span> */}
            </span>
        ),
    },
    {
        header: 'Distribution',
        sort: 'status.version.kubernetes',
        search: 'status.version.kubernetes',
        cell: 'status.version.kubernetes',
    },
    {
        header: 'Labels',
        search: 'metadata.labels',
        cell: (managedCluster) => <AcmLabels labels={managedCluster.metadata.labels} />,
    },
    {
        header: 'Nodes',
        // sort: 'info.status.nodeList.length',
        cell: (managedCluster) => <div>-</div>,
    },
]

export default function ClustersPage() {
    return <ClustersPageContent />
}

const ClusterActions = () => {
    const [open, setOpen] = useState<boolean>(false)
    const { push } = useHistory()
    const { t } = useTranslation(['cluster'])
    return (
        <Dropdown
            isOpen={open}
            toggle={
                <DropdownToggle
                    onToggle={() => setOpen(!open)}
                    toggleIndicator={CaretDownIcon}
                    isPrimary
                    id="cluster-actions"
                >
                    {t('managed.addCluster')}
                </DropdownToggle>
            }
            dropdownItems={[
                <DropdownItem
                    key="create"
                    component={Link}
                    onClick={() => push(NavigationPath.createCluster)}
                    id="create-cluster"
                >
                    {t('managed.createCluster')}
                </DropdownItem>,
                <DropdownItem
                    key="import"
                    component={Link}
                    onClick={() => push(NavigationPath.importCluster)}
                    id="import-cluster"
                >
                    {t('managed.importCluster')}
                </DropdownItem>,
            ]}
        />
    )
}

export function ClustersPageContent() {
    const { data, startPolling, refresh } = useQuery(listManagedClusters)
    useEffect(startPolling, [startPolling])
    usePageContext(!!data, ClusterActions)
    return (
        <AcmPageCard>
            <ClustersTable managedClusters={data} deleteCluster={deleteResource} refresh={refresh} />
        </AcmPageCard>
    )
}

export function ClustersTable(props: {
    managedClusters?: ManagedCluster[]
    deleteCluster: (managedCluster: ManagedCluster) => void
    refresh: () => void
}) {
    sessionStorage.removeItem('DiscoveredClusterName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')

    const { t } = useTranslation(['cluster'])

    function mckeyFn(cluster: ManagedCluster) {
        return cluster.metadata.uid!
    }

    return (
        <AcmTable<ManagedCluster>
            plural="clusters"
            items={props.managedClusters}
            columns={managedClusterCols}
            keyFn={mckeyFn}
            key="managedClustersTable"
            tableActions={[]}
            bulkActions={[
                {
                    id: 'destroyCluster',
                    title: t('managed.destroy'),
                    click: (managedClusters) => {
                        // TODO props.deleteCluster
                        props.refresh()
                    },
                },
                { id: 'detachCluster', title: t('managed.detachSelected'), click: (managedClusters) => {} },
                { id: 'upgradeClusters', title: t('managed.upgradeSelected'), click: (managedClusters) => {} },
            ]}
            rowActions={[
                { id: 'editLabels', title: t('managed.editLabels'), click: (managedCluster) => {} },
                { id: 'launchToCluster', title: t('managed.launch'), click: (managedCluster) => {} },
                { id: 'upgradeCluster', title: t('managed.upgrade'), click: (managedCluster) => {} },
                { id: 'searchCluster', title: t('managed.search'), click: (managedCluster) => {} },
                { id: 'detachCluster', title: t('managed.detached'), click: (managedCluster) => {} },
            ]}
            emptyState={<AcmEmptyState title={t('managed.emptyStateHeader')} key="mcEmptyState" />}
        />
    )
}
