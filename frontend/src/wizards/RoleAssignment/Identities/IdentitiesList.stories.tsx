/* Copyright Contributors to the Open Cluster Management project */

import {
  Button,
  PageSection,
  Tab,
  Tabs,
  TabTitleText,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'

const MockUsersTable = ({
  onUserClick,
  actionButton,
}: {
  onUserClick?: () => void
  actionButton?: React.ReactNode
}) => (
  <div style={{ border: '1px dashed #ccc' }}>
    {actionButton && (
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>{actionButton}</ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    )}
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <h3>Users Table (Mocked)</h3>
      <p>This would show the actual users table with data</p>
      <button onClick={onUserClick} style={{ marginTop: '0.5rem' }}>
        Select Mock User
      </button>
    </div>
  </div>
)

const MockGroupsTable = ({
  onGroupClick,
  actionButton,
}: {
  onGroupClick?: () => void
  actionButton?: React.ReactNode
}) => (
  <div style={{ border: '1px dashed #ccc' }}>
    {actionButton && (
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>{actionButton}</ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    )}
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <h3>Groups Table (Mocked)</h3>
      <p>This would show the actual groups table with data</p>
      <button onClick={onGroupClick} style={{ marginTop: '0.5rem' }}>
        Select Mock Group
      </button>
    </div>
  </div>
)

interface MockedIdentitiesListProps {
  isDirectAuthenticationEnabled?: boolean
  onUserSelect?: (user: any) => void
  onGroupSelect?: (group: any) => void
}

const MockedIdentitiesList = ({
  isDirectAuthenticationEnabled = false,
  onUserSelect,
  onGroupSelect,
}: MockedIdentitiesListProps) => {
  const { t } = useTranslation()
  const [activeTabKey, setActiveTabKey] = useState<string | number>('users')
  const [showCreatePreAuthorizedUser, setShowCreatePreAuthorizedUser] = useState(false)
  const [showCreatePreAuthorizedGroup, setShowCreatePreAuthorizedGroup] = useState(false)

  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
    setActiveTabKey(tabIndex)
    setShowCreatePreAuthorizedUser(false)
    setShowCreatePreAuthorizedGroup(false)
  }

  const handleUserClick = () => {
    const mockUser = { name: 'Mock User', id: 'mock-user-1' }
    onUserSelect?.(mockUser)
  }

  const handleGroupClick = () => {
    const mockGroup = { name: 'Mock Group', id: 'mock-group-1' }
    onGroupSelect?.(mockGroup)
  }

  const userActionButton = (
    <Button variant="primary" onClick={() => setShowCreatePreAuthorizedUser(true)}>
      {isDirectAuthenticationEnabled ? t('Add user') : t('Create user')}
    </Button>
  )

  const groupActionButton = (
    <Button variant="primary" onClick={() => setShowCreatePreAuthorizedGroup(true)}>
      {isDirectAuthenticationEnabled ? t('Add group') : t('Create group')}
    </Button>
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
              <div style={{ padding: '1rem', border: '1px dashed #ccc', textAlign: 'center' }}>
                <h3>Create Pre-Authorized User (Mocked)</h3>
                <button onClick={() => setShowCreatePreAuthorizedUser(false)}>Cancel</button>
                <button onClick={() => setShowCreatePreAuthorizedUser(false)}>Submit</button>
              </div>
            ) : (
              <MockUsersTable onUserClick={handleUserClick} actionButton={userActionButton} />
            )}
          </div>
        </Tab>

        <Tab eventKey="groups" title={<TabTitleText>{t('Groups')}</TabTitleText>} aria-label={t('Groups tab')}>
          <div style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            {showCreatePreAuthorizedGroup ? (
              <div style={{ padding: '1rem', border: '1px dashed #ccc', textAlign: 'center' }}>
                <h3>Create Pre-Authorized Group (Mocked)</h3>
                <button onClick={() => setShowCreatePreAuthorizedGroup(false)}>Cancel</button>
                <button onClick={() => setShowCreatePreAuthorizedGroup(false)}>Submit</button>
              </div>
            ) : (
              <MockGroupsTable onGroupClick={handleGroupClick} actionButton={groupActionButton} />
            )}
          </div>
        </Tab>
      </Tabs>
    </PageSection>
  )
}

const meta: Meta<typeof MockedIdentitiesList> = {
  title: 'Wizards/RoleAssignment/IdentitiesList',
  component: MockedIdentitiesList,
  argTypes: {
    isDirectAuthenticationEnabled: { control: 'boolean' },
    onUserSelect: { action: 'onUserSelect' },
    onGroupSelect: { action: 'onGroupSelect' },
  },
}

export default meta

type Story = StoryObj<typeof MockedIdentitiesList>

export const Default: Story = {
  args: {
    isDirectAuthenticationEnabled: false,
    onUserSelect: (user) => console.log('User selected:', user),
    onGroupSelect: (group) => console.log('Group selected:', group),
  },
}

export const DirectAuthEnabled: Story = {
  args: {
    isDirectAuthenticationEnabled: true,
    onUserSelect: (user) => console.log('User selected:', user),
    onGroupSelect: (group) => console.log('Group selected:', group),
  },
}

export const WithoutHandlers: Story = {
  args: {},
}
