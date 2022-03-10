/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { AcmTable, IAcmTableColumn } from '@stolostron/ui-components'
import { useCallback, useMemo } from 'react'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState, usePolicies } from '../../../atoms'
import { Cluster } from '../../../resources'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import {
    useClusterDistributionColumn,
    useClusterLabelsColumn,
    useClusterNameColumn,
    useClusterProviderColumn,
    useClusterStatusColumn,
} from '../../Infrastructure/Clusters/ManagedClusters/ManagedClusters'
import {
    GovernanceCreatePolicyEmptyState,
    GovernanceManagePoliciesEmptyState,
} from '../components/GovernanceEmptyState'
import { ClusterViolationSummaryMap, useClusterViolationSummaryMap } from '../overview/ClusterViolationSummary'
import { usePolicyViolationSummary } from '../overview/PolicyViolationSummary'
import { useClusterPolicyViolationsColumn } from './useClusterPolicyViolationsColumn'

export default function GovernanceClustersPage() {
    const policies = usePolicies()
    const policyViolationSummary = usePolicyViolationSummary(policies)
    const clusterViolationSummaryMap = useClusterViolationSummaryMap(policies)
    if (policies.length === 0) {
        return <GovernanceCreatePolicyEmptyState />
    }
    if (!(policyViolationSummary.compliant || policyViolationSummary.noncompliant)) {
        return <GovernanceManagePoliciesEmptyState />
    }

    return (
        <PageSection isWidthLimited>
            <GovernanceClustersTable clusterViolationSummaryMap={clusterViolationSummaryMap} />
        </PageSection>
    )
}

export function GovernanceClustersTable(props: { clusterViolationSummaryMap: ClusterViolationSummaryMap }) {
    const [clusterCurators] = useRecoilState(clusterCuratorsState)
    let clusters = useAllClusters()
    clusters = clusters.filter((cluster) => {
        // don't show clusters in cluster pools in table
        if (cluster.hive.clusterPool) {
            return cluster.hive.clusterClaimName !== undefined
        } else {
            return true
        }
    })
    const mckeyFn = useCallback((cluster: Cluster) => cluster.name!, [])
    const clusterNameColumn = useClusterNameColumn()
    const clusterPolicyViolationsColumn = useClusterPolicyViolationsColumn(props.clusterViolationSummaryMap)
    const clusterStatusColumn = useClusterStatusColumn()
    const clusterProviderColumn = useClusterProviderColumn()
    const clusterDistributionColumn = useClusterDistributionColumn(clusterCurators)
    const clusterLabelsColumn = useClusterLabelsColumn()
    const columns = useMemo<IAcmTableColumn<Cluster>[]>(
        () => [
            clusterNameColumn,
            clusterPolicyViolationsColumn,
            clusterStatusColumn,
            clusterProviderColumn,
            clusterDistributionColumn,
            clusterLabelsColumn,
        ],
        [
            clusterNameColumn,
            clusterPolicyViolationsColumn,
            clusterStatusColumn,
            clusterProviderColumn,
            clusterDistributionColumn,
            clusterLabelsColumn,
        ]
    )

    return (
        <div>
            <AcmTable<Cluster>
                plural="clusters"
                items={clusters}
                columns={columns}
                keyFn={mckeyFn}
                key="managedClustersTable"
            />
        </div>
    )
}
