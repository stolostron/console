// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

jest.mock('./resourceStatusesArgo', () => ({
  getArgoResourceStatuses: jest.fn().mockResolvedValue({
    resourceStatuses: { mocked: 'argo' },
    relatedResources: { argoRel: true },
  }),
}))
jest.mock('./resourceStatusesAppSet', () => ({
  getAppSetResourceStatuses: jest.fn().mockResolvedValue({
    resourceStatuses: { mocked: 'appset' },
    relatedResources: { appsetRel: true },
  }),
}))
jest.mock('./resourceStatusesSubscription', () => ({
  getSubscriptionResourceStatuses: jest.fn().mockResolvedValue({
    resourceStatuses: { mocked: 'subscription' },
    relatedResources: { subRel: true },
  }),
}))

import { getArgoResourceStatuses } from './resourceStatusesArgo'
import { getAppSetResourceStatuses } from './resourceStatusesAppSet'
import { getSubscriptionResourceStatuses } from './resourceStatusesSubscription'

import {
  calculateArgoClusterStatus,
  computeNodeStatus,
  getOnlineClusters,
  getPodState,
  getPulseForData,
  getPulseStatusForArgoApp,
  getPulseStatusForCluster,
  getPulseStatusForSubscription,
  getResourceStatuses,
  getShapeTypeForSubscription,
} from './computeStatuses'
import { setAppSetDeployStatus } from './NodeDetailsProviderStatuses'
import { setPlacementRuleDeployStatus } from './NodeDetailsProviderStatuses'
import { setApplicationDeployStatus } from './NodeDetailsProviderStatuses'
import { setSubscriptionDeployStatus } from './NodeDetailsProviderStatuses'
import { setPodDeployStatus } from './NodeDetailsProviderStatuses'
import { setResourceDeployStatus } from './NodeDetailsProviderStatuses'

import {
  appNoChannelGreen,
  appNoChannelRed,
  appSetDeployable,
  appSubDeployable,
  appSetDesignFalse,
  clusterNode,
  deploymentNodeNoPodModel,
  deploymentNodeNoPODS,
  deploymentNodeNoPODSNoRes,
  deploymentNodeRed,
  deploymentNodeRed3,
  deploymentNodeYellow2,
  deploymentNodeYellow4,
  genericNodeInputRed,
  genericNodeInputRed2,
  genericNodeYellow,
  genericNodeYellowNotDefined,
  packageNodeOrange,
  persVolumePendingStateGreen,
  persVolumePendingStateYellow,
  placementsDeployable,
  placementDeployable,
  ruleNodeGreen2,
  ruleNodeRed,
  subscriptionGreenNotPlacedYellow,
  subscriptionInputNotPlaced,
  subscriptionInputRed,
  subscriptionInputRed1,
  subscriptionInputYellow,
  ansibleError,
  ansibleError2,
  ansibleErrorAllClusters,
  ansibleSuccess,
} from './computeStatuses.testdata'

import type { ActiveFilters, Translator, DetailItem } from '../types'

const t: Translator = (string: string): string => {
  return string
}

// Provide an empty implementation for window.open
window.open = jest.fn()

describe('getPulseForData', () => {
  const available = 1
  const desired = 2
  const podsUnavailable = 3

  it('getPulseForData pulse red', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('red')
  })
})

describe('getPulseForData', () => {
  const available = 1
  const desired = 2
  const podsUnavailable = 3

  it('getPulseForData pulse red pod unavailable', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('red')
  })
})

describe('getPulseForData', () => {
  const available = 1
  const desired = 2
  const podsUnavailable = 0

  it('getPulseForData pulse red pod desired less then available', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('yellow')
  })
})

describe('getPulseForData', () => {
  const available = 1
  const desired = 0
  const podsUnavailable = 0

  it('getPulseForData pulse yellow pod desired is 0', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('yellow')
  })
})

describe('getPulseForData', () => {
  const available = 1
  const desired = 1
  const podsUnavailable = 0

  it('getPulseForData pulse green pod desired is equal with available', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('green')
  })
})

