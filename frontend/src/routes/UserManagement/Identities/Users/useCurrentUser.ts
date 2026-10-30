/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'
import { useFleetSearchSubscription } from '@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { User, UserApiVersion, UserKind } from '../../../../resources/rbac'
import { getResource, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { AcmToastContext } from '../../../../ui-components'
import { resolveIndexedThenRead, useIdentityLiveEvents } from '../searchIdentityHelpers'
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
        // Search alone is not enough (no identities/groups/fullName); MRA synthetic is last resort.
        // Forbidden on an unresolved route id with a matching MRA must not hide the stub.
        const resolved = await resolveIndexedThenRead(id, hubName, findIndexedUserName, readUser, {
          allowForbiddenWhenUnresolved: Boolean(mraIdentity),
        })
        if (cancelled) return
        setFetched(resolved)
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
    // Depend on MRA identity keys (not the object) so late MRA data retries without loops.
  }, [hubName, id, mraIdentity?.metadata?.name, mraIdentity?.metadata?.uid])

  const hasRoleAssignment = useCallback(
    (name: string) =>
      usersFromMulticlusterRoleAssignments(mras ?? [], new Set()).some((candidate) => candidate.metadata.name === name),
    [mras]
  )
  const toastWarning = useCallback(
    (title: string) => toast.addAlert({ type: 'warning', title, autoClose: true }),
    [toast]
  )
  const deletedWithRoleAssignmentTitle = useCallback(
    (name: string) => t('User {{name}} was deleted. Showing the identity from the role assignment.', { name }),
    [t]
  )
  const deletedTitle = useCallback((name: string) => t('User {{name}} was deleted.', { name }), [t])
  const detailsPath = useCallback(
    (name: string) => generatePath(NavigationPath.identitiesUsersDetails, { id: name }),
    []
  )

  useIdentityLiveEvents({
    latestEvent,
    watchedName,
    routeId: id,
    resourceUid: fetched?.metadata?.uid,
    hasRoleAssignment,
    readResource: readUser,
    setFetched,
    toastWarning,
    deletedWithRoleAssignmentTitle,
    deletedTitle,
    detailsPath,
    listPath: NavigationPath.identitiesUsers,
    navigate,
  })

  const synthetic = loaded && !fetched && !error ? mraIdentity : undefined

  return { user: fetched ?? synthetic, loaded, error }
}
