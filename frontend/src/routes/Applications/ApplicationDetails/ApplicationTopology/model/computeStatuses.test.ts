// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import {
  computeNodeStatus,
  getPodState,
  getPulseForData,
  getPulseStatusForArgoApp,
  getPulseStatusForCluster,
  setApplicationDeployStatus,
  setAppSetDeployStatus,
  setPlacementRuleDeployStatus,
  setPodDeployStatus,
  setResourceDeployStatus,
  setSubscriptionDeployStatus,
} from './computeStatuses'

import type {
  TopologyNodeWithStatus,
  PulseColor,
  StatusType,
  ArgoHealthStatus,
  ClusterInfo,
  ClusterStatus,
  ResourceItemWithStatus,
  SubscriptionItem,
  PodInfo,
  ArgoApplication,
  ActiveFilters,
  StateNames,
} from '../types'

import { deepClone } from '../utils'

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
  persVolumePendingStateGreenRes,
  persVolumePendingStatePendingRes,
  persVolumePendingStateYellow,
  placementsDeployable,
  placementDeployable,
  podCrash,
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
} from './computeStatuses.testdata.js'

const t = (string: string): string => {
  return string
}

// Provide an empty implementation for window.open
;(window as any).open = (): void => {}

describe('getPulseForData', () => {
  const previousPulse: PulseColor = 'red'
  const available = 1
  const desired = 2
  const podsUnavailable = 3

  it('getPulseForData pulse red', () => {
    expect(getPulseForData(previousPulse, available, desired, podsUnavailable)).toEqual('red')
  })
})

describe('getPulseForData', () => {
  const previousPulse: PulseColor = 'green'
  const available = 1
  const desired = 2
  const podsUnavailable = 3

  it('getPulseForData pulse red pod unavailable', () => {
    expect(getPulseForData(previousPulse, available, desired, podsUnavailable)).toEqual('red')
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

  it('getPulseForData pulse green pod desired 0', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('green')
  })
})

describe('getPulseForData', () => {
  const available = 1
  const desired = 1
  const podsUnavailable = 0

  it('getPulseForData pulse green pod desired equal available', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('green')
  })
})

describe('getPulseForData', () => {
  const available = 2
  const desired = 1
  const podsUnavailable = 0

  it('getPulseForData pulse green pod desired less then available', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('green')
  })
})

describe('getPulseForData', () => {
  const available = 0
  const desired = 0
  const podsUnavailable = 0

  it('getPulseForData pulse green pod desired 0 available 0', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('green')
  })
})

describe('getPulseForData', () => {
  const available = 0
  const desired = 1
  const podsUnavailable = 0

  it('getPulseForData pulse red pod desired 1 available 0', () => {
    expect(getPulseForData(available, desired, podsUnavailable)).toEqual('red')
  })
})

describe('getPulseStatusForCluster', () => {
  const clusterList: ClusterInfo[] = [
    {
      name: 'cluster1',
      status: 'ok' as ClusterStatus,
    },
    {
      name: 'cluster2',
      status: 'offline' as ClusterStatus,
    },
  ]

  it('getPulseStatusForCluster pulse red', () => {
    expect(getPulseStatusForCluster(clusterList)).toEqual('red')
  })
})

describe('getPulseStatusForCluster', () => {
  const clusterList: ClusterInfo[] = [
    {
      name: 'cluster1',
      status: 'ok' as ClusterStatus,
    },
    {
      name: 'cluster2',
      status: 'ready' as ClusterStatus,
    },
  ]

  it('getPulseStatusForCluster pulse green', () => {
    expect(getPulseStatusForCluster(clusterList)).toEqual('green')
  })
})

describe('getPulseStatusForCluster', () => {
  const clusterList: ClusterInfo[] = [
    {
      name: 'cluster1',
      status: 'pendingimport' as ClusterStatus,
    },
    {
      name: 'cluster2',
      status: 'ready' as ClusterStatus,
    },
  ]

  it('getPulseStatusForCluster pulse yellow', () => {
    expect(getPulseStatusForCluster(clusterList)).toEqual('yellow')
  })
})

describe('getPulseStatusForCluster', () => {
  const clusterList: ClusterInfo[] = []

  it('getPulseStatusForCluster pulse green empty', () => {
    expect(getPulseStatusForCluster(clusterList)).toEqual('green')
  })
})

describe('getPulseStatusForArgoApp', () => {
  const argoAppList: ArgoApplication[] = [
    {
      status: {
        health: {
          status: 'Healthy' as ArgoHealthStatus,
        },
      },
    },
    {
      status: {
        health: {
          status: 'Degraded' as ArgoHealthStatus,
        },
      },
    },
  ]

  it('getPulseStatusForArgoApp pulse red', () => {
    expect(getPulseStatusForArgoApp(argoAppList)).toEqual('red')
  })
})

