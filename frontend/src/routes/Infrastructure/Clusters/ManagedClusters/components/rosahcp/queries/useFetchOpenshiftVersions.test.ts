/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { versionRegEx, versionComparator, useFetchHCPVersions } from './useFetchOpenshiftVersions'
import type { SelectedSecret, OpenshiftVersion } from '../constants/types'

const mockRefetch = jest.fn()
const mockUseQuery = jest.fn()

jest.mock('~/hooks/shared-react-query', () => ({
  useSharedReactQuery: () => ({
    useQuery: mockUseQuery,
  }),
}))

jest.mock('~/lib/rosa-hcp-api', () => ({
  getWizardVersions: jest.fn(),
}))

const mockSecret: SelectedSecret = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
}

const createVersion = (overrides: Partial<OpenshiftVersion> = {}): OpenshiftVersion => ({
  available_channels: [],
  available_upgrades: [],
  channel_group: 'stable',
  default: false,
  enabled: true,
  hosted_control_plane_default: false,
  hosted_control_plane_enabled: true,
  id: 'openshift-v4.14.10',
  raw_id: '4.14.10',
  rosa_enabled: true,
  wif_enabled: false,
  end_of_life_timestamp: '2026-12-31T00:00:00Z',
  ...overrides,
})

describe('versionRegEx', () => {
  test('should match standard version strings', () => {
    const match = versionRegEx.exec('4.14.10')
    expect(match?.groups).toEqual({
      major: '4',
      minor: '14',
      revision: '10',
      patch: undefined,
    })
  })

  test('should match release candidate versions', () => {
    const match = versionRegEx.exec('4.15.0-rc.2')
    expect(match?.groups).toEqual({
      major: '4',
      minor: '15',
      revision: '0',
      patch: '2',
    })
  })

  test('should match feature candidate versions', () => {
    const match = versionRegEx.exec('4.15.0-fc.1')
    expect(match?.groups).toEqual({
      major: '4',
      minor: '15',
      revision: '0',
      patch: '1',
    })
  })

  test('should not match invalid version strings', () => {
    const match = versionRegEx.exec('invalid')
    expect(match).toBeNull()
  })
})

describe('versionComparator', () => {
  test('should return 1 when first version has higher major', () => {
    expect(versionComparator('5.0.0', '4.0.0')).toBe(1)
  })

  test('should return -1 when first version has lower major', () => {
    expect(versionComparator('3.0.0', '4.0.0')).toBe(-1)
  })

  test('should return 1 when first version has higher minor', () => {
    expect(versionComparator('4.15.0', '4.14.0')).toBe(1)
  })

  test('should return -1 when first version has lower minor', () => {
    expect(versionComparator('4.13.0', '4.14.0')).toBe(-1)
  })

  test('should return 1 when first version has higher revision', () => {
    expect(versionComparator('4.14.10', '4.14.9')).toBe(1)
  })

  test('should return -1 when first version has lower revision', () => {
    expect(versionComparator('4.14.8', '4.14.9')).toBe(-1)
  })

  test('should return 0 when versions are equal', () => {
    expect(versionComparator('4.14.10', '4.14.10')).toBe(0)
  })

  test('should return 1 when first version is release and second is rc', () => {
    expect(versionComparator('4.15.0', '4.15.0-rc.4')).toBe(1)
  })

  test('should return -1 when first version is rc and second is release', () => {
    expect(versionComparator('4.15.0-rc.4', '4.15.0')).toBe(-1)
  })

  test('should compare patch versions for release candidates', () => {
    expect(versionComparator('4.15.0-rc.5', '4.15.0-rc.3')).toBe(1)
    expect(versionComparator('4.15.0-rc.1', '4.15.0-rc.3')).toBe(-1)
  })

  test('should return 0 when both versions are invalid', () => {
    expect(versionComparator('invalid', 'also-invalid')).toBe(0)
  })
})

