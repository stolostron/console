/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { isType } from '../../../../lib/is-type'
import { ManagedClusterSet } from '../../../../resources'
import { useAllClusters } from '../../../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { Cluster } from '../../../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'

export const useClustersFromClusterSets = (selectedClusterSets?: (ManagedClusterSet | string)[]) => {
  const clusters = useAllClusters(true)
  const [filteredClusters, setFilteredClusters] = useState<Cluster[]>([])
  const [namespaces, setNamespaces] = useState<string[]>()

  useEffect(() => {
    setNamespaces(
      selectedClusterSets
        ?.map((cs) => ((cs as ManagedClusterSet).metadata ? (cs as ManagedClusterSet).metadata.name : (cs as string)))
        .filter(isType)
    )
  }, [selectedClusterSets])

  useEffect(() => {
    if (namespaces) {
      setFilteredClusters(
        clusters.filter((cluster) => cluster.clusterSet !== undefined && namespaces?.includes(cluster.clusterSet))
      )
    } else {
      setFilteredClusters([])
    }
  }, [clusters, namespaces])

  return filteredClusters
}
