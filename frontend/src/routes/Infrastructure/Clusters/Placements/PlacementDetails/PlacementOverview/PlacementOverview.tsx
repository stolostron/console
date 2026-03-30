/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, CardTitle, CodeBlock, CodeBlockCode, PageSection, Tooltip } from '@patternfly/react-core'
import { AcmDescriptionList, AcmPageContent, AcmTable, IAcmTableColumn } from '../../../../../../ui-components'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../../../../shared-recoil'
import { usePlacementDetailsContext } from '../PlacementDetails'
import { ClusterLinkList, ClusterSetLinkList } from '../../utils'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../../../NavigationPath'
import { PlacementDecisionApiVersion } from '../../../../../../resources/placement-decision'
import { GitOpsClusterApiVersion } from '../../../../../../resources/gitops-cluster'
import { useLocalHubName } from '../../../../../../hooks/use-local-hub'
import { useEffect, useMemo, useState } from 'react'
import {
  getLabels,
  getMatchLabels,
} from '../../../../../Applications/CreateSubscriptionApplication/controlData/ControlDataPlacement'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import AcmTimestamp from '../../../../../../lib/AcmTimestamp'
import {
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
} from '../../../../../../resources/application-set'
import { listResources } from '../../../../../../resources/utils'
import {
  getApplicationSetsReferencingPlacement,
  getPoliciesReferencingPlacement,
  getPolicySetsReferencingPlacement,
  getGitOpsClustersReferencingPlacement,
} from '../../Placements'
import { GitOpsCluster } from '../../../../../../resources/gitops-cluster'
import { AcmExpandableCard } from '../../../../../../ui-components/AcmExpandable/AcmExpandableCard/AcmExpandableCard'
import './PlacementOverview.css'
import { PlacementStatus } from '../../../../../../resources/placement'
import { PlacementDecision } from '../../../../../../resources/placement-decision'

type PlacementCondition = NonNullable<PlacementStatus['conditions']>[number]

