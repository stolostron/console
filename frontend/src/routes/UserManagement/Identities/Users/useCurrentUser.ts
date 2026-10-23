/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'
import { useFleetSearchSubscription } from '@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { User, UserApiVersion, UserKind } from '../../../../resources/rbac'
import { getResource, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { AcmToastContext } from '../../../../ui-components'
import { usersFromMulticlusterRoleAssignments } from '../useMergedIdentities'
import { findIndexedUserName, hubUserFilters } from './useUsersSearch'

export type CurrentUser = {
  user?: User
  loaded: boolean
  error?: Error
}

async function readUser(name: string): Promise<User | undefined> {
  try {
    return await getResource<User>({
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: { name },
    }).promise
  } catch (err) {
    if (err instanceof ResourceError && err.code === ResourceErrorCode.NotFound) return undefined
    throw err
  }
}

function eventName(data: { name?: unknown } | null | undefined): string | undefined {
  return typeof data?.name === 'string' ? data.name : undefined
}

function eventMatchesUser(
  uid: string,
  name: string | undefined,
  userUid: string | undefined,
  userName: string | undefined
): boolean {
  if (userName && name === userName) return true
  if (!userUid || !uid) return false
  return uid === userUid || uid.endsWith(`/${userUid}`)
}

/** useNavigate returns void in declarative mode and a Promise in data routers. */
function settleNavigation(navigation: void | Promise<void>) {
  Promise.resolve(navigation).catch(() => {
    // The toast already explains the deletion; a failed redirect should not surface again.
  })
}

export const useCurrentUser = (): CurrentUser => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useContext(AcmToastContext)
  const hubName = useLocalHubName()
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const mras = useSharedValue(multiclusterRoleAssignmentState)
  const [fetched, setFetched] = useState<User>()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<Error>()

  // Watch by identity name even when only an MRA stub exists (no User CR yet), so INSERT
  // of the CR upgrades YAML/Groups without leaving the page.
  const mraIdentity = useMemo(
    () =>
      id
        ? usersFromMulticlusterRoleAssignments(mras ?? [], new Set()).find(
            (candidate) => candidate.metadata.uid === id || candidate.metadata.name === id
          )
        : undefined,
    [id, mras]
  )
  const watchedName = fetched?.metadata?.name ?? mraIdentity?.metadata?.name
  // Do not filter the watch by `name`: Search delivers User events on the broad hub
  // watch (same as the Users list) but often sends none when `name` is set — Details/YAML
  // would stay stale while the list still updated. Match the watched user client-side.
  const watchInput = useMemo(
    () => (watchedName ? { filters: hubUserFilters() } : undefined),
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
        // Search alone is not enough (no identities/groups/fullName); MRA synthetic is last resort only.
        let indexedName: string | undefined
        try {
          indexedName = await findIndexedUserName(id, hubName)
        } catch {
          // Search failures must not block the MRA-only fallback below.
          indexedName = undefined
        }
        if (cancelled) return
        if (indexedName) {
          const resolved = await readUser(indexedName)
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
        setError(err instanceof Error ? err : new Error('Failed to load user'))
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

    const userUid = fetched?.metadata?.uid
    const dataName = eventName(latestEvent.newData) ?? eventName(latestEvent.oldData)
    if (!eventMatchesUser(latestEvent.uid, dataName, userUid, watchedName)) return
    handledEventKey.current = key

    if (latestEvent.operation === 'DELETE') {
      // Match by User name: the route id may still be the CR uid while the MRA subject is the name.
      const hasRoleAssignment = usersFromMulticlusterRoleAssignments(mras ?? [], new Set()).some(
        (candidate) => candidate.metadata.name === watchedName
      )
      if (hasRoleAssignment) {
        toast.addAlert({
          type: 'warning',
          title: t('User {{name}} was deleted. Showing the identity from the role assignment.', {
            name: watchedName,
          }),
          autoClose: true,
        })
        if (id !== watchedName) {
          settleNavigation(
            navigate(generatePath(NavigationPath.identitiesUsersDetails, { id: watchedName }), { replace: true })
          )
        } else {
          setFetched(undefined)
        }
        return
      }
      toast.addAlert({
        type: 'warning',
        title: t('User {{name}} was deleted.', { name: watchedName }),
        autoClose: true,
      })
      settleNavigation(navigate(NavigationPath.identitiesUsers, { replace: true }))
      return
    }

    if (latestEvent.operation !== 'UPDATE' && latestEvent.operation !== 'INSERT') return

    const name = watchedName
    void readUser(name)
      .then((resolved) => {
        if (watchedNameRef.current !== name || !resolved) return
        setFetched(resolved)
      })
      .catch(() => {
        // Keep whatever is on screen (CR or MRA stub) if the background refresh fails.
      })
  }, [fetched?.metadata?.uid, id, latestEvent, mras, navigate, t, toast, watchedName])

  const synthetic = loaded && !fetched && !error ? mraIdentity : undefined

  return { user: fetched ?? synthetic, loaded, error }
}
