/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button } from '@patternfly/react-core'
import { ExampleScopesDrawer } from './ExampleScopesDrawer'

const meta: Meta<typeof ExampleScopesDrawer> = {
  title: 'Wizards/RoleAssignment/ExampleScope/ExampleScopesDrawer',
  component: ExampleScopesDrawer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Whether the drawer is visible/expanded',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when drawer is closed',
    },
  },
}

export default meta
type Story = StoryObj<typeof ExampleScopesDrawer>

export const Open: Story = {
  args: {
    isVisible: true,
    onClose: () => console.log('Drawer closed'),
    children: (
      <div style={{ padding: '2rem', minHeight: '400px' }}>
        <h2>Main Application Content</h2>
        <p>This is the main content area of your application.</p>
        <p>The drawer will overlay this content when opened.</p>
        <p>You can interact with both the main content and the drawer.</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer in open state showing the example scopes panel alongside main content.',
      },
    },
  },
}

export const Closed: Story = {
  args: {
    isVisible: false,
    onClose: () => console.log('Drawer closed'),
    children: (
      <div style={{ padding: '2rem', minHeight: '400px' }}>
        <h2>Main Application Content</h2>
        <p>This is the main content area when the drawer is closed.</p>
        <p>The drawer panel is hidden but the main content remains visible.</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer in closed state showing only the main content.',
      },
    },
  },
}

const InteractiveDemo = () => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <ExampleScopesDrawer isVisible={isVisible} onClose={() => setIsVisible(false)}>
      <div style={{ padding: '2rem', minHeight: '400px' }}>
        <h2>Interactive Drawer Demo</h2>
        <p>Use the button below to toggle the drawer visibility:</p>
        <Button variant="primary" onClick={() => setIsVisible(!isVisible)}>
          {isVisible ? 'Close' : 'Open'} Example Scopes Drawer
        </Button>
        <div style={{ marginTop: '2rem' }}>
          <p>Main content area that remains visible when drawer is open.</p>
          <p>The drawer provides additional context without blocking the main workflow.</p>
        </div>
      </div>
    </ExampleScopesDrawer>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo allowing you to toggle the drawer open and closed.',
      },
    },
  },
}

export const WithComplexContent: Story = {
  args: {
    isVisible: true,
    onClose: () => console.log('Drawer closed'),
    children: (
      <div style={{ padding: '2rem' }}>
        <h2>Role Assignment Wizard</h2>
        <form>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="user-select">Select User:</label>
            <select id="user-select" style={{ marginLeft: '0.5rem', padding: '0.25rem' }}>
              <option>John Doe</option>
              <option>Jane Smith</option>
              <option>Bob Johnson</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="role-select">Select Role:</label>
            <select id="role-select" style={{ marginLeft: '0.5rem', padding: '0.25rem' }}>
              <option>Admin</option>
              <option>Editor</option>
              <option>Viewer</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <p>
              <strong>Scope Configuration:</strong>
            </p>
            <p>
              Use the "Example Scopes" drawer to see different scoping patterns and configure your role assignment
              accordingly.
            </p>
          </div>
          <div>
            <Button variant="primary" style={{ marginRight: '0.5rem' }}>
              Create Assignment
            </Button>
            <Button variant="secondary">Cancel</Button>
          </div>
        </form>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer used within a role assignment wizard context with form content.',
      },
    },
  },
}
