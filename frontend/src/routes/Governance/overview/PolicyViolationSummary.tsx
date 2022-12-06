/* Copyright Contributors to the Open Cluster Management project */
import { Card } from '@patternfly/react-core'
import { AcmDonutChart, colorThemes } from '../../../ui-components'
import { useMemo } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { Policy } from '../../../resources'

export function PolicyViolationsCard(props: { policyViolationSummary: ViolationSummary }) {
    return (
        <ViolationsCard
            title="Policy violations"
            description="Overview of policy violations"
            noncompliant={props.policyViolationSummary.noncompliant}
            compliant={props.policyViolationSummary.compliant}
            pending={props.policyViolationSummary.pending}
            unknown={props.policyViolationSummary.unknown}
        />
    )
}

export interface ViolationSummary {
    noncompliant: number
    compliant: number
    pending: number
    unknown: number
}

export function usePolicyViolationSummary(policies: Policy[]): ViolationSummary {
    const violations = useMemo(() => {
        let compliant = 0
        let noncompliant = 0
        let pending = 0
        let unknown = 0
        for (const policy of policies) {
            if (policy.spec.disabled) continue
            switch (policy.status?.compliant) {
                case 'Compliant':
                    compliant++
                    break
                case 'NonCompliant':
                    noncompliant++
                    break
                case 'Pending':
                    pending++
                    break
                default:
                    unknown++
                    break
            }
        }
        return { noncompliant, compliant, pending, unknown }
    }, [policies])
    return violations
}

export function ViolationsCard(props: {
    title: string
    description: string
    noncompliant: number
    compliant: number
    pending: number
    unknown?: number
}) {
    const { t } = useTranslation()
    return (
        <Card>
            <AcmDonutChart
                title={props.title}
                description={props.description}
                donutLabel={{
                    title: props.noncompliant.toString(),
                    subTitle: t('Violation', { count: props.noncompliant }),
                }}
                data={[
                    {
                        key: t('violation', { count: props.noncompliant }),
                        value: props.noncompliant,
                        isPrimary: true,
                        link:
                            props.noncompliant > 0
                                ? `${NavigationPath.policies}?violations=with-violations`
                                : undefined,
                    },
                    {
                        key: 'pending',
                        value: props.pending,
                        link: props.pending > 0 ? `${NavigationPath.policies}?violations=pending` : undefined,
                    },
                    {
                        key: 'without violations',
                        value: props.compliant,
                        link:
                            props.compliant > 0
                                ? `${NavigationPath.policies}?violations=without-violations`
                                : undefined,
                    },
                ]}
                colorScale={colorThemes.failureWarningSuccess}
            />
        </Card>
    )
}

export type PolicyClusterViolationSummaryMap = Record<string, ViolationSummary>

export function usePolicyClusterViolationSummaryMap(policies: Policy[]): PolicyClusterViolationSummaryMap {
    const violations = useMemo(() => {
        const map: Record<string, ViolationSummary> = {}
        for (const policy of policies) {
            const clusterViolationSummary: ViolationSummary = {
                compliant: 0,
                noncompliant: 0,
                pending: 0,
                unknown: 0,
            }
            map[policy.metadata.uid ?? ''] = clusterViolationSummary
            if (policy.spec.disabled) continue
            for (const clusterStatus of policy.status?.status ?? []) {
                switch (clusterStatus.compliant) {
                    case 'Compliant':
                        clusterViolationSummary.compliant++
                        break
                    case 'NonCompliant':
                        clusterViolationSummary.noncompliant++
                        break
                    case 'Pending':
                        clusterViolationSummary.pending++
                        break
                    default:
                        clusterViolationSummary.unknown++
                        break
                }
            }
        }
        return map
    }, [policies])
    return violations
}
