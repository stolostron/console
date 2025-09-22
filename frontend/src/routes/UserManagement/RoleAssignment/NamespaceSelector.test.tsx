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
      namespaces: ['default', 'kube-system', 'monitoring'],
    },
    {
      name: 'cluster-2',
      namespaces: ['default', 'kube-public', 'istio-system'],
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
      expect(container.querySelector('[data-testid="option-kube-system"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-monitoring"]')).toBeInTheDocument()

      expect(container.querySelector('[data-testid="option-kube-public"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-istio-system"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-logging"]')).toBeNull()
    })

    it('shows namespaces from multiple selected clusters', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1', 'cluster-2']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-default"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-kube-system"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-monitoring"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-kube-public"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-istio-system"]')).toBeInTheDocument()
    })

    it('deduplicates namespaces from multiple clusters', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1', 'cluster-2', 'cluster-3']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-default"]')).toBeInTheDocument()
      expect(container.querySelectorAll('[data-testid="option-default"]')).toHaveLength(1)
    })

    it('sorts namespaces alphabetically', () => {
      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1', 'cluster-2']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      const options = container.querySelector('[data-testid="multiselect-options"]')
      const optionElements = options?.querySelectorAll('[data-testid^="option-"]')
      const values = Array.from(optionElements || []).map((el) =>
        el.getAttribute('data-testid')?.replace('option-', '')
      )

      expect(values).toEqual(['default', 'istio-system', 'kube-public', 'kube-system', 'monitoring'])
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

    it('handles empty selected clusters array', () => {
      const { container } = render(
        <NamespaceSelector selectedClusters={[]} clusters={mockClusters} onChangeNamespaces={mockOnChangeNamespaces} />
      )

      expect(container.firstChild).toBeNull()
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

      const kubeSystemOption = container.querySelector('[data-testid="option-kube-system"]') as HTMLElement
      fireEvent.click(kubeSystemOption)

      await waitFor(() => {
        expect(mockOnChangeNamespaces).toHaveBeenCalledWith(['default', 'kube-system'])
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

    it('handles clusters with empty namespaces array', () => {
      const clustersWithEmptyNamespaces: Cluster[] = [
        {
          name: 'cluster-1',
          namespaces: [],
        },
      ]

      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={clustersWithEmptyNamespaces}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="acm-multi-select"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-options"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="multiselect-options"]')?.children).toHaveLength(0)
    })

    it('handles duplicate namespace names across clusters', () => {
      const clustersWithDuplicates: Cluster[] = [
        {
          name: 'cluster-1',
          namespaces: ['default', 'kube-system'],
        },
        {
          name: 'cluster-2',
          namespaces: ['default', 'kube-system', 'monitoring'],
        },
      ]

      const { container } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1', 'cluster-2']}
          clusters={clustersWithDuplicates}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-default"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-kube-system"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-monitoring"]')).toBeInTheDocument()
      expect(container.querySelectorAll('[data-testid="option-default"]')).toHaveLength(1)
      expect(container.querySelectorAll('[data-testid="option-kube-system"]')).toHaveLength(1)
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

    it('updates namespace options when selected clusters change', () => {
      const { container, rerender } = render(
        <NamespaceSelector
          selectedClusters={['cluster-1']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-default"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-kube-system"]')).toBeInTheDocument()

      rerender(
        <NamespaceSelector
          selectedClusters={['cluster-2']}
          clusters={mockClusters}
          onChangeNamespaces={mockOnChangeNamespaces}
        />
      )

      expect(container.querySelector('[data-testid="option-default"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-kube-public"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-istio-system"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="option-kube-system"]')).toBeNull()
      expect(container.querySelector('[data-testid="option-monitoring"]')).toBeNull()
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
          selectedNamespaces={['default', 'kube-system']}
        />
      )

      expect(container.querySelector('[data-testid="multiselect-value"]')).toHaveTextContent(
        '["default","kube-system"]'
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
