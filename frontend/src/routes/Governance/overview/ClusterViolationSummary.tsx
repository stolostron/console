/* Copyright Contributors to the Open Cluster Management project */
import { IAcmTableColumn } from '@stolostron/ui-components'
import { Fragment, useMemo } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Policy } from '../../../resources'
import { PolicyViolationIcons2 } from '../components/PolicyViolations'
import { ViolationSummary } from './PolicyViolationSummary'

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

export function usePolicySetClusterPolicyViolationsColumn(
    clusterViolationSummaryMap: ClusterViolationSummaryMap
): IAcmTableColumn<string> {
    const { t } = useTranslation()
    return {
        header: t('Policy violations'),
        cell: (cluster: string) => {
            const clusterViolationSummary = clusterViolationSummaryMap[cluster ?? '']
            if (!clusterViolationSummary) return <Fragment />
            return (
                <PolicyViolationIcons2
                    compliant={clusterViolationSummary.compliant}
                    noncompliant={clusterViolationSummary.noncompliant}
                />
            )
        },
        sort: (lhs, rhs) => {
            const lhsViolations = clusterViolationSummaryMap[lhs ?? '']
            const rhsViolations = clusterViolationSummaryMap[rhs ?? '']
            if (lhsViolations === rhsViolations) return 0
            if (!lhsViolations) return -1
            if (!rhsViolations) return 1
            if (lhsViolations.noncompliant > rhsViolations.noncompliant) return -1
            if (lhsViolations.noncompliant < rhsViolations.noncompliant) return 1
            if (lhsViolations.compliant > rhsViolations.compliant) return -1
            if (lhsViolations.compliant < rhsViolations.compliant) return 1
            return 0
        },
    }
}
