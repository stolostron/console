/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useState } from 'react'
import { generatePath, Outlet, useLocation, useOutletContext, useParams } from 'react-router'
import { ErrorPage } from '../../../../components/ErrorPage'
import { LoadingPage } from '../../../../components/LoadingPage'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Group, GroupKind, User, UserApiVersion } from '../../../../resources/rbac'
import { getResource, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useSharedValue, useSharedAtoms } from '../../../../shared-atoms'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../../ui-components'
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
        const direct = await readGroup(id)
        if (cancelled) return
        if (direct) {
          setFetched(direct)
          setLoaded(true)
          return
        }

        let indexedName: string | undefined
        try {
          indexedName = await findIndexedGroupName(id, hubName)
        } catch {
          // Search failures must not block the MRA-only fallback below.
          indexedName = undefined
        }
        if (cancelled) return
        if (indexedName && indexedName !== id) {
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
            (candidate) => candidate.metadata.name === id || candidate.metadata.uid === id
          )
        : undefined,
    [error, fetched, id, loaded, mras]
  )

  return { group: fetched ?? synthetic, loaded, error }
}

export type GroupDetailsContext = {
  readonly group?: Group
  readonly users?: User[]
}

const GroupPage = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const location = useLocation()

  const { group, loaded, error } = useCurrentGroup()
  const { usersState, isDirectAuthenticationEnabledState } = useSharedAtoms()
  const users = useSharedValue(usersState)
  const isDirectAuth = useSharedValue(isDirectAuthenticationEnabledState)

  const groupDetailsContext = useMemo<GroupDetailsContext>(
    () => ({
      group,
      users,
    }),
    [group, users]
  )

  const isDetailsActive = location.pathname === generatePath(NavigationPath.identitiesGroupsDetails, { id: id ?? '' })
  const isYamlActive = location.pathname.includes('/yaml')
  const isRoleAssignmentsActive = location.pathname.includes('/role-assignments')
  const isUsersActive = location.pathname.includes('/users')

  const backToGroups = (
    <AcmButton component="a" href={NavigationPath.identitiesGroups} style={{ marginRight: '10px' }}>
      {t('button.backToGroups')}
    </AcmButton>
  )

  if (!loaded) {
    return <LoadingPage />
  }

  if (!group) {
    return <ErrorPage error={error ?? new ResourceError(ResourceErrorCode.NotFound)} actions={backToGroups} />
  }

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={group?.metadata.name ?? t('Unknown Group')}
          description={group?.metadata.name}
          breadcrumb={[
            { text: t('Identities'), to: NavigationPath.identities },
            { text: t('Groups'), to: NavigationPath.identitiesGroups },
            { text: group?.metadata.name ?? t('Unknown Group') },
          ]}
          navigation={
            <AcmSecondaryNav
              navItems={[
                {
                  key: 'user-mgmt-identities-groups-details',
                  title: t('Details'),
                  isActive: isDetailsActive,
                  to: generatePath(NavigationPath.identitiesGroupsDetails, { id: id ?? '' }),
                },
                ...(!isDirectAuth
                  ? [
                      {
                        key: 'user-mgmt-identities-groups-yaml',
                        title: t('YAML'),
                        isActive: isYamlActive,
                        to: generatePath(NavigationPath.identitiesGroupsYaml, { id: id ?? '' }),
                      },
                    ]
                  : []),
                {
                  key: 'user-mgmt-identities-groups-role-assignments',
                  title: t('Role assignments'),
                  isActive: isRoleAssignmentsActive,
                  to: generatePath(NavigationPath.identitiesGroupsRoleAssignments, { id: id ?? '' }),
                },
                ...(!isDirectAuth
                  ? [
                      {
                        key: 'user-mgmt-identities-groups-users',
                        title: t('Users'),
                        isActive: isUsersActive,
                        to: generatePath(NavigationPath.identitiesGroupsUsers, { id: id ?? '' }),
                      },
                    ]
                  : []),
              ]}
            />
          }
        />
      }
    >
      <Outlet context={groupDetailsContext} />
    </AcmPage>
  )
}

export { GroupPage }

export function useGroupDetailsContext() {
  return useOutletContext<GroupDetailsContext>()
}
