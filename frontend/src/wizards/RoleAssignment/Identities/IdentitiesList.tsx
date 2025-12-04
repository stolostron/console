/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, Tab, Tabs, TabTitleText, Text, Title } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { GroupsTable } from '../../../routes/UserManagement/Identities/Groups/GroupsTable'
import { UsersTable } from '../../../routes/UserManagement/Identities/Users/UsersTable'
import { CreatePreAuthorizedUser } from './CreatePreAuthorizedUser'
import { User, Group } from '../../../resources/rbac'

interface IdentitiesListProps {
  onUserSelect?: (user: User) => void
  onGroupSelect?: (group: Group) => void
}

export function IdentitiesList({ onUserSelect, onGroupSelect }: IdentitiesListProps = {}) {
  const { t } = useTranslation()
  const [activeTabKey, setActiveTabKey] = useState<string | number>('users')
  const [showCreatePreAuthorized, setShowCreatePreAuthorized] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User>()
  const [selectedGroup, setSelectedGroup] = useState<Group>()

  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
    setActiveTabKey(tabIndex)
    // Reset to table view when switching tabs
    setShowCreatePreAuthorized(false)
  }

  const handlePreAuthorizedLinkClick = () => {
    setActiveTabKey('users') // Switch to Users tab
    setShowCreatePreAuthorized(true)
  }

  const handleCancelPreAuthorized = () => setShowCreatePreAuthorized(false)

  const handlePreAuthorizedSubmit = () => setShowCreatePreAuthorized(false)

  const handleOnUserSelect = (user: User) => {
    setSelectedUser(user)
    onUserSelect?.(user)
  }

  const handleOnGroupSelect = (group: Group) => {
    setSelectedGroup(group)
    onGroupSelect?.(group)
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="lg" style={{ marginBottom: '0.5rem' }}>
        {t('Identities')}
      </Title>

      <Text style={{ marginBottom: '1.5rem' }}>
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
      </Text>

      <Tabs activeKey={activeTabKey} onSelect={handleTabClick} aria-label={t('Identity selection tabs')}>
        <Tab eventKey="users" title={<TabTitleText>{t('Users')}</TabTitleText>} aria-label={t('Users tab')}>
          {showCreatePreAuthorized ? (
            <CreatePreAuthorizedUser onCancel={handleCancelPreAuthorized} onSubmit={handlePreAuthorizedSubmit} />
          ) : (
            <UsersTable areLinksDisplayed={false} selectedUser={selectedUser} setSelectedUser={handleOnUserSelect} />
          )}
        </Tab>

        <Tab eventKey="groups" title={<TabTitleText>{t('Groups')}</TabTitleText>} aria-label={t('Groups tab')}>
          <GroupsTable areLinksDisplayed={false} selectedGroup={selectedGroup} setSelectedGroup={handleOnGroupSelect} />
        </Tab>
      </Tabs>
    </PageSection>
  )
}
