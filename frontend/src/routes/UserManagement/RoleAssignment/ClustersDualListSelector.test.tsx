/* Copyright Contributors to the Open Cluster Management project */
import { render, fireEvent, waitFor } from '@testing-library/react'
import { ClustersDualListSelector } from './ClustersDualListSelector'
import { ClusterSet } from '../RoleAssignments/hook/RoleAssignmentDataHook'

jest.mock('@patternfly/react-core', () => ({
  DualListSelector: ({ availableOptions, chosenOptions, onListChange, onOptionCheck, ...props }: any) => {
    console.log('Mock DualListSelector rendered with:', {
      availableOptions,
      chosenOptions,
      props: {
        isSearchable: props.isSearchable,
        isTree: props.isTree,
        id: props.id,
      },
    })

    const handleCheckboxChange = (e: any, isChecked: boolean, optionId: string) => {
      onOptionCheck?.(e, isChecked, optionId)

      const option =
        availableOptions?.find((opt: any) => opt.id === optionId) ||
        availableOptions?.find((opt: any) => opt.children?.some((child: any) => child.id === optionId))

      if (option) {
        const updatedAvailableOptions =
          availableOptions?.map((opt: any) => {
            if (opt.id === option.id) {
              if (opt.children) {
                return {
                  ...opt,
                  children: opt.children.map((child: any) => (child.id === optionId ? { ...child, isChecked } : child)),
                }
              } else {
                return { ...opt, isChecked }
              }
            }
            return opt
          }) || []

        const updatedChosenOptions = isChecked
          ? [...(chosenOptions || []), { ...option, isChecked }]
          : (chosenOptions || []).filter((opt: any) => opt.id !== option.id)

        onListChange?.(e, updatedAvailableOptions, updatedChosenOptions)
      }
    }

    return (
      <div data-testid="dual-list-selector" {...props}>
        <div data-testid="available-options">
          {availableOptions?.map((option: any) => (
            <div key={option.id} data-testid={`available-${option.id}`}>
              <input
                type="checkbox"
                checked={option.isChecked}
                onChange={(e) => handleCheckboxChange(e, e.target.checked, option.id)}
                data-testid={`checkbox-${option.id}`}
                aria-label={option.checkProps?.['aria-label']}
              />
              <span>{option.text}</span>
              {option.children?.map((child: any) => (
                <div key={child.id} data-testid={`available-child-${child.id}`}>
                  <input
                    type="checkbox"
                    checked={child.isChecked}
                    onChange={(e) => handleCheckboxChange(e, e.target.checked, child.id)}
                    data-testid={`checkbox-${child.id}`}
                    aria-label={child.checkProps?.['aria-label']}
                  />
                  <span>{child.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div data-testid="chosen-options">
          {chosenOptions?.map((option: any) => (
            <div key={option.id} data-testid={`chosen-${option.id}`}>
              <input
                type="checkbox"
                checked={option.isChecked}
                onChange={(e) => handleCheckboxChange(e, e.target.checked, option.id)}
                data-testid={`chosen-checkbox-${option.id}`}
              />
              <span>{option.text}</span>
              {option.children?.map((child: any) => (
                <div key={child.id} data-testid={`chosen-child-${child.id}`}>
                  <input
                    type="checkbox"
                    checked={child.isChecked}
                    onChange={(e) => handleCheckboxChange(e, e.target.checked, child.id)}
                    data-testid={`chosen-checkbox-${child.id}`}
                  />
                  <span>{child.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  },
}))

describe('ClustersDualListSelector', () => {
  const mockOnChoseOptions = jest.fn()

  const mockClusterSets: ClusterSet[] = [
    {
      name: 'cluster-set-1',
      clusters: [
        { name: 'cluster-1', namespace: 'default' },
        { name: 'cluster-2', namespace: 'kube-system' },
      ],
    },
    {
      name: 'cluster-set-2',
      clusters: [{ name: 'cluster-3', namespace: 'default' }],
    },
    {
      name: 'cluster-set-3',
      clusters: [],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders with empty cluster sets', async () => {
      const { container } = render(<ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={[]} />)

      expect(container.querySelector('[data-testid="dual-list-selector"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="available-options"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="chosen-options"]')).toBeInTheDocument()
    })

    it('renders with populated cluster sets', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="available-cluster-set-1"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="available-cluster-set-2"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="available-cluster-set-3"]')).toBeInTheDocument()
      })
    })

    it('renders cluster children correctly', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="available-child-cluster-1"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="available-child-cluster-2"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="available-child-cluster-3"]')).toBeInTheDocument()
      })
    })

    it('handles cluster sets with no clusters', async () => {
      const emptyClusterSet: ClusterSet[] = [
        {
          name: 'empty-cluster-set',
          clusters: [],
        },
      ]

      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={emptyClusterSet} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="available-empty-cluster-set"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid*="available-child-"]')).not.toBeInTheDocument()
      })
    })
  })

  describe('Selection Logic', () => {
    it('calls onChoseOptions when individual cluster is selected', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
      })

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]') as HTMLInputElement
      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })
    })

    it('handles parent cluster set selection', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-set-1"]')).toBeInTheDocument()
      })

      const clusterSet1Checkbox = container.querySelector('[data-testid="checkbox-cluster-set-1"]') as HTMLInputElement
      fireEvent.click(clusterSet1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })
    })

    it('handles child cluster selection', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
      })

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]') as HTMLInputElement
      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })
    })

    it('handles deselection', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
      })

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]') as HTMLInputElement
      fireEvent.click(cluster1Checkbox)

      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Callback Parameters', () => {
    it('calls onChoseOptions with correct format for individual cluster', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
      })

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]') as HTMLInputElement
      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'cluster-1',
              value: 'cluster-1',
            }),
          ])
        )
      })
    })

    it('calls onChoseOptions with correct format for parent cluster set', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-set-1"]')).toBeInTheDocument()
      })

      const clusterSet1Checkbox = container.querySelector('[data-testid="checkbox-cluster-set-1"]') as HTMLInputElement
      fireEvent.click(clusterSet1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'cluster-1',
              value: 'cluster-1',
            }),
            expect.objectContaining({
              id: 'cluster-2',
              value: 'cluster-2',
            }),
          ])
        )
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined cluster sets', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={undefined as any} />
      )

      expect(container.querySelector('[data-testid="dual-list-selector"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="available-options"]')).toBeInTheDocument()
    })

    it('handles cluster sets with undefined clusters', async () => {
      const clusterSetsWithUndefinedClusters: ClusterSet[] = [
        {
          name: 'cluster-set-undefined',
          clusters: undefined,
        },
      ]

      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={clusterSetsWithUndefinedClusters} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="available-cluster-set-undefined"]')).toBeInTheDocument()
      })
    })

    it('handles single cluster set with single cluster', async () => {
      const singleClusterSet: ClusterSet[] = [
        {
          name: 'single-cluster-set',
          clusters: [{ name: 'single-cluster', namespace: 'default' }],
        },
      ]

      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={singleClusterSet} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="available-single-cluster-set"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="available-child-single-cluster"]')).toBeInTheDocument()
      })
    })
  })

  describe('Component Props', () => {
    it('passes correct props to DualListSelector', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      const dualListSelector = container.querySelector('[data-testid="dual-list-selector"]')
      expect(dualListSelector).toHaveAttribute('id', 'clusters-dual-list-selector-tree')
    })

    it('updates when clusterSets prop changes', async () => {
      const { container, rerender } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={[]} />
      )

      expect(container.querySelector('[data-testid="available-cluster-set-1"]')).not.toBeInTheDocument()

      rerender(<ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />)

      await waitFor(() => {
        expect(container.querySelector('[data-testid="available-cluster-set-1"]')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-labels for checkboxes', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="checkbox-cluster-set-1"]')).toBeInTheDocument()
      })

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]')
      expect(cluster1Checkbox).toHaveAttribute('aria-label', 'cluster-1')

      const clusterSet1Checkbox = container.querySelector('[data-testid="checkbox-cluster-set-1"]')
      expect(clusterSet1Checkbox).toHaveAttribute('aria-label', 'cluster-set-1')
    })
  })

  describe('Performance', () => {
    it('does not call onChoseOptions unnecessarily', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
      })

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]') as HTMLInputElement
      fireEvent.click(cluster1Checkbox)
      fireEvent.click(cluster1Checkbox)
      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('Code Coverage - Specific Scenarios', () => {
    it('covers individual option selection without children (lines 42-43)', async () => {
      const singleClusterSet: ClusterSet[] = [
        {
          name: 'single-cluster-set',
          clusters: [],
        },
      ]

      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={singleClusterSet} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-single-cluster-set"]')).toBeInTheDocument()
      })

      const parentCheckbox = container.querySelector('[data-testid="checkbox-single-cluster-set"]') as HTMLInputElement
      fireEvent.click(parentCheckbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })
    })

    it('covers individual child selection when parent is not checked but some children are (lines 51-53)', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="checkbox-cluster-2"]')).toBeInTheDocument()
      })

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]') as HTMLInputElement
      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })

      mockOnChoseOptions.mockClear()

      const cluster2Checkbox = container.querySelector('[data-testid="checkbox-cluster-2"]') as HTMLInputElement
      fireEvent.click(cluster2Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })
    })

    it('covers parent option check handling with children (lines 103-110)', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-set-1"]')).toBeInTheDocument()
      })

      const parentCheckbox = container.querySelector('[data-testid="checkbox-cluster-set-1"]') as HTMLInputElement
      fireEvent.click(parentCheckbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })

      mockOnChoseOptions.mockClear()

      fireEvent.click(parentCheckbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })
    })

    it('covers the hasChanged condition with different cluster selections (line 84)', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="checkbox-cluster-2"]')).toBeInTheDocument()
      })

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]') as HTMLInputElement
      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })

      mockOnChoseOptions.mockClear()

      const cluster2Checkbox = container.querySelector('[data-testid="checkbox-cluster-2"]') as HTMLInputElement
      fireEvent.click(cluster2Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })

      mockOnChoseOptions.mockClear()

      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })
    })

    it('covers the fallback return in handleOptionCheck when option is not found (line 127)', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
      })

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]') as HTMLInputElement
      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })

      mockOnChoseOptions.mockClear()

      const cluster3Checkbox = container.querySelector('[data-testid="checkbox-cluster-3"]') as HTMLInputElement
      fireEvent.click(cluster3Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })
    })

    it('covers complex selection scenario with mixed parent and child selections', async () => {
      const { container } = render(
        <ClustersDualListSelector onChoseOptions={mockOnChoseOptions} clusterSets={mockClusterSets} />
      )

      await waitFor(() => {
        expect(container.querySelector('[data-testid="checkbox-cluster-set-1"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="checkbox-cluster-1"]')).toBeInTheDocument()
        expect(container.querySelector('[data-testid="checkbox-cluster-2"]')).toBeInTheDocument()
      })

      const parentCheckbox = container.querySelector('[data-testid="checkbox-cluster-set-1"]') as HTMLInputElement
      fireEvent.click(parentCheckbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })

      mockOnChoseOptions.mockClear()

      const cluster1Checkbox = container.querySelector('[data-testid="checkbox-cluster-1"]') as HTMLInputElement
      fireEvent.click(cluster1Checkbox)

      await waitFor(() => {
        expect(mockOnChoseOptions).toHaveBeenCalled()
      })
    })
  })
})
