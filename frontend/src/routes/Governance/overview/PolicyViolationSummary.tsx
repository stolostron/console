/* Copyright Contributors to the Open Cluster Management project */
import { Card } from '@patternfly/react-core'
import { AcmDonutChart } from '@stolostron/ui-components'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
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
            unknown={props.policyViolationSummary.unknown}
            to={NavigationPath.policies}
        />
    )
}

export interface ViolationSummary {
    noncompliant: number
    compliant: number
    unknown: number
}

export function usePolicyViolationSummary(policies: Policy[]): ViolationSummary {
    const violations = useMemo(() => {
        let compliant = 0
        let noncompliant = 0
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
                default:
                    unknown++
                    break
            }
        }
        return { noncompliant, compliant, unknown }
    }, [policies])
    return violations
}

export function ViolationsCard(props: {
    title: string
    description: string
    noncompliant: number
    compliant: number
    unknown?: number
    to?: string
}) {
    const { t } = useTranslation()
    const history = useHistory()
    return (
        <Card
            isHoverable
            onClick={() => {
                if (props.to) history.push(props.to)
            }}
        >
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
                    },
                    { key: 'without violations', value: props.compliant },
                    // { key: 'Unknown', value: props.unknown ?? 0 },
                ]}
                colorScale={[
                    'var(--pf-global--danger-color--100)',
                    'var(--pf-global--success-color--100)',
                    'var(--pf-global--warning-color--100)',
                ]}
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
