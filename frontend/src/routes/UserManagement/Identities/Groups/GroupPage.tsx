/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useParams, useLocation, Link, Outlet, useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { User, Group, UserApiVersion, UserKind, GroupKind } from '../../../../resources/rbac'
import {
  AcmPage,
  AcmPageHeader,
  AcmSecondaryNav,
  AcmSecondaryNavItem,
  AcmLoadingPage,
  AcmButton,
} from '../../../../ui-components'
import { NavigationPath } from '../../../../NavigationPath'
import { generatePath, useOutletContext } from 'react-router-dom-v5-compat'
import { Page, PageSection } from '@patternfly/react-core'
import { ErrorPage } from '../../../../components/ErrorPage'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'

export type GroupDetailsContext = {
  readonly group?: Group
  readonly users?: User[]
  readonly loading: boolean
  readonly usersLoading: boolean
}

const GroupPage = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  // TODO: Replace the mockdata when backend is implemented

  const mockUsers: User[] = [
    {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'test-user',
        uid: 'test-user-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      fullName: 'Test User',
      identities: ['htpasswd:test-user'],
    },
    {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'alice.trask',
        uid: 'mock-user-alice-trask',
        creationTimestamp: '2024-01-15T10:30:00Z',
      },
      fullName: 'Alice Trask',
      identities: ['ldap:alice.trask', 'htpasswd_provider:alice.trask'],
    },
    {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'bob.levy',
        uid: 'mock-user-bob-levy',
        creationTimestamp: '2024-01-16T14:20:00Z',
      },
      fullName: 'Bob Levy',
      identities: ['oauth:github:bob.levy'],
    },
    {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'charlie.cranston',
        uid: 'mock-user-charlie-cranston',
        creationTimestamp: '2024-01-17T09:45:00Z',
      },
      fullName: 'Charlie Cranston',
      identities: ['oauth:google:charlie.cranston@company.com'],
    },
    {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'sarah.jones',
        uid: 'mock-user-sarah-jones',
        creationTimestamp: '2024-01-18T16:15:00Z',
      },
      fullName: 'Sarah Jones',
      identities: ['ldap:sarah.jones', 'oauth:saml:sarah.jones@enterprise.corp'],
    },
  ]

  const users = mockUsers
  const loading = false as boolean

  // TODO: Replace the mockdata when backend is implemented

  const mockGroups: Group[] = [
    {
      apiVersion: UserApiVersion,
      kind: GroupKind,
      metadata: {
        name: 'kubevirt-admins',
        uid: 'mock-group-kubevirt-admins',
        creationTimestamp: '2024-01-10T09:00:00Z',
      },
      users: ['alice.trask', 'sarah.jones'],
    },
    {
      apiVersion: UserApiVersion,
      kind: GroupKind,
      metadata: {
        name: 'developers',
        uid: 'mock-group-developers',
        creationTimestamp: '2024-01-11T10:30:00Z',
      },
      users: ['bob.levy', 'charlie.cranston'],
    },
    {
      apiVersion: UserApiVersion,
      kind: GroupKind,
      metadata: {
        name: 'sre-team',
        uid: 'mock-group-sre-team',
        creationTimestamp: '2024-01-12T14:15:00Z',
      },
      users: ['alice.trask'],
    },
    {
      apiVersion: UserApiVersion,
      kind: GroupKind,
      metadata: {
        name: 'security-auditors',
        uid: 'mock-group-security-auditors',
        creationTimestamp: '2024-01-13T11:45:00Z',
      },
      users: ['charlie.cranston'],
    },
    {
      apiVersion: UserApiVersion,
      kind: GroupKind,
      metadata: {
        name: 'storage-team',
        uid: 'mock-group-storage-team',
        creationTimestamp: '2024-01-14T12:00:00Z',
      },
      users: ['sarah.jones'],
    },
  ]

  const groups = mockGroups
  const groupsLoading = false as boolean
  const group = useMemo(() => {
    if (!groups || !id) return undefined
    return groups.find((u) => u.metadata.uid === id || u.metadata.name === id)
  }, [groups, id])

  const groupDetailsContext = useMemo<GroupDetailsContext>(
    () => ({
      group,
      users,
      loading,
      usersLoading: groupsLoading,
    }),
    [group, users, loading, groupsLoading]
  )

  const isDetailsActive = location.pathname === generatePath(NavigationPath.identitiesGroupsDetails, { id: id ?? '' })
  const isYamlActive = location.pathname.includes('/yaml')
  const isRoleAssignmentsActive = location.pathname.includes('/role-assignments')
  const isUsersActive = location.pathname.includes('/users')

  switch (true) {
    case loading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !group:
      return (
        <Page>
          <ErrorPage
            error={new ResourceError(ResourceErrorCode.NotFound)}
            actions={
              <AcmButton
                role="link"
                onClick={() => navigate(NavigationPath.identitiesGroups)}
                style={{ marginRight: '10px' }}
              >
                {t('button.backToGroups')}
              </AcmButton>
            }
          />
        </Page>
      )
    default:
      return (
        <AcmPage
          hasDrawer
          header={
            <AcmPageHeader
              title={group.metadata.name ?? t('Unknown Group')}
              description={group.metadata.name}
              breadcrumb={[
                { text: t('User Management'), to: NavigationPath.identitiesGroups },
                { text: t('Identities'), to: NavigationPath.identities },
                { text: t('Groups'), to: NavigationPath.identitiesGroups },
                { text: group.metadata.name ?? t('Unknown Group') },
              ]}
              navigation={
                <AcmSecondaryNav>
                  <AcmSecondaryNavItem isActive={isDetailsActive}>
                    <Link to={generatePath(NavigationPath.identitiesGroupsDetails, { id: id ?? '' })}>
                      {t('Details')}
                    </Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isYamlActive}>
                    <Link to={generatePath(NavigationPath.identitiesGroupsYaml, { id: id ?? '' })}>{t('YAML')}</Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isRoleAssignmentsActive}>
                    <Link to={generatePath(NavigationPath.identitiesGroupsRoleAssignments, { id: id ?? '' })}>
                      {t('Role assignments')}
                    </Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isUsersActive}>
                    <Link to={generatePath(NavigationPath.identitiesGroupsUsers, { id: id ?? '' })}>{t('Users')}</Link>
                  </AcmSecondaryNavItem>
                </AcmSecondaryNav>
              }
            />
          }
        >
          <Outlet context={groupDetailsContext} />
        </AcmPage>
      )
  }
}

export { GroupPage }

export function useGroupDetailsContext() {
  return useOutletContext<GroupDetailsContext>()
}
