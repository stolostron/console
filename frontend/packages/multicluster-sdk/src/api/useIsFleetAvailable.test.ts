/* Copyright Contributors to the Open Cluster Management project */
import { REQUIRED_PROVIDER_FLAG } from './constants'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { renderHook } from '@testing-library/react-hooks'

let useFlagResult: boolean | undefined = undefined

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: (flag: string) => (flag === REQUIRED_PROVIDER_FLAG ? useFlagResult : undefined),
}))

describe('useIsFleetAvailable', () => {
  it('returns true when the flag is true', () => {
    useFlagResult = true
    const { result } = renderHook(() => useIsFleetAvailable())
    expect(result.current).toBe(true)
  })
  it('returns false when the flag is false', () => {
    useFlagResult = false
    const { result } = renderHook(() => useIsFleetAvailable())
    expect(result.current).toBe(false)
  })
  it('returns false when the flag is undefined', () => {
    useFlagResult = undefined
    const { result } = renderHook(() => useIsFleetAvailable())
    expect(result.current).toBe(false)
  })
})
