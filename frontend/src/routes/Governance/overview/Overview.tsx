/* Copyright Contributors to the Open Cluster Management project */
import { Button, ButtonVariant, Card, CardBody, CardTitle, PageSection, Stack, Tooltip } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AcmMasonry } from '../../../components/AcmMasonry'
import { useTranslation } from '../../../lib/acm-i18next'
import { checkPermission, rbacCreate } from '../../../lib/rbac-util'
import { ManagedCluster, Policy, PolicyDefinition } from '../../../resources'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { AcmDrawerContext, compareStrings } from '../../../ui-components'
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
  const { usePolicies, namespacesState } = useSharedAtoms()
  const policies = usePolicies()
  const [namespaces] = useRecoilState(namespacesState)
  const policyViolationSummary = usePolicyViolationSummary(policies)
  const [canCreatePolicy, setCanCreatePolicy] = useState<boolean>(false)
  const { t } = useTranslation()
  useEffect(() => {
    checkPermission(rbacCreate(PolicyDefinition), setCanCreatePolicy, namespaces)
  }, [namespaces])

  if (policies.length === 0) {
    return (
      <PageSection isFilled>
        <GovernanceCreatePolicyEmptyState rbac={canCreatePolicy} />
      </PageSection>
    )
  }
  if (!(policyViolationSummary.compliant || policyViolationSummary.noncompliant || policyViolationSummary.pending)) {
    return (
      <PageSection isFilled>
        <GovernanceManagePoliciesEmptyState rbac={canCreatePolicy} />
      </PageSection>
    )
  }
  return (
    <PageSection>
      <Stack hasGutter>
        <AcmMasonry minSize={415} maxColumns={3}>
          <PolicySetViolationsCard />
          <PolicyViolationsCard policyViolationSummary={policyViolationSummary} />
          <ClustersCard />
          <SecurityGroupCard key="standards" title={t('Standards')} group="standards" policies={policies} />
          <SecurityGroupCard key="categories" title={t('Categories')} group="categories" policies={policies} />
          <SecurityGroupCard key="controls" title={t('Controls')} group="controls" policies={policies} />
        </AcmMasonry>
      </Stack>
    </PageSection>
  )
}

export interface SecurityGroupViolations {
  name: string
  compliant: number
  noncompliant: number
  pending: number
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
          v = { name, compliant: 0, noncompliant: 0, pending: 0 }
          clusterViolations[name] = v
        }
        switch (policy.status?.compliant) {
          case 'Compliant':
            v.compliant++
            break
          case 'NonCompliant':
            v.noncompliant++
            break
          case 'Pending':
            v.pending++
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16 }}>
            {violations.map((violation) => {
              if (!(violation.compliant || violation.noncompliant || violation.pending)) return <Fragment />
              return (
                <Fragment key={`${props.title}-${violation.name}`}>
                  <span>{violation.name}</span>
                  {violation.compliant ? (
                    <Tooltip content={t('policies.noviolations', { count: violation.compliant })}>
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
                    <Tooltip content={t('policy.violations', { count: violation.noncompliant })}>
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
                  {violation.pending ? (
                    <Tooltip content={t('policies.pending', { count: violation.pending })}>
                      <Fragment>
                        <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                          <Button
                            isInline
                            variant={ButtonVariant.link}
                            onClick={() => onClick(violation, props.group, 'pending')}
                          >
                            {violation.pending}
                          </Button>{' '}
                          &nbsp;
                          <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />
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
  const { usePolicies, managedClustersState } = useSharedAtoms()
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
        <CardTitle>{t('Clusters')}</CardTitle>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 16 }}>
            {clusters.map((cluster) => {
              const clusterViolationSummary = clusterViolationSummaryMap[cluster.metadata.name ?? '']
              if (!clusterViolationSummary) return <Fragment />
              return (
                <Fragment key={`${cluster.metadata.name}-card`}>
                  <span>{cluster.metadata.name}</span>
                  {clusterViolationSummary.pending ? (
                    <Tooltip
                      content={t('policies.pending', {
                        count: clusterViolationSummary.pending,
                      })}
                    >
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <Fragment>
                          <Button isInline variant={ButtonVariant.link} onClick={() => onClick(cluster, 'pending')}>
                            {clusterViolationSummary.pending}
                          </Button>{' '}
                          &nbsp;
                          <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />
                        </Fragment>
                      </span>
                    </Tooltip>
                  ) : (
                    <span />
                  )}
                  {clusterViolationSummary.unknown ? (
                    <Tooltip
                      content={t('policies.unknown', {
                        count: clusterViolationSummary.unknown,
                      })}
                    >
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <Button isInline variant={ButtonVariant.link} onClick={() => onClick(cluster, 'unknown')}>
                          {clusterViolationSummary.unknown}
                        </Button>{' '}
                        &nbsp;
                        <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />
                      </span>
                    </Tooltip>
                  ) : (
                    <span />
                  )}
                  {clusterViolationSummary.compliant ? (
                    <Tooltip
                      content={t('policies.noviolations', {
                        count: clusterViolationSummary.compliant,
                      })}
                    >
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <Fragment>
                          <Button isInline variant={ButtonVariant.link} onClick={() => onClick(cluster, 'compliant')}>
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
                      content={t('policy.violations', {
                        count: clusterViolationSummary.noncompliant,
                      })}
                    >
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <Button isInline variant={ButtonVariant.link} onClick={() => onClick(cluster, 'noncompliant')}>
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
