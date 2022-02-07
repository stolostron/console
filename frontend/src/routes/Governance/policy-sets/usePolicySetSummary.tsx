/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { PolicySet } from '../../../resources'

export interface IPolicySetSummary {
    policyCount: number
    policyViolations: number
    policyUnknownStatusCount: number
    clusterCount: number
    clusterViolations: number
}

export function usePolicySetSummary(policySet: PolicySet) {
    const [summary, setSummary] = useState<IPolicySetSummary>({
        policyCount: 0,
        policyViolations: 0,
        policyUnknownStatusCount: 0,
        clusterCount: 0,
        clusterViolations: 0,
    })

    useEffect(() => {
        const newPolicySetSummary: IPolicySetSummary = {
            policyCount: 0,
            policyViolations: 0,
            policyUnknownStatusCount: 0,
            clusterCount: 0,
            clusterViolations: 0,
        }

        if (policySet && policySet.status && policySet.status.results) {
            calculatePolicySetPolicyStats(newPolicySetSummary, policySet)
            caculatePolicySetClusterStats(newPolicySetSummary, policySet)
        }
        setSummary(newPolicySetSummary)
    }, [policySet])

    return summary
}

function calculatePolicySetPolicyStats(summary: IPolicySetSummary, policySet: PolicySet) {
    summary.policyCount = 0
    summary.policyViolations = 0
    summary.policyUnknownStatusCount = 0
    for (const result of policySet.status?.results ?? []) {
        summary.policyCount++
        if (!result.compliant) {
            summary.policyUnknownStatusCount++
        } else if (result.compliant === 'NonCompliant') {
            summary.policyViolations++
        }
    }
}

function caculatePolicySetClusterStats(summary: IPolicySetSummary, policySet: PolicySet) {
    const clusterStats: { [clusterName: string]: boolean } = {}
    for (const result of policySet.status?.results ?? []) {
        if (!result.clusters) continue
        for (const clusterResult of result.clusters) {
            if (clusterResult.compliant === 'Compliant' && clusterStats[clusterResult.clusterName] !== false) {
                clusterStats[clusterResult.clusterName] = true
            } else {
                clusterStats[clusterResult.clusterName] = false
            }
        }
        const clusterNames = Object.keys(clusterStats)
        summary.clusterCount = clusterNames.length
        summary.clusterViolations = clusterNames.filter((clusterName: string) => !clusterStats[clusterName]).length
    }
}
