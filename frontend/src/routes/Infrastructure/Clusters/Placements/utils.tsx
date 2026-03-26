/* Copyright Contributors to the Open Cluster Management project */

import { Label } from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '~/lib/acm-i18next'
import { NavigationPath } from '~/NavigationPath'
import { Placement, PlacementDecision } from '~/resources'
import { ApplicationDataType } from '~/routes/Applications/ApplicationDetails/ApplicationDetails'

export const getPlacementsForCluster = (
  clusterName: string,
  placements: Placement[],
  placementDecisions: PlacementDecision[]
) => {
  const placementMatches: Placement[] = []
  placementDecisions.forEach((placementDecision) => {
    // Does PlacementDecision contain a status.decision with the given clusterName
    const isMatch = placementDecision.status?.decisions?.some((decision) => decision.clusterName === clusterName)
    if (isMatch) {
      placementDecision.metadata.ownerReferences?.find((ownerReference) => {
        const placementMatch = placements.find((placement) => placement.metadata.uid === ownerReference.uid)
        if (placementMatch) {
          placementMatches.push(placementMatch)
          return
        }
      })
    }
  })
  return placementMatches
}

export const getPlacementsForApplicationSet = (app: ApplicationDataType) => {
  if (app.application.placement) return [app.application.placement]
  return []
}

export function PlacementLinkList(props: { placementsForCluster: Placement[] }) {
  const { placementsForCluster } = props
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const renderShowMoreBtn = placementsForCluster.length > 3

  const displayedPlacements = useMemo(() => {
    if (placementsForCluster.length === 0) return []
    if (showMore) return placementsForCluster // if expanded -> pass the whole array
    return placementsForCluster.slice(0, 3) // if collapsed only show 3 placements
  }, [placementsForCluster, showMore])

  if (placementsForCluster.length === 0) return <>-</>

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {displayedPlacements.map((placement, i) => (
        <Link
          key={`placement-link-${placement.metadata.name!}`}
          to={{
            pathname: generatePath(NavigationPath.placementOverview, {
              namespace: placement.metadata.namespace!,
              name: placement.metadata.name!,
            }),
          }}
        >
          {`${placement.metadata.name!}${i !== displayedPlacements.length - 1 ? ',' : ''}`}
        </Link>
      ))}
      {renderShowMoreBtn && (
        <Label
          id={'placement-expandable-toggle'}
          color={'blue'}
          style={{ width: 'fit-content' }}
          isCompact
          variant={'outline'}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? t('Show less') : t('{{count}} more', { count: placementsForCluster.length - 3 })}
        </Label>
      )}
    </div>
  )
}
