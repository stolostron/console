/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardTitle, PageSection, Stack, Tooltip } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { Fragment, useMemo } from 'react'
import { usePolicies } from '../../../atoms'
import { AcmMasonry } from '../../../components/AcmMasonry'
import { useTranslation } from '../../../lib/acm-i18next'
import { Policy } from '../../../resources'
import {
    GovernanceCreatePolicyEmptyState,
    GovernanceManagePoliciesEmptyState,
} from '../components/GovernanceEmptyState'
import { ClusterViolationsCard, useClusterViolationSummaryMap } from './ClusterViolationSummary'
import { PolicySetViolationsCard } from './PolicySetViolationSummary'
import { PolicyViolationsCard, usePolicyViolationSummary } from './PolicyViolationSummary'

export default function GovernanceOverview() {
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
            <Stack hasGutter>
                <AcmMasonry minSize={400} maxColumns={3}>
                    <PolicySetViolationsCard />
                    <PolicyViolationsCard policyViolationSummary={policyViolationSummary} />
                    <ClusterViolationsCard clusterViolationSummaryMap={clusterViolationSummaryMap} />
                    <SecurityGroupCard key="standards" title="Standards" group="standards" policies={policies} />
                    <SecurityGroupCard key="categories" title="Categories" group="categories" policies={policies} />
                    <SecurityGroupCard key="controls" title="Controls" group="controls" policies={policies} />
                </AcmMasonry>
            </Stack>
        </PageSection>
    )
}

interface SecurityGroupViolations {
    name: string
    compliant: number
    noncompliant: number
}

function SecurityGroupCard(props: { title: string; group: string; policies: Policy[] }) {
    const violations = useSecurityGroupViolations(props.group, props.policies)
    const { t } = useTranslation()
    return (
        <div>
            <Card isRounded>
                <CardTitle>{props.title}</CardTitle>
                <CardBody>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16 }}>
                        {violations.map((violation) => {
                            if (!(violation.compliant || violation.noncompliant)) return <Fragment />
                            return (
                                <Fragment>
                                    <span>{violation.name}</span>
                                    {violation.compliant ? (
                                        <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                                            <Tooltip
                                                content={t('policies.noviolations', { count: violation.compliant })}
                                            >
                                                <Fragment>
                                                    {violation.compliant} &nbsp;
                                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                                                </Fragment>
                                            </Tooltip>
                                        </span>
                                    ) : (
                                        <span style={{ whiteSpace: 'nowrap', opacity: 0.2, textAlign: 'right' }}>
                                            {violation.compliant} &nbsp;
                                            <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                                        </span>
                                    )}
                                    {violation.noncompliant ? (
                                        <Tooltip content={t('policy.violations', { count: violation.noncompliant })}>
                                            <Fragment>
                                                <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                                                    {violation.noncompliant} &nbsp;
                                                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
                                                </span>
                                            </Fragment>
                                        </Tooltip>
                                    ) : (
                                        <span style={{ whiteSpace: 'nowrap', opacity: 0.2, textAlign: 'right' }}>
                                            {violation.noncompliant} &nbsp;
                                            <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
                                        </span>
                                    )}
                                </Fragment>
                            )
                        })}
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}

function useSecurityGroupViolations(group: string, policies: Policy[]) {
    const violations = useMemo(() => {
        const clusterViolations: Record<string, SecurityGroupViolations> = {}
        for (const policy of policies) {
            if (policy.spec.disabled) continue
            const annotation = policy.metadata.annotations?.[`policy.open-cluster-management.io/${group}`]
            if (!annotation) continue
            const names = annotation.split(',')
            for (const name of names) {
                let v = clusterViolations[name]
                if (!v) {
                    v = { name, compliant: 0, noncompliant: 0 }
                    clusterViolations[name] = v
                }
                switch (policy.status?.compliant) {
                    case 'Compliant':
                        v.compliant++
                        break
                    case 'NonCompliant':
                        v.noncompliant++
                        break
                }
            }
        }
        return Object.values(clusterViolations)
    }, [group, policies])
    return violations
}
