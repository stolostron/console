/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, PageSection, Tab, Tabs, TabTitleText, Title } from '@patternfly/react-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { Group, User } from '../../resources/rbac'
import { GroupsTable } from '../../routes/UserManagement/Identities/Groups/GroupsTable'
import {
  isSearchBackedGroup,
  useGroupIdentity,
  useHasHubGroups,
  useMraGroupSubjects,
} from '../../routes/UserManagement/Identities/Groups/useGroupsSearch'
import {
  isSearchBackedUser,
  useHasHubUsers,
  useMraUserSubjects,
  useUserIdentity,
} from '../../routes/UserManagement/Identities/Users/useUsersSearch'
import { UsersTable } from '../../routes/UserManagement/Identities/Users/UsersTable'
import { useSharedValue, useSharedAtoms } from '../../shared-atoms'
import { IAcmTableButtonAction } from '../../ui-components/AcmTable/AcmTableTypes'
import { CreatePreAuthorizedIdentity } from './CreatePreAuthorizedIdentity'

interface IdentitiesListProps {
  onUserSelect?: (user: User) => void
  onGroupSelect?: (group: Group) => void
  initialSelectedIdentity?: { kind: 'User' | 'Group'; name: string }
  /**
   * Hub Users from listUsers(). When provided, the Users tab skips Search
   * (required for MCE Cluster Set access management).
   */
  users?: User[]
  usersLoading?: boolean
  usersError?: Error
  /**
   * Hub Groups from listGroups(). When provided, the Groups tab skips Search
   * (required for MCE Cluster Set access management).
   */
  groups?: Group[]
  groupsLoading?: boolean
  groupsError?: Error
}

type IdentitiesListBaseProps = Omit<
  IdentitiesListProps,
  'users' | 'usersLoading' | 'usersError' | 'groups' | 'groupsLoading' | 'groupsError'
>

type UsersResolvedProps = IdentitiesListBaseProps & {
  hasUsers: boolean
  initialUser: User | undefined
  hubUsers?: User[]
  usersLoading?: boolean
  usersError?: Error
  groups?: Group[]
  groupsLoading?: boolean
  groupsError?: Error
}

export function IdentitiesList(props: Readonly<IdentitiesListProps> = {}) {
  const { users, usersLoading, usersError, ...listProps } = props
  if (users !== undefined) {
    return (
      <IdentitiesListWithHubUsers
        {...listProps}
        users={users}
        usersLoading={usersLoading}
        usersError={usersError}
      />
    )
  }
  return <IdentitiesListWithSearchUsers {...listProps} />
}

function IdentitiesListWithSearchUsers(
  props: Readonly<Omit<IdentitiesListProps, 'users' | 'usersLoading' | 'usersError'>>
) {
  const { hasUsers } = useHasHubUsers()
  const initialUserName =
    props.initialSelectedIdentity?.kind === 'User' ? props.initialSelectedIdentity.name : undefined
  const initialUser = useUserIdentity(initialUserName)

  return <ResolveGroups {...props} hasUsers={hasUsers} initialUser={initialUser} />
}

function IdentitiesListWithHubUsers(
  props: Readonly<Omit<IdentitiesListProps, 'users'> & { users: User[] }>
) {
  const { users, usersLoading, usersError, initialSelectedIdentity, ...rest } = props
  const mraUsers = useMraUserSubjects()
  const hasUsers = users.length > 0 || mraUsers.length > 0
  const initialUser = useMemo(() => {
    if (initialSelectedIdentity?.kind !== 'User') return undefined
    return (
      users.find((user) => user.metadata.name === initialSelectedIdentity.name) ??
      mraUsers.find((user) => user.metadata.name === initialSelectedIdentity.name)
    )
  }, [initialSelectedIdentity, mraUsers, users])

  return (
    <ResolveGroups
      {...rest}
      initialSelectedIdentity={initialSelectedIdentity}
      hasUsers={hasUsers}
      initialUser={initialUser}
      hubUsers={users}
      usersLoading={usersLoading}
      usersError={usersError}
    />
  )
}

function ResolveGroups(props: Readonly<UsersResolvedProps>) {
  const { groups, groupsLoading, groupsError, ...rest } = props
  if (groups !== undefined) {
    return (
      <IdentitiesListWithHubGroups
        {...rest}
        groups={groups}
        groupsLoading={groupsLoading}
        groupsError={groupsError}
      />
    )
  }
  return <IdentitiesListWithSearchGroups {...rest} />
}

