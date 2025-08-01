/* Copyright Contributors to the Open Cluster Management project */
import * as exportedItems from './index'

describe('package index', () => {
  it('should not export unexpected items', () => {
    const actualExports = Object.keys(exportedItems).sort()
    expect(actualExports).toEqual([
      'FleetResourceEventStream',
      'FleetResourceLink',
      'REQUIRED_PROVIDER_FLAG',
      'buildResourceURL', // TODO do not export
      'fleetK8sCreate',
      'fleetK8sDelete',
      'fleetK8sGet',
      'fleetK8sPatch',
      'fleetK8sUpdate',
      'fleetWatch', // TODO do not export
      'getBackendUrl', // TODO do not export
      'getFleetK8sAPIPath',
      'getResourcePath', //TODO do not export
      'getResourceURL', // TODO do not export
      'useFleetAccessReview',
      'useFleetClusterNames',
      'useFleetK8sAPIPath',
      'useFleetK8sWatchResource',
      'useFleetPrometheusPoll',
      'useFleetSearchPoll',
      'useHubClusterName',
      'useIsFleetAvailable',
    ])
  })
})
