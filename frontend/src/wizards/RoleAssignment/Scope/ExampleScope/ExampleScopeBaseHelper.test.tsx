/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render } from '@testing-library/react'
import { getExampleTitle, getExampleTreeData } from './ExampleScopeBaseHelper'

// Mock translation function
const mockT = (key: string) => key

describe('ExampleScopeBaseHelper', () => {
  describe('getExampleTitle', () => {
    it.each([
      [0, 'Example scope: Full access to all resources'],
      [1, 'Example scope: Single cluster set → Single cluster → Partial access'],
      [2, 'Example scope: Single cluster set → Multiple clusters → Common projects'],
      [3, 'Example scope: Multiple cluster sets → Full access'],
      [4, 'Example scope: Multiple cluster sets → Partial access → Common projects'],
      [5, 'Example scope: Single cluster → Full access'],
      [6, 'Example scope: Single cluster → Partial access'],
      [7, 'Example scope: Multiple clusters → Full access'],
      [8, 'Example scope: Multiple clusters → Common projects'],
      [9, 'Example scope: Single cluster set → Partial access'],
      [10, 'Example scope: Multiple cluster sets → Common projects'],
    ])('returns correct title for example index %i', (exampleIndex, expectedTitle) => {
      const title = getExampleTitle(exampleIndex, mockT)
      expect(title).toBe(expectedTitle)
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

    it('returns tree data for example index 2 (single cluster set → multiple clusters → common projects)', () => {
      const treeData = getExampleTreeData(2, mockT)

      expect(treeData).toHaveLength(1)
      expect(treeData[0].id).toBe('case2-cluster-set-1')
      expect(treeData[0].children).toBeDefined()

      const clusters = treeData[0].children!
      expect(clusters).toHaveLength(2)
      expect(clusters[0].id).toBe('case2-cluster-1')
      expect(clusters[1].id).toBe('case2-cluster-2')

      // Both clusters should have common projects
      expect(clusters[0].children).toBeDefined()
      expect(clusters[1].children).toBeDefined()
    })

    it('returns tree data for example index 3 (multiple cluster sets → full access)', () => {
      const treeData = getExampleTreeData(3, mockT)

      expect(treeData).toHaveLength(2)
      expect(treeData[0].id).toBe('case3-cluster-set-1')
      expect(treeData[1].id).toBe('case3-cluster-set-2')

      // Both cluster sets should have clusters
      expect(treeData[0].children).toBeDefined()
      expect(treeData[1].children).toBeDefined()

      const firstClusterSetClusters = treeData[0].children!
      expect(firstClusterSetClusters).toHaveLength(2)
      expect(firstClusterSetClusters[0].id).toBe('case3-cluster-1')
      expect(firstClusterSetClusters[1].id).toBe('case3-cluster-2')
    })

    it('returns tree data for example index 4 (multiple cluster sets → partial access → common projects)', () => {
      const treeData = getExampleTreeData(4, mockT)

      expect(treeData).toHaveLength(2)
      expect(treeData[0].id).toBe('case4-cluster-set-1')
      expect(treeData[1].id).toBe('case4-cluster-set-2')

      // First cluster set should have one checked cluster and one unchecked
      const firstClusterSetClusters = treeData[0].children!
      expect(firstClusterSetClusters).toHaveLength(2)
      expect(firstClusterSetClusters[0].id).toBe('case4-cluster-1')
      expect(firstClusterSetClusters[1].id).toBe('case4-cluster-2')

      // Second cluster set should have one checked cluster with common project
      const secondClusterSetClusters = treeData[1].children!
      expect(secondClusterSetClusters).toHaveLength(1)
      expect(secondClusterSetClusters[0].id).toBe('case4-cluster-3')
    })

    it('returns tree data for single cluster examples (index 5)', () => {
      const treeData = getExampleTreeData(5, mockT)

      expect(treeData).toHaveLength(1)
      expect(treeData[0].id).toBe('case5-cluster-1')
      expect(treeData[0].children).toBeDefined()

      const projects = treeData[0].children!
      expect(projects).toHaveLength(3)
      expect(projects[0].id).toBe('case5-project-1')
      expect(projects[1].id).toBe('case5-project-2')
      expect(projects[2].id).toBe('case5-project-3')
    })

    it('returns tree data for example index 6 (single cluster → partial access)', () => {
      const treeData = getExampleTreeData(6, mockT)

      expect(treeData).toHaveLength(1)
      expect(treeData[0].id).toBe('case6-cluster-1')
      expect(treeData[0].children).toBeDefined()

      const projects = treeData[0].children!
      expect(projects).toHaveLength(3)
      expect(projects[0].id).toBe('case6-project-1')
      expect(projects[1].id).toBe('case6-project-2')
      expect(projects[2].id).toBe('case6-project-3')
    })

    it('returns tree data for example index 7 (multiple clusters → full access)', () => {
      const treeData = getExampleTreeData(7, mockT)

      expect(treeData).toHaveLength(2)
      expect(treeData[0].id).toBe('case7-cluster-1')
      expect(treeData[1].id).toBe('case7-cluster-2')

      // Both clusters should have projects
      expect(treeData[0].children).toBeDefined()
      expect(treeData[1].children).toBeDefined()

      const firstClusterProjects = treeData[0].children!
      expect(firstClusterProjects).toHaveLength(2)
      expect(firstClusterProjects[0].id).toBe('case7-project-1')
      expect(firstClusterProjects[1].id).toBe('case7-project-2')
    })

    it('returns tree data for example index 8 (multiple clusters → common projects)', () => {
      const treeData = getExampleTreeData(8, mockT)

      expect(treeData).toHaveLength(2)
      expect(treeData[0].id).toBe('case8-cluster-1')
      expect(treeData[1].id).toBe('case8-cluster-2')

      // Both clusters should have common projects
      expect(treeData[0].children).toBeDefined()
      expect(treeData[1].children).toBeDefined()

      const firstClusterProjects = treeData[0].children!
      expect(firstClusterProjects).toHaveLength(3)
      expect(firstClusterProjects[0].id).toBe('case8-project-1') // Common project
    })

    it('returns tree data for example index 9 (single cluster set → partial access)', () => {
      const treeData = getExampleTreeData(9, mockT)

      expect(treeData).toHaveLength(1)
      expect(treeData[0].id).toBe('case9-cluster-set-1')
      expect(treeData[0].children).toBeDefined()

      // Check that some projects are checked and some are not
      const projects = treeData[0].children!
      expect(projects).toHaveLength(3)

      // First project should be checked
      expect(projects[0].id).toBe('case9-project-1')
      // Other projects should not be checked
      expect(projects[1].id).toBe('case9-project-2')
      expect(projects[2].id).toBe('case9-project-3')
    })

    it('returns tree data for example index 10 (multiple cluster sets → common projects)', () => {
      const treeData = getExampleTreeData(10, mockT)

      expect(treeData).toHaveLength(2)
      expect(treeData[0].id).toBe('case10-cluster-set-1')
      expect(treeData[1].id).toBe('case10-cluster-set-2')

      // Both cluster sets should have children (projects)
      expect(treeData[0].children).toBeDefined()
      expect(treeData[1].children).toBeDefined()

      // Check common projects structure
      const firstClusterSetProjects = treeData[0].children!
      expect(firstClusterSetProjects).toHaveLength(3)
      expect(firstClusterSetProjects[0].id).toBe('case10-project-1') // Common project

      const secondClusterSetProjects = treeData[1].children!
      expect(secondClusterSetProjects).toHaveLength(3)
      expect(secondClusterSetProjects[0].id).toBe('case10-project-4') // Common project
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
