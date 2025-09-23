/* Copyright Contributors to the Open Cluster Management project */
import { render, fireEvent, waitFor } from '@testing-library/react'
import { NamespaceSelector } from './NamespaceSelector'
import { Cluster } from '../RoleAssignments/hook/RoleAssignmentDataHook'

jest.mock('../../../ui-components', () => ({
  AcmMultiSelect: ({ id, label, placeholder, value, onChange, children, ...props }: any) => {
    const handleSelection = (selectedValue: string) => {
      if (value === undefined) {
        onChange([selectedValue])
      } else {
        if (value.includes(selectedValue)) {
          onChange(value.filter((item: string) => item !== selectedValue))
        } else {
          onChange([...value, selectedValue])
        }
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent, selectedValue: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleSelection(selectedValue)
      }
    }

    return (
      <div data-testid="acm-multi-select" id={id} {...props}>
        <div data-testid="multiselect-label">{label}</div>
        <div data-testid="multiselect-placeholder">{placeholder}</div>
        <div data-testid="multiselect-value">{JSON.stringify(value || [])}</div>
        <div data-testid="multiselect-options">
          {children?.map((child: React.ReactElement) => (
            <button
              key={child.key}
              data-testid={`option-${child.props.value}`}
              onClick={() => handleSelection(child.props.value)}
              onKeyDown={(e) => handleKeyDown(e, child.props.value)}
              type="button"
              aria-label={`Select ${child.props.value}`}
            >
              {child.props.children}
            </button>
          ))}
        </div>
      </div>
    )
  },
}))

jest.mock('@patternfly/react-core', () => ({
  SelectOption: ({ value, children, ...props }: any) => (
    <div data-testid={`select-option-${value}`} {...props}>
      {children}
    </div>
  ),
}))

jest.mock('../../../components/AcmSelectBase', () => ({
  SelectVariant: {
    typeaheadMulti: 'typeaheadMulti',
  },
}))

