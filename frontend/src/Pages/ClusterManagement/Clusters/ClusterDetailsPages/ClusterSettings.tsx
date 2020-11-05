import {
    AcmEmptyState,
    AcmLoadingPage,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'

import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import MinusCircleIcon from '@patternfly/react-icons/dist/js/icons/minus-circle-icon'
import InProgressIcon from '@patternfly/react-icons/dist/js/icons/in-progress-icon'
import { ClusterManagementAddons, ClusterManagementAddOn } from '../../../../lib/ClusterManagementAddOn'
import {
    ManagedClusterAddOn,
    ManagedClusterAddOns as GetManagedClusterAddOns,
} from '../../../../lib/ManagedClusterAddOn'
import React, { ReactNode, useEffect } from 'react'
import { ErrorPage } from '../../../../components/ErrorPage'

export function ClustersSettingsPageContent(props: { name: string; namespace: string }) {
    const cma = ClusterManagementAddons()
    const mca = GetManagedClusterAddOns(props.namespace)
    const refresh = () => {
        cma.refresh()
        mca.refresh()
    }
    useEffect(() => {
        cma.startPolling(5 * 1000)
        mca.startPolling(5 * 1000)
        const stopPollingFn = () => {
            cma.stopPolling()
            mca.stopPolling()
        }
        return stopPollingFn
    }, [cma.startPolling, cma.stopPolling, mca.startPolling, mca.stopPolling, cma, mca])

    if (cma.loading || mca.loading) {
        return <AcmLoadingPage />
    } else if (cma.error) {
        return <ErrorPage error={cma.error} />
    } else if (mca.error) {
        return <ErrorPage error={mca.error} />
    } else if (!cma.data?.items || cma.data.items.length === 0 || !mca.data?.items || mca.data.items.length === 0) {
        return (
            <AcmPageCard>
                <AcmEmptyState title="No add-ons found." message="Your cluster does not contain any addons." />
            </AcmPageCard>
        )
    }

    return (
        <ClusterSettingsTable
            clusterManagementAddOns={cma.data.items}
            managedClusterAddOns={mca.data.items}
            refresh={refresh}
        />
    )
}

export function ClusterSettingsTable(props: {
    clusterManagementAddOns: ClusterManagementAddOn[]
    refresh: () => void
    managedClusterAddOns: ManagedClusterAddOn[] | undefined
    // deleteConnection: (name?: string, namespace?: string) => Promise<unknown>
}) {
    const columns: IAcmTableColumn<ClusterManagementAddOn>[] = [
        {
            header: 'Name',
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: 'metadata.name',
        },
        {
            header: 'Status',
            cell: (item: ClusterManagementAddOn) => {
                const status = getDisplayStatus(item)
                return (
                    <span style={{ whiteSpace: 'nowrap' }} key="2">
                        {status === 'Available' && <CheckIcon color="green" key="available-icon" />}
                        {status === 'Disabled' && <MinusCircleIcon color="grey" key="disabled-icon" />}
                        {status === 'Progressing' && <InProgressIcon color="grey" key="progressing-icon" />}
                        {status === 'Degraded' && <MinusCircleIcon color="red" key="degraded-icon" />}
                        <span key="status">&nbsp; {status}</span>
                    </span>
                )
            },
            search: (item: ClusterManagementAddOn) => {
                return getDisplayStatus(item)
            },
        },
        {
            header: 'Message',
            cell: getDisplayMessage,
        },
    ]

    function keyFn(clusterManagementAddOn: ClusterManagementAddOn) {
        return clusterManagementAddOn.metadata?.uid || (clusterManagementAddOn.metadata.name as string)
    }

    function getDisplayStatus(cma: ClusterManagementAddOn): string {
        const mcaStatus = props.managedClusterAddOns?.find((mca) => mca.metadata.name === cma.metadata.name)
        if (mcaStatus?.status?.conditions === undefined) {
            return 'Disabled'
        }
        const managedClusterAddOnConditionDegraded = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Degraded'
        )
        if (managedClusterAddOnConditionDegraded?.status === 'True') {
            return 'Degraded'
        }
        const managedClusterAddOnConditionProgressing = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Progressing'
        )
        if (managedClusterAddOnConditionProgressing?.status === 'True') {
            return 'Progressing'
        }
        const managedClusterAddOnConditionAvailable = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Available'
        )
        if (managedClusterAddOnConditionAvailable?.status === 'True') {
            return 'Available'
        }
        if (
            managedClusterAddOnConditionAvailable?.status === 'False' ||
            managedClusterAddOnConditionProgressing?.status === 'False' ||
            managedClusterAddOnConditionDegraded?.status === 'False'
        ) {
            return 'Progressing'
        }

        return 'Unknown'
    }

    function getDisplayMessage(cma: ClusterManagementAddOn): ReactNode {
        const mcaStatus = props.managedClusterAddOns?.find((mca) => mca.metadata.name === cma.metadata.name)
        if (mcaStatus?.status?.conditions === undefined) {
            return <span key="message">&nbsp; - </span>
        }
        const managedClusterAddOnConditionDegraded = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Degraded'
        )
        if (managedClusterAddOnConditionDegraded?.status === 'True') {
            return managedClusterAddOnConditionDegraded.message
        }
        const managedClusterAddOnConditionProgressing = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Progressing'
        )
        if (managedClusterAddOnConditionProgressing?.status === 'True') {
            return managedClusterAddOnConditionProgressing.message
        }
        const managedClusterAddOnConditionAvailable = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Available'
        )
        if (managedClusterAddOnConditionAvailable?.status === 'True') {
            return managedClusterAddOnConditionAvailable.message
        }
        if (
            managedClusterAddOnConditionAvailable?.status === 'False' ||
            managedClusterAddOnConditionProgressing?.status === 'False' ||
            managedClusterAddOnConditionDegraded?.status === 'False'
        ) {
            return ''
        }

        return <span key="message">Unknown</span>
    }

    // const [deleteProviderConnection] = useDeleteProviderConnectionMutation({ client })
    //const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
    // const history = useHistory()

    return (
        <AcmPageCard>
            <AcmTable<ClusterManagementAddOn>
                plural="clustermanagementaddons"
                items={props.clusterManagementAddOns}
                columns={columns}
                keyFn={keyFn}
                tableActions={[]}
                bulkActions={[]}
                rowActions={[]}
            />
        </AcmPageCard>
    )
}
