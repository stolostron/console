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

export const getExampleTreeData = (exampleIndex: number, t: TFunction): TreeViewDataItem[] => {
  switch (exampleIndex) {
    case 0: // Full access to all resources
      return [
        {
          name: createName(t('Cluster set'), true),
          id: 'case0-cluster-set-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Cluster'), true),
              id: 'case0-cluster-1',
              icon: createCheckIcon(true),
              children: [
                {
                  name: createName(t('Project'), true),
                  id: 'case0-project-1',
                  icon: createCheckIcon(true),
                  children: [
                    {
                      name: createName(t('Virtual machine'), true),
                      id: 'case0-vm-1',
                      icon: createCheckIcon(true),
                    },
                    {
                      name: createName(t('Virtual machine'), true),
                      id: 'case0-vm-2',
                      icon: createCheckIcon(true),
                    },
                  ],
                },
                {
                  name: createName(t('Project'), true),
                  id: 'case0-project-2',
                  icon: createCheckIcon(true),
                  children: [
                    {
                      name: createName(t('Virtual machine'), true),
                      id: 'case0-vm-3',
                      icon: createCheckIcon(true),
                    },
                    {
                      name: createName(t('Virtual machine'), true),
                      id: 'case0-vm-4',
                      icon: createCheckIcon(true),
                    },
                  ],
                },
              ],
            },
            {
              name: createName(t('Cluster'), true),
              id: 'case0-cluster-2',
              icon: createCheckIcon(true),
              children: [
                {
                  name: createName(t('Project'), true),
                  id: 'case0-project-3',
                  icon: createCheckIcon(true),
                  children: [
                    {
                      name: createName(t('Virtual machine'), true),
                      id: 'case0-vm-5',
                      icon: createCheckIcon(true),
                    },
                    {
                      name: createName(t('Virtual machine'), true),
                      id: 'case0-vm-6',
                      icon: createCheckIcon(true),
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: createName(t('Cluster set'), true),
          id: 'case0-cluster-set-2',
          icon: createCheckIcon(true),
        },
        {
          name: createName(t('Cluster set'), true),
          id: 'case0-cluster-set-3',
          icon: createCheckIcon(true),
        },
      ]

    case 1: // Single cluster set → Single cluster → Partial access
      return [
        {
          name: createName(t('Cluster set'), true),
          id: 'case1-cluster-set-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Cluster'), true),
              id: 'case1-cluster-1',
              icon: createCheckIcon(true),
              children: [
                {
                  name: createName(t('Project'), true),
                  id: 'case1-project-1',
                  icon: createCheckIcon(true),
                },
                {
                  name: createName(t('Project'), false),
                  id: 'case1-project-2',
                  icon: createCheckIcon(false),
                },
              ],
            },
            {
              name: createName(t('Cluster'), false),
              id: 'case1-cluster-2',
              icon: createCheckIcon(false),
            },
          ],
        },
      ]

    case 2: // Single cluster set → Multiple clusters → Common projects
      return [
        {
          name: createName(t('Cluster set'), true),
          id: 'case2-cluster-set-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Cluster'), true),
              id: 'case2-cluster-1',
              icon: createCheckIcon(true),
              children: [
                {
                  name: createName(t('Common project'), true),
                  id: 'case2-project-1',
                  icon: createCheckIcon(true),
                },
                {
                  name: createName(t('Project'), false),
                  id: 'case2-project-2',
                  icon: createCheckIcon(false),
                },
              ],
            },
            {
              name: createName(t('Cluster'), true),
              id: 'case2-cluster-2',
              icon: createCheckIcon(true),
              children: [
                {
                  name: createName(t('Common project'), true),
                  id: 'case2-project-3',
                  icon: createCheckIcon(true),
                },
                {
                  name: createName(t('Project'), false),
                  id: 'case2-project-4',
                  icon: createCheckIcon(false),
                },
              ],
            },
          ],
        },
      ]

    case 3: // Multiple cluster sets → Full access
      return [
        {
          name: createName(t('Cluster set'), true),
          id: 'case3-cluster-set-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Cluster'), true),
              id: 'case3-cluster-1',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Cluster'), true),
              id: 'case3-cluster-2',
              icon: createCheckIcon(true),
            },
          ],
        },
        {
          name: createName(t('Cluster set'), true),
          id: 'case3-cluster-set-2',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Cluster'), true),
              id: 'case3-cluster-3',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Cluster'), true),
              id: 'case3-cluster-4',
              icon: createCheckIcon(true),
            },
          ],
        },
      ]

    case 4: // Multiple cluster sets → Partial access → Common projects
      return [
        {
          name: createName(t('Cluster set'), true),
          id: 'case4-cluster-set-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Cluster'), true),
              id: 'case4-cluster-1',
              icon: createCheckIcon(true),
              children: [
                {
                  name: createName(t('Common project'), true),
                  id: 'case4-project-1',
                  icon: createCheckIcon(true),
                },
              ],
            },
            {
              name: createName(t('Cluster'), false),
              id: 'case4-cluster-2',
              icon: createCheckIcon(false),
            },
          ],
        },
        {
          name: createName(t('Cluster set'), true),
          id: 'case4-cluster-set-2',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Cluster'), true),
              id: 'case4-cluster-3',
              icon: createCheckIcon(true),
              children: [
                {
                  name: createName(t('Common project'), true),
                  id: 'case4-project-2',
                  icon: createCheckIcon(true),
                },
              ],
            },
          ],
        },
      ]

    case 5: // Single cluster → Full access
      return [
        {
          name: createName(t('Cluster'), true),
          id: 'case5-cluster-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Project'), true),
              id: 'case5-project-1',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), true),
              id: 'case5-project-2',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), true),
              id: 'case5-project-3',
              icon: createCheckIcon(true),
            },
          ],
        },
      ]

    case 6: // Single cluster → Partial access
      return [
        {
          name: createName(t('Cluster'), true),
          id: 'case6-cluster-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Project'), true),
              id: 'case6-project-1',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), false),
              id: 'case6-project-2',
              icon: createCheckIcon(false),
            },
            {
              name: createName(t('Project'), false),
              id: 'case6-project-3',
              icon: createCheckIcon(false),
            },
          ],
        },
      ]

    case 7: // Multiple clusters → Full access
      return [
        {
          name: createName(t('Cluster'), true),
          id: 'case7-cluster-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Project'), true),
              id: 'case7-project-1',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), true),
              id: 'case7-project-2',
              icon: createCheckIcon(true),
            },
          ],
        },
        {
          name: createName(t('Cluster'), true),
          id: 'case7-cluster-2',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Project'), true),
              id: 'case7-project-3',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), true),
              id: 'case7-project-4',
              icon: createCheckIcon(true),
            },
          ],
        },
      ]

    case 8: // Multiple clusters → Common projects
      return [
        {
          name: createName(t('Cluster'), true),
          id: 'case8-cluster-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Common project'), true),
              id: 'case8-project-1',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), false),
              id: 'case8-project-2',
              icon: createCheckIcon(false),
            },
            {
              name: createName(t('Project'), false),
              id: 'case8-project-3',
              icon: createCheckIcon(false),
            },
          ],
        },
        {
          name: createName(t('Cluster'), true),
          id: 'case8-cluster-2',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Common project'), true),
              id: 'case8-project-4',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), false),
              id: 'case8-project-5',
              icon: createCheckIcon(false),
            },
            {
              name: createName(t('Project'), false),
              id: 'case8-project-6',
              icon: createCheckIcon(false),
            },
          ],
        },
      ]

    case 9: // Single cluster set → Partial access
      return [
        {
          name: createName(t('Cluster set'), true),
          id: 'case9-cluster-set-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Project'), true),
              id: 'case9-project-1',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), false),
              id: 'case9-project-2',
              icon: createCheckIcon(false),
            },
            {
              name: createName(t('Project'), false),
              id: 'case9-project-3',
              icon: createCheckIcon(false),
            },
          ],
        },
      ]

    case 10: // Multiple cluster sets → Common projects
      return [
        {
          name: createName(t('Cluster set'), true),
          id: 'case10-cluster-set-1',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Common project'), true),
              id: 'case10-project-1',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), false),
              id: 'case10-project-2',
              icon: createCheckIcon(false),
            },
            {
              name: createName(t('Project'), false),
              id: 'case10-project-3',
              icon: createCheckIcon(false),
            },
          ],
        },
        {
          name: createName(t('Cluster set'), true),
          id: 'case10-cluster-set-2',
          icon: createCheckIcon(true),
          children: [
            {
              name: createName(t('Common project'), true),
              id: 'case10-project-4',
              icon: createCheckIcon(true),
            },
            {
              name: createName(t('Project'), false),
              id: 'case10-project-5',
              icon: createCheckIcon(false),
            },
            {
              name: createName(t('Project'), false),
              id: 'case10-project-6',
              icon: createCheckIcon(false),
            },
          ],
        },
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
