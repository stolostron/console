/* Copyright Contributors to the Open Cluster Management project */
import * as exportedItems from './index'

describe('package index', () => {
  it('should not export unexpected items', () => {
    const actualExports = Object.keys(exportedItems).sort()
    expect(actualExports).toEqual([
      'FleetResourceEventStream',
      'FleetResourceLink',
      'REQUIRED_PROVIDER_FLAG',
      'RESOURCE_ROUTE_TYPE',
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
      'useFleetClusterSets',
      'useFleetK8sAPIPath',
      'useFleetK8sWatchResource',
      'useFleetK8sWatchResources',
      'useFleetPrometheusPoll',
      'useFleetSearchPoll',
      'useHubClusterName',
      'useIsFleetAvailable',
      'useIsFleetObservabilityInstalled',
    ])
  })
})
