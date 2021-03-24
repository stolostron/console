/* Copyright Contributors to the Open Cluster Management project */

import { useContext } from 'react'
import { AcmPageContent, AcmPageCard } from '@open-cluster-management/ui-components'
import { ClusterSetContext } from '../ClusterSetDetails'
import { ClustersTable } from '../../../Clusters/Clusters'

export function ClusterSetOverviewPageContent(props: { canGetSecret?: boolean }) {
    const { clusters } = useContext(ClusterSetContext)
    return (
        <AcmPageContent id="overview">
            <AcmPageCard>
                <ClustersTable clusters={clusters} />
            </AcmPageCard>
        </AcmPageContent>
    )
}
