/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useParams, useLocation, Link, Outlet, useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { User, Group } from '../../../../resources/rbac'
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

export type UserDetailsContext = {
  readonly user?: User
  readonly groups?: Group[]
  readonly loading: boolean
  readonly groupsLoading: boolean
}

const UserPage = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // TODO: Replace the mockdata when backend is implemented
  // const { data: users, loading } = useQuery(listUsers)

  // Use mock data instead of live API for development
  const mockUsers: User[] = [
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: {
        name: 'test-user',
        uid: 'test-user-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      fullName: 'Test User',
      identities: ['htpasswd:test-user'],
    },
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: {
        name: 'alice.trask',
        uid: 'mock-user-alice-trask',
        creationTimestamp: '2024-01-15T10:30:00Z',
      },
      fullName: 'Alice Trask',
      identities: ['ldap:alice.trask', 'htpasswd_provider:alice.trask'],
    },
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: {
        name: 'bob.levy',
        uid: 'mock-user-bob-levy',
        creationTimestamp: '2024-01-16T14:20:00Z',
      },
      fullName: 'Bob Levy',
      identities: ['oauth:github:bob.levy'],
    },
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: {
        name: 'charlie.cranston',
        uid: 'mock-user-charlie-cranston',
        creationTimestamp: '2024-01-17T09:45:00Z',
      },
      fullName: 'Charlie Cranston',
      identities: ['oauth:google:charlie.cranston@company.com'],
    },
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: {
        name: 'sarah.jones',
        uid: 'mock-user-sarah-jones',
        creationTimestamp: '2024-01-18T16:15:00Z',
      },
      fullName: 'Sarah Jones',
      identities: ['ldap:sarah.jones', 'oauth:saml:sarah.jones@enterprise.corp'],
    },
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: {
        name: 'david.brown',
        uid: 'mock-user-david-brown',
        creationTimestamp: '2024-01-19T11:30:00Z',
      },
      fullName: 'David Brown',
      identities: ['htpasswd_provider:david.brown'],
    },
  ]

  // const { data: users, loading } = useQuery(listUsers)
  const users = mockUsers
  const loading = false as boolean
  // Mock groups data - some users belong to groups, others don't
  const mockGroups: Group[] = [
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: 'platform-admins',
        uid: 'mock-group-platform-admins',
        creationTimestamp: '2024-01-10T09:00:00Z',
      },
      users: ['alice.trask', 'sarah.jones'],
    },
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: 'developers',
        uid: 'mock-group-developers',
        creationTimestamp: '2024-01-11T10:30:00Z',
      },
      users: ['bob.levy', 'charlie.cranston'],
    },
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: 'security-team',
        uid: 'mock-group-security-team',
        creationTimestamp: '2024-01-12T14:15:00Z',
      },
      users: ['alice.trask'],
    },
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: 'qa-engineers',
        uid: 'mock-group-qa-engineers',
        creationTimestamp: '2024-01-13T11:45:00Z',
      },
      users: ['charlie.cranston'],
    },
  ]

  // const { data: groups, loading: groupsLoading } = useQuery(listGroups)
  const groups = mockGroups
  const groupsLoading = false as boolean

  const user = useMemo(() => {
    if (!users || !id) return undefined
    return users.find((u) => u.metadata.uid === id || u.metadata.name === id)
  }, [users, id])

  const userDetailsContext = useMemo<UserDetailsContext>(
    () => ({
      user,
      groups,
      loading,
      groupsLoading,
    }),
    [user, groups, loading, groupsLoading]
  )

  const isDetailsActive = location.pathname === generatePath(NavigationPath.identitiesUsersDetails, { id: id ?? '' })
  const isYamlActive = location.pathname.includes('/yaml')
  const isRoleAssignmentsActive = location.pathname.includes('/role-assignments')
  const isGroupsActive = location.pathname.includes('/groups')

  switch (true) {
    case loading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !user:
      return (
        <Page>
          <ErrorPage
            error={new ResourceError(ResourceErrorCode.NotFound)}
            actions={
              <AcmButton
                role="link"
                onClick={() => navigate(NavigationPath.identitiesUsers)}
                style={{ marginRight: '10px' }}
              >
                {t('button.backToUsers')}
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
              title={user.fullName ?? user.metadata.name}
              description={user.metadata.name}
              breadcrumb={[
                { text: t('User Management'), to: NavigationPath.roles },
                { text: t('Identities'), to: NavigationPath.identities },
                { text: t('Users'), to: NavigationPath.identitiesUsers },
                { text: user.fullName ?? user.metadata.name ?? t('Unknown User') },
              ]}
              navigation={
                <AcmSecondaryNav>
                  <AcmSecondaryNavItem isActive={isDetailsActive}>
                    <Link to={generatePath(NavigationPath.identitiesUsersDetails, { id: id ?? '' })}>
                      {t('Details')}
                    </Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isYamlActive}>
                    <Link to={generatePath(NavigationPath.identitiesUsersYaml, { id: id ?? '' })}>{t('YAML')}</Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isRoleAssignmentsActive}>
                    <Link to={generatePath(NavigationPath.identitiesUsersRoleAssignments, { id: id ?? '' })}>
                      {t('Role assignments')}
                    </Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isGroupsActive}>
                    <Link to={generatePath(NavigationPath.identitiesUsersGroups, { id: id ?? '' })}>{t('Groups')}</Link>
                  </AcmSecondaryNavItem>
                </AcmSecondaryNav>
              }
            />
          }
        >
          <Outlet context={userDetailsContext} />
        </AcmPage>
      )
  }
}

export { UserPage }

export function useUserDetailsContext() {
  return useOutletContext<UserDetailsContext>()
}
