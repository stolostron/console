/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { RecoilRoot } from 'recoil'
import { multiClusterEnginesState } from '../../../../../../../atoms'
import { useCheckClusterAPI } from './useCheckClusterAPI'

describe('useCheckClusterAPI', () => {
  const createWrapper =
    (mceComponents: { name: string; enabled: boolean }[] = []) =>
    ({ children }: { children: React.ReactNode }) => (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(multiClusterEnginesState, [
            {
              spec: {
                overrides: {
                  components: mceComponents,
                },
              },
            },
          ] as any)
        }}
      >
        {children}
      </RecoilRoot>
    )

  test('should return isCapiEnabled true when cluster-api component is enabled', () => {
    const wrapper = createWrapper([{ name: 'cluster-api', enabled: true }])
    const { result } = renderHook(() => useCheckClusterAPI(), { wrapper })

    expect(result.current.isCapiEnabled).toBe(true)
    expect(result.current.isCapaEnabled).toBe(false)
  })

  test('should return isCapaEnabled true when cluster-api-provider-aws component is enabled', () => {
    const wrapper = createWrapper([{ name: 'cluster-api-provider-aws', enabled: true }])
    const { result } = renderHook(() => useCheckClusterAPI(), { wrapper })

    expect(result.current.isCapiEnabled).toBe(false)
    expect(result.current.isCapaEnabled).toBe(true)
  })

  test('should return both false when no components are enabled', () => {
    const wrapper = createWrapper([])
    const { result } = renderHook(() => useCheckClusterAPI(), { wrapper })

    expect(result.current.isCapiEnabled).toBe(false)
    expect(result.current.isCapaEnabled).toBe(false)
  })

  test('should return both true when both components are enabled', () => {
    const wrapper = createWrapper([
      { name: 'cluster-api', enabled: true },
      { name: 'cluster-api-provider-aws', enabled: true },
    ])
    const { result } = renderHook(() => useCheckClusterAPI(), { wrapper })

    expect(result.current.isCapiEnabled).toBe(true)
    expect(result.current.isCapaEnabled).toBe(true)
  })

  test('should return false when components exist but are disabled', () => {
    const wrapper = createWrapper([
      { name: 'cluster-api', enabled: false },
      { name: 'cluster-api-provider-aws', enabled: false },
    ])
    const { result } = renderHook(() => useCheckClusterAPI(), { wrapper })

    expect(result.current.isCapiEnabled).toBe(false)
    expect(result.current.isCapaEnabled).toBe(false)
  })
})