function IdentitiesListWithSearchGroups(
  props: Readonly<Omit<UsersResolvedProps, 'groups' | 'groupsLoading' | 'groupsError'>>
) {
  const { hasGroups } = useHasHubGroups()
  const initialGroupName =
    props.initialSelectedIdentity?.kind === 'Group' ? props.initialSelectedIdentity.name : undefined
  const initialGroup = useGroupIdentity(initialGroupName)

  return <IdentitiesListView {...props} hasGroups={hasGroups} initialGroup={initialGroup} />
}

function IdentitiesListWithHubGroups(
  props: Readonly<Omit<UsersResolvedProps, 'groups'> & { groups: Group[] }>
) {
  const { groups, groupsLoading, groupsError, initialSelectedIdentity, ...rest } = props
  const mraGroups = useMraGroupSubjects()
  const hasGroups = groups.length > 0 || mraGroups.length > 0
  const initialGroup = useMemo(() => {
    if (initialSelectedIdentity?.kind !== 'Group') return undefined
    return (
      groups.find((group) => group.metadata.name === initialSelectedIdentity.name) ??
      mraGroups.find((group) => group.metadata.name === initialSelectedIdentity.name)
    )
  }, [groups, initialSelectedIdentity, mraGroups])

  return (
    <IdentitiesListView
      {...rest}
      initialSelectedIdentity={initialSelectedIdentity}
      hasGroups={hasGroups}
      initialGroup={initialGroup}
      hubGroups={groups}
      groupsLoading={groupsLoading}
      groupsError={groupsError}
    />
  )
}

interface IdentitiesListViewProps extends IdentitiesListBaseProps {
  hasUsers: boolean
  initialUser: User | undefined
  hubUsers?: User[]
  usersLoading?: boolean
  usersError?: Error
  hasGroups: boolean
  initialGroup: Group | undefined
  hubGroups?: Group[]
  groupsLoading?: boolean
  groupsError?: Error
}

