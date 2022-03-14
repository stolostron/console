/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { AcmDrawerContext, AcmTable, IAcmTableColumn } from '@stolostron/ui-components'
import { Fragment, useCallback, useContext, useMemo } from 'react'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState, usePolicies } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
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
import { PolicyViolationIcons2 } from '../components/PolicyViolations'
import { ClusterViolationSummaryMap, useClusterViolationSummaryMap } from '../overview/ClusterViolationSummary'
import { usePolicyViolationSummary } from '../overview/PolicyViolationSummary'
import { PolicySummarySidebar } from './PolicySummarySidebar'

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
    const { t } = useTranslation()
    const { setDrawerContext } = useContext(AcmDrawerContext)
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

    const onClick = useCallback(
        (cluster: Cluster, compliance: string) => {
            setDrawerContext({
                isExpanded: true,
                onCloseClick: () => {
                    setDrawerContext(undefined)
                },
                panelContent: <PolicySummarySidebar cluster={cluster} compliance={compliance} />,
                panelContentProps: { defaultSize: '40%' },
                isInline: true,
                isResizable: true,
            })
        },
        [setDrawerContext]
    )

    const mckeyFn = useCallback((cluster: Cluster) => cluster.name!, [])
    const clusterNameColumn = useClusterNameColumn()
    const clusterStatusColumn = useClusterStatusColumn()
    const clusterProviderColumn = useClusterProviderColumn()
    const clusterDistributionColumn = useClusterDistributionColumn(clusterCurators)
    const clusterLabelsColumn = useClusterLabelsColumn()
    const columns = useMemo<IAcmTableColumn<Cluster>[]>(
        () => [
            clusterNameColumn,
            {
                header: t('Policy violations'),
                cell: (cluster: Cluster) => {
                    const clusterViolationSummary = props.clusterViolationSummaryMap[cluster.name ?? '']
                    if (!clusterViolationSummary) return <Fragment />
                    return (
                        <PolicyViolationIcons2
                            compliant={clusterViolationSummary.compliant}
                            compliantOnClick={() => onClick(cluster, 'compliant')}
                            noncompliant={clusterViolationSummary.noncompliant}
                            violationOnClick={() => onClick(cluster, 'noncompliant')}
                        />
                    )
                },
                sort: (lhs, rhs) => {
                    const lhsViolations = props.clusterViolationSummaryMap[lhs.name ?? '']
                    const rhsViolations = props.clusterViolationSummaryMap[rhs.name ?? '']
                    if (lhsViolations === rhsViolations) return 0
                    if (!lhsViolations) return -1
                    if (!rhsViolations) return 1
                    if (lhsViolations.noncompliant > rhsViolations.noncompliant) return -1
                    if (lhsViolations.noncompliant < rhsViolations.noncompliant) return 1
                    if (lhsViolations.compliant > rhsViolations.compliant) return -1
                    if (lhsViolations.compliant < rhsViolations.compliant) return 1
                    return 0
                },
            },
            clusterStatusColumn,
            clusterProviderColumn,
            clusterDistributionColumn,
            clusterLabelsColumn,
        ],
        [
            clusterNameColumn,
            clusterStatusColumn,
            clusterProviderColumn,
            clusterDistributionColumn,
            clusterLabelsColumn,
            props.clusterViolationSummaryMap,
            onClick,
            t,
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
