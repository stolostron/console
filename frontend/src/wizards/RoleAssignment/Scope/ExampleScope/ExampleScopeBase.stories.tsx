/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { ExampleScopeBase } from './ExampleScopeBase'

const meta: Meta<typeof ExampleScopeBase> = {
  title: 'Wizards/RoleAssignment/ExampleScope/ExampleScopeBase',
  component: ExampleScopeBase,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    exampleIndex: {
      control: {
        type: 'select',
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      description: 'Index of the example to display (0-8)',
    },
  },
}

export default meta
type Story = StoryObj<typeof ExampleScopeBase>

export const FullAccessToAllResources: Story = {
  args: {
    exampleIndex: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows full access to all resources with all items checked and bold.',
      },
    },
  },
}

export const SingleClusterSetPartialAccess: Story = {
  args: {
    exampleIndex: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows partial access within a single cluster set with some items unchecked.',
      },
    },
  },
}

export const SingleClusterSetCommonProjects: Story = {
  args: {
    exampleIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows access to common projects across multiple clusters in a single cluster set.',
      },
    },
  },
}

export const MultipleClusterSetsFullAccess: Story = {
  args: {
    exampleIndex: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows full access across multiple cluster sets.',
      },
    },
  },
}

export const MultipleClusterSetsPartialAccess: Story = {
  args: {
    exampleIndex: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows partial access to common projects across multiple cluster sets.',
      },
    },
  },
}

export const SingleClusterFullAccess: Story = {
  args: {
    exampleIndex: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows full access to a single cluster with all projects accessible.',
      },
    },
  },
}

export const SingleClusterPartialAccess: Story = {
  args: {
    exampleIndex: 6,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows partial access to a single cluster with some projects restricted.',
      },
    },
  },
}

export const MultipleClusterFullAccess: Story = {
  args: {
    exampleIndex: 7,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows full access across multiple clusters.',
      },
    },
  },
}

export const MultipleClusterCommonProjects: Story = {
  args: {
    exampleIndex: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows access to common projects across multiple clusters.',
      },
    },
  },
}

export const AllExamples: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
        <div key={index} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <ExampleScopeBase exampleIndex={index} />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all 9 example scopes in a grid layout for comparison.',
      },
    },
  },
}
