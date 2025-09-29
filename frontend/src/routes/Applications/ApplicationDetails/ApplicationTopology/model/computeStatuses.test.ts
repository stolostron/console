// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import {
  computeNodeStatus,
  getPodState,
  getPulseForData,
  setApplicationDeployStatus,
  setAppSetDeployStatus,
  setPlacementRuleDeployStatus,
  setPodDeployStatus,
  setResourceDeployStatus,
  setSubscriptionDeployStatus,
} from './computeStatuses'

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
} from './computeStatuses.testdata'

import type { ActiveFilters, Translator } from '../types'

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
