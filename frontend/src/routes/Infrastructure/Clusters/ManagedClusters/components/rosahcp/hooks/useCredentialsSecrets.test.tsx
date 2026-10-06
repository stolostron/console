/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react'
import { useSharedValue, useSharedAtoms } from '~/shared-atoms'
import { useCredentialsSecrets } from './useCredentialsSecrets'
import type { Secret } from '~/resources'

jest.mock('~/shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockUseSharedValue = useSharedValue as jest.MockedFunction<typeof useSharedValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>
const secretsAtom = Symbol('secretsState')

const mockRhocmSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'my-rhocm-credential',
    namespace: 'default',
    labels: {
      'cluster.open-cluster-management.io/credentials': '',
      'cluster.open-cluster-management.io/type': 'rhocm',
    },
  },
}

const mockOtherSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'other-secret',
    namespace: 'default',
    labels: {
      'cluster.open-cluster-management.io/credentials': '',
      'cluster.open-cluster-management.io/type': 'aws',
    },
  },
}

const mockNoLabelsSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'no-labels-secret',
    namespace: 'default',
  },
}

describe('useCredentialsSecrets', () => {
  beforeEach(() => {
    mockUseSharedAtoms.mockReturnValue({ secretsState: secretsAtom } as unknown as ReturnType<typeof useSharedAtoms>)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return only secrets with rhocm type and credentials label', () => {
    mockUseSharedValue.mockReturnValue([mockRhocmSecret, mockOtherSecret, mockNoLabelsSecret])

    const { result } = renderHook(() => useCredentialsSecrets())

    expect(result.current).toHaveLength(1)
    expect(result.current[0].metadata!.name).toBe('my-rhocm-credential')
  })

  test('should return empty array when no matching secrets exist', () => {
    mockUseSharedValue.mockReturnValue([mockOtherSecret, mockNoLabelsSecret])

    const { result } = renderHook(() => useCredentialsSecrets())

    expect(result.current).toHaveLength(0)
  })

  test('should return multiple matching secrets', () => {
    const secondRhocmSecret: Secret = {
      ...mockRhocmSecret,
      metadata: {
        ...mockRhocmSecret.metadata,
        name: 'second-rhocm-credential',
      },
    }
    mockUseSharedValue.mockReturnValue([mockRhocmSecret, secondRhocmSecret])

    const { result } = renderHook(() => useCredentialsSecrets())

    expect(result.current).toHaveLength(2)
  })

  test('should return empty array when secrets state is empty', () => {
    mockUseSharedValue.mockReturnValue([])

    const { result } = renderHook(() => useCredentialsSecrets())

    expect(result.current).toHaveLength(0)
  })

  test('should call useSharedAtoms to get secretsState atom', () => {
    mockUseSharedValue.mockReturnValue([])

    renderHook(() => useCredentialsSecrets())

    expect(mockUseSharedAtoms).toHaveBeenCalled()
    expect(mockUseSharedValue).toHaveBeenCalledWith(secretsAtom)
  })
})
