/* Copyright Contributors to the Open Cluster Management project */

import { Meta, StoryObj } from '@storybook/react'
import { CreatePreAuthorizedUser } from './CreatePreAuthorizedUser'

const meta: Meta<typeof CreatePreAuthorizedUser> = {
  title: 'Wizards/RoleAssignment/CreatePreAuthorizedUser',
  component: CreatePreAuthorizedUser,
  argTypes: {
    onCancel: { action: 'onCancel' },
    onSubmit: { action: 'onSubmit' },
  },
}

export default meta

type Story = StoryObj<typeof CreatePreAuthorizedUser>

export const Default: Story = {
  args: {
    onCancel: () => console.log('Cancel clicked'),
    onSubmit: (username) => console.log('Submit clicked with username:', username),
  },
}

export const WithoutSubmitHandler: Story = {
  args: {
    onCancel: () => console.log('Cancel clicked'),
  },
}
