/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { RecoilRoot } from 'recoil'
import { secretsState } from '../../../../../../../atoms'
import { useCredentialsSecrets } from './useCredentialsSecrets'
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
    const wrapper = createWrapper([mockRhocmSecret, mockOtherSecret, mockNoLabelsSecret])
    const { result } = renderHook(() => useCredentialsSecrets(), { wrapper })

    expect(result.current).toHaveLength(1)
    expect(result.current[0].metadata.name).toBe('my-rhocm-credential')
  })

  test('should return empty array when no matching secrets exist', () => {
    const wrapper = createWrapper([mockOtherSecret, mockNoLabelsSecret])
    const { result } = renderHook(() => useCredentialsSecrets(), { wrapper })

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
    const wrapper = createWrapper([mockRhocmSecret, secondRhocmSecret])
    const { result } = renderHook(() => useCredentialsSecrets(), { wrapper })

    expect(result.current).toHaveLength(2)
  })

  test('should return empty array when secrets state is empty', () => {
    const wrapper = createWrapper([])
    const { result } = renderHook(() => useCredentialsSecrets(), { wrapper })

    expect(result.current).toHaveLength(0)
  })
})