describe('getPulseStatusForArgoApp', () => {
  const argoAppList: ArgoApplication[] = [
    {
      status: {
        health: {
          status: 'Healthy' as ArgoHealthStatus,
        },
      },
    },
    {
      status: {
        health: {
          status: 'Healthy' as ArgoHealthStatus,
        },
      },
    },
  ]

  it('getPulseStatusForArgoApp pulse green', () => {
    expect(getPulseStatusForArgoApp(argoAppList)).toEqual('green')
  })
})

describe('getPulseStatusForArgoApp', () => {
  const argoAppList: ArgoApplication[] = [
    {
      status: {
        health: {
          status: 'Progressing' as ArgoHealthStatus,
        },
      },
    },
    {
      status: {
        health: {
          status: 'Healthy' as ArgoHealthStatus,
        },
      },
    },
  ]

  it('getPulseStatusForArgoApp pulse yellow', () => {
    expect(getPulseStatusForArgoApp(argoAppList)).toEqual('yellow')
  })
})

describe('getPulseStatusForArgoApp', () => {
  const argoAppList: ArgoApplication[] = []

  it('getPulseStatusForArgoApp pulse green empty', () => {
    expect(getPulseStatusForArgoApp(argoAppList)).toEqual('green')
  })
})

describe('getPodState', () => {
  const podItem: PodInfo = {
    status: 'Running',
    restarts: 0,
  }

  it('getPodState running', () => {
    expect(getPodState(podItem, t)).toEqual('running')
  })
})

describe('getPodState', () => {
  const podItem: PodInfo = {
    status: 'Pending',
    restarts: 0,
  }

  it('getPodState pending', () => {
    expect(getPodState(podItem, t)).toEqual('pending')
  })
})

describe('getPodState', () => {
  const podItem: PodInfo = {
    status: 'Failed',
    restarts: 0,
  }

  it('getPodState failed', () => {
    expect(getPodState(podItem, t)).toEqual('failed')
  })
})

describe('getPodState', () => {
  const podItem: PodInfo = {
    status: 'Succeeded',
    restarts: 0,
  }

  it('getPodState succeeded', () => {
    expect(getPodState(podItem, t)).toEqual('running')
  })
})

describe('getPodState', () => {
  const podItem: PodInfo = {
    status: 'Running',
    restarts: 5,
  }

  it('getPodState running with restarts', () => {
    expect(getPodState(podItem, t)).toEqual('error')
  })
})

describe('getPodState', () => {
  const podItem: PodInfo = {
    status: 'CrashLoopBackOff',
    restarts: 0,
  }

  it('getPodState crashloopbackoff', () => {
    expect(getPodState(podItem, t)).toEqual('crashloopbackoff')
  })
})

describe('getPodState', () => {
  const podItem: PodInfo = {
    status: 'ImagePullBackOff',
    restarts: 0,
  }

  it('getPodState imagepullbackoff', () => {
    expect(getPodState(podItem, t)).toEqual('imagepullbackoff')
  })
})

describe('getPodState', () => {
  const podItem: PodInfo = {
    status: 'Unknown',
    restarts: 0,
  }

  it('getPodState unknown', () => {
    expect(getPodState(podItem, t)).toEqual('unknown')
  })
})

