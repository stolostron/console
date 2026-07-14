/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { RecoilRoot } from 'recoil'
import { secretsState } from '../../../../../../../atoms'
import { useRhocmSecrets } from './useServiceAccount'
import { Secret } from '../../../../../../../resources'

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

const mockAwsSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'aws-secret',
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

describe('useRhocmSecrets', () => {
  const createWrapper =
    (secrets: Secret[]) =>
    ({ children }: { children: React.ReactNode }) => (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(secretsState, secrets as any)
        }}
      >
        {children}
      </RecoilRoot>
    )

  test('should return only secrets with rhocm type and credentials label', () => {
    const wrapper = createWrapper([mockRhocmSecret, mockAwsSecret, mockNoLabelsSecret])
    const { result } = renderHook(() => useRhocmSecrets(), { wrapper })

    expect(result.current).toHaveLength(1)
    expect(result.current[0].metadata!.name).toBe('my-rhocm-credential')
  })

  test('should return empty array when no matching secrets exist', () => {
    const wrapper = createWrapper([mockAwsSecret, mockNoLabelsSecret])
    const { result } = renderHook(() => useRhocmSecrets(), { wrapper })

    expect(result.current).toHaveLength(0)
  })

  test('should return multiple matching rhocm secrets', () => {
    const secondRhocmSecret: Secret = {
      ...mockRhocmSecret,
      metadata: {
        ...mockRhocmSecret.metadata,
        name: 'second-rhocm-credential',
      },
    }
    const wrapper = createWrapper([mockRhocmSecret, secondRhocmSecret])
    const { result } = renderHook(() => useRhocmSecrets(), { wrapper })

    expect(result.current).toHaveLength(2)
  })

  test('should return empty array when secrets state is empty', () => {
    const wrapper = createWrapper([])
    const { result } = renderHook(() => useRhocmSecrets(), { wrapper })

    expect(result.current).toHaveLength(0)
  })

  test('should exclude secrets missing the credentials label', () => {
    const secretWithTypeOnly: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'type-only-secret',
        namespace: 'default',
        labels: {
          'cluster.open-cluster-management.io/type': 'rhocm',
        },
      },
    }
    const wrapper = createWrapper([secretWithTypeOnly])
    const { result } = renderHook(() => useRhocmSecrets(), { wrapper })

    expect(result.current).toHaveLength(0)
  })
})
