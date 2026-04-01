/* Copyright Contributors to the Open Cluster Management project */

import { useTranslation } from '../../../../lib/acm-i18next'
import { Placement, PlacementDefinition, PlacementKind } from '../../../../resources/placement'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import {
  AcmButton,
  AcmEmptyState,
  AcmLabels,
  AcmPageContent,
  AcmTable,
  AcmTableStateProvider,
  AcmVisitedLink,
  compareStrings,
  IAcmTableColumn,
} from '../../../../ui-components'
import { PageSection } from '@patternfly/react-core'
import { navigateToBackCancelLocation } from '../../../../NavigationPath'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import { HighlightSearchText } from '../../../../components/HighlightSearchText'
import { Selector } from '../../../../resources/selector'
import {
  getLabels,
  getMatchLabels,
} from '../../../Applications/CreateSubscriptionApplication/controlData/ControlDataPlacement'
import { useCallback, useMemo, useState } from 'react'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { getSearchLink } from '../../../Applications/helpers/resource-helper'
import { rbacDelete, useIsAnyNamespaceAuthorized } from '../../../../lib/rbac-util'
import { IDeletePlacementModalProps } from './components/DeletePlacementModal'
import { DeletePlacementModal } from './components/DeletePlacementModal'
import { listResources } from '../../../../resources/utils'
import {
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  AppSetGenerator,
} from '../../../../resources/application-set'
import { PlacementBinding } from '../../../../resources/placement-binding'
import { Policy, PolicyKind } from '../../../../resources/policy'
import { PolicySet, PolicySetKind } from '../../../../resources/policy-set'
import { GitOpsCluster } from '../../../../resources/gitops-cluster'
import { ClusterSetLinkList } from './utils'

export default function PlacementsPage() {
  const { t } = useTranslation()
  const { placementsState } = useSharedAtoms()
  const placements = useRecoilValue(placementsState)
  const navigate = useNavigate()

  return (
    <AcmPageContent id="placements">
      <PageSection hasBodyWrapper={false}>
        <PlacementsTable
          placements={placements}
          emptyState={
            <AcmEmptyState
              key="placementsEmptyState"
              title={t("You don't have any placements yet")}
              message={t('To get started, create a placement.')}
              action={
                <AcmButton
                  onClick={() => navigateToBackCancelLocation(navigate, NavigationPath.createPlacement)}
                  variant="primary"
                >
                  {t('Create placement')}
                </AcmButton>
              }
            />
          }
        />
      </PageSection>
    </AcmPageContent>
  )
}

const PLACEMENT_LABEL = 'cluster.open-cluster-management.io/placement'

function generatorReferencesPlacement(generator: AppSetGenerator, placementName: string): boolean {
  if (generator.clusterDecisionResource?.labelSelector?.matchLabels?.[PLACEMENT_LABEL] === placementName) {
    return true
  }
  const nestedGenerators = generator.matrix?.generators ?? generator.merge?.generators
  return nestedGenerators?.some((g) => generatorReferencesPlacement(g, placementName)) ?? false
}

export function getApplicationSetsReferencingPlacement(
  applicationSets: ApplicationSet[],
  placement: Placement
): ApplicationSet[] {
  return applicationSets.filter(
    (appSet) =>
      appSet.metadata.namespace === placement.metadata.namespace &&
      appSet.spec.generators?.some((g) => generatorReferencesPlacement(g, placement.metadata.name!))
  )
}

export function getPoliciesReferencingPlacement(
  placement: Placement,
  placementBindings: PlacementBinding[],
  policies: Policy[]
): Policy[] {
  const bindingsForPlacement = placementBindings.filter(
    (pb) =>
      pb.metadata.namespace === placement.metadata.namespace &&
      pb.placementRef.kind === PlacementKind &&
      pb.placementRef.name === placement.metadata.name
  )

  const policyNames = new Set<string>()
  for (const binding of bindingsForPlacement) {
    for (const subject of binding.subjects ?? []) {
      if (subject.kind === PolicyKind && subject.name) {
        policyNames.add(subject.name)
      }
    }
  }

  return policies.filter(
    (p) => p.metadata.namespace === placement.metadata.namespace && policyNames.has(p.metadata.name!)
  )
}

export function getPolicySetsReferencingPlacement(
  placement: Placement,
  placementBindings: PlacementBinding[],
  policySets: PolicySet[]
): PolicySet[] {
  const bindingsForPlacement = placementBindings.filter(
    (pb) =>
      pb.metadata.namespace === placement.metadata.namespace &&
      pb.placementRef.kind === PlacementKind &&
      pb.placementRef.name === placement.metadata.name
  )

  const policySetNames = new Set<string>()
  for (const binding of bindingsForPlacement) {
    for (const subject of binding.subjects ?? []) {
      if (subject.kind === PolicySetKind && subject.name) {
        policySetNames.add(subject.name)
      }
    }
  }

  return policySets.filter(
    (ps) => ps.metadata.namespace === placement.metadata.namespace && policySetNames.has(ps.metadata.name)
  )
}

