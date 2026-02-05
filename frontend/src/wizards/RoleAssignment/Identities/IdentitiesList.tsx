/* Copyright Contributors to the Open Cluster Management project */
import { Content, PageSection, Tab, Tabs, TabTitleText, Title } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Group, User } from '../../../resources/rbac'
import { GroupsTable } from '../../../routes/UserManagement/Identities/Groups/GroupsTable'
import { UsersTable } from '../../../routes/UserManagement/Identities/Users/UsersTable'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { CreatePreAuthorizedUser } from './Users/CreatePreAuthorizedUser'

interface IdentitiesListProps {
  onUserSelect?: (user: User) => void
  onGroupSelect?: (group: Group) => void
  initialSelectedIdentity?: { kind: 'User' | 'Group'; name: string }
}

export function IdentitiesList({ onUserSelect, onGroupSelect, initialSelectedIdentity }: IdentitiesListProps = {}) {
  const { t } = useTranslation()
  const { usersState, groupsState } = useSharedAtoms()
  const users = useRecoilValue(usersState)
  const groups = useRecoilValue(groupsState)

  const [activeTabKey, setActiveTabKey] = useState<string | number>(
    initialSelectedIdentity?.kind === 'Group' ? 'groups' : 'users'
  )
  const [showCreatePreAuthorized, setShowCreatePreAuthorized] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>()

  useEffect(() => {
    if (!initialSelectedIdentity) return

    if (initialSelectedIdentity.kind === 'User' && users && !selectedUser) {
      const user = users.find((u) => u.metadata.name === initialSelectedIdentity.name)
      if (user) setSelectedUser(user)
    } else if (initialSelectedIdentity.kind === 'Group' && groups && !selectedGroup) {
      const group = groups.find((g) => g.metadata.name === initialSelectedIdentity.name)
      if (group) setSelectedGroup(group)
    }
  }, [initialSelectedIdentity, users, groups, selectedUser, selectedGroup])

  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
    setActiveTabKey(tabIndex)
    // Reset to table view when switching tabs
    setShowCreatePreAuthorized(false)
  }

  const handlePreAuthorizedLinkClick = () => {
    setActiveTabKey('users') // Switch to Users tab
    setShowCreatePreAuthorized(true)
  }

  const handleClosePreAuthorizedUser = () => setShowCreatePreAuthorized(false)

  const handleOnUserSelect = (user: User) => {
    setSelectedUser(user)
    onUserSelect?.(user)
  }

  const handleOnGroupSelect = (group: Group) => {
    setSelectedGroup(group)
    onGroupSelect?.(group)
  }

  return (
    <PageSection hasBodyWrapper={false}>
      <Title headingLevel="h1" size="lg" style={{ marginBottom: '0.5rem' }}>
        {t('Identities')}
      </Title>

      <Content component="p" style={{ marginBottom: '1.5rem' }}>
        {t('Select a user or group to assign this role, or ')}{' '}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--pf-global--link--Color)',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
          }}
          onClick={handlePreAuthorizedLinkClick}
        >
          {t('add pre-authorized user')}
        </button>
      </Content>

      <Tabs activeKey={activeTabKey} onSelect={handleTabClick} aria-label={t('Identity selection tabs')}>
        <Tab eventKey="users" title={<TabTitleText>{t('Users')}</TabTitleText>} aria-label={t('Users tab')}>
          <div style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            {showCreatePreAuthorized ? (
              <CreatePreAuthorizedUser onClose={handleClosePreAuthorizedUser} onSuccess={handleOnUserSelect} />
            ) : (
              <UsersTable areLinksDisplayed={false} selectedUser={selectedUser} setSelectedUser={handleOnUserSelect} />
            )}
          </div>
        </Tab>

        <Tab eventKey="groups" title={<TabTitleText>{t('Groups')}</TabTitleText>} aria-label={t('Groups tab')}>
          <div style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            <GroupsTable
              areLinksDisplayed={false}
              selectedGroup={selectedGroup}
              setSelectedGroup={handleOnGroupSelect}
            />
          </div>
        </Tab>
      </Tabs>
    </PageSection>
  )
}
