/* Copyright Contributors to the Open Cluster Management project */

import { useParams, useNavigate, Outlet, generatePath, useMatch, useOutletContext } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useRecoilValue } from '../../../../../shared-recoil'
import { useSharedAtoms } from '../../../../../shared-recoil'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { Placement } from '../../../../../resources'
import { ResourceError, ResourceErrorCode } from '../../../../../resources/utils'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../../../ui-components'
import { NavigationPath } from '../../../../../NavigationPath'
import { Fragment, Suspense, useMemo } from 'react'

export type PlacementDetailsContext = {
  readonly placement: Placement
}

export default function PlacementDetailsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { name = '', namespace = '' } = useParams()
  const { placementsState } = useSharedAtoms()
  const placements = useRecoilValue(placementsState)

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
          navigation={<AcmSecondaryNav navItems={navItems} />}
        />
      }
    >
      <Suspense fallback={<Fragment />}>
        <Outlet context={placementDetailsContext} />
      </Suspense>
    </AcmPage>
  )
}

export function usePlacementDetailsContext() {
  return useOutletContext<PlacementDetailsContext>()
}
