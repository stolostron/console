/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useRecoilState } from 'recoil'
import { policySetsState } from '../../../atoms'
import { NavigationPath } from '../../../NavigationPath'
import { ViolationsCard } from './PolicyViolationSummary'

export function PolicySetViolationsCard() {
    const violations = usePolicySetViolations()
    return (
        <ViolationsCard
            title="Policy set violations"
            description="Overview of policy set violations"
            noncompliant={violations.noncompliant}
            compliant={violations.compliant}
            unknown={violations.unknown}
            to={NavigationPath.policySets}
        />
    )
}

function usePolicySetViolations() {
    const [policySets] = useRecoilState(policySetsState)
    const violations = useMemo(() => {
        let compliant = 0
        let noncompliant = 0
        let unknown = 0
        for (const policySet of policySets) {
            switch (policySet.status?.compliant) {
                case 'Compliant':
                    compliant++
                    break
                case 'NonCompliant':
                    noncompliant++
                    break
                default:
                    unknown++
                    break
            }
        }
        return { noncompliant, compliant, unknown }
    }, [policySets])
    return violations
}
