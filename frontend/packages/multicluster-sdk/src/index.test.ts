/* Copyright Contributors to the Open Cluster Management project */
import * as exportedItems from './index'

describe('package index', () => {
  it('should not export unexpected items', () => {
    const actualExports = Object.keys(exportedItems).sort()
    expect(actualExports).toEqual([
      'FleetResourceEventStream',
      'FleetResourceLink',
      'REQUIRED_PROVIDER_FLAG',
      'fleetK8sCreate',
      'fleetK8sDelete',
      'fleetK8sGet',
      'fleetK8sList',
      'fleetK8sListItems',
      'fleetK8sPatch',
      'fleetK8sUpdate',
      'getFleetK8sAPIPath',
      'useFleetAccessReview',
      'useFleetClusterNames',
      'useFleetK8sAPIPath',
      'useFleetK8sWatchResource',
      'useFleetPrometheusPoll',
      'useFleetSearchPoll',
      'useHubClusterName',
      'useIsFleetAvailable',
      'useIsFleetObservabilityInstalled',
    ])
  })
})
