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
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import MinusCircleIcon from '@patternfly/react-icons/dist/js/icons/minus-circle-icon'
import InProgressIcon from '@patternfly/react-icons/dist/js/icons/in-progress-icon'
import UnknownIcon from '@patternfly/react-icons/dist/js/icons/unknown-icon'

//import from '@patternfly/icons/in-progress'
import { ClusterManagementAddons, ClusterManagementAddOn, clusterManagementAddOns} from '../../../lib/ClusterManagementAddOn'
import { ManagedClusterAddOn, ManagedClusterAddOns as GetManagedClusterAddOns} from '../../../lib/ManagedClusterAddOn'
import React, { ReactNode, useEffect, Fragment } from 'react'
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
        {
            header: 'Status',
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: getDisplayStatus,
        },
        {
            header: 'Message',
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: getDisplayMessage,
        },
    ]
    function keyFn(clusterManagementAddOn: ClusterManagementAddOn) {
        return clusterManagementAddOn.metadata?.uid as string
    }
    function getDisplayStatus(cma: ClusterManagementAddOn): ReactNode {
        const mcaStatus = props.managedClusterAddOns?.find(mca => mca.metadata.name === cma.metadata.name)
       
        if (mcaStatus?.status?.conditions === undefined) {
            return <span style={{ whiteSpace: 'nowrap' }} key="2">  
                        <MinusCircleIcon color="grey" key="disabled-icon" />
                        <span key="status">&nbsp; Disabled</span>
                </span>
        }
        const managedClusterAddOnConditionDegraded = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Degraded'
        )
        if (managedClusterAddOnConditionDegraded?.status === 'True') {
            return <span style={{ whiteSpace: 'nowrap' }} key="2">  
                        <MinusCircleIcon color="red" key="degraded-icon" />
                    <span key="status">&nbsp; Degraded</span>
                    </span>
        } 
        const managedClusterAddOnConditionProgressing = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Progressing'
        )
        if (managedClusterAddOnConditionProgressing?.status === 'True') {
            return <span style={{ whiteSpace: 'nowrap' }} key="2">  
                    <InProgressIcon color="grey" />
                    <span key="status">&nbsp; Progressing</span>
                </span>
        }
        const  managedClusterAddOnConditionAvailable = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Available'
        )   
        if (managedClusterAddOnConditionAvailable?.status === 'True') {
            return <span style={{ whiteSpace: 'nowrap' }} key="2">  
                        <CheckIcon color="green" key="available-icon" />
                        <span key="status">&nbsp; Available</span>
                    </span>
        }
        if ((managedClusterAddOnConditionAvailable?.status === 'False') || (managedClusterAddOnConditionProgressing?.status === 'False') || (managedClusterAddOnConditionDegraded?.status === 'False')) {
            return <span style={{ whiteSpace: 'nowrap' }} key="2">  
                        <InProgressIcon color="grey" />
                        <span key="status">&nbsp; Progressing</span>
                    </span>
        }
        
        return <span style={{ whiteSpace: 'nowrap' }} key="2">  
                    <UnknownIcon color="grey" />
                <span key="status">&nbsp; Unknown</span>
                </span>
    } 

    function getDisplayMessage(cma: ClusterManagementAddOn): ReactNode {
        const mcaStatus = props.managedClusterAddOns?.find(mca => mca.metadata.name === cma.metadata.name)
        console.log("mcaStatus: ", mcaStatus)
        if (mcaStatus?.status?.conditions === undefined) {
            return <span key="status">&nbsp; - </span>
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
        const  managedClusterAddOnConditionAvailable = mcaStatus?.status.conditions.find(
            (condition) => condition.type === 'Available'
        )   
        if (managedClusterAddOnConditionAvailable?.status === 'True') {
            return managedClusterAddOnConditionAvailable.message
        }
        if ((managedClusterAddOnConditionAvailable?.status === 'False') || (managedClusterAddOnConditionProgressing?.status === 'False') || (managedClusterAddOnConditionDegraded?.status === 'False')) {
            return ""
        }
        
        return <span>Unknown</span>
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