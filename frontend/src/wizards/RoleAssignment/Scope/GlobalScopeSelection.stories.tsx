/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { GlobalScopeSelection } from './GlobalScopeSelection'

const meta: Meta<typeof GlobalScopeSelection> = {
  title: 'Wizards/RoleAssignment/Scope/GlobalScopeSelection',
  component: GlobalScopeSelection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'GlobalScopeSelection displays a Panel with a light gray background using PatternFly global background color (--pf-v5-global--BackgroundColor--200) containing a message indicating that a role assignment will apply to all resources in Advanced Cluster Management. The component uses PatternFly Panel components for consistent styling.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <GlobalScopeSelection />,
  parameters: {
    docs: {
      description: {
        story:
          'The default GlobalScopeSelection component with a light gray background using PatternFly global CSS variable (--pf-v5-global--BackgroundColor--200). It displays a fixed message explaining the global scope of the role assignment within a Panel structure.',
      },
    },
  },
}

export const InWizardContext: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '600px',
        border: '1px solid #ccc',
        padding: '20px',
        borderRadius: '4px',
        backgroundColor: '#fff',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Role Assignment Scope</h3>
      <GlobalScopeSelection />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example of GlobalScopeSelection in a wizard context, showing how the light gray background contrasts nicely with the surrounding white background, making the scope selection visually distinct.',
      },
    },
  },
}

export const WithContrastComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>With PatternFly Background Color (Current)</h4>
        <GlobalScopeSelection />
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Without Background Color (Comparison)</h4>
        <div style={{ padding: '16px', border: '1px solid #d2d2d2' }}>
          This role assignment will apply to all current and future resources on the cluster set.
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparison showing the GlobalScopeSelection with and without the background color, demonstrating how the PatternFly global background color enhances visual distinction and provides better UX.',
      },
    },
  },
}

export const MultipleInstances: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Global Scope Option 1</h4>
        <GlobalScopeSelection />
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Global Scope Option 2</h4>
        <GlobalScopeSelection />
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Global Scope Option 3</h4>
        <GlobalScopeSelection />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Multiple instances of GlobalScopeSelection showing consistency in styling and spacing when used in lists or multiple selection scenarios.',
      },
    },
  },
}
