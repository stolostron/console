/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '../../../../lib/useQuery'
import { listGroups, listUsers } from '../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { compareStrings } from '../../../../ui-components'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { useSearchResultItemsQuery } from '../../../Search/search-sdk/search-sdk'

type SelectOption = {
  id?: string
  value?: string
}

type Cluster = {
  name: string
  namespace?: string
  namespaces?: string[]
  clusterSet?: string
}

type ClusterSet = {
  name: string
  clusters?: Cluster[]
}

type RoleAssignmentHookType = {
  users: SelectOption[]
  groups: SelectOption[]
  serviceAccounts: SelectOption[]
  roles: SelectOption[]
  clusterSets: ClusterSet[]
}

type RoleAssignmentHookReturnType = {
  roleAssignmentData: RoleAssignmentHookType
  isLoading: boolean
  isUsersLoading: boolean
  isGroupsLoading: boolean
  isRolesLoading: boolean
  isClusterSetLoading: boolean
}
/**
 * custom hook for retrieving whatever the data is needed for RoleAssignment creation/edit
 * @returns RoleAssignmentHookReturnType
 */
const useRoleAssignmentData = (): RoleAssignmentHookReturnType => {
  const [roleAssignmentData, setRoleAssignmentData] = useState<RoleAssignmentHookType>({
    users: [],
    groups: [],
    serviceAccounts: [],
    roles: [],
    clusterSets: [],
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { data: userList, loading: isUsersLoading } = useQuery(listUsers)
  const users: SelectOption[] = useMemo(
    () =>
      userList
        ?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
        .map((e) => ({ id: e.metadata.name, value: e.metadata.name })) ?? [],
    [userList]
  )

  const { data: groupList, loading: isGroupsLoading } = useQuery(listGroups)
  const groups: SelectOption[] = useMemo(
    () =>
      groupList
        ?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
        .map((e) => ({ id: e.metadata.name, value: e.metadata.name })) ?? [],
    [groupList]
  )

  const { data: clusterRolesQuery, loading: isRolesLoading } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          keywords: [],
          filters: [
            { property: 'kind', values: ['ClusterRole'] },
            { property: 'cluster', values: ['local-cluster'] },
            { property: 'label', values: ['rbac.open-cluster-management.io/filter=vm-clusterroles'] },
          ],
          limit: -1,
        },
      ],
    },
  })

  const roles: SelectOption[] = useMemo(
    () =>
      clusterRolesQuery?.searchResult
        ?.flatMap((roles) => roles?.items as unknown as { name: string; _uid: string })
        .map((e) => ({ id: e.name, value: e.name }))
        .sort((a, b) => a.value.localeCompare(b.value)) ?? [],
    [clusterRolesQuery?.searchResult]
  )

  const [isClusterSetLoading, setIsClusterSetLoading] = useState(true)
  const { namespacesState } = useSharedAtoms()
  const namespaces = useRecoilValue(namespacesState)

  const { managedClusterSetsState } = useSharedAtoms()
  const managedClusterSets = useRecoilValue(managedClusterSetsState)

  const { managedClustersState } = useSharedAtoms()
  const allManagedClusters = useRecoilValue(managedClustersState)

  const clusters = useMemo(() => {
    const manualClusters: Cluster[] = []

    managedClusterSets.forEach((clusterSet) => {
      if (clusterSet) {
        const isGlobal = clusterSet.metadata.name === 'global'
        if (isGlobal) {
          return
        }
        const matchingClusters = allManagedClusters.filter(
          (mc) => mc.metadata.labels?.['cluster.open-cluster-management.io/clusterset'] === clusterSet.metadata.name
        )

        if (matchingClusters.length !== 0) {
          matchingClusters.forEach((mc) => {
            manualClusters.push({
              name: mc.metadata.name,
              namespaces: [],
              clusterSet: clusterSet.metadata.name,
            } as Cluster)
          })
        }
      }
    })

    return manualClusters
  }, [managedClusterSets, allManagedClusters])

  useEffect(() => {
    const sharedNamespaces = namespaces
      .filter((ns) => {
        const name = ns.metadata.name
        return name && !name.startsWith('kube-') && !name.startsWith('openshift-') && name !== 'default'
      })
      .map((ns) => ns.metadata.name!)
      .sort()

    const clustersWithClusterSet = clusters.filter((e) => e.clusterSet)

    const clustersGroupedBySet = Object.groupBy(clustersWithClusterSet, ({ clusterSet }) => clusterSet!)

    const clusterSets: ClusterSet[] = Object.keys(clustersGroupedBySet).map((key) => ({
      name: key,
      clusters: clustersGroupedBySet[key]?.map((cluster) => ({
        name: cluster.name,
        namespaces: [...(cluster.namespace ? [cluster.namespace] : []), ...sharedNamespaces],
      })),
    }))

    setRoleAssignmentData((prevData) => ({
      ...prevData,
      users,
      groups,
      serviceAccounts: [],
      roles,
      clusterSets,
    }))
    setIsClusterSetLoading(false)
  }, [clusters, namespaces, users, groups, roles])

  useEffect(
    () => setIsLoading(isUsersLoading || isGroupsLoading || isRolesLoading || isClusterSetLoading),
    [isUsersLoading, isRolesLoading, isClusterSetLoading, isGroupsLoading]
  )

  return { roleAssignmentData, isLoading, isUsersLoading, isGroupsLoading, isRolesLoading, isClusterSetLoading }
}

export { useRoleAssignmentData }

export type { RoleAssignmentHookType, SelectOption, Cluster, ClusterSet }