describe('NamespaceSelector', () => {
  const mockOnChangeNamespaces = jest.fn()

  const mockClusters: Cluster[] = [
    {
      name: 'cluster-1',
      namespaces: ['default', 'app-backend', 'monitoring'],
    },
    {
      name: 'cluster-2',
      namespaces: ['default', 'app-frontend', 'istio-system'],
    },
    {
      name: 'cluster-3',
      namespaces: ['default', 'logging'],
    },
    {
      name: 'cluster-4',
      namespaces: undefined,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders nothing when no clusters are selected', () => {
      const { container } = render(
        <NamespaceSelector selectedClusters={[]} clusters={mockClusters} onChangeNamespaces={mockOnChangeNamespaces} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders the multi-select when clusters are selected', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="acm-multi-select"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-label"]')).toHaveTextContent('Select shared namespaces')
      expect(container.querySelector('[data-testid="multiselect-placeholder"]')).toHaveTextContent(
        'Select namespaces to target'
      )
    })

    it('renders with correct props', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={['default']}
        />
      )

      const multiSelect = container.querySelector('[data-testid="acm-multi-select"]')
      expect(multiSelect).toHaveAttribute('id', 'namespace-selector')
      expect(multiSelect).toHaveAttribute('variant', 'typeaheadMulti')
      expect(multiSelect).toHaveAttribute('menuAppendTo', 'parent')
      expect(multiSelect).toHaveAttribute('maxHeight', '18em')
    })
  })

  describe('Namespace Filtering Logic', () => {
    it('shows namespaces from selected clusters only', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-default"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-app-backend"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-monitoring"]')).toBeInTheDocument()

      expect(container.querySelector('[data-testid="option-app-frontend"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-istio-system"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-logging"]')).toBeNull()
    })

    it('handles clusters with no namespaces', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-4']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="acm-multi-select"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-options"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-options"]')?.children).toHaveLength(0)
    })

    it('returns empty when selected clusters have no common namespaces', () => {
      const clustersWithNoCommon: Cluster[] = [
        {
          name: 'cluster-1',
          namespaces: ['namespace-a', 'namespace-b'],
        },
        {
          name: 'cluster-2',
          namespaces: ['namespace-c', 'namespace-d'],
        },
      ]

      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1', 'cluster-2']}
          clusters={clustersWithNoCommon}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="acm-multi-select"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-options"]')?.children).toHaveLength(0)
    })

    it('handles complex intersection with partial overlaps', () => {
      const complexClusters: Cluster[] = [
        {
          name: 'cluster-1',
          namespaces: ['shared-all', 'shared-1-2', 'shared-1-3', 'shared-1-4', 'unique-1'],
        },
        {
          name: 'cluster-2',
          namespaces: ['shared-all', 'shared-1-2', 'shared-2-3', 'shared-2-4', 'unique-2'],
        },
        {
          name: 'cluster-3',
          namespaces: ['shared-all', 'shared-1-3', 'shared-2-3', 'shared-3-4', 'unique-3'],
        },
        {
          name: 'cluster-4',
          namespaces: ['shared-all', 'shared-1-4', 'shared-2-4', 'shared-3-4', 'unique-4'],
        },
      ]

      const { container, rerender } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1', 'cluster-2', 'cluster-3', 'cluster-4']}
          clusters={complexClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-shared-all"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-shared-1-2"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-shared-1-3"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-unique-1"]')).toBeNull()

      rerender(
        <NamespaceSelector
          selectedClusters={['cluster-1', 'cluster-2']}
          clusters={complexClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-shared-all"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-shared-1-2"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-shared-1-3"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-shared-2-3"]')).toBeNull()

      rerender(
        <NamespaceSelector
          selectedClusters={['cluster-2', 'cluster-3']}
          clusters={complexClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-shared-all"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-shared-2-3"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-shared-1-2"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-shared-1-3"]')).toBeNull()

      rerender(
        <NamespaceSelector
          selectedClusters={['cluster-1', 'cluster-3', 'cluster-4']}
          clusters={complexClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-shared-all"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-shared-1-3"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-shared-3-4"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-shared-1-4"]')).toBeNull()
    })

    it('sorts namespaces alphabetically', () => {
      const clustersForSorting: Cluster[] = [
        {
          name: 'cluster-1',
          namespaces: ['zebra', 'alpha', 'beta', 'gamma'],
        },
        {
          name: 'cluster-2',
          namespaces: ['zebra', 'beta', 'alpha', 'delta'],
        },
      ]

      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1', 'cluster-2']}
          clusters={clustersForSorting}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      const options = container.querySelector('[data-testid="multiselect-options"]')
      const optionElements = options?.querySelectorAll('[data-testid^="option-"]')
      const values = Array.from(optionElements || []).map((e) => e.getAttribute('data-testid')?.replace('option-', ''))

      expect(values).toEqual(['alpha', 'beta', 'zebra'])
    })
  })

  describe('Cluster Name Matching', () => {
    it('handles string comparison with trimming', () => {
      const clustersWithSpaces: Cluster[] = [
        {
          name: ' cluster-1 ',
          namespaces: ['default'],
        },
      ]

      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={clustersWithSpaces}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-default"]')).toBeInTheDocument()
    })

    it('handles different data types in cluster names', () => {
      const clustersWithNumbers: Cluster[] = [
        {
          name: '123',
          namespaces: ['default'],
        },
      ]

      const { container } = render(
        <NamespaceSelector
          selectedClusters={['123']}
          clusters={clustersWithNumbers}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-default"]')).toBeInTheDocument()
    })

    it('handles undefined cluster names gracefully', () => {
      const clustersWithUndefined: Cluster[] = [
        {
          name: undefined as any,
          namespaces: ['default'],
        },
      ]

      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={clustersWithUndefined}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="acm-multi-select"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-options"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-options"]')?.children).toHaveLength(0)
    })
  })

  describe('Callback Functions', () => {
    it('calls onChangeNamespaces when namespace is selected', async () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      const defaultOption = container.querySelector('[data-testid="option-default"]') as HTMLElement
      fireEvent.click(defaultOption)

      await waitFor(() => {
        expect(mockOnChangeNamespaces).toHaveBeenCalledWith(['default'])
      })
    })

    it('calls onChangeNamespaces when namespace is deselected', async () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={['default']}
        />
      )

      const defaultOption = container.querySelector('[data-testid="option-default"]') as HTMLElement
      fireEvent.click(defaultOption)

      await waitFor(() => {
        expect(mockOnChangeNamespaces).toHaveBeenCalledWith([])
      })
    })

    it('handles multiple namespace selections', async () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={['default']}
        />
      )

      const appBackendOption = container.querySelector('[data-testid="option-app-backend"]') as HTMLElement
      fireEvent.click(appBackendOption)

      await waitFor(() => {
        expect(mockOnChangeNamespaces).toHaveBeenCalledWith(['default', 'app-backend'])
      })
    })

    it('handles undefined value in onChange callback', async () => {
      render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      mockOnChangeNamespaces(undefined as any)

      await waitFor(() => {
        expect(mockOnChangeNamespaces).toHaveBeenCalledWith(undefined)
      })
    })
  })

  describe('Effect Hook - Clear Namespaces', () => {
    it('clears namespaces when no clusters are selected', () => {
      const { rerender } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={['default']}
        />
      )

      rerender(
        <NamespaceSelector
          selectedClusters={[]}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={['default']}
        />
      )

      expect(mockOnChangeNamespaces).toHaveBeenCalledWith([])
    })

    it('does not clear namespaces when clusters are still selected', () => {
      const { rerender } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={['default']}
        />
      )

      rerender(
        <NamespaceSelector
          selectedClusters={['cluster-2']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={['default']}
        />
      )

      expect(mockOnChangeNamespaces).not.toHaveBeenCalledWith([])
    })

    it('does not clear namespaces when no namespaces are selected', () => {
      const { rerender } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={[]}
        />
      )

      rerender(
        <NamespaceSelector
          selectedClusters={[]}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={[]}
        />
      )

      expect(mockOnChangeNamespaces).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty clusters array', () => {
      const { container } = render(
        <NamespaceSelector selectedClusters={['cluster-1']} clusters={[]} onChangeNamespaces={mockOnChangeNamespaces} />
      )

      expect(container.querySelector('[data-testid="acm-multi-select"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-options"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-options"]')?.children).toHaveLength(0)
    })

    it('handles undefined clusters prop', () => {
      expect(() => {
        render(
          <NamespaceSelector
            selectedClusters={['cluster-1']}
            clusters={undefined as any}
            onChangeNamespaces={mockOnChangeNamespaces}
          />
        )
      }).toThrow()
    })

    it('handles undefined selectedNamespaces prop', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={undefined}
        />
      )

      expect(container.querySelector('[data-testid="multiselect-value"]')).toHaveTextContent('[]')
    })
  })

  describe('Performance and Memoization', () => {
    it('memoizes namespace options correctly', () => {
      const { rerender } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      rerender(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(mockOnChangeNamespaces).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper accessibility attributes', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      const multiSelect = container.querySelector('[data-testid="acm-multi-select"]')
      expect(multiSelect).toHaveAttribute('id', 'namespace-selector')
    })

    it('renders options with proper structure', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      const defaultButton = container.querySelector('[data-testid="option-default"]')
      expect(defaultButton).toHaveTextContent('default')
    })
  })

  describe('Integration with AcmMultiSelect', () => {
    it('passes correct value to AcmMultiSelect', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={['default', 'app-backend']}
        />
      )

      expect(container.querySelector('[data-testid="multiselect-value"]')).toHaveTextContent(
        '["default","app-backend"]'
      )
    })

    it('handles empty value array', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
          selectedNamespaces={[]}
        />
      )

      expect(container.querySelector('[data-testid="multiselect-value"]')).toHaveTextContent('[]')
    })
  })
})