describe('useFetchHCPVersions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call useQuery with correct query key', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchHCPVersions(mockSecret))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', 'openshift-versions'],
      })
    )
  })

  test('should return loading state when fetching', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchHCPVersions(mockSecret))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  test('should return error state when fetch fails', () => {
    const error = new Error('Network error')
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchHCPVersions(mockSecret))

    expect(result.current.error).toBe(error)
    expect(result.current.isLoading).toBe(false)
  })

  test('should return refetch function', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchHCPVersions(mockSecret))

    expect(result.current.refetch).toBe(mockRefetch)
  })

  test('should provide a select function that transforms versions data', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchHCPVersions(mockSecret))

    const queryConfig = mockUseQuery.mock.calls[0][0]
    const selectFn = queryConfig.select

    const versions: OpenshiftVersion[] = [
      createVersion({ raw_id: '4.14.10', hosted_control_plane_default: true }),
      createVersion({ raw_id: '4.14.9' }),
      createVersion({ raw_id: '4.13.25' }),
    ]

    const result = selectFn(versions)

    expect(result.default).toEqual({ label: '4.14.10', value: '4.14.10' })
    expect(result.latest).toEqual({ label: '4.14.10', value: '4.14.10' })
    expect(result.releases).toEqual(
      expect.arrayContaining([
        { label: '4.14.10', value: '4.14.10' },
        { label: '4.14.9', value: '4.14.9' },
        { label: '4.13.25', value: '4.13.25' },
      ])
    )
  })

  test('select function should filter out non-stable channel groups', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchHCPVersions(mockSecret))

    const queryConfig = mockUseQuery.mock.calls[0][0]
    const selectFn = queryConfig.select

    const versions: OpenshiftVersion[] = [
      createVersion({ raw_id: '4.14.10', channel_group: 'stable' }),
      createVersion({ raw_id: '4.14.9', channel_group: 'candidate' }),
      createVersion({ raw_id: '4.14.8', channel_group: 'nightly' }),
    ]

    const result = selectFn(versions)

    expect(result.releases).toEqual([{ label: '4.14.10', value: '4.14.10' }])
  })

  test('select function should filter out versions past end of life', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchHCPVersions(mockSecret))

    const queryConfig = mockUseQuery.mock.calls[0][0]
    const selectFn = queryConfig.select

    const versions: OpenshiftVersion[] = [
      createVersion({ raw_id: '4.14.10', end_of_life_timestamp: '2099-12-31T00:00:00Z' }),
      createVersion({ raw_id: '4.14.9', end_of_life_timestamp: '2020-01-01T00:00:00Z' }),
    ]

    const result = selectFn(versions)

    expect(result.releases).toEqual([{ label: '4.14.10', value: '4.14.10' }])
  })

  test('select function should filter out versions where hosted_control_plane_enabled is false', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchHCPVersions(mockSecret))

    const queryConfig = mockUseQuery.mock.calls[0][0]
    const selectFn = queryConfig.select

    const versions: OpenshiftVersion[] = [
      createVersion({ raw_id: '4.14.10', hosted_control_plane_enabled: true }),
      createVersion({ raw_id: '4.14.9', hosted_control_plane_enabled: false }),
    ]

    const result = selectFn(versions)

    expect(result.releases).toEqual([{ label: '4.14.10', value: '4.14.10' }])
  })

  test('select function should filter out versions where rosa_enabled is false', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchHCPVersions(mockSecret))

    const queryConfig = mockUseQuery.mock.calls[0][0]
    const selectFn = queryConfig.select

    const versions: OpenshiftVersion[] = [
      createVersion({ raw_id: '4.14.10', rosa_enabled: true }),
      createVersion({ raw_id: '4.14.9', rosa_enabled: false }),
    ]

    const result = selectFn(versions)

    expect(result.releases).toEqual([{ label: '4.14.10', value: '4.14.10' }])
  })

  test('select function should limit to 3 minor version branches', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchHCPVersions(mockSecret))

    const queryConfig = mockUseQuery.mock.calls[0][0]
    const selectFn = queryConfig.select

    const versions: OpenshiftVersion[] = [
      createVersion({ raw_id: '4.16.1' }),
      createVersion({ raw_id: '4.15.5' }),
      createVersion({ raw_id: '4.14.10' }),
      createVersion({ raw_id: '4.13.25' }),
    ]

    const result = selectFn(versions)

    const versionValues = result.releases.map((r: { value: string }) => r.value)
    expect(versionValues).toContain('4.16.1')
    expect(versionValues).toContain('4.15.5')
    expect(versionValues).toContain('4.14.10')
    expect(versionValues).not.toContain('4.13.25')
  })

  test('select function should sort versions in descending order', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchHCPVersions(mockSecret))

    const queryConfig = mockUseQuery.mock.calls[0][0]
    const selectFn = queryConfig.select

    const versions: OpenshiftVersion[] = [
      createVersion({ raw_id: '4.14.8' }),
      createVersion({ raw_id: '4.14.10' }),
      createVersion({ raw_id: '4.14.9' }),
    ]

    const result = selectFn(versions)

    expect(result.releases).toEqual([
      { label: '4.14.10', value: '4.14.10' },
      { label: '4.14.9', value: '4.14.9' },
      { label: '4.14.8', value: '4.14.8' },
    ])
  })

  test('select function should handle empty versions array', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchHCPVersions(mockSecret))

    const queryConfig = mockUseQuery.mock.calls[0][0]
    const selectFn = queryConfig.select

    const result = selectFn([])

    expect(result.default).toBeUndefined()
    expect(result.latest).toBeUndefined()
    expect(result.releases).toEqual([])
  })
})
