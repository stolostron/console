/* Copyright Contributors to the Open Cluster Management project */
import { Button, ButtonVariant, Card, CardBody, CardTitle, PageSection, Stack, Tooltip } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { AcmDrawerContext, compareStrings } from '@stolostron/ui-components'
import { Fragment, useCallback, useContext, useMemo } from 'react'
import { useRecoilState } from 'recoil'
import { managedClustersState, usePolicies } from '../../../atoms'
import { AcmMasonry } from '../../../components/AcmMasonry'
import { useTranslation } from '../../../lib/acm-i18next'
import { ManagedCluster, Policy } from '../../../resources'
import {
    GovernanceCreatePolicyEmptyState,
    GovernanceManagePoliciesEmptyState,
} from '../components/GovernanceEmptyState'
import { ClusterPolicySummarySidebar } from './ClusterPolicySummarySidebar'
import { useClusterViolationSummaryMap } from './ClusterViolationSummary'
import { PolicySetViolationsCard } from './PolicySetViolationSummary'
import { PolicyViolationsCard, usePolicyViolationSummary } from './PolicyViolationSummary'
import { SecurityGroupPolicySummarySidebar } from './SecurityGroupPolicySummarySidebar'

export default function GovernanceOverview() {
    const policies = usePolicies()
    const policyViolationSummary = usePolicyViolationSummary(policies)
    if (policies.length === 0) {
        return <GovernanceCreatePolicyEmptyState />
    }
    if (!(policyViolationSummary.compliant || policyViolationSummary.noncompliant)) {
        return <GovernanceManagePoliciesEmptyState />
    }
    return (
        <PageSection isWidthLimited>
            <Stack hasGutter>
                <AcmMasonry minSize={415} maxColumns={3}>
                    <PolicySetViolationsCard />
                    <PolicyViolationsCard policyViolationSummary={policyViolationSummary} />
                    <ClustersCard />
                    <SecurityGroupCard key="standards" title="Standards" group="standards" policies={policies} />
                    <SecurityGroupCard key="categories" title="Categories" group="categories" policies={policies} />
                    <SecurityGroupCard key="controls" title="Controls" group="controls" policies={policies} />
                </AcmMasonry>
            </Stack>
        </PageSection>
    )
}

export interface SecurityGroupViolations {
    name: string
    compliant: number
    noncompliant: number
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
        return Object.values(clusterViolations).sort((a: SecurityGroupViolations, b: SecurityGroupViolations) =>
            compareStrings(a.name, b.name)
        )
    }, [group, policies])
    return violations
}

function SecurityGroupCard(props: { title: string; group: string; policies: Policy[] }) {
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const violations = useSecurityGroupViolations(props.group, props.policies)
    const { t } = useTranslation()

    const onClick = useCallback(
        (violation: SecurityGroupViolations, secGroupName: string, compliance: string) => {
            setDrawerContext({
                title: violation.name,
                isExpanded: true,
                onCloseClick: () => {
                    setDrawerContext(undefined)
                },
                panelContent: (
                    <SecurityGroupPolicySummarySidebar
                        violation={violation}
                        secGroupName={secGroupName}
                        compliance={compliance}
                    />
                ),
                panelContentProps: { defaultSize: '40%' },
                isInline: true,
                isResizable: true,
            })
        },
        [setDrawerContext]
    )

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
                                        <Tooltip
                                            content={t(
                                                violation.compliant === 1
                                                    ? 'policies.noviolations'
                                                    : 'policies.noviolations_plural',
                                                { count: violation.compliant }
                                            )}
                                        >
                                            <Fragment>
                                                <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                                                    <Button
                                                        isInline
                                                        variant={ButtonVariant.link}
                                                        onClick={() => onClick(violation, props.group, 'compliant')}
                                                    >
                                                        {violation.compliant}
                                                    </Button>{' '}
                                                    &nbsp;
                                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                                                </span>
                                            </Fragment>
                                        </Tooltip>
                                    ) : (
                                        <span />
                                    )}
                                    {violation.noncompliant ? (
                                        <Tooltip
                                            content={t(
                                                violation.noncompliant === 1
                                                    ? 'policy.violations'
                                                    : 'policy.violations_plural',
                                                { count: violation.noncompliant }
                                            )}
                                        >
                                            <Fragment>
                                                <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                                                    <Button
                                                        isInline
                                                        variant={ButtonVariant.link}
                                                        onClick={() => onClick(violation, props.group, 'noncompliant')}
                                                    >
                                                        {violation.noncompliant}
                                                    </Button>{' '}
                                                    &nbsp;
                                                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
                                                </span>
                                            </Fragment>
                                        </Tooltip>
                                    ) : (
                                        <span />
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

function ClustersCard() {
    const { t } = useTranslation()
    const [clusters] = useRecoilState(managedClustersState)
    const policies = usePolicies()
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const clusterViolationSummaryMap = useClusterViolationSummaryMap(policies)

    const onClick = useCallback(
        (cluster: ManagedCluster, compliance: string) => {
            setDrawerContext({
                title: cluster.metadata.name,
                isExpanded: true,
                onCloseClick: () => {
                    setDrawerContext(undefined)
                },
                panelContent: <ClusterPolicySummarySidebar cluster={cluster} compliance={compliance} />,
                panelContentProps: { defaultSize: '40%' },
                isInline: true,
                isResizable: true,
            })
        },
        [setDrawerContext]
    )

    return (
        <div>
            <Card isRounded>
                <CardTitle>{'Clusters'}</CardTitle>
                <CardBody>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16 }}>
                        {clusters.map((cluster) => {
                            const clusterViolationSummary = clusterViolationSummaryMap[cluster.metadata.name ?? '']
                            if (!clusterViolationSummary) return <Fragment />
                            return (
                                <Fragment>
                                    <span>{cluster.metadata.name}</span>
                                    {clusterViolationSummary.compliant ? (
                                        <Tooltip
                                            content={t(
                                                clusterViolationSummary.compliant === 1
                                                    ? 'cluster.without.violations'
                                                    : 'clusters.without.violations',
                                                {
                                                    count: clusterViolationSummary.compliant,
                                                }
                                            )}
                                        >
                                            <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                                                <Fragment>
                                                    <Button
                                                        isInline
                                                        variant={ButtonVariant.link}
                                                        onClick={() => onClick(cluster, 'compliant')}
                                                    >
                                                        {clusterViolationSummary.compliant}
                                                    </Button>{' '}
                                                    &nbsp;
                                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                                                </Fragment>
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <span />
                                    )}
                                    {clusterViolationSummary.noncompliant ? (
                                        <Tooltip
                                            content={t(
                                                clusterViolationSummary.noncompliant === 1
                                                    ? 'cluster.with.violations'
                                                    : 'clusters.with.violations',
                                                {
                                                    count: clusterViolationSummary.noncompliant,
                                                }
                                            )}
                                        >
                                            <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                                                <Button
                                                    isInline
                                                    variant={ButtonVariant.link}
                                                    onClick={() => onClick(cluster, 'noncompliant')}
                                                >
                                                    {clusterViolationSummary.noncompliant}
                                                </Button>{' '}
                                                &nbsp;
                                                <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <span />
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
