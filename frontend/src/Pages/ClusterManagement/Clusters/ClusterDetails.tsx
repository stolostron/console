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
import { ClusterManagementAddOn, 
    ManagedClusterAddOn, 
    ManagedClusterAddOnsDocument, 
    useClusterManagementAddOnsQuery,
    useManagedClusterAddOnsQuery
     } from '../../../sdk'
import React, { useEffect } from 'react'
import { ErrorPage } from '../../../components/ErrorPage'
import { ClosedConfirmModalProps } from '../../../components/ConfirmModal'

export function ClusterDetailsPage() {
    return (
        <Page>
            <AcmPageHeader title="Cluster Details" />
            <ClustersDeatilsPageContent />
        </Page>
    )
}

export function ClustersDeatilsPageContent() {
    const { loading, error, data, refetch, startPolling, stopPolling } = useClusterManagementAddOnsQuery({
        client,
    })
    const ManagedClusterAddOnsQuery = useManagedClusterAddOnsQuery({ 
        client,
        // variables: {
        //     namespace: "leena-ocp"
        // },
    })
    useEffect(() => {
        refetch()
        startPolling(10 * 1000)
        return () => {
            stopPolling()
        }
    }, [refetch, startPolling, stopPolling])
    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data?.clusterManagementAddOns || data.clusterManagementAddOns.length === 0) {
        return <AcmEmptyPage title="No addons found." message="No managed addons found." />
    }
    return (
        <AcmPageCard>
            <ClusterDetailsTable 
            clusterManagementAddOns={data.clusterManagementAddOns as ClusterManagementAddOn[]} 
            managedClusterAddOns={ManagedClusterAddOnsQuery.data?.managedClusterAddOns as ManagedClusterAddOn[]}
            />
        </AcmPageCard>
    )
}

export function ClusterDetailsTable(props: { clusterManagementAddOns: ClusterManagementAddOn[]
    managedClusterAddOns: ManagedClusterAddOn[]}) {
    const columns: IAcmTableColumn<ClusterManagementAddOn>[] = [
        {
            header: 'Name',
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: 'metadata.name',
        },
       // {
       //     header: 'Status',
           // sort: 'managedclusteraddon.displayAddOnStatus',
           // search: 'managedclusteraddon.displayAddOnStatus',
            // cell: (clusterManagementAddon) => (
            //     <span style={{ whiteSpace: 'nowrap' }} key="2">
            //         {clusterManagementAddon.displayStatus === 'Ready' ? (
            //             <CheckIcon color="green" key="ready-icon" />
            //         ) : (
            //             <Fragment key="ready-icon"></Fragment>
            //         )}
            //         {clusterManagementAddon.displayStatus === 'Pending import' ? (
            //             <MinusCircleIcon color="grey" key="pending-icon" />
            //         ) : (
            //             <Fragment key="pending-icon"></Fragment>
            //         )}
            //         {managedCluster.displayStatus === 'Offline' ? (
            //             <ExclamationIcon color="red" key="offline-icon" />
            //         ) : (
            //             <Fragment key="offline-icon"></Fragment>
            //         )}
            //         <span key="status">&nbsp; {managedCluster.displayStatus}</span>
            //     </span>
            // ),
            //cell: (managedClusterAddon) => props.managedClusterAddOns.length: "undefined",
            // props.clusterManagementAddOns.forEach((cma) => {
            //     props.managedClusterAddOns.find(({ metadata }) => metadata.name === cma.metadata.name && metadata.namespace === "leena-ocp")?.displayAddOnStatus
            // })
            //(managedClusterAddOn) => (props.managedClusterAddOns.find((mca)=> mca.metadata.name === "application-manager" && mca.metadata.namespace === "leena-ocp" )?.displayAddOnStatus),
       // },
    ]

    function keyFn(secret: ClusterManagementAddOn) {
        return secret.metadata.uid
    }
  
    return (
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
    )
}