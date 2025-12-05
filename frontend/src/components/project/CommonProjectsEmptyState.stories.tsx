/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { CommonProjectsEmptyState } from './CommonProjectsEmptyState'

const meta: Meta<typeof CommonProjectsEmptyState> = {
  title: 'Project/CommonProjectsEmptyState',
  component: CommonProjectsEmptyState,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onCreateCommonProject: {
      action: 'onCreateCommonProject',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onCreateCommonProject: () => console.log('Create common project clicked'),
  },
}

export const Interactive: Story = {
  args: {
    onCreateCommonProject: () => alert('Create common project button clicked!'),
  },
}
