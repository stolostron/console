/* Copyright Contributors to the Open Cluster Management project */
import { useEffect } from 'react'
import { useItem } from '@patternfly-labs/react-form-wizard'
import { IResource } from '../common/resources/IResource'
import { IPlacement } from '../common/resources/IPlacement'
import { GitOpsCluster } from '../../resources'

export interface ClusterSetMonitorProps {
  argoServers: { label: string; value: GitOpsCluster; description?: string }[]
  clusterSets: IResource[]
  placements: IPlacement[]
  onFilteredClusterSetsChange: (filteredClusterSets: IResource[]) => void
}

export function ClusterSetMonitor(props: ClusterSetMonitorProps) {
  const { argoServers, clusterSets, placements, onFilteredClusterSetsChange } = props
  const resources = useItem() as IResource[]

  useEffect(() => {
    if (!argoServers?.length || !resources) return
    const applicationSet = resources.find((resource) => resource.kind === 'ApplicationSet')
    if (!applicationSet?.metadata?.namespace) return

    const filteredArgoServers = argoServers.filter(
      (argoServer) => argoServer.value?.metadata?.namespace === applicationSet?.metadata?.namespace
    )

    if (!filteredArgoServers.length) return

    const relevantPlacements = filteredArgoServers
      .map((argoServer) => {
        const placementRefName = argoServer?.value?.spec?.placementRef?.name
        return placements.find(
          (placement) =>
            placement.metadata?.namespace === argoServer?.value?.metadata.namespace &&
            placement.metadata?.name === placementRefName
        )
      })
      .filter(Boolean)

    const filteredClusterSets: IResource[] =
      relevantPlacements.length === 0
        ? clusterSets
        : clusterSets.filter((clusterSet) => {
            return relevantPlacements.some((placement) => {
              if (placement?.spec?.clusterSets) {
                if (placement?.spec?.clusterSets.length > 0) {
                  return placement?.spec?.clusterSets.includes(clusterSet.metadata?.name!)
                }
              }
              return true
            })
          })
    onFilteredClusterSetsChange(filteredClusterSets)
  }, [resources, argoServers, clusterSets, placements, onFilteredClusterSetsChange])

  return null
}
