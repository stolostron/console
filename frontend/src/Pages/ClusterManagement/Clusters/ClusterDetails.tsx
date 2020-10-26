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
import { client } from '../../../lib/apollo-client'
import { ClusterManagementAddons, clusterManagementAddOns, ClusterManagementAddOn} from '../../../lib/ClusterManagementAddOn'
import { ManagedClusterAddOns } from '../../../lib/ManagedClusterAddOn'
import React, { useEffect } from 'react'
import { ErrorPage } from '../../../components/ErrorPage'
import { ManagedClusterAddOn } from '../../../sdk'

export function ClusterDetailsPage() {
    return (
        <Page>
            <AcmPageHeader title="Cluster Details" />
            <ClustersDeatilsPageContent />
        </Page>
    )
}

export function ClustersDeatilsPageContent() {
    const { loading, error, data, startPolling, stopPolling, refresh } = ClusterManagementAddons()
//    const ManagedClusterAddOnsQuery = useManagedClusterAddOnsQuery({ 
//         client,
//         // variables: {
//         //     namespace: "leena-ocp"
//         //  },
//     })
const managedClusterAddon = ManagedClusterAddOns()

    useEffect(refresh, [refresh])
    useEffect(() => {
        startPolling(5 * 1000)
        return stopPolling
    }, [startPolling, stopPolling, refresh])

    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data || data.length === 0 || !managedClusterAddon.data) {
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
            managedClusterAddOns={managedClusterAddon.data}
            refresh={refresh}
            //managedClusterAddOns={ManagedClusterAddOnsQuery.data?.managedClusterAddOns as ManagedClusterAddOn[]}
            />
        </AcmPageCard>
    )
}

export function ClusterDetailsTable(props: {
    clusterManagementAddOns: ClusterManagementAddOn[]
    refresh: () => void
    managedClusterAddOns: ManagedClusterAddOn[]
   // deleteConnection: (name?: string, namespace?: string) => Promise<unknown>
}) {
    const columns: IAcmTableColumn<ClusterManagementAddOn>[] = [
        {
            header: 'Name',
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: 'metadata.name',
        },
       
    ]
    function keyFn(clusterManagementAddOn: ClusterManagementAddOn) {
        return clusterManagementAddOn.metadata?.uid as string
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