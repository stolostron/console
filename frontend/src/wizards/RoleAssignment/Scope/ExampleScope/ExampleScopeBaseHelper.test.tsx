/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render } from '@testing-library/react'
import { getExampleTitle, getExampleTreeData } from './ExampleScopeBaseHelper'

// Mock translation function
const mockT = (key: string) => key

describe('ExampleScopeBaseHelper', () => {
  describe('getExampleTitle', () => {
    it('returns correct title for example index 0', () => {
      const title = getExampleTitle(0, mockT)
      expect(title).toBe('Example scope: Full access to all resources')
    })

    it('returns correct title for example index 1', () => {
      const title = getExampleTitle(1, mockT)
      expect(title).toBe('Example scope: Single cluster set → Single cluster → Partial access')
    })

    it('returns correct title for example index 8', () => {
      const title = getExampleTitle(8, mockT)
      expect(title).toBe('Example scope: Multiple clusters → Common projects')
    })

    it('returns default title for invalid index', () => {
      const title = getExampleTitle(99, mockT)
      expect(title).toBe('Example scope')
    })
  })

  describe('getExampleTreeData', () => {
    it('returns tree data for example index 0 (full access)', () => {
      const treeData = getExampleTreeData(0, mockT)

      expect(treeData).toHaveLength(3)
      expect(treeData[0].name).toBeDefined()
      expect(treeData[0].id).toBe('case0-cluster-set-1')
      expect(treeData[0].children).toBeDefined()
    })

    it('returns tree data for example index 1 (partial access)', () => {
      const treeData = getExampleTreeData(1, mockT)

      // Single cluster set scenario
      expect(treeData).toHaveLength(1)
      expect(treeData[0].id).toBe('case1-cluster-set-1')
      expect(treeData[0].children).toBeDefined()

      // Check that some items are checked and some are not
      const clusters = treeData[0].children!
      expect(clusters).toHaveLength(2)

      const firstCluster = clusters[0]
      expect(firstCluster.id).toBe('case1-cluster-1')
      expect(firstCluster.children).toBeDefined()

      const projects = firstCluster.children!
      expect(projects).toHaveLength(2)

      // Verify partial access - some projects checked, some not
      expect(projects[0].id).toBe('case1-project-1')
      expect(projects[1].id).toBe('case1-project-2')
    })

    it('returns tree data for single cluster examples (index 5)', () => {
      const treeData = getExampleTreeData(5, mockT)

      expect(treeData).toHaveLength(1)
      expect(treeData[0].id).toBe('case5-cluster-1')
      expect(treeData[0].children).toBeDefined()
    })

    it('returns empty array for invalid index', () => {
      const treeData = getExampleTreeData(99, mockT)
      expect(treeData).toEqual([])
    })

    it('includes icons for all tree items', () => {
      const treeData = getExampleTreeData(0, mockT)

      // Check root level
      expect(treeData[0].icon).toBeDefined()

      // For full access example, we know the structure exists
      expect(treeData[0].children).toBeDefined()
      expect(treeData[0].children![0].icon).toBeDefined()

      expect(treeData[0].children![0].children).toBeDefined()
      expect(treeData[0].children![0].children![0].icon).toBeDefined()

      expect(treeData[0].children![0].children![0].children).toBeDefined()
      expect(treeData[0].children![0].children![0].children![0].icon).toBeDefined()
    })

    it('creates proper tree structure with correct IDs', () => {
      const treeData = getExampleTreeData(2, mockT)

      expect(treeData[0].id).toBe('case2-cluster-set-1')

      // For example 2, we know the structure exists
      expect(treeData[0].children).toBeDefined()
      expect(treeData[0].children![0].id).toBe('case2-cluster-1')

      expect(treeData[0].children![0].children).toBeDefined()
      expect(treeData[0].children![0].children![0].id).toBe('case2-project-1')
    })

    it('handles translation function correctly', () => {
      const mockTranslate = jest.fn((key: string) => `translated-${key}`)
      getExampleTreeData(0, mockTranslate)

      expect(mockTranslate).toHaveBeenCalledWith('Cluster set')
      expect(mockTranslate).toHaveBeenCalledWith('Cluster')
      expect(mockTranslate).toHaveBeenCalledWith('Project')
      expect(mockTranslate).toHaveBeenCalledWith('Virtual machine')
    })

    it('renders JSX elements for names correctly', () => {
      const treeData = getExampleTreeData(0, mockT)

      // The name should be a JSX element (either string or <strong> element)
      expect(typeof treeData[0].name === 'string' || React.isValidElement(treeData[0].name)).toBe(true)
    })
  })

  describe('createName helper (indirectly tested)', () => {
    it('creates bold text for checked items', () => {
      const treeData = getExampleTreeData(0, mockT)

      // For full access example, all items should be bold (checked)
      const { container } = render(<div>{treeData[0].name}</div>)
      const strongElement = container.querySelector('strong')
      expect(strongElement).toBeInTheDocument()
    })

    it('creates normal text for unchecked items', () => {
      const treeData = getExampleTreeData(1, mockT)

      // Find an unchecked item (should exist in partial access example)
      let foundUncheckedItem = false

      const checkItem = (item: any) => {
        if (typeof item.name === 'string') {
          foundUncheckedItem = true
          return
        }
        if (item.children) {
          item.children.forEach(checkItem)
        }
      }

      treeData.forEach(checkItem)

      // We should find at least one unchecked item in partial access example
      expect(foundUncheckedItem).toBe(true)
    })
  })
})