describe('setResourceDeployStatus', () => {
  it('setResourceDeployStatus should set status to green', () => {
    const node = deepClone(genericNodeYellow) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setResourceDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setResourceDeployStatus', () => {
  it('setResourceDeployStatus should set status to red', () => {
    const node = deepClone(genericNodeInputRed) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setResourceDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('setResourceDeployStatus', () => {
  it('setResourceDeployStatus should set status to red 2', () => {
    const node = deepClone(genericNodeInputRed2) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setResourceDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('setResourceDeployStatus', () => {
  it('setResourceDeployStatus should set status to yellow not defined', () => {
    const node = deepClone(genericNodeYellowNotDefined) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setResourceDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('yellow')
  })
})

describe('setResourceDeployStatus', () => {
  it('setResourceDeployStatus should set status to orange', () => {
    const node = deepClone(packageNodeOrange) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setResourceDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('orange')
  })
})

describe('setResourceDeployStatus', () => {
  it('setResourceDeployStatus should set status to green for persistent volume', () => {
    const node = deepClone(persVolumePendingStateGreen) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setResourceDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setResourceDeployStatus', () => {
  it('setResourceDeployStatus should set status to green for persistent volume with resources', () => {
    const node = deepClone(persVolumePendingStateGreenRes) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setResourceDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setResourceDeployStatus', () => {
  it('setResourceDeployStatus should set status to yellow for persistent volume', () => {
    const node = deepClone(persVolumePendingStateYellow) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setResourceDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('yellow')
  })
})

describe('setResourceDeployStatus', () => {
  it('setResourceDeployStatus should set status to yellow for persistent volume with pending resources', () => {
    const node = deepClone(persVolumePendingStatePendingRes) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setResourceDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('yellow')
  })
})

describe('setPodDeployStatus', () => {
  it('setPodDeployStatus should set status to red', () => {
    const node = deepClone(deploymentNodeRed) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPodDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('setPodDeployStatus', () => {
  it('setPodDeployStatus should set status to red 3', () => {
    const node = deepClone(deploymentNodeRed3) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPodDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('setPodDeployStatus', () => {
  it('setPodDeployStatus should set status to yellow 2', () => {
    const node = deepClone(deploymentNodeYellow2) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPodDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('yellow')
  })
})

describe('setPodDeployStatus', () => {
  it('setPodDeployStatus should set status to yellow 4', () => {
    const node = deepClone(deploymentNodeYellow4) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPodDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('yellow')
  })
})

describe('setPodDeployStatus', () => {
  it('setPodDeployStatus should set status to green no pods', () => {
    const node = deepClone(deploymentNodeNoPODS) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPodDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setPodDeployStatus', () => {
  it('setPodDeployStatus should set status to green no pods no resources', () => {
    const node = deepClone(deploymentNodeNoPODSNoRes) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPodDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setPodDeployStatus', () => {
  it('setPodDeployStatus should set status to green no pod model', () => {
    const node = deepClone(deploymentNodeNoPodModel) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPodDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setPodDeployStatus', () => {
  it('setPodDeployStatus should set status to red for pod crash', () => {
    const node = deepClone(podCrash) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPodDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('setSubscriptionDeployStatus', () => {
  it('setSubscriptionDeployStatus should set status to red', () => {
    const node = deepClone(subscriptionInputRed) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setSubscriptionDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('setSubscriptionDeployStatus', () => {
  it('setSubscriptionDeployStatus should set status to red 1', () => {
    const node = deepClone(subscriptionInputRed1) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setSubscriptionDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('setSubscriptionDeployStatus', () => {
  it('setSubscriptionDeployStatus should set status to yellow', () => {
    const node = deepClone(subscriptionInputYellow) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setSubscriptionDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('yellow')
  })
})

describe('setSubscriptionDeployStatus', () => {
  it('setSubscriptionDeployStatus should set status to yellow not placed', () => {
    const node = deepClone(subscriptionInputNotPlaced) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setSubscriptionDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('yellow')
  })
})

describe('setSubscriptionDeployStatus', () => {
  it('setSubscriptionDeployStatus should set status to green not placed yellow', () => {
    const node = deepClone(subscriptionGreenNotPlacedYellow) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setSubscriptionDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setPlacementRuleDeployStatus', () => {
  it('setPlacementRuleDeployStatus should set status to red', () => {
    const node = deepClone(ruleNodeRed) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPlacementRuleDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('setPlacementRuleDeployStatus', () => {
  it('setPlacementRuleDeployStatus should set status to green 2', () => {
    const node = deepClone(ruleNodeGreen2) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setPlacementRuleDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setApplicationDeployStatus', () => {
  it('setApplicationDeployStatus should set status to green no channel', () => {
    const node = deepClone(appNoChannelGreen) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setApplicationDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setApplicationDeployStatus', () => {
  it('setApplicationDeployStatus should set status to red no channel', () => {
    const node = deepClone(appNoChannelRed) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setApplicationDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('setAppSetDeployStatus', () => {
  it('setAppSetDeployStatus should set status to green', () => {
    const node = deepClone(appSetDeployable) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setAppSetDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setAppSetDeployStatus', () => {
  it('setAppSetDeployStatus should set status to green design false', () => {
    const node = deepClone(appSetDesignFalse) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setAppSetDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('setAppSetDeployStatus', () => {
  it('setAppSetDeployStatus should set status to green for app sub deployable', () => {
    const node = deepClone(appSubDeployable) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = setAppSetDeployStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus should set status to green for cluster node', () => {
    const node = deepClone(clusterNode) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = computeNodeStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus should set status to green for placement deployable', () => {
    const node = deepClone(placementDeployable) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = computeNodeStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus should set status to green for placements deployable', () => {
    const node = deepClone(placementsDeployable) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = computeNodeStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus should set status to red for ansible error', () => {
    const node = deepClone(ansibleError) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = computeNodeStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus should set status to red for ansible error 2', () => {
    const node = deepClone(ansibleError2) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = computeNodeStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus should set status to red for ansible error all clusters', () => {
    const node = deepClone(ansibleErrorAllClusters) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = computeNodeStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('red')
  })
})

describe('computeNodeStatus', () => {
  it('computeNodeStatus should set status to green for ansible success', () => {
    const node = deepClone(ansibleSuccess) as TopologyNodeWithStatus
    const activeFilters: ActiveFilters = {}
    const result = computeNodeStatus(node, [], activeFilters, t)
    expect(result.pulse).toEqual('green')
  })
})
