/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { CommonProjectCreate } from './CommonProjectCreate'

const meta: Meta<typeof CommonProjectCreate> = {
  title: 'Wizards/RoleAssignment/CommonProjectCreate',
  component: CommonProjectCreate,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onCancelCallback: { action: 'cancelled' },
    onSuccess: { action: 'success' },
    onError: { action: 'error' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onCancelCallback: action('cancel-clicked'),
    onSuccess: action('project-created-successfully'),
    onError: action('project-creation-failed'),
  },
}

export const WithCallbacks: Story = {
  args: {
    onCancelCallback: action('cancel-clicked'),
    onSuccess: () => {
      action('project-created-successfully')()
      console.log('Project created successfully!')
    },
    onError: (error: Error) => {
      action('project-creation-failed')(error)
      console.error('Project creation failed:', error)
    },
  },
}
