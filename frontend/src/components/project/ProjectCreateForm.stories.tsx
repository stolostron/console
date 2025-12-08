/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { ProjectCreateForm } from './ProjectCreateForm'

const meta: Meta<typeof ProjectCreateForm> = {
  title: 'Components/Project/ProjectCreateForm',
  component: ProjectCreateForm,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onCancelCallback: { action: 'cancelled' },
    onSubmit: { action: 'submitted' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onCancelCallback: action('cancel-clicked'),
    onSubmit: action('form-submitted'),
  },
}

export const WithSubmitHandler: Story = {
  args: {
    onCancelCallback: action('cancel-clicked'),
    onSubmit: async (data) => {
      action('form-submitted')(data)
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
  },
}
