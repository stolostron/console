/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { ClusterSetAccessLevel } from './ClusterSetAccessLevel'

const meta: Meta<typeof ClusterSetAccessLevel> = {
  title: 'Wizards/RoleAssignment/Scope/AccessLevel/ClusterSetAccessLevel',
  component: ClusterSetAccessLevel,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithCustomBackground: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#333333' },
      ],
    },
  },
}
