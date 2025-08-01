/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useFleetK8sAPIPath, getFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { BASE_K8S_API_PATH, MANAGED_CLUSTER_API_PATH } from '../internal/constants'
import { getBackendUrl } from '.'

jest.mock('./useHubClusterName.ts', () => ({
  useHubClusterName: jest.fn(() => {
    return ['local-cluster', true, undefined]
  }),
}))

jest.mock('../internal/cachedHubClusterName', () => ({
  getCachedHubClusterName: jest.fn(),
}))

const mockGetCachedHubClusterName = jest.requireMock('../internal/cachedHubClusterName').getCachedHubClusterName

describe(`useFleetK8sAPIPath tests`, function () {
  it(`useFleetK8sAPIPath returns correct paths`, async function () {
    let { result } = renderHook(() => useFleetK8sAPIPath('local-cluster'))
    expect(result.current[0]).toEqual(BASE_K8S_API_PATH)
    ;({ result } = renderHook(() => useFleetK8sAPIPath('cluster1')))
    expect(result.current[0]).toEqual(`${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/cluster1`)
  })
})

describe(`getFleetK8sAPIPath tests`, function () {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it(`returns BASE_K8S_API_PATH when no cluster is provided`, async function () {
    mockGetCachedHubClusterName.mockResolvedValue('local-cluster')

    const result = await getFleetK8sAPIPath()
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
  })

  it(`returns BASE_K8S_API_PATH when cluster is undefined`, async function () {
    mockGetCachedHubClusterName.mockResolvedValue('local-cluster')

    const result = await getFleetK8sAPIPath(undefined)
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
  })

  it(`returns BASE_K8S_API_PATH when cluster is empty string`, async function () {
    mockGetCachedHubClusterName.mockResolvedValue('local-cluster')

    const result = await getFleetK8sAPIPath('')
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
  })

  it(`returns BASE_K8S_API_PATH when cluster matches hub cluster`, async function () {
    mockGetCachedHubClusterName.mockResolvedValue('local-cluster')

    const result = await getFleetK8sAPIPath('local-cluster')
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
  })

  it(`returns managed cluster API path when cluster is different from hub cluster`, async function () {
    mockGetCachedHubClusterName.mockResolvedValue('local-cluster')

    const result = await getFleetK8sAPIPath('remote-cluster')
    expect(result).toEqual(`${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/remote-cluster`)
    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
  })

  it(`returns managed cluster API path when hub cluster name is undefined`, async function () {
    mockGetCachedHubClusterName.mockResolvedValue(undefined)

    const result = await getFleetK8sAPIPath('any-cluster')
    expect(result).toEqual(`${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/any-cluster`)
    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
  })

  it(`returns BASE_K8S_API_PATH when hub cluster name is undefined and no cluster provided`, async function () {
    mockGetCachedHubClusterName.mockResolvedValue(undefined)

    const result = await getFleetK8sAPIPath()
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
  })
})
