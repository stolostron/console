/* Copyright Contributors to the Open Cluster Management project */

import { useParams, useNavigate, Outlet, generatePath, useMatch, useOutletContext } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { RbacDropdown } from '../../../../../components/Rbac'
import { Placement, PlacementDefinition } from '../../../../../resources'
import { listResources, ResourceError, ResourceErrorCode } from '../../../../../resources/utils'
import { AcmActionGroup, AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../../../ui-components'
import { NavigationPath } from '../../../../../NavigationPath'
import { Fragment, Suspense, useCallback, useMemo, useState } from 'react'
import { getSearchLink } from '../../../../Applications/helpers/resource-helper'
import { rbacDelete } from '../../../../../lib/rbac-util'
import { IDeletePlacementModalProps, DeletePlacementModal } from '../components/DeletePlacementModal'
import { ApplicationSet, ApplicationSetApiVersion, ApplicationSetKind } from '../../../../../resources/application-set'
import {
  getApplicationSetsReferencingPlacement,
  getPoliciesReferencingPlacement,
  getGitOpsClustersReferencingPlacement,
  getPolicySetsReferencingPlacement,
} from '../Placements'

export type PlacementDetailsContext = {
  readonly placement: Placement
}

export default function PlacementDetailsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { name = '', namespace = '' } = useParams()
  const { placementsState, placementBindingsState, policiesState, gitOpsClustersState, policySetsState } =
    useSharedAtoms()
  const placements = useRecoilValue(placementsState)
  const placementBindings = useRecoilValue(placementBindingsState)
  const policies = useRecoilValue(policiesState)
  const gitOpsClusters = useRecoilValue(gitOpsClustersState)
  const policySets = useRecoilValue(policySetsState)

  const placement = placements.find(
    (placement) => placement.metadata.name === name && placement.metadata.namespace === namespace
  )

  const placementDetailsContext = useMemo<PlacementDetailsContext>(() => ({ placement: placement! }), [placement])

  const isPlacementOverview = !!useMatch(NavigationPath.placementOverview)

  const navItems = useMemo(() => {
    return [
      {
        key: 'placement-details-overview',
        title: t('tab.overview'),
        isActive: isPlacementOverview,
        to: generatePath(NavigationPath.placementOverview, { namespace, name }),
      },
    ]
  }, [isPlacementOverview, name, namespace, t])

  const [modalProps, setModalProps] = useState<IDeletePlacementModalProps | { open: false }>({
    open: false,
  })

  const getActions = useCallback(() => {
    const actions = [
      {
        id: 'searchPlacement',
        text: t('Search placement'),
        click: (placement: Placement) => {
          navigate(
            getSearchLink({
              properties: { name: placement.metadata.name!, namespace: placement.metadata.namespace! },
            })
          )
        },
      },
      {
        id: 'deletePlacement',
        text: t('Delete placement'),
        click: async (placement: Placement) => {
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
        rbac: [rbacDelete(PlacementDefinition, placement?.metadata.namespace, placement?.metadata.name)],
      },
    ]
    return actions
  }, [navigate, placementBindings, policies, gitOpsClusters, placement, t, policySets])

  if (!placement) {
    return (
      <ErrorPage
        error={new ResourceError(ResourceErrorCode.NotFound)}
        actions={
          <AcmButton role="link" onClick={() => navigate(NavigationPath.placements)}>
            {t('Back to placements')}
          </AcmButton>
        }
      />
    )
  }

  return (
    <AcmPage
      header={
        <AcmPageHeader
          breadcrumb={[
            { text: t('Placements'), to: NavigationPath.placements },
            { text: placement.metadata.name!, to: '' },
          ]}
          title={placement.metadata.name}
          actions={
            <AcmActionGroup>
              {[
                <RbacDropdown<Placement>
                  id={`${placement.metadata.name!}-actions`}
                  key={`${placement.metadata.name!}-actions`}
                  item={placement}
                  isKebab={false}
                  text={t('Actions')}
                  actions={getActions()}
                />,
              ]}
            </AcmActionGroup>
          }
          navigation={<AcmSecondaryNav navItems={navItems} />}
        />
      }
    >
      <DeletePlacementModal {...modalProps} />
      <Suspense fallback={<Fragment />}>
        <Outlet context={placementDetailsContext} />
      </Suspense>
    </AcmPage>
  )
}

export function usePlacementDetailsContext() {
  return useOutletContext<PlacementDetailsContext>()
}
