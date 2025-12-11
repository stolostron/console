/* Copyright Contributors to the Open Cluster Management project */

import { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { PageSection, Tab, Tabs, TabTitleText, Text, Title } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'

// Mock the table components for Storybook
const MockUsersTable = ({ onUserClick }: { onUserClick?: () => void }) => (
  <div style={{ padding: '1rem', border: '1px dashed #ccc', textAlign: 'center' }}>
    <h3>Users Table (Mocked)</h3>
    <p>This would show the actual users table with data</p>
    <button onClick={onUserClick} style={{ marginTop: '0.5rem' }}>
      Select Mock User
    </button>
  </div>
)

const MockGroupsTable = ({ onGroupClick }: { onGroupClick?: () => void }) => (
  <div style={{ padding: '1rem', border: '1px dashed #ccc', textAlign: 'center' }}>
    <h3>Groups Table (Mocked)</h3>
    <p>This would show the actual groups table with data</p>
    <button onClick={onGroupClick} style={{ marginTop: '0.5rem' }}>
      Select Mock Group
    </button>
  </div>
)

// Create a mock version of IdentitiesList for Storybook
// This approach avoids the jest.mock issue by creating a separate component
interface MockedIdentitiesListProps {
  onUserSelect?: (user: any) => void
  onGroupSelect?: (group: any) => void
}

const MockedIdentitiesList = ({ onUserSelect, onGroupSelect }: MockedIdentitiesListProps) => {
  const { t } = useTranslation()
  const [activeTabKey, setActiveTabKey] = useState<string | number>('users')
  const [showCreatePreAuthorized, setShowCreatePreAuthorized] = useState(false)

  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
    setActiveTabKey(tabIndex)
    setShowCreatePreAuthorized(false)
  }

  const handlePreAuthorizedLinkClick = () => {
    setActiveTabKey('users')
    setShowCreatePreAuthorized(true)
  }

  const handleCancelPreAuthorized = () => setShowCreatePreAuthorized(false)
  const handlePreAuthorizedSubmit = () => setShowCreatePreAuthorized(false)

  const handleUserClick = () => {
    const mockUser = { name: 'Mock User', id: 'mock-user-1' }
    onUserSelect?.(mockUser)
  }

  const handleGroupClick = () => {
    const mockGroup = { name: 'Mock Group', id: 'mock-group-1' }
    onGroupSelect?.(mockGroup)
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
            <div style={{ padding: '1rem', border: '1px dashed #ccc', textAlign: 'center' }}>
              <h3>Create Pre-Authorized User (Mocked)</h3>
              <button onClick={handleCancelPreAuthorized}>Cancel</button>
              <button onClick={handlePreAuthorizedSubmit}>Submit</button>
            </div>
          ) : (
            <MockUsersTable onUserClick={handleUserClick} />
          )}
        </Tab>

        <Tab eventKey="groups" title={<TabTitleText>{t('Groups')}</TabTitleText>} aria-label={t('Groups tab')}>
          <MockGroupsTable onGroupClick={handleGroupClick} />
        </Tab>
      </Tabs>
    </PageSection>
  )
}

const meta: Meta<typeof MockedIdentitiesList> = {
  title: 'Wizards/RoleAssignment/IdentitiesList',
  component: MockedIdentitiesList,
  argTypes: {
    onUserSelect: { action: 'onUserSelect' },
    onGroupSelect: { action: 'onGroupSelect' },
  },
}

export default meta

type Story = StoryObj<typeof MockedIdentitiesList>

export const Default: Story = {
  args: {
    onUserSelect: (user) => console.log('User selected:', user),
    onGroupSelect: (group) => console.log('Group selected:', group),
  },
}

export const WithoutHandlers: Story = {
  args: {},
}
