/* Copyright Contributors to the Open Cluster Management project */
import { BASE_K8S_API_PATH, MANAGED_CLUSTER_API_PATH } from '../internal/constants'
import { getBackendUrl } from '../internal/apiRequests'
import { getFleetK8sAPIPath } from './getFleetK8sAPIPath'

jest.mock('../internal/cachedHubConfiguration', () => ({
  fetchHubConfiguration: jest.fn(),
}))

const mockFetchHubConfiguration = jest.requireMock('../internal/cachedHubConfiguration').fetchHubConfiguration

describe(`getFleetK8sAPIPath`, function () {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it(`returns BASE_K8S_API_PATH when no cluster is provided`, async function () {
    mockFetchHubConfiguration.mockResolvedValue({ localHubName: 'local-cluster' })

    const result = await getFleetK8sAPIPath()
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(0)
  })

  it(`returns BASE_K8S_API_PATH when cluster is undefined`, async function () {
    mockFetchHubConfiguration.mockResolvedValue({ localHubName: 'local-cluster' })

    const result = await getFleetK8sAPIPath(undefined)
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(0)
  })

  it(`returns BASE_K8S_API_PATH when cluster is empty string`, async function () {
    mockFetchHubConfiguration.mockResolvedValue({ localHubName: 'local-cluster' })

    const result = await getFleetK8sAPIPath('')
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(0)
  })

  it(`returns BASE_K8S_API_PATH when cluster matches hub cluster`, async function () {
    mockFetchHubConfiguration.mockResolvedValue({ localHubName: 'local-cluster' })

    const result = await getFleetK8sAPIPath('local-cluster')
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(1)
  })

  it(`returns managed cluster API path when cluster is different from hub cluster`, async function () {
    mockFetchHubConfiguration.mockResolvedValue({ localHubName: 'local-cluster' })

    const result = await getFleetK8sAPIPath('remote-cluster')
    expect(result).toEqual(`${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/remote-cluster`)
    expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(1)
  })

  it(`returns managed cluster API path when hub cluster name is undefined`, async function () {
    mockFetchHubConfiguration.mockResolvedValue(undefined)

    const result = await getFleetK8sAPIPath('any-cluster')
    expect(result).toEqual(`${getBackendUrl()}/${MANAGED_CLUSTER_API_PATH}/any-cluster`)
    expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(1)
  })

  it(`returns BASE_K8S_API_PATH when hub cluster name is undefined and no cluster provided`, async function () {
    mockFetchHubConfiguration.mockResolvedValue(undefined)

    const result = await getFleetK8sAPIPath()
    expect(result).toEqual(BASE_K8S_API_PATH)
    expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(0)
  })
})
