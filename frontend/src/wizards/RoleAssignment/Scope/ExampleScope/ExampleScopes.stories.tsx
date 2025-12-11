/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { ExampleScopes } from './ExampleScopes'

const meta: Meta<typeof ExampleScopes> = {
  title: 'Wizards/RoleAssignment/ExampleScope/ExampleScopes',
  component: ExampleScopes,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof ExampleScopes>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive carousel showing all 9 example scopes with navigation controls.',
      },
    },
  },
}

export const WithCustomContainer: Story = {
  render: () => (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>Role Assignment Example Scopes</h2>
      <p>Use the navigation controls to browse through different scoping examples:</p>
      <ExampleScopes />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example scopes carousel within a custom container with additional context.',
      },
    },
  },
}

export const InSmallerContainer: Story = {
  render: () => (
    <div style={{ maxWidth: '400px', border: '1px solid #ccc', padding: '1rem' }}>
      <ExampleScopes />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example scopes carousel in a smaller container to test responsive behavior.',
      },
    },
  },
}
