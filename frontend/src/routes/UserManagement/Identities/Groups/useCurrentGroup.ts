/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'
import { useFleetSearchSubscription } from '@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Group, GroupKind, UserApiVersion } from '../../../../resources/rbac'
import { getResource, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { AcmToastContext } from '../../../../ui-components'
import { resolveIndexedThenRead, useIdentityLiveEvents } from '../searchIdentityHelpers'
import { groupsFromMulticlusterRoleAssignments } from '../useMergedIdentities'
import { findIndexedGroupName, hubGroupWatchFilters } from './useGroupsSearch'

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
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useContext(AcmToastContext)
  const hubName = useLocalHubName()
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const mras = useSharedValue(multiclusterRoleAssignmentState)
  const [fetched, setFetched] = useState<Group>()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<Error>()

  // Watch by identity name even when only an MRA stub exists (no Group CR yet), so INSERT
  // of the CR upgrades YAML/Users without leaving the page.
  const mraIdentity = useMemo(
    () =>
      id
        ? groupsFromMulticlusterRoleAssignments(mras ?? [], new Set()).find(
            (candidate) => candidate.metadata.uid === id || candidate.metadata.name === id
          )
        : undefined,
    [id, mras]
  )
  const watchedName = fetched?.metadata?.name ?? mraIdentity?.metadata?.name
  const watchInput = useMemo(
    () => (watchedName ? { filters: hubGroupWatchFilters(watchedName) } : undefined),
    [watchedName]
  )
  const [latestEvent] = useFleetSearchSubscription(watchInput)
  // Boolean (not the MRA object) so the load effect can retry when MRA data arrives without looping.
  const allowForbiddenWhenUnresolved = Boolean(mraIdentity)

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
        // Search alone is not enough (no users/annotations); MRA synthetic is last resort.
        // Forbidden on an unresolved route id with a matching MRA must not hide the stub.
        const resolved = await resolveIndexedThenRead(id, hubName, findIndexedGroupName, readGroup, {
          allowForbiddenWhenUnresolved,
        })
        if (cancelled) return
        setFetched(resolved)
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
  }, [allowForbiddenWhenUnresolved, hubName, id])

  const hasRoleAssignment = useCallback(
    (name: string) =>
      groupsFromMulticlusterRoleAssignments(mras ?? [], new Set()).some(
        (candidate) => candidate.metadata.name === name
      ),
    [mras]
  )
  const toastWarning = useCallback(
    (title: string) => toast.addAlert({ type: 'warning', title, autoClose: true }),
    [toast]
  )
  const deletedWithRoleAssignmentTitle = useCallback(
    (name: string) => t('Group {{name}} was deleted. Showing the identity from the role assignment.', { name }),
    [t]
  )
  const deletedTitle = useCallback((name: string) => t('Group {{name}} was deleted.', { name }), [t])
  const detailsPath = useCallback(
    (name: string) => generatePath(NavigationPath.identitiesGroupsDetails, { id: name }),
    []
  )

  useIdentityLiveEvents({
    latestEvent,
    watchedName,
    routeId: id,
    resourceUid: fetched?.metadata?.uid,
    hasRoleAssignment,
    readResource: readGroup,
    setFetched,
    toastWarning,
    deletedWithRoleAssignmentTitle,
    deletedTitle,
    detailsPath,
    listPath: NavigationPath.identitiesGroups,
    navigate,
  })

  const synthetic = loaded && !fetched && !error ? mraIdentity : undefined

  return { group: fetched ?? synthetic, loaded, error }
}
