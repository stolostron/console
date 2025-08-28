/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { BACKEND_URL, BASE_K8S_API_PATH, MANAGED_CLUSTER_API_PATH } from '../internal/constants'

jest.mock('../internal/useHubConfigurationItem', () => ({
  useHubConfigurationItem: jest.fn(() => ['local-cluster', true, undefined]),
}))

jest.mock('../internal/cachedHubConfiguration', () => ({
  fetchHubConfiguration: jest.fn(),
}))

describe(`useFleetK8sAPIPath`, function () {
  it(`useFleetK8sAPIPath returns correct paths`, async function () {
    let { result } = renderHook(() => useFleetK8sAPIPath('local-cluster'))
    expect(result.current[0]).toEqual(BASE_K8S_API_PATH)
    ;({ result } = renderHook(() => useFleetK8sAPIPath('cluster1')))
    expect(result.current[0]).toEqual(`${BACKEND_URL}/${MANAGED_CLUSTER_API_PATH}/cluster1`)
  })
})
