/* Copyright Contributors to the Open Cluster Management project */
import { IAcmTableColumn } from '@stolostron/ui-components'
import { Fragment } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Cluster } from '../../../resources'
import { PolicyViolationIcons2 } from '../components/PolicyViolations'
import { ClusterViolationSummaryMap } from '../overview/ClusterViolationSummary'

export function useClusterPolicyViolationsColumn(
    clusterViolationSummaryMap: ClusterViolationSummaryMap
): IAcmTableColumn<Cluster> {
    const { t } = useTranslation()
    return {
        header: t('Policy violations'),
        cell: (cluster: Cluster) => {
            const clusterViolationSummary = clusterViolationSummaryMap[cluster.name ?? '']
            if (!clusterViolationSummary) return <Fragment />
            return (
                <PolicyViolationIcons2
                    compliant={clusterViolationSummary.compliant}
                    noncompliant={clusterViolationSummary.noncompliant}
                />
            )
        },
        sort: (lhs, rhs) => {
            const lhsViolations = clusterViolationSummaryMap[lhs.name ?? '']
            const rhsViolations = clusterViolationSummaryMap[rhs.name ?? '']
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
