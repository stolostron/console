/* Copyright Contributors to the Open Cluster Management project */

import { TreeViewDataItem } from '@patternfly/react-core'
import { CheckCircleIcon, OutlinedCircleIcon } from '@patternfly/react-icons'
import { TFunction } from 'react-i18next'

const iconColor = 'green'
const greyIconColor = '#6a6e73'

// Helper function to create icons
const createCheckIcon = (isChecked: boolean) =>
  isChecked ? <CheckCircleIcon color={iconColor} /> : <OutlinedCircleIcon color={greyIconColor} />

// Helper function to create name with conditional bold styling
const createName = (text: string, isChecked: boolean) => (isChecked ? <strong>{text}</strong> : text)

// Helper function to create a tree node
const createTreeNode = (
  caseIndex: number,
  t: TFunction,
  type: 'cluster-set' | 'cluster' | 'project' | 'vm' | 'common-project',
  index: number,
  isChecked: boolean,
  children?: TreeViewDataItem[]
): TreeViewDataItem => {
  const typeMap = {
    'cluster-set': t('Cluster set'),
    cluster: t('Cluster'),
    project: t('Project'),
    'common-project': t('Common project'),
    vm: t('Virtual machine'),
  }

  const idMap = {
    'cluster-set': `case${caseIndex}-cluster-set-${index}`,
    cluster: `case${caseIndex}-cluster-${index}`,
    project: `case${caseIndex}-project-${index}`,
    'common-project': `case${caseIndex}-project-${index}`,
    vm: `case${caseIndex}-vm-${index}`,
  }

  return {
    name: createName(typeMap[type], isChecked),
    id: idMap[type],
    icon: createCheckIcon(isChecked),
    ...(children && { children }),
  }
}

// Helper function to create a common project node
const createCommonProjectNode = (caseIndex: number, t: TFunction, index: number): TreeViewDataItem =>
  createTreeNode(caseIndex, t, 'common-project', index, true)

// Helper function to create a project node
const createProjectNode = (
  caseIndex: number,
  t: TFunction,
  index: number,
  isChecked: boolean,
  children?: TreeViewDataItem[]
): TreeViewDataItem => createTreeNode(caseIndex, t, 'project', index, isChecked, children)

// Helper function to create a virtual machine node
const createVMNode = (caseIndex: number, t: TFunction, index: number): TreeViewDataItem =>
  createTreeNode(caseIndex, t, 'vm', index, true)

// Helper function to create a cluster node
const createClusterNode = (
  caseIndex: number,
  t: TFunction,
  index: number,
  isChecked: boolean,
  children?: TreeViewDataItem[]
): TreeViewDataItem => createTreeNode(caseIndex, t, 'cluster', index, isChecked, children)

// Helper function to create a cluster set node
const createClusterSetNode = (
  caseIndex: number,
  t: TFunction,
  index: number,
  isChecked: boolean,
  children?: TreeViewDataItem[]
): TreeViewDataItem => createTreeNode(caseIndex, t, 'cluster-set', index, isChecked, children)

