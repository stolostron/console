/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { RolesList } from './RolesList'

const meta: Meta<typeof RolesList> = {
  title: 'RoleAssignment/RolesList',
  component: RolesList,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onRadioSelect: {
      action: 'onRadioSelect',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    selectedRole: '',
    onRadioSelect: (roleName: string) => console.log('Selected role:', roleName),
  },
}

export const WithCallback: Story = {
  args: {
    selectedRole: '',
    onRadioSelect: (roleName: string) => console.log('Selected role:', roleName),
  },
}

const InteractiveRolesList = () => {
  const [selectedRole, setSelectedRole] = useState<string>()

  return (
    <div>
      <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <strong>Selected Role:</strong> {selectedRole || 'None'}
        <br />
        <small>
          Note: Links are disabled in RolesList (areLinksDisplayed=false). Role names are not clickable and all
          permissions are displayed inline. Selection state is managed internally by RolesTable.
        </small>
      </div>
      <RolesList
        selectedRole={selectedRole || ''}
        onRadioSelect={(roleName) => {
          console.log('Role selected:', roleName)
          setSelectedRole(roleName)
        }}
      />
    </div>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveRolesList />,
}
