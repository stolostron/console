/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useFleetK8sAPIPath } from '../src/api/useFleetK8sAPIPath'
import { BASE_K8S_API_PATH, MANAGED_CLUSTER_API_PATH } from '../src/internal/constants'
import { getBackendUrl } from '../src/api'

jest.mock('../src/api/useHubClusterName.ts', () => ({
  useHubClusterName: jest.fn(() => {
    return ['local-cluster', true, undefined]
  }),
}))

describe(`useFleetK8sAPIPath tests`, function () {
  it(`useFleetK8sAPIPath returns correct paths`, async function () {
    let { result } = renderHook(() => useFleetK8sAPIPath('local-cluster'))
    expect(result.current[0]).toEqual(BASE_K8S_API_PATH)
    ;({ result } = renderHook(() => useFleetK8sAPIPath('cluster1')))
    expect(result.current[0]).toEqual(`${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/cluster1`)
  })
})