export const getExampleTreeData = (exampleIndex: number, t: TFunction): TreeViewDataItem[] => {
  switch (exampleIndex) {
    case 0: // Full access to all resources
      return [
        createClusterSetNode(0, t, 1, true, [
          createClusterNode(0, t, 1, true, [
            createProjectNode(0, t, 1, true, [createVMNode(0, t, 1), createVMNode(0, t, 2)]),
            createProjectNode(0, t, 2, true, [createVMNode(0, t, 3), createVMNode(0, t, 4)]),
          ]),
          createClusterNode(0, t, 2, true, [
            createProjectNode(0, t, 3, true, [createVMNode(0, t, 5), createVMNode(0, t, 6)]),
          ]),
        ]),
        createClusterSetNode(0, t, 2, true),
        createClusterSetNode(0, t, 3, true),
      ]

    case 1: // Single cluster set → Single cluster → Partial access
      return [
        createClusterSetNode(1, t, 1, true, [
          createClusterNode(1, t, 1, true, [createProjectNode(1, t, 1, true), createProjectNode(1, t, 2, false)]),
          createClusterNode(1, t, 2, false),
        ]),
      ]

    case 2: // Single cluster set → Multiple clusters → Common projects
      return [
        createClusterSetNode(2, t, 1, true, [
          createClusterNode(2, t, 1, true, [createCommonProjectNode(2, t, 1), createProjectNode(2, t, 2, false)]),
          createClusterNode(2, t, 2, true, [createCommonProjectNode(2, t, 3), createProjectNode(2, t, 4, false)]),
        ]),
      ]

    case 3: // Multiple cluster sets → Full access
      return [
        createClusterSetNode(3, t, 1, true, [createClusterNode(3, t, 1, true), createClusterNode(3, t, 2, true)]),
        createClusterSetNode(3, t, 2, true, [createClusterNode(3, t, 3, true), createClusterNode(3, t, 4, true)]),
      ]

    case 4: // Multiple cluster sets → Partial access → Common projects
      return [
        createClusterSetNode(4, t, 1, true, [
          createClusterNode(4, t, 1, true, [createCommonProjectNode(4, t, 1)]),
          createClusterNode(4, t, 2, false),
        ]),
        createClusterSetNode(4, t, 2, true, [createClusterNode(4, t, 3, true, [createCommonProjectNode(4, t, 2)])]),
      ]

    case 5: // Single cluster → Full access
      return [
        createClusterNode(5, t, 1, true, [
          createProjectNode(5, t, 1, true),
          createProjectNode(5, t, 2, true),
          createProjectNode(5, t, 3, true),
        ]),
      ]

    case 6: // Single cluster → Partial access
      return [
        createClusterNode(6, t, 1, true, [
          createProjectNode(6, t, 1, true),
          createProjectNode(6, t, 2, false),
          createProjectNode(6, t, 3, false),
        ]),
      ]

    case 7: // Multiple clusters → Full access
      return [
        createClusterNode(7, t, 1, true, [createProjectNode(7, t, 1, true), createProjectNode(7, t, 2, true)]),
        createClusterNode(7, t, 2, true, [createProjectNode(7, t, 3, true), createProjectNode(7, t, 4, true)]),
      ]

    case 8: // Multiple clusters → Common projects
      return [
        createClusterNode(8, t, 1, true, [
          createCommonProjectNode(8, t, 1),
          createProjectNode(8, t, 2, false),
          createProjectNode(8, t, 3, false),
        ]),
        createClusterNode(8, t, 2, true, [
          createCommonProjectNode(8, t, 4),
          createProjectNode(8, t, 5, false),
          createProjectNode(8, t, 6, false),
        ]),
      ]

    case 9: // Single cluster set → Partial access
      return [
        createClusterSetNode(9, t, 1, true, [
          createProjectNode(9, t, 1, true),
          createProjectNode(9, t, 2, false),
          createProjectNode(9, t, 3, false),
        ]),
      ]

    case 10: // Multiple cluster sets → Common projects
      return [
        createClusterSetNode(10, t, 1, true, [
          createCommonProjectNode(10, t, 1),
          createProjectNode(10, t, 2, false),
          createProjectNode(10, t, 3, false),
        ]),
        createClusterSetNode(10, t, 2, true, [
          createCommonProjectNode(10, t, 4),
          createProjectNode(10, t, 5, false),
          createProjectNode(10, t, 6, false),
        ]),
      ]

    default:
      return []
  }
}

export const getExampleTitle = (exampleIndex: number, t: TFunction): string => {
  switch (exampleIndex) {
    case 0:
      return t('Example scope: Full access to all resources')
    case 1:
      return t('Example scope: Single cluster set → Single cluster → Partial access')
    case 2:
      return t('Example scope: Single cluster set → Multiple clusters → Common projects')
    case 3:
      return t('Example scope: Multiple cluster sets → Full access')
    case 4:
      return t('Example scope: Multiple cluster sets → Partial access → Common projects')
    case 5:
      return t('Example scope: Single cluster → Full access')
    case 6:
      return t('Example scope: Single cluster → Partial access')
    case 7:
      return t('Example scope: Multiple clusters → Full access')
    case 8:
      return t('Example scope: Multiple clusters → Common projects')
    case 9:
      return t('Example scope: Single cluster set → Partial access')
    case 10:
      return t('Example scope: Multiple cluster sets → Common projects')
    default:
      return t('Example scope')
  }
}
