/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'
import { useFleetSearchSubscription } from '@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Group, GroupKind, UserApiVersion } from '../../../../resources/rbac'
import { getResource, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { AcmToastContext } from '../../../../ui-components'
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

function eventName(data: { name?: unknown } | null | undefined): string | undefined {
  return typeof data?.name === 'string' ? data.name : undefined
}

function eventMatchesGroup(
  uid: string,
  name: string | undefined,
  groupUid: string | undefined,
  groupName: string | undefined
): boolean {
  if (groupName && name === groupName) return true
  if (!groupUid || !uid) return false
  return uid === groupUid || uid.endsWith(`/${groupUid}`)
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

  const handledEventKey = useRef<string | undefined>(undefined)
  const watchedNameRef = useRef(watchedName)
  useEffect(() => {
    watchedNameRef.current = watchedName
  }, [watchedName])

  useEffect(() => {
    if (!latestEvent || !watchedName) return
    const key = `${latestEvent.operation}:${latestEvent.uid}:${String(latestEvent.timestamp)}`
    if (handledEventKey.current === key) return

    const groupUid = fetched?.metadata?.uid
    const dataName = eventName(latestEvent.newData) ?? eventName(latestEvent.oldData)
    if (!eventMatchesGroup(latestEvent.uid, dataName, groupUid, watchedName)) return
    handledEventKey.current = key

    if (latestEvent.operation === 'DELETE') {
      // Match by Group name: the route id may still be the CR uid while the MRA subject is the name.
      const roleAssignmentGroup = groupsFromMulticlusterRoleAssignments(mras ?? [], new Set()).find(
        (candidate) => candidate.metadata.name === watchedName
      )
      if (roleAssignmentGroup) {
        toast.addAlert({
          type: 'warning',
          title: t('Group {{name}} was deleted. Showing the identity from the role assignment.', {
            name: watchedName,
          }),
          autoClose: true,
        })
        if (id !== watchedName) {
          navigate(generatePath(NavigationPath.identitiesGroupsDetails, { id: watchedName }), { replace: true })
        } else {
          setFetched(undefined)
        }
        return
      }
      toast.addAlert({
        type: 'warning',
        title: t('Group {{name}} was deleted.', { name: watchedName }),
        autoClose: true,
      })
      navigate(NavigationPath.identitiesGroups, { replace: true })
      return
    }

    if (latestEvent.operation !== 'UPDATE' && latestEvent.operation !== 'INSERT') return

    const name = watchedName
    void readGroup(name)
      .then((resolved) => {
        if (watchedNameRef.current !== name || !resolved) return
        setFetched(resolved)
      })
      .catch(() => {
        // Keep whatever is on screen (CR or MRA stub) if the background refresh fails.
      })
  }, [fetched?.metadata?.uid, id, latestEvent, mras, navigate, t, toast, watchedName])

  const synthetic = loaded && !fetched && !error ? mraIdentity : undefined

  return { group: fetched ?? synthetic, loaded, error }
}
