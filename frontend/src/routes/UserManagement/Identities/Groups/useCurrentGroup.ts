/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import { Group, GroupKind, UserApiVersion } from '../../../../resources/rbac'
import { getResource, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { groupsFromMulticlusterRoleAssignments } from '../useMergedIdentities'
import { findIndexedGroupName } from './useGroupsSearch'

export type CurrentGroup = {
  group?: Group
  loaded: boolean
  error?: Error
}

async function readGroup(name: string): Promise<Group | undefined> {
  try {
    const group = await getResource<Group>({
      apiVersion: UserApiVersion,
      kind: GroupKind,
      metadata: { name },
      users: [],
    }).promise
    return { ...group, users: group.users ?? [] }
  } catch (err) {
    if (err instanceof ResourceError && err.code === ResourceErrorCode.NotFound) return undefined
    throw err
  }
}

export const useCurrentGroup = (): CurrentGroup => {
  const { id } = useParams()
  const hubName = useLocalHubName()
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const mras = useSharedValue(multiclusterRoleAssignmentState)
  const [fetched, setFetched] = useState<Group>()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<Error>()

  useEffect(() => {
    if (!id) {
      setFetched(undefined)
      setError(undefined)
      setLoaded(true)
      return
    }

    let cancelled = false
    setLoaded(false)
    setError(undefined)

    const load = async () => {
      try {
        // Same path for uid or name in the URL: Search → resolve name → getResource (full CR).
        // Search alone is not enough (no users/annotations); MRA synthetic is last resort only.
        let indexedName: string | undefined
        try {
          indexedName = await findIndexedGroupName(id, hubName)
        } catch {
          // Search failures must not block the MRA-only fallback below.
          indexedName = undefined
        }
        if (cancelled) return
        if (indexedName) {
          const resolved = await readGroup(indexedName)
          if (cancelled) return
          if (resolved) {
            setFetched(resolved)
            setLoaded(true)
            return
          }
        }

        if (cancelled) return
        setFetched(undefined)
        setLoaded(true)
      } catch (err) {
        if (cancelled) return
        setFetched(undefined)
        setError(err instanceof Error ? err : new Error('Failed to load group'))
        setLoaded(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [hubName, id])

  const synthetic = useMemo(
    () =>
      id && loaded && !fetched && !error
        ? groupsFromMulticlusterRoleAssignments(mras ?? [], new Set()).find(
            (candidate) => candidate.metadata.uid === id || candidate.metadata.name === id
          )
        : undefined,
    [error, fetched, id, loaded, mras]
  )

  return { group: fetched ?? synthetic, loaded, error }
}
