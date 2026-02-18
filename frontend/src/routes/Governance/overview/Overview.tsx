/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  ButtonVariant,
  Card,
  CardBody,
  CardTitle,
  ExpandableSection,
  Icon,
  PageSection,
  Stack,
  Tooltip,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { Fragment, useCallback, useContext, useMemo, useState } from 'react'
import { AcmMasonry } from '../../../components/AcmMasonry'
import { useTranslation } from '../../../lib/acm-i18next'
import { rbacCreate, useIsAnyNamespaceAuthorized } from '../../../lib/rbac-util'
import { ManagedCluster, Policy, PolicyDefinition } from '../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmDrawerContext, compareStrings } from '../../../ui-components'
import {
  GovernanceCreatePolicyEmptyState,
  GovernanceManagePoliciesEmptyState,
} from '../components/GovernanceEmptyState'
import { ClusterPolicySummarySidebar } from './ClusterPolicySummarySidebar'
import { useClusterViolationSummaryMap } from './ClusterViolationSummary'
import { PolicySetViolationsCard } from './PolicySetViolationSummary'
import { PolicyViolationsCard, usePolicyViolationSummary, ViolationSummary } from './PolicyViolationSummary'
import { SecurityGroupPolicySummarySidebar } from './SecurityGroupPolicySummarySidebar'
import keyBy from 'lodash/keyBy'
import { TFunction } from 'react-i18next'
import { JSX } from 'react/jsx-runtime'
import { LoadingPage } from '../../../components/LoadingPage'
import { PluginContext } from '../../../lib/PluginContext'

// # of clusters initially shown
// the rest are shown by clicking "more"
const INITIAL_CLUSTERS_SHOWN = 10

const getScore = (item: { cluster?: ManagedCluster; violations: any }) => {
  return item.violations.noncompliant * 100 + item.violations.unknown * 10 + item.violations.pending
}

