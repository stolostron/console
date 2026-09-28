/* Copyright Contributors to the Open Cluster Management project */

import { renderHook, waitFor } from '@testing-library/react'
import nock from 'nock'
import { useCheckClusterAPI } from './useCheckClusterAPI'

function nockMceComponents(components: { name: string; enabled: boolean }[]) {
  return nock(process.env.JEST_DEFAULT_HOST as string)
    .get('/multiclusterengine/components')
    .reply(200, components)
}

describe('useCheckClusterAPI', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  test('should return isCapiEnabled true when cluster-api component is enabled', async () => {
    nockMceComponents([{ name: 'cluster-api', enabled: true }])
    const { result } = renderHook(() => useCheckClusterAPI())

    await waitFor(() => expect(result.current.loaded).toBe(true))

    expect(result.current.isCapiEnabled).toBe(true)
    expect(result.current.isCapaEnabled).toBe(false)
  })

  test('should return isCapaEnabled true when cluster-api-provider-aws component is enabled', async () => {
    nockMceComponents([{ name: 'cluster-api-provider-aws', enabled: true }])
    const { result } = renderHook(() => useCheckClusterAPI())

    await waitFor(() => expect(result.current.loaded).toBe(true))

    expect(result.current.isCapiEnabled).toBe(false)
    expect(result.current.isCapaEnabled).toBe(true)
  })

  test('should return both false when no components are enabled', async () => {
    nockMceComponents([])
    const { result } = renderHook(() => useCheckClusterAPI())

    await waitFor(() => expect(result.current.loaded).toBe(true))

    expect(result.current.isCapiEnabled).toBe(false)
    expect(result.current.isCapaEnabled).toBe(false)
  })

  test('should return both true when both components are enabled', async () => {
    nockMceComponents([
      { name: 'cluster-api', enabled: true },
      { name: 'cluster-api-provider-aws', enabled: true },
    ])
    const { result } = renderHook(() => useCheckClusterAPI())

    await waitFor(() => expect(result.current.loaded).toBe(true))

    expect(result.current.isCapiEnabled).toBe(true)
    expect(result.current.isCapaEnabled).toBe(true)
  })

  test('should return false when components exist but are disabled', async () => {
    nockMceComponents([
      { name: 'cluster-api', enabled: false },
      { name: 'cluster-api-provider-aws', enabled: false },
    ])
    const { result } = renderHook(() => useCheckClusterAPI())

    await waitFor(() => expect(result.current.loaded).toBe(true))

    expect(result.current.isCapiEnabled).toBe(false)
    expect(result.current.isCapaEnabled).toBe(false)
  })
})
