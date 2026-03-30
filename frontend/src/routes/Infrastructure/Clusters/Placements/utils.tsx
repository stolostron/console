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
            pathname: generatePath(NavigationPath.placementDetails, {
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

export function ClusterLinkList(props: { clusterNames: string[] }) {
  const { clusterNames } = props
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const renderShowMoreBtn = clusterNames.length > 3
  const displayedClusters = useMemo(() => {
    if (clusterNames.length === 0) return []
    if (showMore) return clusterNames
    return clusterNames.slice(0, 3)
  }, [clusterNames, showMore])
  if (clusterNames.length === 0) return <>-</>
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {displayedClusters.map((clusterName, i) => (
        <Link
          key={`cluster-link-${clusterName}`}
          to={{
            pathname: generatePath(NavigationPath.clusterDetails, {
              name: clusterName,
              namespace: clusterName,
            }),
          }}
        >
          {`${clusterName}${i !== displayedClusters.length - 1 ? ',' : ''}`}
        </Link>
      ))}
      {renderShowMoreBtn && (
        <Label
          color={'blue'}
          style={{ width: 'fit-content' }}
          isCompact
          variant={'outline'}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? t('Show less') : t('{{count}} more', { count: clusterNames.length - 3 })}
        </Label>
      )}
    </div>
  )
}

export function ClusterSetLinkList(props: { clusterSets: string[] }) {
  const { clusterSets } = props
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const renderShowMoreBtn = clusterSets.length > 3
  const displayedClusterSets = useMemo(() => {
    if (clusterSets.length === 0) return []
    if (showMore) return clusterSets
    return clusterSets.slice(0, 3)
  }, [clusterSets, showMore])
  if (clusterSets.length === 0) return <>-</>
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {displayedClusterSets.map((clusterSet, i) => (
        <Link
          key={`clusterset-link-${clusterSet}`}
          to={{
            pathname: generatePath(NavigationPath.clusterSetDetails, {
              id: clusterSet,
            }),
          }}
        >
          {`${clusterSet}${i !== displayedClusterSets.length - 1 ? ',' : ''}`}
        </Link>
      ))}
      {renderShowMoreBtn && (
        <Label
          color={'blue'}
          style={{ width: 'fit-content' }}
          isCompact
          variant={'outline'}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? t('Show less') : t('{{count}} more', { count: clusterSets.length - 3 })}
        </Label>
      )}
    </div>
  )
}