function IdentitiesListView({
  onUserSelect,
  onGroupSelect,
  initialSelectedIdentity,
  hasUsers,
  initialUser,
  hubUsers,
  usersLoading,
  usersError,
  hasGroups,
  initialGroup,
  hubGroups,
  groupsLoading,
  groupsError,
}: Readonly<IdentitiesListViewProps>) {
  const { t } = useTranslation()

  const { isDirectAuthenticationEnabledState } = useSharedAtoms()
  const isDirectAuthenticationEnabled = useSharedValue(isDirectAuthenticationEnabledState)

  const [activeTabKey, setActiveTabKey] = useState<string | number>(
    initialSelectedIdentity?.kind === 'Group' ? 'groups' : 'users'
  )
  const [showCreatePreAuthorizedUser, setShowCreatePreAuthorizedUser] = useState(false)
  const [showCreatePreAuthorizedGroup, setShowCreatePreAuthorizedGroup] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>()
  const [additionalUsers, setAdditionalUsers] = useState<User[]>([])
  const [additionalGroups, setAdditionalGroups] = useState<Group[]>([])

  useEffect(() => {
    if (!initialSelectedIdentity) return

    if (initialSelectedIdentity.kind === 'User') {
      if (!initialUser) return
      const shouldSelectInitialUser =
        !selectedUser ||
        (selectedUser.metadata.name === initialUser.metadata.name &&
          !isSearchBackedUser(selectedUser) &&
          isSearchBackedUser(initialUser))
      if (shouldSelectInitialUser) {
        setSelectedUser(initialUser)
      }
      return
    }

    if (!initialGroup) return

    const shouldSelectInitialGroup =
      !selectedGroup ||
      (selectedGroup.metadata.name === initialGroup.metadata.name &&
        !isSearchBackedGroup(selectedGroup) &&
        isSearchBackedGroup(initialGroup))

    if (shouldSelectInitialGroup) {
      setSelectedGroup(initialGroup)
    }
  }, [initialGroup, initialSelectedIdentity, initialUser, selectedGroup, selectedUser])

  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
    setActiveTabKey(tabIndex)
    setShowCreatePreAuthorizedUser(false)
    setShowCreatePreAuthorizedGroup(false)
  }

  const handleClosePreAuthorizedIdentity = () => {
    setShowCreatePreAuthorizedUser(false)
    setShowCreatePreAuthorizedGroup(false)
  }

  const handleOnUserSelect = useCallback(
    (user: User) => {
      setSelectedUser(user)
      onUserSelect?.(user)
    },
    [onUserSelect]
  )

  const handleOnGroupSelect = useCallback(
    (group: Group) => {
      setSelectedGroup(group)
      onGroupSelect?.(group)
    },
    [onGroupSelect]
  )

  const handleUserCreated = useCallback(
    (identity: User | Group) => {
      const user = identity as User
      setAdditionalUsers((prev) => {
        if (prev.some((u) => u.metadata.name === user.metadata.name)) return prev
        return [...prev, user]
      })
      handleOnUserSelect(user)
    },
    [handleOnUserSelect]
  )

  const handleGroupCreated = useCallback(
    (identity: User | Group) => {
      const group = identity as Group
      setAdditionalGroups((prev) => {
        if (prev.some((g) => g.metadata.name === group.metadata.name)) return prev
        return [...prev, group]
      })
      handleOnGroupSelect(group)
    },
    [handleOnGroupSelect]
  )

  const userTableActionButtons = useMemo<IAcmTableButtonAction[]>(
    () => [
      {
        id: 'create-pre-authorized-user',
        title: isDirectAuthenticationEnabled ? t('Add user') : t('Create user'),
        click: () => setShowCreatePreAuthorizedUser(true),
        variant: hasUsers || additionalUsers.length > 0 ? ButtonVariant.secondary : ButtonVariant.primary,
      },
    ],
    [additionalUsers.length, hasUsers, isDirectAuthenticationEnabled, t]
  )

  const groupTableActionButtons = useMemo<IAcmTableButtonAction[]>(
    () => [
      {
        id: 'create-pre-authorized-group',
        title: isDirectAuthenticationEnabled ? t('Add group') : t('Create group'),
        click: () => setShowCreatePreAuthorizedGroup(true),
        variant: hasGroups || additionalGroups.length > 0 ? ButtonVariant.secondary : ButtonVariant.primary,
      },
    ],
    [additionalGroups.length, hasGroups, isDirectAuthenticationEnabled, t]
  )

  return (
    <PageSection hasBodyWrapper={false}>
      <Title headingLevel="h1" size="lg" style={{ marginBottom: '0.5rem' }}>
        {t('Identities')}
      </Title>

      <Tabs activeKey={activeTabKey} onSelect={handleTabClick} aria-label={t('Identity selection tabs')}>
        <Tab eventKey="users" title={<TabTitleText>{t('Users')}</TabTitleText>} aria-label={t('Users tab')}>
          <div style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            {showCreatePreAuthorizedUser ? (
              <CreatePreAuthorizedIdentity
                subjectKind="User"
                onClose={handleClosePreAuthorizedIdentity}
                onSuccess={handleUserCreated}
              />
            ) : (
              <UsersTable
                areLinksDisplayed={false}
                selectedUser={selectedUser}
                setSelectedUser={handleOnUserSelect}
                additionalUsers={additionalUsers}
                users={hubUsers}
                usersLoading={usersLoading}
                usersError={usersError}
                isCreateButtonDisplayed
                createButtonText={isDirectAuthenticationEnabled ? t('Add user') : undefined}
                onCreateClick={() => setShowCreatePreAuthorizedUser(true)}
                tableActionButtons={userTableActionButtons}
              />
            )}
          </div>
        </Tab>

        <Tab eventKey="groups" title={<TabTitleText>{t('Groups')}</TabTitleText>} aria-label={t('Groups tab')}>
          <div style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            {showCreatePreAuthorizedGroup ? (
              <CreatePreAuthorizedIdentity
                subjectKind="Group"
                onClose={handleClosePreAuthorizedIdentity}
                onSuccess={handleGroupCreated}
              />
            ) : (
              <GroupsTable
                areLinksDisplayed={false}
                selectedGroup={selectedGroup}
                setSelectedGroup={handleOnGroupSelect}
                additionalGroups={additionalGroups}
                groups={hubGroups}
                groupsLoading={groupsLoading}
                groupsError={groupsError}
                isCreateButtonDisplayed
                createButtonText={isDirectAuthenticationEnabled ? t('Add group') : undefined}
                onCreateClick={() => setShowCreatePreAuthorizedGroup(true)}
                tableActionButtons={groupTableActionButtons}
              />
            )}
          </div>
        </Tab>
      </Tabs>
    </PageSection>
  )
}
