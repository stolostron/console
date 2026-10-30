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
import { eventMatchesIdentity, eventResourceName, settleNavigation } from '../searchIdentityHelpers'
import { usersFromMulticlusterRoleAssignments } from '../useMergedIdentities'
import { findIndexedUserName, hubUserWatchFilters } from './useUsersSearch'

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
  const watchInput = useMemo(
    () => (watchedName ? { filters: hubUserWatchFilters(watchedName) } : undefined),
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
        // When Search misses (errorPolicy, lag, or throw), still try getResource with the route id —
        // names resolve; uids NotFound safely and fall through to MRA.
        let indexedName: string | undefined
        try {
          indexedName = await findIndexedUserName(id, hubName)
        } catch {
          // Search failures must not block the getResource / MRA fallbacks below.
          indexedName = undefined
        }
        if (cancelled) return
        const resolved = await readUser(indexedName ?? id)
        if (cancelled) return
        if (resolved) {
          setFetched(resolved)
          setLoaded(true)
          return
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
    const dataName = eventResourceName(latestEvent.newData) ?? eventResourceName(latestEvent.oldData)
    if (!eventMatchesIdentity(latestEvent.uid, dataName, userUid, watchedName)) return
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