describe('setSubscriptionDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setSubscriptionDeployStatus subscription input red', () => {
    const result = setSubscriptionDeployStatus(subscriptionInputRed, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setSubscriptionDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setSubscriptionDeployStatus subscription input red1', () => {
    const result = setSubscriptionDeployStatus(subscriptionInputRed1, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setSubscriptionDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setSubscriptionDeployStatus subscription input yellow', () => {
    const result = setSubscriptionDeployStatus(subscriptionInputYellow, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setSubscriptionDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setSubscriptionDeployStatus subscription input not placed', () => {
    const result = setSubscriptionDeployStatus(subscriptionInputNotPlaced, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setSubscriptionDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setSubscriptionDeployStatus subscription green not placed yellow', () => {
    const result = setSubscriptionDeployStatus(subscriptionGreenNotPlacedYellow, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setResourceDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setResourceDeployStatus generic node input red', () => {
    const result = setResourceDeployStatus(genericNodeInputRed, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setResourceDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setResourceDeployStatus generic node input red2', () => {
    const result = setResourceDeployStatus(genericNodeInputRed2, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setResourceDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setResourceDeployStatus generic node yellow', () => {
    const result = setResourceDeployStatus(genericNodeYellow, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setResourceDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setResourceDeployStatus generic node yellow not defined', () => {
    const result = setResourceDeployStatus(genericNodeYellowNotDefined, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setResourceDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setResourceDeployStatus package node orange', () => {
    const result = setResourceDeployStatus(packageNodeOrange, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setResourceDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setResourceDeployStatus persistent volume pending state yellow', () => {
    const result = setResourceDeployStatus(persVolumePendingStateYellow, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setResourceDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setResourceDeployStatus persistent volume pending state green', () => {
    const result = setResourceDeployStatus(persVolumePendingStateGreen, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setPodDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setPodDeployStatus deployment node red', () => {
    const result = setPodDeployStatus(deploymentNodeRed, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setPodDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setPodDeployStatus deployment node red3', () => {
    const result = setPodDeployStatus(deploymentNodeRed3, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setPodDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setPodDeployStatus deployment node yellow2', () => {
    const result = setPodDeployStatus(deploymentNodeYellow2, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setPodDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setPodDeployStatus deployment node yellow4', () => {
    const result = setPodDeployStatus(deploymentNodeYellow4, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setPodDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setPodDeployStatus deployment node no pods', () => {
    const result = setPodDeployStatus(deploymentNodeNoPODS, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setPodDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setPodDeployStatus deployment node no pods no res', () => {
    const result = setPodDeployStatus(deploymentNodeNoPODSNoRes, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setPodDeployStatus', () => {
  const activeFilters: ActiveFilters = {}

  it('setPodDeployStatus deployment node no pod model', () => {
    const result = setPodDeployStatus(deploymentNodeNoPodModel, [], activeFilters, t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setPlacementRuleDeployStatus', () => {
  it('setPlacementRuleDeployStatus rule node green2', () => {
    const result = setPlacementRuleDeployStatus(ruleNodeGreen2, [], t)
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setPlacementRuleDeployStatus', () => {
  it('setPlacementRuleDeployStatus rule node red', () => {
    const result = setPlacementRuleDeployStatus(ruleNodeRed, [], t)
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setApplicationDeployStatus', () => {
  it('setApplicationDeployStatus app no channel green', () => {
    const result = setApplicationDeployStatus(appNoChannelGreen, [], t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setApplicationDeployStatus', () => {
  it('setApplicationDeployStatus app no channel red', () => {
    const result = setApplicationDeployStatus(appNoChannelRed, [], t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setApplicationDeployStatus', () => {
  it('setApplicationDeployStatus app sub deployable', () => {
    const result = setApplicationDeployStatus(appSubDeployable, [], t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setAppSetDeployStatus', () => {
  it('setAppSetDeployStatus app set deployable', () => {
    setAppSetDeployStatus(appSetDeployable, [], t, 'local-cluster')
    // setAppSetDeployStatus returns void, so we just test that it doesn't throw
    expect(true).toBe(true)
  })
})

describe('setAppSetDeployStatus', () => {
  it('setAppSetDeployStatus app set design false', () => {
    setAppSetDeployStatus(appSetDesignFalse, [], t, 'local-cluster')
    // setAppSetDeployStatus returns void, so we just test that it doesn't throw
    expect(true).toBe(true)
  })
})

describe('setApplicationDeployStatus', () => {
  it('setApplicationDeployStatus placements deployable', () => {
    const result = setApplicationDeployStatus(placementsDeployable, [], t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('setApplicationDeployStatus', () => {
  it('setApplicationDeployStatus placement deployable', () => {
    const result = setApplicationDeployStatus(placementDeployable, [], t, 'local-cluster')
    expect(result).toEqual(expect.arrayContaining([]))
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus cluster node', () => {
    const result = computeNodeStatus(clusterNode, true, t, 'local-cluster')
    expect(result).toEqual('green')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus ansible success', () => {
    const result = computeNodeStatus(ansibleSuccess, true, t, 'local-cluster')
    expect(result).toEqual('green')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus ansible error', () => {
    const result = computeNodeStatus(ansibleError, true, t, 'local-cluster')
    expect(result).toEqual('orange')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus ansible error2', () => {
    const result = computeNodeStatus(ansibleError2, true, t, 'local-cluster')
    expect(result).toEqual('orange')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus ansible error all clusters', () => {
    const result = computeNodeStatus(ansibleErrorAllClusters, true, t, 'local-cluster')
    expect(result).toEqual('orange')
  })
})

// Additional comprehensive tests for getPulseForData edge cases
describe('getPulseForData edge cases', () => {
  it('should return red when available is 0 and desired is greater than 0', () => {
    expect(getPulseForData(0, 1, 0)).toEqual('red')
  })

  it('should return green when available is 0 and desired is 0', () => {
    expect(getPulseForData(0, 0, 0)).toEqual('green')
  })

  it('should return green when desired is 0 and available is 0', () => {
    expect(getPulseForData(0, 0, 0)).toEqual('green')
  })

  it('should return yellow when available is less than desired and no unavailable pods', () => {
    expect(getPulseForData(1, 3, 0)).toEqual('yellow')
  })

  it('should return green when available equals desired and no unavailable pods', () => {
    expect(getPulseForData(2, 2, 0)).toEqual('green')
  })

  it('should return yellow when desired is 0 but available is greater than 0', () => {
    expect(getPulseForData(1, 0, 0)).toEqual('yellow')
  })

  it('should handle large numbers correctly', () => {
    expect(getPulseForData(1000, 1000, 0)).toEqual('green')
    expect(getPulseForData(999, 1000, 0)).toEqual('yellow')
    expect(getPulseForData(0, 1000, 0)).toEqual('red')
  })
})

// Tests for computeNodeStatus with different node types
describe('computeNodeStatus node type variations', () => {
  it('should return spinner when isSearchingStatusComplete is false', () => {
    const node = {
      type: 'application',
      specs: { pulse: 'green' },
      name: 'test-app',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const result = computeNodeStatus(node, false, t, 'local-cluster')
    expect(result).toEqual('spinner')
  })

  it('should handle fluxapplication node type', () => {
    const node = {
      type: 'fluxapplication',
      specs: { pulse: 'green' },
      name: 'test-flux-app',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const result = computeNodeStatus(node, true, t, 'local-cluster')
    expect(result).toEqual('green')
  })

  it('should handle ocpapplication node type', () => {
    const node = {
      type: 'ocpapplication',
      specs: { pulse: 'green' },
      name: 'test-ocp-app',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const result = computeNodeStatus(node, true, t, 'local-cluster')
    expect(result).toEqual('green')
  })

  it('should handle applicationset node type with isDesign false', () => {
    const node = {
      type: 'applicationset',
      specs: {
        pulse: 'green',
        isDesign: false,
        raw: { status: { health: { status: 'Healthy' } } },
      },
      name: 'test-appset',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const result = computeNodeStatus(node, true, t, 'local-cluster')
    expect(result).toEqual('orange')
  })

  it('should handle placements node type with no decisions', () => {
    const node = {
      type: 'placements',
      specs: {
        pulse: 'green',
        isDesign: true,
        raw: { status: {} },
      },
      name: 'test-placement',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const result = computeNodeStatus(node, true, t, 'local-cluster')
    expect(result).toEqual('red')
  })

  it('should handle placement node type with numberOfSelectedClusters 0', () => {
    const node = {
      type: 'placementDecision',
      specs: {
        pulse: 'green',
        isDesign: true,
        raw: { status: { numberOfSelectedClusters: 0 } },
      },
      name: 'test-placement',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const result = computeNodeStatus(node, true, t, 'local-cluster')
    expect(result).toEqual('red')
  })

  it('should handle subscription node type with isBlocked true', () => {
    const node = {
      type: 'subscription',
      specs: {
        pulse: 'green',
        isBlocked: true,
        isDesign: true,
      },
      name: 'test-subscription',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const result = computeNodeStatus(node, true, t, 'local-cluster')
    expect(result).toEqual('blocked')
  })

  it('should handle cluster node type', () => {
    const node = {
      type: 'cluster',
      specs: {
        pulse: 'green',
        clusters: [{ name: 'test-cluster', status: 'ok' }],
      },
      name: 'test-cluster',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const result = computeNodeStatus(node, true, t, 'local-cluster')
    expect(result).toEqual('green')
  })
})

// Tests for setApplicationDeployStatus with various scenarios
describe('setApplicationDeployStatus comprehensive tests', () => {
  it('should return details unchanged for non-application node types', () => {
    const node = {
      type: 'subscription',
      specs: { isDesign: true },
    } as any
    const details: any[] = []
    const result = setApplicationDeployStatus(node, details, t, 'local-cluster')
    expect(result).toEqual(details)
  })

  it('should return details unchanged for application node with isDesign false', () => {
    const node = {
      type: 'application',
      specs: { isDesign: false },
    } as any
    const details: any[] = []
    const result = setApplicationDeployStatus(node, details, t, 'local-cluster')
    expect(result).toEqual(details)
  })

  it('should handle application with no channels and show error', () => {
    const node = {
      type: 'application',
      specs: {
        isDesign: true,
        channels: null,
      },
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    const result = setApplicationDeployStatus(node, details, t, 'local-cluster')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((detail) => detail.status === 'failure')).toBe(true)
  })

  it('should handle applicationset node type', () => {
    const node = {
      type: 'applicationset',
      specs: {
        isDesign: true,
        appSetApps: [],
      },
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    setApplicationDeployStatus(node, details, t, 'local-cluster')
    expect(details.length).toBeGreaterThan(0)
  })

  it('should handle argo application with argoproj.io apiVersion', () => {
    const node = {
      type: 'application',
      specs: {
        isDesign: true,
        raw: { apiVersion: 'argoproj.io/v1alpha1' },
      },
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    setApplicationDeployStatus(node, details, t, 'local-cluster')
    expect(details).toBeDefined()
  })
})

// Tests for setSubscriptionDeployStatus with various scenarios
describe('setSubscriptionDeployStatus comprehensive tests', () => {
  it('should return details unchanged for non-subscription node types', () => {
    const node = {
      type: 'application',
      specs: { isDesign: true },
    } as any
    const details: any[] = []
    const result = setSubscriptionDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result).toEqual(details)
  })

  it('should return details unchanged for deployable subscription', () => {
    const node = {
      type: 'subscription',
      specs: { isDesign: true },
      isDeployable: true,
    } as any
    const details: any[] = []
    const result = setSubscriptionDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result).toEqual(details)
  })

  it('should return details unchanged for subscription with isDesign false', () => {
    const node = {
      type: 'subscription',
      specs: { isDesign: false },
    } as any
    const details: any[] = []
    const result = setSubscriptionDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result).toEqual(details)
  })

  it('should handle subscription with time window configuration', () => {
    const node = {
      type: 'subscription',
      specs: {
        isDesign: true,
        raw: {
          spec: {
            timewindow: {
              windowtype: 'active',
              location: 'UTC',
              daysofweek: ['monday', 'tuesday'],
              hours: [{ start: '09:00', end: '17:00' }],
            },
          },
          status: { message: 'cluster1:active,cluster2:blocked' },
        },
        isBlocked: false,
      },
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    const result = setSubscriptionDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle subscription with local placement', () => {
    const node = {
      type: 'subscription',
      specs: {
        isDesign: true,
        raw: {
          spec: { placement: { local: true } },
        },
      },
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    const result = setSubscriptionDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result.length).toBeGreaterThan(0)
  })
})

// Tests for setResourceDeployStatus with various scenarios
describe('setResourceDeployStatus comprehensive tests', () => {
  it('should return details unchanged for resources that must have pods', () => {
    const node = {
      type: 'deployment',
      specs: { podModel: {} },
    } as any
    const details: any[] = []
    const result = setResourceDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result).toEqual(details)
  })

  it('should return details unchanged for package node type', () => {
    const node = {
      type: 'package',
      specs: {},
    } as any
    const details: any[] = []
    const result = setResourceDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result).toEqual(details)
  })

  it('should handle ansible job with hook type', () => {
    const node = {
      type: 'ansiblejob',
      specs: {
        raw: { hookType: 'prehook' },
        ansiblejobModel: {},
      },
      name: 'test-ansible',
      namespace: 'test-ns',
      cluster: 'local-cluster',
    } as any
    const details: any[] = []
    const result = setResourceDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle resource with no resource map', () => {
    const node = {
      type: 'configmap',
      specs: { configmapModel: null },
      name: 'test-cm',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    const result = setResourceDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result.length).toBeGreaterThan(0)
  })
})

// Tests for setPodDeployStatus with various scenarios
describe('setPodDeployStatus comprehensive tests', () => {
  it('should return details unchanged for resources that do not have pods', () => {
    const node = {
      type: 'configmap',
      specs: {},
    } as any
    const details: any[] = []
    const result = setPodDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result).toEqual(details)
  })

  it('should handle pod with error status', () => {
    const node = {
      type: 'statefulset',
      specs: {
        podModel: {
          'test-cluster': [
            {
              name: 'test-pod',
              namespace: 'test-ns',
              status: 'Error',
              cluster: 'test-cluster',
              restarts: 3,
              hostIP: '192.168.1.1',
              podIP: '10.0.0.1',
              startedAt: '2023-01-01T00:00:00Z',
            },
          ],
        },
      },
      name: 'test-statefulset',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    const result = setPodDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle pod with warning status', () => {
    const node = {
      type: 'statefulset',
      specs: {
        podModel: {
          'test-cluster': [
            {
              name: 'test-pod',
              namespace: 'test-ns',
              status: 'Pending',
              cluster: 'test-cluster',
              restarts: 0,
              hostIP: '192.168.1.1',
              podIP: '10.0.0.1',
              startedAt: '2023-01-01T00:00:00Z',
            },
          ],
        },
      },
      name: 'test-statefulset',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    const result = setPodDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle pod with success status', () => {
    const node = {
      type: 'statefulset',
      specs: {
        podModel: {
          'test-cluster': [
            {
              name: 'test-pod',
              namespace: 'test-ns',
              status: 'Running',
              cluster: 'test-cluster',
              restarts: 0,
              hostIP: '192.168.1.1',
              podIP: '10.0.0.1',
              startedAt: '2023-01-01T00:00:00Z',
            },
          ],
        },
      },
      name: 'test-statefulset',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    const result = setPodDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should show not deployed message when no pod details are added', () => {
    const node = {
      type: 'statefulset',
      specs: { podModel: {} },
      name: 'test-statefulset',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    const details: any[] = []
    const result = setPodDeployStatus(node, details, {}, t, 'local-cluster')
    expect(result.length).toBeGreaterThan(0)
  })
})

// Tests for setPlacementRuleDeployStatus
describe('setPlacementRuleDeployStatus comprehensive tests', () => {
  it('should return details unchanged for non-placements node type', () => {
    const node = {
      type: 'application',
      specs: {},
    } as any
    const details: any[] = []
    const result = setPlacementRuleDeployStatus(node, details, t)
    expect(result).toEqual(details)
  })

  it('should return details unchanged for placement node (not placement rule)', () => {
    const node = {
      type: 'placements',
      isPlacement: true,
      specs: {},
    } as any
    const details: any[] = []
    const result = setPlacementRuleDeployStatus(node, details, t)
    expect(result).toEqual(details)
  })

  it('should show error when placement rule has no decisions', () => {
    const node = {
      type: 'placements',
      isPlacement: false,
      specs: {
        raw: { status: { decisions: [] } },
      },
    } as any
    const details: any[] = []
    const result = setPlacementRuleDeployStatus(node, details, t)
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((detail) => detail.status === 'failure')).toBe(true)
  })

  it('should not show error when placement rule has decisions', () => {
    const node = {
      type: 'placements',
      isPlacement: false,
      specs: {
        raw: { status: { decisions: [{ clusterName: 'test-cluster' }] } },
      },
    } as any
    const details: any[] = []
    const result = setPlacementRuleDeployStatus(node, details, t)
    expect(result).toEqual(details)
  })
})

// Tests for error handling and edge cases
describe('Error handling and edge cases', () => {
  it('should handle null/undefined node gracefully', () => {
    expect(() => {
      computeNodeStatus(null as any, true, t, 'local-cluster')
    }).toThrow()
  })

  it('should handle node with missing specs gracefully', () => {
    const node = {
      type: 'application',
      name: 'test-app',
      namespace: 'test-ns',
      id: 'test-id',
    } as any
    expect(() => {
      computeNodeStatus(node, true, t, 'local-cluster')
    }).not.toThrow()
  })

  it('should handle node with missing required properties', () => {
    const node = {
      type: 'application',
      specs: {},
    } as any
    expect(() => {
      setApplicationDeployStatus(node, [], t, 'local-cluster')
    }).not.toThrow()
  })

  it('should handle empty details array', () => {
    const node = {
      type: 'application',
      specs: { isDesign: true },
    } as any
    const result = setApplicationDeployStatus(node, [], t, 'local-cluster')
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle node with deeply nested missing properties', () => {
    const node = {
      type: 'subscription',
      specs: {
        isDesign: true,
        raw: {
          spec: {
            timewindow: null,
          },
          status: null,
        },
      },
    } as any
    expect(() => {
      setSubscriptionDeployStatus(node, [], {}, t, 'local-cluster')
    }).not.toThrow()
  })
})

// Tests for type validation using types from types.ts
describe('Type validation tests', () => {
  it('should use proper PulseColor type values', () => {
    const validPulseColors = ['red', 'green', 'yellow', 'orange', 'blocked', 'spinner']
    const node = {
      type: 'application',
      specs: { pulse: 'green' },
      name: 'test-app',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    const result = computeNodeStatus(node, true, t, 'local-cluster')
    expect(validPulseColors).toContain(result)
  })

  it('should use proper StatusType values in details', () => {
    const validStatusTypes = ['checkmark', 'warning', 'pending', 'failure']
    const node = {
      type: 'application',
      specs: {
        isDesign: true,
        channels: null,
      },
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    const details: any[] = []
    setApplicationDeployStatus(node, details, t, 'local-cluster')

    const statusDetails = details.filter((detail) => detail.status)
    statusDetails.forEach((detail) => {
      expect(validStatusTypes).toContain(detail.status)
    })
  })

  it('should use proper ActiveFilters type structure', () => {
    const activeFilters: ActiveFilters = {
      resourceStatuses: new Set(['checkmark', 'warning', 'pending', 'failure']),
    }

    const node = {
      type: 'subscription',
      specs: { isDesign: true },
    } as any

    expect(() => {
      setSubscriptionDeployStatus(node, [], activeFilters, t, 'local-cluster')
    }).not.toThrow()
  })
})

// Integration tests that test multiple functions working together
describe('Integration tests', () => {
  it('should compute node status and then set deployment status for application', () => {
    const node = {
      type: 'application',
      specs: {
        isDesign: true,
        channels: null,
        pulse: 'green',
      },
      name: 'test-app',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    // First compute the node status
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(pulse).toBeDefined()

    // Then set deployment status details
    const details: DetailItem[] = []
    const result = setApplicationDeployStatus(node, details, t, 'local-cluster')

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((detail) => detail.status === 'failure')).toBe(true)
  })

  it('should handle complete subscription workflow with status computation and details', () => {
    const node = {
      type: 'subscription',
      specs: {
        isDesign: true,
        isBlocked: false,
        raw: {
          spec: {
            timewindow: {
              windowtype: 'active',
              location: 'UTC',
            },
          },
          status: { message: 'cluster1:active' },
        },
        subscriptionModel: {
          'test-cluster': [
            {
              name: 'test-sub',
              namespace: 'test-ns',
              cluster: 'test-cluster',
              status: 'Subscribed',
            },
          ],
        },
      },
      name: 'test-subscription',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    // Compute node status
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(pulse).toBeDefined()

    // Set subscription deployment status
    const details: DetailItem[] = []
    const result = setSubscriptionDeployStatus(node, details, {}, t, 'local-cluster')

    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle complete pod resource workflow', () => {
    const node = {
      type: 'statefulset',
      specs: {
        pulse: 'green',
        podModel: {
          'test-cluster': [
            {
              name: 'test-pod',
              namespace: 'test-ns',
              status: 'Running',
              cluster: 'test-cluster',
              restarts: 0,
              hostIP: '192.168.1.1',
              podIP: '10.0.0.1',
              startedAt: '2023-01-01T00:00:00Z',
            },
          ],
        },
      },
      name: 'test-statefulset',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    // Compute node status
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(pulse).toBeDefined()

    // Set pod deployment status
    const details: DetailItem[] = []
    const result = setPodDeployStatus(node, details, {}, t, 'local-cluster')

    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle complete resource workflow for non-pod resources', () => {
    const node = {
      type: 'configmap',
      specs: {
        pulse: 'green',
        configmapModel: {
          'test-cluster': [
            {
              name: 'test-cm',
              namespace: 'test-ns',
              cluster: 'test-cluster',
              status: 'Deployed',
            },
          ],
        },
      },
      name: 'test-configmap',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    // Compute node status
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(pulse).toBeDefined()

    // Set resource deployment status
    const details: DetailItem[] = []
    const result = setResourceDeployStatus(node, details, {}, t, 'local-cluster')

    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle complete placement rule workflow', () => {
    const node = {
      type: 'placements',
      specs: {
        pulse: 'green',
        isDesign: true,
        raw: { status: { decisions: [] } },
      },
      name: 'test-placement-rule',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    // Compute node status
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(pulse).toBeDefined()

    // Set placement rule deployment status
    const details: DetailItem[] = []
    const result = setPlacementRuleDeployStatus(node, details, t)

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((detail) => detail.status === 'failure')).toBe(true)
  })

  it('should handle workflow with active filters', () => {
    const activeFilters: ActiveFilters = {
      resourceStatuses: new Set(['failure', 'warning']),
    }

    const node = {
      type: 'subscription',
      specs: {
        isDesign: true,
        subscriptionModel: {
          'test-cluster': [
            {
              name: 'test-sub',
              namespace: 'test-ns',
              cluster: 'test-cluster',
              status: 'Failed',
            },
          ],
        },
      },
      name: 'test-subscription',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    // Compute node status
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(pulse).toBeDefined()

    // Set subscription deployment status with filters
    const details: DetailItem[] = []
    const result = setSubscriptionDeployStatus(node, details, activeFilters, t, 'local-cluster')

    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle workflow with multiple node types in sequence', () => {
    const nodes = [
      {
        type: 'application',
        specs: { isDesign: true, channels: null },
        name: 'test-app',
        namespace: 'test-ns',
        id: 'app-id',
      },
      {
        type: 'subscription',
        specs: { isDesign: true },
        name: 'test-sub',
        namespace: 'test-ns',
        id: 'sub-id',
      },
      {
        type: 'deployment',
        specs: { podModel: {} },
        name: 'test-deployment',
        namespace: 'test-ns',
        id: 'deploy-id',
      },
    ] as any[]

    const results = nodes.map((node) => {
      const pulse = computeNodeStatus(node, true, t, 'local-cluster')
      const details: DetailItem[] = []

      switch (node.type) {
        case 'application':
          setApplicationDeployStatus(node, details, t, 'local-cluster')
          break
        case 'subscription':
          setSubscriptionDeployStatus(node, details, {}, t, 'local-cluster')
          break
        case 'deployment':
          setPodDeployStatus(node, details, {}, t, 'local-cluster')
          break
      }

      return { pulse, detailsCount: details.length }
    })

    expect(results).toHaveLength(3)
    results.forEach((result) => {
      expect(result.pulse).toBeDefined()
      expect(result.detailsCount).toBeGreaterThanOrEqual(0)
    })
  })

  it('should handle workflow with getPulseForData integration', () => {
    const node = {
      type: 'deployment',
      specs: {
        pulse: 'green',
        deploymentModel: {
          'test-cluster': [
            {
              name: 'test-deployment',
              namespace: 'test-ns',
              cluster: 'test-cluster',
              desired: 3,
              available: 2,
              current: 2,
            },
          ],
        },
      },
      name: 'test-deployment',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    // Compute node status (which internally uses getPulseForData)
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(pulse).toBeDefined()

    // Verify getPulseForData behavior directly
    const directPulse = getPulseForData(2, 3, 0)
    expect(directPulse).toEqual('yellow')

    // Set resource deployment status
    const details: DetailItem[] = []
    const result = setResourceDeployStatus(node, details, {}, t, 'local-cluster')

    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle complete argo application workflow', () => {
    const node = {
      type: 'application',
      specs: {
        isDesign: true,
        raw: {
          apiVersion: 'argoproj.io/v1alpha1',
          status: {
            health: { status: 'Healthy' },
            conditions: [],
          },
        },
        relatedApps: [
          {
            name: 'test-argo-app',
            cluster: 'test-cluster',
            namespace: 'test-ns',
            destinationName: 'test-cluster',
            destinationNamespace: 'test-ns',
            healthStatus: 'Healthy',
          },
        ],
      },
      name: 'test-argo-app',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    // Compute node status
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(pulse).toBeDefined()

    // Set application deployment status
    const details: DetailItem[] = []
    setApplicationDeployStatus(node, details, t, 'local-cluster')

    expect(details.length).toBeGreaterThan(0)
  })

  it('should handle workflow with cluster node and status computation', () => {
    const node = {
      type: 'cluster',
      specs: {
        pulse: 'green',
        clusters: [
          { name: 'cluster1', status: 'ok' },
          { name: 'cluster2', status: 'offline' },
        ],
        clustersNames: ['cluster1', 'cluster2'],
      },
      name: 'test-cluster',
      namespace: 'test-ns',
      id: 'test-id',
    } as any

    // Compute node status
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(pulse).toBeDefined()

    // The pulse should reflect the mixed cluster status
    expect(['yellow', 'red']).toContain(pulse)
  })
})

describe('computeStatuses exported helpers', () => {
  it('computeNodeStatus returns sync pulse for git and chart nodes', () => {
    const gitNode = { type: 'git', name: 'repo', namespace: 'ns', id: 'git-1', specs: {} } as any
    expect(computeNodeStatus(gitNode, true, t, 'local-cluster')).toEqual('sync')
    expect(gitNode.specs.pulse).toEqual('sync')

    const chartNode = { type: 'chart', name: 'helm', namespace: 'ns', id: 'chart-1', specs: {} } as any
    expect(computeNodeStatus(chartNode, true, t, 'local-cluster')).toEqual('sync')
  })

  it('computeNodeStatus uses Argo aggregate path for design-time ApplicationSet', () => {
    const node = {
      type: 'applicationset',
      name: 'appset',
      namespace: 'ns',
      cluster: 'hub',
      id: 'id',
      specs: {
        isDesign: true,
        appSetApps: [
          {
            metadata: { name: 'child', namespace: 'ns' },
            status: { health: { status: 'Healthy' } },
          },
        ],
        appStatusByNameMap: {
          child: { health: { status: 'Healthy' }, sync: { status: 'Synced' } },
        },
      },
    } as any
    expect(computeNodeStatus(node, true, t, 'local-cluster')).toEqual('green')
  })

  it('computeNodeStatus returns red for design ApplicationSet with no related apps', () => {
    const node = {
      type: 'applicationset',
      name: 'appset',
      namespace: 'ns',
      id: 'id',
      specs: { isDesign: true, appSetApps: [] },
    } as any
    expect(computeNodeStatus(node, true, t, 'local-cluster')).toEqual('red')
  })

  it('computeNodeStatus routes deployable placements through generic node logic', () => {
    const pulse = computeNodeStatus(placementsDeployable, true, t, 'local-cluster')
    expect(pulse).toBeDefined()
  })

  it('computeNodeStatus treats deployable placementDecision without model as green', () => {
    const pulse = computeNodeStatus(placementDeployable, true, t, 'local-cluster')
    expect(pulse).toEqual('green')
  })

  it('computeNodeStatus uses subscription-specific status for design-time subscription', () => {
    const node = {
      type: 'subscription',
      name: 'sub',
      namespace: 'default',
      id: 'member--clusters--feng--default--app--subscription--sub1',
      specs: {
        isDesign: true,
        isBlocked: false,
        subscriptionModel: {
          feng: [{ cluster: 'feng', status: 'Subscribed' }],
        },
        clustersNames: ['feng'],
        searchClusters: [{ name: 'feng', status: 'ok' }],
      },
    } as any
    const pulse = computeNodeStatus(node, true, t, 'local-cluster')
    expect(['green', 'yellow']).toContain(pulse)
    expect(node.specs.shapeType).toBeDefined()
  })

  it('getPulseStatusForSubscription returns orange when subscription model is missing', () => {
    const node = { type: 'subscription', specs: {} } as any
    expect(getPulseStatusForSubscription(node, 'local-cluster')).toEqual('orange')
  })

  it('getPulseStatusForSubscription marks red for failed report results', () => {
    const node = {
      type: 'subscription',
      specs: {
        subscriptionModel: {
          c1: [{ cluster: 'c1', status: 'Subscribed' }],
        },
        raw: { status: { statuses: {} } },
      },
      report: { results: [{ result: 'failed', source: 'c1' }] },
    } as any
    expect(getPulseStatusForSubscription(node, 'local-cluster')).toEqual('red')
  })

  it('getPulseStatusForSubscription turns yellow for failed package phase when pulse was green', () => {
    const node = {
      type: 'subscription',
      specs: {
        subscriptionModel: {
          c1: [{ cluster: 'c1', status: 'Subscribed' }],
        },
        raw: {
          status: {
            statuses: {
              c1: {
                packages: { pkg1: { phase: 'Failed' } },
              },
            },
          },
        },
      },
    } as any
    expect(getPulseStatusForSubscription(node, 'local-cluster')).toEqual('yellow')
  })

  it('getShapeTypeForSubscription returns subscriptionblocked when status message indicates blocked', () => {
    const node = {
      type: 'subscription',
      specs: { raw: { status: { message: 'Blocked by policy' } } },
    } as any
    expect(getShapeTypeForSubscription(node)).toEqual('subscriptionblocked')
  })

  it('getShapeTypeForSubscription returns subscription when not blocked', () => {
    const node = {
      type: 'subscription',
      specs: { raw: { status: { message: 'Active' } } },
    } as any
    expect(getShapeTypeForSubscription(node)).toEqual('subscription')
  })

  it('getPulseStatusForArgoApp returns pending when a related app has empty health', () => {
    const node = {
      name: 'appset',
      namespace: 'ns',
      specs: {
        appSetApps: [{ metadata: { name: 'noh', namespace: 'ns' }, status: {} }],
        appStatusByNameMap: {},
      },
    } as any
    expect(getPulseStatusForArgoApp(node, true)).toEqual('orange')
  })

  it('getPulseStatusForArgoApp returns warning when pull model targets local cluster with related apps', () => {
    const node = {
      name: 'appset',
      namespace: 'ns',
      isArgoCDPullModelTargetLocalCluster: true,
      specs: {
        appSetApps: [{ metadata: { name: 'a', namespace: 'ns' }, status: { health: { status: 'Healthy' } } }],
        appStatusByNameMap: {
          a: { health: { status: 'Healthy' }, sync: { status: 'Synced' } },
        },
      },
    } as any
    expect(getPulseStatusForArgoApp(node, true)).toEqual('yellow')
  })

  it('getPulseStatusForArgoApp classifies single Argo application health', () => {
    const degraded = {
      name: 'app',
      namespace: 'ns',
      cluster: 'c1',
      specs: { raw: { status: { health: { status: 'Degraded' } } } },
    } as any
    expect(getPulseStatusForArgoApp(degraded)).toEqual('red')

    const progressing = {
      name: 'app',
      namespace: 'ns',
      cluster: 'c1',
      specs: { raw: { status: { health: { status: 'Progressing' } } } },
    } as any
    expect(getPulseStatusForArgoApp(progressing)).toEqual('orange')

    const healthy = {
      name: 'app',
      namespace: 'ns',
      cluster: 'c1',
      specs: {
        raw: { status: { health: { status: 'Healthy' } } },
        appStatusByNameMap: {
          app: { health: { status: 'Healthy' }, sync: { status: 'Synced' } },
        },
      },
    } as any
    expect(getPulseStatusForArgoApp(healthy)).toEqual('green')
  })

  it('calculateArgoClusterStatus maps managed cluster conditions to status strings', () => {
    expect(
      calculateArgoClusterStatus({
        name: 'c',
        HubAcceptedManagedCluster: 'False',
      } as any)
    ).toEqual('notaccepted')
    expect(
      calculateArgoClusterStatus({
        name: 'c',
        HubAcceptedManagedCluster: 'True',
        ManagedClusterJoined: 'False',
      } as any)
    ).toEqual('pendingimport')
    expect(
      calculateArgoClusterStatus({
        name: 'c',
        HubAcceptedManagedCluster: 'True',
        ManagedClusterJoined: 'True',
        ManagedClusterConditionAvailable: 'True',
      } as any)
    ).toEqual('ok')
    expect(
      calculateArgoClusterStatus({
        name: 'c',
        HubAcceptedManagedCluster: 'True',
        ManagedClusterJoined: 'True',
        ManagedClusterConditionAvailable: 'False',
      } as any)
    ).toEqual('offline')
  })

  it('getPulseStatusForCluster merges app cluster entries and maps in-cluster to hub', () => {
    const node = {
      type: 'cluster',
      specs: {
        clusters: [{ name: 'in-cluster', status: '' }],
        appClusters: ['local-cluster'],
        clustersNames: ['local-cluster'],
      },
    } as any
    const pulse = getPulseStatusForCluster(node, 'local-cluster')
    expect(['green', 'yellow', 'red', 'orange']).toContain(pulse)
  })

  it('getPulseStatusForCluster returns orange when every cluster is pending import', () => {
    const node = {
      type: 'cluster',
      specs: {
        clusters: [
          { name: 'a', status: 'pendingimport' },
          { name: 'b', status: 'pendingimport' },
        ],
        clustersNames: ['a', 'b'],
      },
    } as any
    expect(getPulseStatusForCluster(node, 'hub')).toEqual('orange')
  })

  it('getOnlineClusters treats hub and OK remote clusters as online', () => {
    const node = {
      specs: {
        clustersNames: [' local-cluster ', 'remote'],
        searchClusters: [{ name: 'remote', status: 'ok' }],
      },
    } as any
    const online = getOnlineClusters(node as any, 'local-cluster')
    expect(online).toEqual(expect.arrayContaining(['local-cluster', 'remote']))
  })

  it('getPodState matches pod status substrings for the target cluster', () => {
    const pod = { cluster: 'c1', status: 'CrashLoopBackOff' } as any
    expect(getPodState(pod, 'c1', ['crash'])).toBe(1)
    expect(getPodState(pod, 'c2', ['crash'])).toBe(0)
    expect(getPodState(pod, '', ['crash'])).toBe(1)
  })

  it('getPulseForData returns green when available exceeds desired', () => {
    expect(getPulseForData(5, 3, 0)).toEqual('green')
  })

  it('computeNodeStatus returns yellow when resourceCount exceeds discovered resources', () => {
    const node = {
      type: 'deployment',
      name: 'd',
      namespace: 'default',
      id: 'member--member--deployable--member--clusters--feng--default--app--deployment--d1',
      specs: {
        resourceCount: 10,
        clustersNames: ['feng'],
        searchClusters: [{ name: 'feng', status: 'ok' }],
        deploymentModel: {
          key1: [{ name: 'd', namespace: 'default', cluster: 'feng', status: 'running' }],
        },
      },
    } as any
    expect(computeNodeStatus(node, true, t, 'local-cluster')).toEqual('yellow')
  })

  it('getResourceStatuses dispatches by application flags and deep-clones results', async () => {
    const appData = { original: true } as any
    const topology = { rawSearchData: { items: [] } } as any

    const argo = await getResourceStatuses({ isArgoApp: true } as any, appData, topology)
    expect(getArgoResourceStatuses).toHaveBeenCalled()
    expect(argo.resourceStatuses).toEqual({ mocked: 'argo' })
    expect(appData.original).toBe(true)

    const appset = await getResourceStatuses({ isAppSet: true } as any, appData, topology)
    expect(getAppSetResourceStatuses).toHaveBeenCalled()
    expect(appset.resourceStatuses).toEqual({ mocked: 'appset' })

    const ocp = await getResourceStatuses({ isOCPApp: true } as any, appData, topology)
    expect(ocp.resourceStatuses).toEqual({ items: [] })
    expect(getArgoResourceStatuses).toHaveBeenCalledTimes(1)

    const flux = await getResourceStatuses({ isFluxApp: true } as any, appData, topology)
    expect(flux.resourceStatuses).toEqual({ items: [] })

    const sub = await getResourceStatuses({} as any, appData, topology)
    expect(getSubscriptionResourceStatuses).toHaveBeenCalled()
    expect(sub.resourceStatuses).toEqual({ mocked: 'subscription' })
  })

  it('getPulseStatusForSubscription sets yellow when nothing is placed but pulse stayed green', () => {
    const node = {
      type: 'subscription',
      specs: {
        subscriptionModel: {
          c1: [{ cluster: 'c1' }],
        },
        clustersNames: ['c1'],
        searchClusters: [{ name: 'c1', status: 'ok' }],
      },
    } as any
    expect(getPulseStatusForSubscription(node, 'local-cluster')).toEqual('yellow')
  })

  it('getPulseStatusForSubscription flags failed packages after subscription rows stay green', () => {
    const node = {
      type: 'subscription',
      specs: {
        subscriptionModel: {
          c1: [{ cluster: 'c1' }],
        },
        raw: {
          status: {
            statuses: {
              c1: { packages: { p1: { phase: 'Failed' } } },
            },
          },
        },
      },
    } as any
    expect(getPulseStatusForSubscription(node, 'local-cluster')).toEqual('yellow')
  })

  it('getPulseStatusForSubscription applies package failure when subscription placement is green', () => {
    const node = {
      type: 'subscription',
      specs: {
        subscriptionModel: {
          c1: [{ cluster: 'c1', status: 'Subscribed' }],
        },
        clustersNames: ['c1'],
        searchClusters: [{ name: 'c1', status: 'ok' }],
        raw: {
          status: {
            statuses: {
              c1: { packages: { p1: { phase: 'Failed' } } },
            },
          },
        },
      },
    } as any
    expect(getPulseStatusForSubscription(node, 'local-cluster')).toEqual('yellow')
  })

  it('computeNodeStatus routes non-design subscription through generic node logic', () => {
    const node = {
      type: 'subscription',
      name: 'sub',
      namespace: 'ns',
      id: 'member--member--deployable--member--clusters--feng--ns--app--subscription--sub1',
      specs: {
        isDesign: false,
        subscriptionModel: {
          feng: [{ name: 'sub', namespace: 'ns', cluster: 'feng', status: 'Subscribed' }],
        },
        clustersNames: ['feng'],
        searchClusters: [{ name: 'feng', status: 'ok' }],
      },
    } as any
    expect(computeNodeStatus(node, true, t, 'local-cluster')).toBeDefined()
  })

  it('getPulseStatusForArgoApp returns warning when only some related apps are healthy', () => {
    const node = {
      name: 'appset',
      namespace: 'ns',
      specs: {
        appSetApps: [
          { metadata: { name: 'a', namespace: 'ns' }, status: { health: { status: 'Healthy' } } },
          { metadata: { name: 'b', namespace: 'ns' }, status: { health: { status: 'Degraded' } } },
        ],
        appStatusByNameMap: {
          a: { health: { status: 'Healthy' }, sync: { status: 'Synced' } },
          b: { health: { status: 'Degraded' }, sync: { status: 'Synced' } },
        },
      },
    } as any
    expect(getPulseStatusForArgoApp(node, true)).toEqual('yellow')
  })

  it('computeNodeStatus reflects error resource status strings on generic resources', () => {
    const node = {
      type: 'deployment',
      name: 'd',
      namespace: 'default',
      id: 'member--member--deployable--member--clusters--feng--default--app--deployment--d1',
      specs: {
        clustersNames: ['feng'],
        searchClusters: [{ name: 'feng', status: 'ok' }],
        deploymentModel: {
          k: [{ name: 'd', namespace: 'default', cluster: 'feng', status: 'crashloopbackoff' }],
        },
      },
    } as any
    expect(computeNodeStatus(node, true, t, 'local-cluster')).toEqual('red')
  })

  it('computeNodeStatus maps pending-style resource status to yellow', () => {
    const node = {
      type: 'deployment',
      name: 'd',
      namespace: 'default',
      id: 'member--member--deployable--member--clusters--feng--default--app--deployment--d1',
      specs: {
        clustersNames: ['feng'],
        searchClusters: [{ name: 'feng', status: 'ok' }],
        deploymentModel: {
          k: [{ name: 'd', namespace: 'default', cluster: 'feng', status: 'pending' }],
        },
      },
    } as any
    expect(computeNodeStatus(node, true, t, 'local-cluster')).toEqual('yellow')
  })

  it('computeNodeStatus uses desired counts when resource items expose desired', () => {
    const node = {
      type: 'deployment',
      name: 'd',
      namespace: 'default',
      id: 'member--member--deployable--member--clusters--feng--default--app--deployment--d1',
      specs: {
        clustersNames: ['feng'],
        searchClusters: [{ name: 'feng', status: 'ok' }],
        deploymentModel: {
          k: [{ name: 'd', namespace: 'default', cluster: 'feng', desired: 2, available: 1 }],
        },
      },
    } as any
    expect(computeNodeStatus(node, true, t, 'local-cluster')).toEqual('yellow')
  })

  it('computeNodeStatus lowers pulse when a cluster has no matching resources', () => {
    const node = {
      type: 'deployment',
      name: 'd',
      namespace: 'default',
      id: 'member--member--deployable--member--clusters--feng,cluster2--default--app--deployment--d1',
      specs: {
        clustersNames: ['feng', 'cluster2'],
        searchClusters: [
          { name: 'feng', status: 'ok' },
          { name: 'cluster2', status: 'ok' },
        ],
        deploymentModel: {
          k: [{ name: 'd', namespace: 'default', cluster: 'feng', status: 'running' }],
        },
      },
    } as any
    expect(computeNodeStatus(node, true, t, 'local-cluster')).toEqual('yellow')
  })
})
