/* Copyright Contributors to the Open Cluster Management project */

import { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { IdentitiesList } from './IdentitiesList'

// Mock the table components for Storybook
const MockUsersTable = () => (
  <div style={{ padding: '1rem', border: '1px dashed #ccc', textAlign: 'center' }}>
    <h3>Users Table (Mocked)</h3>
    <p>This would show the actual users table with data</p>
  </div>
)

const MockGroupsTable = () => (
  <div style={{ padding: '1rem', border: '1px dashed #ccc', textAlign: 'center' }}>
    <h3>Groups Table (Mocked)</h3>
    <p>This would show the actual groups table with data</p>
  </div>
)

// Mock the components
jest.mock('../../../routes/UserManagement/Identities/Users/UsersTable', () => ({
  UsersTable: MockUsersTable,
}))

jest.mock('../../../routes/UserManagement/Identities/Groups/GroupsTable', () => ({
  GroupsTable: MockGroupsTable,
}))

const meta: Meta<typeof IdentitiesList> = {
  title: 'Wizards/RoleAssignment/IdentitiesList',
  component: IdentitiesList,
  decorators: [
    (Story) => (
      <RecoilRoot>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </RecoilRoot>
    ),
  ],
  argTypes: {
    onUserSelect: { action: 'onUserSelect' },
    onGroupSelect: { action: 'onGroupSelect' },
    onPreAuthorizedUserAdd: { action: 'onPreAuthorizedUserAdd' },
  },
}

export default meta

type Story = StoryObj<typeof IdentitiesList>

export const Default: Story = {
  args: {
    onUserSelect: (username) => console.log('User selected:', username),
    onGroupSelect: (groupname) => console.log('Group selected:', groupname),
    onPreAuthorizedUserAdd: (username) => console.log('Pre-authorized user added:', username),
  },
}

export const WithoutHandlers: Story = {
  args: {},
}