export default function GovernanceOverview() {
  const { usePolicies } = useSharedAtoms()
  const policies = usePolicies()
  const policyViolationSummary = usePolicyViolationSummary(policies)
  const canCreatePolicy = useIsAnyNamespaceAuthorized(rbacCreate(PolicyDefinition))
  const { t } = useTranslation()
  const { dataContext } = useContext(PluginContext)
  const { loadStarted, loadCompleted } = useContext(dataContext)
  if (loadCompleted || process.env.NODE_ENV === 'test') {
    if (policies.length === 0) {
      return (
        <PageSection hasBodyWrapper={false} isFilled>
          <GovernanceCreatePolicyEmptyState rbac={canCreatePolicy} />
        </PageSection>
      )
    }
    if (!(policyViolationSummary.compliant || policyViolationSummary.noncompliant || policyViolationSummary.pending)) {
      return (
        <PageSection hasBodyWrapper={false} isFilled>
          <GovernanceManagePoliciesEmptyState rbac={canCreatePolicy} />
        </PageSection>
      )
    }
  }
  return (
    <PageSection hasBodyWrapper={false}>
      <Stack hasGutter>
        {loadStarted ? (
          <AcmMasonry minSize={415} maxColumns={3}>
            <PolicySetViolationsCard />
            <PolicyViolationsCard policyViolationSummary={policyViolationSummary} />
            <ClustersCard />
            <SecurityGroupCard key="standards" title={t('Standards')} group="standards" policies={policies} />
            <SecurityGroupCard key="categories" title={t('Categories')} group="categories" policies={policies} />
            <SecurityGroupCard key="controls" title={t('Controls')} group="controls" policies={policies} />
          </AcmMasonry>
        ) : (
          <LoadingPage />
        )}
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
      <Card>
        <CardTitle>{props.title}</CardTitle>
        <CardBody>
          <div
            className="card-body-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16 }}
          >
            {violations.map((violation) => {
              const key = `${props.title}-${violation.name}`
              if (!(violation.compliant || violation.noncompliant || violation.pending)) return <Fragment key={key} />
              return (
                <Fragment key={key}>
                  <span>{violation.name}</span>
                  {violation.compliant ? (
                    <Tooltip content={t('policies.noviolations', { count: violation.compliant })}>
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <Button
                          isInline
                          variant={ButtonVariant.link}
                          onClick={() => onClick(violation, props.group, 'compliant')}
                        >
                          {violation.compliant}
                        </Button>{' '}
                        &nbsp;
                        <Icon status="success">
                          <CheckCircleIcon />
                        </Icon>
                      </span>
                    </Tooltip>
                  ) : (
                    <span />
                  )}
                  {violation.noncompliant ? (
                    <Tooltip content={t('policy.violations', { count: violation.noncompliant })}>
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <Button
                          isInline
                          variant={ButtonVariant.link}
                          onClick={() => onClick(violation, props.group, 'noncompliant')}
                        >
                          {violation.noncompliant}
                        </Button>{' '}
                        &nbsp;
                        <Icon status="danger">
                          <ExclamationCircleIcon />
                        </Icon>
                      </span>
                    </Tooltip>
                  ) : (
                    <span />
                  )}
                  {violation.pending ? (
                    <Tooltip content={t('policies.pending', { count: violation.pending })}>
                      <span style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <Button
                          isInline
                          variant={ButtonVariant.link}
                          onClick={() => onClick(violation, props.group, 'pending')}
                        >
                          {violation.pending}
                        </Button>{' '}
                        &nbsp;
                        <Icon status="warning">
                          <ExclamationTriangleIcon />
                        </Icon>
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

function ClustersCard() {
  const { t } = useTranslation()
  const { usePolicies, managedClustersState } = useSharedAtoms()
  const clusters = useRecoilValue(managedClustersState)
  const policies = usePolicies()
  const { setDrawerContext } = useContext(AcmDrawerContext)

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

  const [isExpandedNon, setIsExpandedNon] = useState(false)
  const onToggleNon = (isExpanded: boolean) => {
    setIsExpandedNon(isExpanded)
  }
  const [isExpandedUnk, setIsExpandedUnk] = useState(false)
  const onToggleUnk = (isExpanded: boolean) => {
    setIsExpandedUnk(isExpanded)
  }
  const [isExpandedCom, setIsExpandedCom] = useState(false)
  const onToggleCom = (isExpanded: boolean) => {
    setIsExpandedCom(isExpanded)
  }

  const clusterViolationSummaryMap = useClusterViolationSummaryMap(policies)

  const { topClustersList, remainingNoncompliant, remainingUnknown, remainingCompliant } = useMemo(() => {
    const clusterMap = keyBy(clusters, 'metadata.name')
    const clusterViolationSummaryList = Object.keys(clusterViolationSummaryMap)
      .filter((clusterKey) => !!clusterMap[clusterKey])
      .map((clusterKey) => {
        return {
          cluster: clusterMap[clusterKey],
          violations: clusterViolationSummaryMap[clusterKey],
        }
      })

    // sort noncompliant clusters to the top of the list
    clusterViolationSummaryList.sort((a, b) => {
      return getScore(b) - getScore(a)
    })

    // if there's more then INITIAL_CLUSTERS_SHOWN clusters, split lists into groups
    let remainingNoncompliant
    let remainingUnknown
    let remainingCompliant
    let topClustersList = clusterViolationSummaryList
    // don't end first group on boundary to avoid a small group
    if (clusterViolationSummaryList.length > INITIAL_CLUSTERS_SHOWN + 5) {
      topClustersList = clusterViolationSummaryList.slice(0, INITIAL_CLUSTERS_SHOWN)
      let remainingList = clusterViolationSummaryList.slice(INITIAL_CLUSTERS_SHOWN)
      if (remainingList.length) {
        let inx = remainingList.findIndex((item) => {
          return item.violations.noncompliant === 0
        })
        if (inx > 0) {
          remainingNoncompliant = remainingList.slice(0, inx)
          remainingList = remainingList.slice(inx)
        }
        inx = remainingList.findIndex((item) => {
          return item.violations.pending === 0 && item.violations.unknown === 0
        })
        if (inx > 0) {
          remainingUnknown = remainingList.slice(0, inx)
          remainingList = remainingList.slice(inx)
        }
        remainingCompliant = remainingList
      }
    }

    // consolidate
    /* istanbul ignore next */
    if (isExpandedNon) topClustersList = [...topClustersList, ...(remainingNoncompliant || [])]
    /* istanbul ignore next */
    if (isExpandedUnk) topClustersList = [...topClustersList, ...(remainingUnknown || [])]
    /* istanbul ignore next */
    if (isExpandedCom) topClustersList = [...topClustersList, ...(remainingCompliant || [])]
    return {
      topClustersList,
      remainingNoncompliant,
      remainingUnknown,
      remainingCompliant,
    }
  }, [clusterViolationSummaryMap, clusters, isExpandedCom, isExpandedNon, isExpandedUnk])

  const renderExtraClusterList = (
    xtraList: { cluster: any; violations: any }[] | undefined,
    icon: JSX.Element,
    xtraToggle: ((isExpanded: boolean) => void) | undefined,
    isXtraExpanded: boolean | undefined
  ) => {
    return (
      xtraList &&
      !isXtraExpanded && (
        <ExpandableSection
          toggleContent={
            <div>
              <span style={{ whiteSpace: 'pre' }}>{t('Show {{count}} more', { count: xtraList.length })}</span>
              {icon}
            </div>
          }
          onToggle={(_event, isExpanded) => xtraToggle?.(isExpanded)}
          isExpanded={isXtraExpanded}
        >
          {renderClusterList(xtraList, onClick, t)}
        </ExpandableSection>
      )
    )
  }

  return (
    <div>
      <Card>
        <CardTitle>{t('Clusters')}</CardTitle>
        <CardBody>
          {renderClusterList(topClustersList, onClick, t)}
          {renderExtraClusterList(
            remainingNoncompliant,
            <Icon status="danger">
              <ExclamationCircleIcon />
            </Icon>,
            onToggleNon,
            isExpandedNon
          )}
          {renderExtraClusterList(
            remainingUnknown,
            <Icon status="warning">
              <ExclamationTriangleIcon />
            </Icon>,
            onToggleUnk,
            isExpandedUnk
          )}
          {renderExtraClusterList(
            remainingCompliant,
            <Icon status="success">
              <CheckCircleIcon />
            </Icon>,
            onToggleCom,
            isExpandedCom
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function renderClusterList(
  clusterList: { cluster: ManagedCluster; violations: ViolationSummary }[],
  onClick: (cluster: ManagedCluster, compliance: string) => void,
  t: TFunction
) {
  return (
    <div
      className="card-body-grid"
      style={{ paddingBottom: '10px', display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', rowGap: 16 }}
    >
      {clusterList.map(({ cluster, violations }) => {
        const key = `${cluster?.metadata?.name}-card`
        /* istanbul ignore if */
        if (!violations) return <Fragment key={key} />
        return (
          <Fragment key={key}>
            <span style={{ marginRight: 16 }}>{cluster?.metadata?.name}</span>
            {violations.compliant ? (
              <Tooltip
                content={t('policies.noviolations', {
                  count: violations.compliant,
                })}
              >
                <span style={{ whiteSpace: 'nowrap', textAlign: 'right', marginRight: 16 }}>
                  <Fragment>
                    <Button isInline variant={ButtonVariant.link} onClick={() => onClick(cluster, 'compliant')}>
                      {violations.compliant}
                    </Button>{' '}
                    &nbsp;
                    <Icon status="success">
                      <CheckCircleIcon />
                    </Icon>
                  </Fragment>
                </span>
              </Tooltip>
            ) : (
              <span />
            )}
            {violations.noncompliant ? (
              <Tooltip
                content={t('policy.violations', {
                  count: violations.noncompliant,
                })}
              >
                <span style={{ whiteSpace: 'nowrap', textAlign: 'right', marginRight: 16 }}>
                  <Button isInline variant={ButtonVariant.link} onClick={() => onClick(cluster, 'noncompliant')}>
                    {violations.noncompliant}
                  </Button>{' '}
                  &nbsp;
                  <Icon status="danger">
                    <ExclamationCircleIcon />
                  </Icon>
                </span>
              </Tooltip>
            ) : (
              <span />
            )}
            {violations.pending ? (
              <Tooltip
                content={t('policies.pending', {
                  count: violations.pending,
                })}
              >
                <span style={{ whiteSpace: 'nowrap', textAlign: 'right', marginRight: 16 }}>
                  <Fragment>
                    <Button isInline variant={ButtonVariant.link} onClick={() => onClick(cluster, 'pending')}>
                      {violations.pending}
                    </Button>{' '}
                    &nbsp;
                    <Icon status="warning">
                      <ExclamationTriangleIcon />
                    </Icon>
                  </Fragment>
                </span>
              </Tooltip>
            ) : (
              <span />
            )}
            {violations.unknown ? (
              <Tooltip
                content={t('policies.unknown', {
                  count: violations.unknown,
                })}
              >
                <span style={{ whiteSpace: 'nowrap', textAlign: 'right', marginRight: 16 }}>
                  <Button isInline variant={ButtonVariant.link} onClick={() => onClick(cluster, 'unknown')}>
                    {violations.unknown}
                  </Button>{' '}
                  &nbsp;
                  <Icon status="warning">
                    <ExclamationTriangleIcon />
                  </Icon>
                </span>
              </Tooltip>
            ) : (
              <span />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
