/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { NavigationPath } from '../../../NavigationPath'
import { Policy } from '../../../resources'
import { ViolationsCard, ViolationSummary } from './PolicyViolationSummary'

export function ClusterViolationsCard(props: { clusterViolationSummaryMap: ClusterViolationSummaryMap }) {
    const clusterViolationSummary = useClusterViolationSummary(props.clusterViolationSummaryMap)
    return (
        <ViolationsCard
            title="Cluster policy violations"
            description="Overview of cluster policy violations"
            noncompliant={clusterViolationSummary.noncompliant}
            compliant={clusterViolationSummary.compliant}
            unknown={clusterViolationSummary.unknown}
            to={NavigationPath.governanceClusters}
        />
    )
}

export function useClusterViolationSummary(clusterViolationSummaryMap: ClusterViolationSummaryMap): ViolationSummary {
    const violations = useMemo(() => {
        let compliant = 0
        let noncompliant = 0
        let unknown = 0
        for (const clusterName in clusterViolationSummaryMap) {
            const clusterViolationSummary = clusterViolationSummaryMap[clusterName]
            if (clusterViolationSummary.noncompliant) {
                noncompliant++
            } else if (clusterViolationSummary.compliant) {
                compliant++
            } else {
                unknown++
            }
        }
        return { noncompliant, compliant, unknown }
    }, [clusterViolationSummaryMap])
    return violations
}

export type ClusterViolationSummaryMap = Record<string, ViolationSummary>

export function useClusterViolationSummaryMap(policies: Policy[]): ClusterViolationSummaryMap {
    const clusterViolations = useMemo(() => {
        const clusterViolationSummaryMap: ClusterViolationSummaryMap = {}
        for (const policy of policies) {
            if (policy.spec.disabled) continue
            for (const clusterStatus of policy.status?.status ?? []) {
                let clusterViolationSummary = clusterViolationSummaryMap[clusterStatus.clustername]
                if (!clusterViolationSummary) {
                    clusterViolationSummary = { noncompliant: 0, compliant: 0, unknown: 0 }
                    clusterViolationSummaryMap[clusterStatus.clustername] = clusterViolationSummary
                }
                switch (clusterStatus.compliant) {
                    case 'Compliant':
                        clusterViolationSummary.compliant++
                        break
                    case 'NonCompliant':
                        clusterViolationSummary.noncompliant++
                        break
                    default:
                        clusterViolationSummary.unknown++
                        break
                }
            }
        }
        return clusterViolationSummaryMap
    }, [policies])
    return clusterViolations
}
