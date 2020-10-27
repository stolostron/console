import {
    AcmEmptyPage,
    AcmLabels,
    AcmLoadingPage,
    AcmPageCard,
    AcmPageHeader,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import { ClusterManagementAddons, ClusterManagementAddOn, clusterManagementAddOns} from '../../../lib/ClusterManagementAddOn'
import { ManagedClusterAddOn, ManagedClusterAddOns as GetManagedClusterAddOns} from '../../../lib/ManagedClusterAddOn'
import React, { useEffect } from 'react'
import { ErrorPage } from '../../../components/ErrorPage'
import { RouteComponentProps } from 'react-router-dom'
import { createMappedTypeNode } from 'typescript'

type ClusterDetailsParams =  { id: string };
export function ClusterDetailsPage({match}: RouteComponentProps<ClusterDetailsParams>) {
    return (
        <Page>
            <AcmPageHeader title="Cluster Details" />
            <ClustersDeatilsPageContent namespace={match.params.id} name={match.params.id}/>
        </Page>
    )
}

export function ClustersDeatilsPageContent(props: {
    name: string;
    namespace: string;
}) {
    const { loading, error, data, startPolling, stopPolling, refresh } = ClusterManagementAddons()

    const MCARes = GetManagedClusterAddOns(props.namespace)
    useEffect(refresh, [refresh])
    useEffect(() => {
        startPolling(5 * 1000)
        MCARes.startPolling(5*1000)
        return stopPolling
    }, [startPolling, stopPolling, refresh])

    if (loading || MCARes.loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data || data.length === 0 || !MCARes.data || MCARes.data.length==0) {
        return (
            <AcmEmptyPage
                title="No addons found."
                message="Your cluster does not contain any addons."
            />
        )
    }

    return (
        <AcmPageCard>
            <ClusterDetailsTable 
            clusterManagementAddOns={data} 
            managedClusterAddOns={MCARes.data}
            refresh={refresh}
            />
        </AcmPageCard>
    )
}

export function ClusterDetailsTable(props: {
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
        // {
        //     header: 'Status',
        //     sort: 'metadata.name',
        //     search: 'metadata.name',
        //    // cell: cma => props.managedClusterAddOns?.filter(mca => mca.metadata.name === cma.metadata.name),
        //    cell: props.managedClusterAddOns?.find(mca => props.clusterManagementAddOns.find(cma => mca.metadata.name === cma.metadata.name))?.status.conditions.length.toString(),
        // },

    ]
    function keyFn(clusterManagementAddOn: ClusterManagementAddOn) {
        return clusterManagementAddOn.metadata?.uid as string
    }
    

function getStatus(){
    let displayStatus
    const mcaStatus = props.managedClusterAddOns?.find(mca => props.clusterManagementAddOns.find(cma => mca.metadata.name === cma.metadata.name))
    if (mcaStatus?.status?.conditions === undefined) {
        displayStatus = 'Unknown'
    }
    const managedClusterAddOnConditionDegraded = mcaStatus?.status.conditions.find(
        (condition) => condition.type === 'Degraded'
    )
    if (managedClusterAddOnConditionDegraded?.status === 'True') {
        displayStatus = 'Degraded'
    } 
    const managedClusterAddOnConditionProgressing = mcaStatus?.status.conditions.find(
        (condition) => condition.type === 'Progressing'
    )
    if (managedClusterAddOnConditionProgressing?.status === 'True') {
        displayStatus = 'Progressing'
    }
    const  managedClusterAddOnConditionAvailable = mcaStatus?.status.conditions.find(
        (condition) => condition.type === 'Available'
    )   
    if (managedClusterAddOnConditionAvailable?.status === 'True') {
        displayStatus =  'Available'
    }
    if ((managedClusterAddOnConditionAvailable?.status === 'False') && (managedClusterAddOnConditionProgressing?.status === 'False') && (managedClusterAddOnConditionDegraded?.status === 'False')) {
        displayStatus = 'Progressing'
    }
    console.log("result: ",displayStatus)
    return displayStatus
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
                tableActions={[
                    {
                        id: 'addConnenction',
                        title: 'Add connection',
                        click: () => {
                            getStatus()
                        },
                    },
                ]}
                bulkActions={[
                   
                ]}
                rowActions={[
              
                ]}
            />
        </AcmPageCard>
    )
}

// export function ClusterDetailsTable(props: { 
//     clusterManagementAddOns: ClusterManagementAddOn[]
//     refresh: () => void
// )} {
//     const columns: IAcmTableColumn<ClusterManagementAddOn>[] = [
//         {
//             header: 'Name',
//             sort: 'metadata.name',
//             search: 'metadata.name',
//             cell: 'metadata.name',
//         },
//     ]

//     function keyFn(clusterManagementAddOn: ClusterManagementAddOn) {
//         return clusterManagementAddOn.metadata?.uid as string
//     }
  
//     return (
//         <AcmTable<ClusterManagementAddOn>
//             plural="clustermanagementaddons"
//             items={props.clusterManagementAddOns}
//             columns={columns}
//             keyFn={keyFn}
//             tableActions={[
                
//             ]}
//             bulkActions={[
               
//             ]}
//             rowActions={[
               
//             ]}
//         />
//     )
// }