export default function PlacementOverviewPageContent() {
  const { t } = useTranslation()
  const { placement } = usePlacementDetailsContext()
  const localHubName = useLocalHubName()
  const { placementBindingsState, policiesState, policySetsState, gitOpsClustersState, placementDecisionsState } =
    useSharedAtoms()
  const placementBindings = useRecoilValue(placementBindingsState)
  const policies = useRecoilValue(policiesState)
  const policySets = useRecoilValue(policySetsState)
  const gitOpsClusters = useRecoilValue(gitOpsClustersState)
  const placementDecisions = useRecoilValue(placementDecisionsState)

  const placementDecisionsForPlacement = useMemo(
    () =>
      placementDecisions.filter((pd) => pd.metadata.ownerReferences?.some((ref) => ref.uid === placement.metadata.uid)),
    [placementDecisions, placement.metadata.uid]
  )

  const [relatedAppSets, setRelatedAppSets] = useState<ApplicationSet[]>([])

  useEffect(() => {
    let cancelled = false
    listResources<ApplicationSet>({
      apiVersion: ApplicationSetApiVersion,
      kind: ApplicationSetKind,
      metadata: { namespace: placement.metadata.namespace! },
    })
      .promise.then((applicationSets) => {
        if (!cancelled) {
          setRelatedAppSets(getApplicationSetsReferencingPlacement(applicationSets, placement))
        }
      })
      .catch(() => {
        if (!cancelled) setRelatedAppSets([])
      })
    return () => {
      cancelled = true
    }
  }, [placement])

  const relatedPolicies = useMemo(
    () => getPoliciesReferencingPlacement(placement, placementBindings, policies),
    [placement, placementBindings, policies]
  )

  const relatedPolicySets = useMemo(
    () => getPolicySetsReferencingPlacement(placement, placementBindings, policySets),
    [placement, placementBindings, policySets]
  )

  const relatedGitOpsClusters = useMemo(
    () => getGitOpsClustersReferencingPlacement(gitOpsClusters, placement),
    [gitOpsClusters, placement]
  )

  const filtersValue = useMemo(() => {
    const filters: string[] = []
    placement.spec.predicates?.forEach((predicate) => {
      if (!predicate.requiredClusterSelector) return
      if (
        predicate.requiredClusterSelector.labelSelector?.matchLabels &&
        Object.keys(predicate.requiredClusterSelector.labelSelector.matchLabels).length > 0
      ) {
        filters.push(getMatchLabels(predicate.requiredClusterSelector.labelSelector))
      }
      if (
        predicate.requiredClusterSelector.labelSelector?.matchExpressions &&
        predicate.requiredClusterSelector.labelSelector.matchExpressions.length > 0
      ) {
        filters.push(getLabels(predicate.requiredClusterSelector.labelSelector))
      }
      if (
        predicate.requiredClusterSelector.claimSelector?.matchLabels &&
        Object.keys(predicate.requiredClusterSelector.claimSelector.matchLabels).length > 0
      ) {
        filters.push(getMatchLabels(predicate.requiredClusterSelector.claimSelector))
      }
      if (
        predicate.requiredClusterSelector.claimSelector?.matchExpressions &&
        predicate.requiredClusterSelector.claimSelector.matchExpressions.length > 0
      ) {
        filters.push(getLabels(predicate.requiredClusterSelector.claimSelector))
      }
    })
    if (filters.length === 0) return t('None')
    return (
      <CodeBlock>
        <CodeBlockCode id="placement-filters">{`Label expressions:\n${filters.join('\n')}`}</CodeBlockCode>
      </CodeBlock>
    )
  }, [placement.spec.predicates, t])

  const leftItems = [
    { key: t('Name'), value: placement.metadata.name },
    { key: t('Namespace'), value: placement.metadata.namespace },
    {
      key: t('Cluster sets'),
      value: <ClusterSetLinkList clusterSets={placement.spec.clusterSets ?? []} />,
      keyAction: (
        <Tooltip content={t('tooltip.placements.table.clusterSets')}>
          <OutlinedQuestionCircleIcon className="help-icon" />
        </Tooltip>
      ),
    },
    {
      key: t('Filters'),
      value: filtersValue,
      keyAction: (
        <Tooltip content={t('tooltip.placements.details.page.filter')}>
          <OutlinedQuestionCircleIcon className="help-icon" />
        </Tooltip>
      ),
    },
  ]

  const rightItems = [
    {
      key: t('Selected clusters'),
      value: placement.status?.numberOfSelectedClusters ?? 0,
      keyAction: (
        <Tooltip content={t('tooltip.placements.table.selectedClusters')}>
          <OutlinedQuestionCircleIcon className="help-icon" />
        </Tooltip>
      ),
    },
    {
      key: t('Used in'),
      value: relatedPolicies.length + relatedPolicySets.length + relatedAppSets.length + relatedGitOpsClusters.length,
      keyAction: (
        <Tooltip content={t('tooltip.placements.details.page.usedIn')}>
          <OutlinedQuestionCircleIcon className="help-icon" />
        </Tooltip>
      ),
    },
    {
      key: t('Last updated'),
      value: (() => {
        const satisfiedCondition = placement.status?.conditions?.find(
          (condition) => condition.type === 'PlacementSatisfied'
        )
        if (satisfiedCondition?.lastTransitionTime) {
          return <AcmTimestamp timestamp={satisfiedCondition.lastTransitionTime} />
        }
        return '-'
      })(),
    },
  ]

  const columns = useMemo<IAcmTableColumn<PlacementCondition>[]>(
    () => [
      {
        header: t('Type'),
        sort: 'type',
        cell: (condition) => condition.type,
      },
      {
        header: t('Status'),
        sort: 'status',
        cell: (condition) => condition.status,
      },
      {
        header: t('Updated'),
        sort: 'lastTransitionTime',
        cell: (condition) => <AcmTimestamp timestamp={condition.lastTransitionTime} />,
      },
      {
        header: t('Reason'),
        sort: 'reason',
        cell: (condition) => condition.reason,
      },
      {
        header: t('Message'),
        cell: (condition) => condition.message,
      },
    ],
    [t]
  )

  const placementDecisionColumns = useMemo<IAcmTableColumn<PlacementDecision>[]>(
    () => [
      {
        header: t('Name'),
        sort: 'metadata.name',
        cell: (pd) => (
          <Link
            to={{
              pathname: NavigationPath.resources,
              search: `?cluster=${localHubName}&kind=PlacementDecision&apiversion=${PlacementDecisionApiVersion}&namespace=${pd.metadata.namespace!}&name=${pd.metadata.name!}`,
            }}
          >
            {pd.metadata.name}
          </Link>
        ),
      },
      {
        header: t('Namespace'),
        sort: 'metadata.namespace',
        cell: (pd) => pd.metadata.namespace,
      },
      {
        header: t('Clusters'),
        cell: (pd) => <ClusterLinkList clusterNames={pd.status?.decisions?.map((d) => d.clusterName) ?? []} />,
      },
    ],
    [t, localHubName]
  )

  type GovernanceResource = { name: string; namespace: string; kind: string; uid: string }

  const governanceItems = useMemo<GovernanceResource[]>(() => {
    const items: GovernanceResource[] = []
    relatedPolicies.forEach((p) =>
      items.push({ name: p.metadata.name!, namespace: p.metadata.namespace!, kind: 'Policy', uid: p.metadata.uid! })
    )
    relatedPolicySets.forEach((ps) =>
      items.push({ name: ps.metadata.name, namespace: ps.metadata.namespace, kind: 'PolicySet', uid: ps.metadata.uid! })
    )
    return items
  }, [relatedPolicies, relatedPolicySets])

  const governanceColumns = useMemo<IAcmTableColumn<GovernanceResource>[]>(
    () => [
      {
        header: t('Name'),
        sort: 'name',
        cell: (item) => {
          const path =
            item.kind === 'Policy'
              ? generatePath(NavigationPath.policyDetails, { namespace: item.namespace, name: item.name })
              : generatePath(NavigationPath.policySets)
          return <Link to={path}>{item.name}</Link>
        },
      },
      { header: t('Type'), sort: 'kind', cell: (item) => item.kind },
      { header: t('Namespace'), sort: 'namespace', cell: (item) => item.namespace },
    ],
    [t]
  )

  const applicationColumns = useMemo<IAcmTableColumn<ApplicationSet>[]>(
    () => [
      {
        header: t('Name'),
        sort: 'metadata.name',
        cell: (appSet) => (
          <Link
            to={{
              pathname: generatePath(NavigationPath.applicationDetails, {
                namespace: appSet.metadata.namespace!,
                name: appSet.metadata.name!,
              }),
              search: `?apiVersion=${ApplicationSetKind.toLowerCase()}.${ApplicationSetApiVersion.split('/')[0]}`,
            }}
          >
            {appSet.metadata.name}
          </Link>
        ),
      },
      { header: t('Type'), sort: 'kind', cell: (appSet) => appSet.kind },
      { header: t('Namespace'), sort: 'metadata.namespace', cell: (appSet) => appSet.metadata.namespace },
    ],
    [t]
  )

  const systemColumns = useMemo<IAcmTableColumn<GitOpsCluster>[]>(
    () => [
      {
        header: t('Name'),
        sort: 'metadata.name',
        cell: (gc) => (
          <Link
            to={{
              pathname: NavigationPath.resources,
              search: `?cluster=${localHubName}&kind=GitOpsCluster&apiversion=${GitOpsClusterApiVersion}&namespace=${gc.metadata.namespace!}&name=${gc.metadata.name!}`,
            }}
          >
            {gc.metadata.name}
          </Link>
        ),
      },
      { header: t('Type'), sort: 'kind', cell: (gc) => gc.kind },
      { header: t('Namespace'), sort: 'metadata.namespace', cell: (gc) => gc.metadata.namespace },
    ],
    [t, localHubName]
  )

  return (
    <AcmPageContent id="overview">
      <PageSection hasBodyWrapper={false}>
        <div className="placement-details-card">
          <AcmDescriptionList
            title={t('Details')}
            leftItems={leftItems}
            rightItems={rightItems}
            id="placement-overview"
          />
        </div>
        <div className="placement-details-card">
          <AcmExpandableCard title={t('Used in')} id="placement-used-in">
            {governanceItems.length > 0 && (
              <Card isPlain>
                <CardTitle>{t('Governance')}</CardTitle>
                <CardBody>
                  <AcmTable<GovernanceResource>
                    items={governanceItems}
                    columns={governanceColumns}
                    keyFn={(item) => item.uid}
                    autoHidePagination={true}
                    emptyState={<>{t('No policies or policy sets')}</>}
                  />
                </CardBody>
              </Card>
            )}
            {relatedAppSets.length > 0 && (
              <Card isPlain>
                <CardTitle>{t('Applications')}</CardTitle>
                <CardBody>
                  <AcmTable<ApplicationSet>
                    items={relatedAppSets}
                    columns={applicationColumns}
                    keyFn={(appSet) => appSet.metadata.uid!}
                    autoHidePagination={true}
                    emptyState={<>{t('No application sets')}</>}
                  />
                </CardBody>
              </Card>
            )}
            {relatedGitOpsClusters.length > 0 && (
              <Card isPlain>
                <CardTitle>{t('System')}</CardTitle>
                <CardBody>
                  <AcmTable<GitOpsCluster>
                    items={relatedGitOpsClusters}
                    columns={systemColumns}
                    keyFn={(gc) => gc.metadata.uid!}
                    autoHidePagination={true}
                    emptyState={<>{t('No GitOps clusters')}</>}
                  />
                </CardBody>
              </Card>
            )}
          </AcmExpandableCard>
        </div>
        <div className="placement-details-card">
          <AcmExpandableCard title={t('PlacementDecisions')} id="placement-decisions">
            <AcmTable<PlacementDecision>
              items={placementDecisionsForPlacement}
              columns={placementDecisionColumns}
              keyFn={(pd) => pd.metadata.uid!}
              autoHidePagination={true}
              emptyState={<>{t('No placement decisions')}</>}
            />
          </AcmExpandableCard>
        </div>
        <div className="placement-details-card">
          <AcmExpandableCard title={t('Conditions')} id="placement-conditions">
            <AcmTable<PlacementCondition>
              items={placement.status?.conditions ?? []}
              columns={columns}
              keyFn={(condition) => condition.type}
              autoHidePagination={true}
              emptyState={<>{t('No conditions')}</>}
            />
          </AcmExpandableCard>
        </div>
      </PageSection>
    </AcmPageContent>
  )
}