export function getGitOpsClustersReferencingPlacement(
  gitOpsClusters: GitOpsCluster[],
  placement: Placement
): GitOpsCluster[] {
  return gitOpsClusters.filter(
    (gc) =>
      gc.metadata.namespace === placement.metadata.namespace &&
      gc.spec?.placementRef?.kind === PlacementKind &&
      gc.spec?.placementRef?.name === placement.metadata.name
  )
}

export function PlacementsTable(props: { placements: Placement[]; emptyState: React.ReactNode }) {
  const { t } = useTranslation()
  const filtersDisplayLimit = 3
  const { placementBindingsState, policiesState, gitOpsClustersState, policySetsState } = useSharedAtoms()
  const placementBindings = useRecoilValue(placementBindingsState)
  const policies = useRecoilValue(policiesState)
  const gitOpsClusters = useRecoilValue(gitOpsClustersState)
  const policySets = useRecoilValue(policySetsState)

  function placementKeyFn(placement: Placement) {
    return placement.metadata.uid!
  }

  const columns = useMemo<IAcmTableColumn<Placement>[]>(
    () => [
      {
        header: t('Name'),
        sort: 'metadata.name',
        search: 'metadata.name',
        cell: (placement: Placement, search: string) => {
          return (
            <AcmVisitedLink
              to={generatePath(NavigationPath.placementDetails, {
                namespace: placement.metadata.namespace!,
                name: placement.metadata.name!,
              })}
            >
              <HighlightSearchText text={placement.metadata.name!} searchText={search} isLink useFuzzyHighlighting />
            </AcmVisitedLink>
          )
        },
        exportContent: (placement: Placement) => {
          return placement.metadata.name
        },
      },
      {
        header: t('Namespace'),
        sort: 'metadata.namespace',
        search: 'metadata.namespace',
        cell: (placement: Placement) => {
          return <span>{placement.metadata.namespace}</span>
        },
        exportContent: (placement: Placement) => {
          return placement.metadata.namespace
        },
      },
      {
        header: t('Cluster sets'),
        tooltip: t('tooltip.placements.table.clusterSets'),
        cell: (placement: Placement) => {
          if (placement.spec.clusterSets) {
            return <ClusterSetLinkList clusterSets={placement.spec.clusterSets} />
          } else {
            return '-'
          }
        },
        exportContent: (placement: Placement) => {
          if (placement.spec.clusterSets) {
            return placement.spec.clusterSets.join(', ')
          }
          return '-'
        },
      },
      {
        header: t('Filters'),
        tooltip: t('tooltip.placements.table.filter'),
        cell: (placement: Placement) => {
          const clusterSelectors: Selector[] = []

          placement.spec.predicates?.forEach((predicate) => {
            if (!predicate.requiredClusterSelector) return
            if (predicate.requiredClusterSelector.labelSelector) {
              clusterSelectors.push(predicate.requiredClusterSelector.labelSelector)
            }
            if (predicate.requiredClusterSelector.claimSelector) {
              clusterSelectors.push(predicate.requiredClusterSelector.claimSelector)
            }
          })

          if (clusterSelectors?.length && clusterSelectors.length > 0) {
            const filters: string[] = []
            const collapse: string[] = []
            clusterSelectors.forEach((s, i) => {
              if (s.matchLabels && Object.keys(s.matchLabels).length > 0) {
                if (i >= filtersDisplayLimit) {
                  collapse.push(getMatchLabels(s))
                } else {
                  filters.push(getMatchLabels(s))
                }
              }
              if (s.matchExpressions && s.matchExpressions.length > 0) {
                if (i >= filtersDisplayLimit) {
                  collapse.push(getLabels(s))
                } else {
                  filters.push(getLabels(s))
                }
              }
            })
            if (filters.length === 0) {
              return t('None')
            }
            return <AcmLabels labels={filters} collapse={collapse} />
          }
          return t('None')
        },
        exportContent: (placement: Placement) => {
          const filters: string[] = []
          placement.spec.predicates?.forEach((predicate) => {
            if (!predicate.requiredClusterSelector) return
            if (predicate.requiredClusterSelector.labelSelector?.matchLabels) {
              filters.push(getMatchLabels(predicate.requiredClusterSelector.labelSelector))
            }
            if (predicate.requiredClusterSelector.labelSelector?.matchExpressions) {
              filters.push(getLabels(predicate.requiredClusterSelector.labelSelector))
            }
            if (predicate.requiredClusterSelector.claimSelector?.matchLabels) {
              filters.push(getMatchLabels(predicate.requiredClusterSelector.claimSelector))
            }
            if (predicate.requiredClusterSelector.claimSelector?.matchExpressions) {
              filters.push(getLabels(predicate.requiredClusterSelector.claimSelector))
            }
          })
          return filters.length > 0 ? filters.join(', ') : t('None')
        },
      },
      {
        header: t('Selected clusters'),
        tooltip: t('tooltip.placements.table.selectedClusters'),
        cell: (placement: Placement) => {
          return <span>{placement.status?.numberOfSelectedClusters ?? 0}</span>
        },
        sort: 'status.numberOfSelectedClusters',
        search: 'status.numberOfSelectedClusters',
        exportContent: (placement: Placement) => {
          return placement.status?.numberOfSelectedClusters ?? '0'
        },
      },
      {
        header: t('Last updated'),
        sort: (a: Placement, b: Placement) => {
          const satisfiedConditionA = a.status?.conditions?.find((condition) => condition.type === 'PlacementSatisfied')
          const satisfiedConditionB = b.status?.conditions?.find((condition) => condition.type === 'PlacementSatisfied')
          return compareStrings(
            satisfiedConditionA?.lastTransitionTime ?? '',
            satisfiedConditionB?.lastTransitionTime ?? ''
          )
        },
        cell: (placement: Placement) => {
          const satisfiedCondition = placement.status?.conditions?.find(
            (condition) => condition.type === 'PlacementSatisfied'
          )
          if (satisfiedCondition) {
            return <AcmTimestamp timestamp={satisfiedCondition.lastTransitionTime ?? ''} />
          }
          return '-'
        },
        exportContent: (placement: Placement) => {
          const satisfiedCondition = placement.status?.conditions?.find(
            (condition) => condition.type === 'PlacementSatisfied'
          )
          if (satisfiedCondition) {
            return satisfiedCondition.lastTransitionTime ?? '-'
          }
          return '-'
        },
      },
    ],
    [t]
  )

  const navigate = useNavigate()
  const canDeletePlacement = useIsAnyNamespaceAuthorized(rbacDelete(PlacementDefinition))

  const [modalProps, setModalProps] = useState<IDeletePlacementModalProps | { open: false }>({
    open: false,
  })

  const rowActionResolver = useCallback(
    (placement: Placement) => {
      return [
        {
          id: 'viewPlacement',
          title: t('View placement'),
          click: () =>
            navigate(
              generatePath(NavigationPath.placementDetails, {
                namespace: placement.metadata.namespace!,
                name: placement.metadata.name!,
              })
            ),
        },
        {
          id: 'searchPlacement',
          title: t('Search placement'),
          click: () =>
            navigate(
              getSearchLink({
                properties: { name: placement.metadata.name!, namespace: placement.metadata.namespace! },
              })
            ),
        },
        {
          id: 'deletePlacement',
          title: t('Delete placement'),
          click: async () => {
            let relatedAppSets: ApplicationSet[] = []
            let appSetFetchError: string | undefined
            try {
              const applicationSets = await listResources<ApplicationSet>({
                apiVersion: ApplicationSetApiVersion,
                kind: ApplicationSetKind,
                metadata: {
                  namespace: placement.metadata.namespace!,
                },
              }).promise
              relatedAppSets = getApplicationSetsReferencingPlacement(applicationSets, placement)
            } catch (err) {
              appSetFetchError = err instanceof Error ? err.message : String(err)
            }

            const relatedPolicies = getPoliciesReferencingPlacement(placement, placementBindings, policies)
            const relatedGitOpsClusters = getGitOpsClustersReferencingPlacement(gitOpsClusters, placement)
            const relatedPolicySets = getPolicySetsReferencingPlacement(placement, placementBindings, policySets)

            setModalProps({
              open: true,
              resource: placement,
              relatedAppSets,
              relatedPolicies,
              relatedGitOpsClusters,
              relatedPolicySets,
              appSetFetchError,
              close: () => setModalProps({ open: false }),
            })
          },
          isDisabled: !canDeletePlacement,
        },
      ]
    },
    [navigate, t, canDeletePlacement, placementBindings, policies, gitOpsClusters, policySets]
  )

  return (
    <AcmTableStateProvider localStorageKey="advanced-tables-pagination">
      <DeletePlacementModal {...modalProps} />
      <AcmTable<Placement>
        items={props.placements}
        columns={columns}
        showExportButton
        keyFn={placementKeyFn}
        emptyState={props.emptyState}
        rowActionResolver={rowActionResolver}
      />
    </AcmTableStateProvider>
  )
}
