/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { launchToOCP, useMultiClusterHubConsoleUrl } from './ocp-utils'
import { useSharedSelectors, useRecoilValue } from '../shared-recoil'
import { useOperatorCheck, SupportedOperator } from './operatorCheck'

// Mock the dependencies
jest.mock('../shared-recoil')
jest.mock('./operatorCheck')

describe('launchToOCP', () => {
  test('launchToOCP newtab true', () => {
    // These are the default values
    expect(launchToOCP('/blah')).toEqual(undefined)
  })
})

describe('useMultiClusterHubConsoleUrl', () => {
  const mockUseSharedSelectors = useSharedSelectors as jest.MockedFunction<typeof useSharedSelectors>
  const mockUseOperatorCheck = useOperatorCheck as jest.MockedFunction<typeof useOperatorCheck>
  const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>

  const mockSubscription = {
    metadata: {
      namespace: 'open-cluster-management',
      name: 'advanced-cluster-management',
    },
    spec: {
      name: 'advanced-cluster-management',
    },
  }

  beforeEach(() => {
    jest.resetAllMocks()
    mockUseSharedSelectors.mockReturnValue({
      acmOperatorSubscriptionsValue: { selector: 'mock-selector' } as any,
    } as any)

    // Mock the subscription data
    mockUseRecoilValue.mockReturnValue([mockSubscription])
  })

  describe('when ACM operator is installed and has version', () => {
    beforeEach(() => {
      mockUseOperatorCheck.mockReturnValue({
        operator: SupportedOperator.acm,
        installed: true,
        version: 'advanced-cluster-management.v2.15.0',
        pending: false,
      })
    })

    test('returns YAML URL by default', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl())
      expect(result.current).toBe(
        '/k8s/ns/open-cluster-management/operators.coreos.com~v1alpha1~ClusterServiceVersion/advanced-cluster-management.v2.15.0/operator.open-cluster-management.io~v1~MultiClusterHub/multiclusterhub/yaml'
      )
    })

    test('returns YAML URL when explicitly requested', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl('multiclusterhub', 'yaml'))
      expect(result.current).toBe(
        '/k8s/ns/open-cluster-management/operators.coreos.com~v1alpha1~ClusterServiceVersion/advanced-cluster-management.v2.15.0/operator.open-cluster-management.io~v1~MultiClusterHub/multiclusterhub/yaml'
      )
    })

    test('returns details URL when requested', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl('multiclusterhub', 'details'))
      expect(result.current).toBe(
        '/k8s/ns/open-cluster-management/operators.coreos.com~v1alpha1~ClusterServiceVersion/advanced-cluster-management.v2.15.0/operator.open-cluster-management.io~v1~MultiClusterHub/multiclusterhub'
      )
    })

    test('returns URL with custom resource name', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl('my-custom-hub'))
      expect(result.current).toBe(
        '/k8s/ns/open-cluster-management/operators.coreos.com~v1alpha1~ClusterServiceVersion/advanced-cluster-management.v2.15.0/operator.open-cluster-management.io~v1~MultiClusterHub/my-custom-hub/yaml'
      )
    })

    test('returns URL with custom resource name and details view', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl('my-custom-hub', 'details'))
      expect(result.current).toBe(
        '/k8s/ns/open-cluster-management/operators.coreos.com~v1alpha1~ClusterServiceVersion/advanced-cluster-management.v2.15.0/operator.open-cluster-management.io~v1~MultiClusterHub/my-custom-hub'
      )
    })

    test('returns URL with custom namespace from subscription', () => {
      // Mock a subscription with custom namespace
      mockUseRecoilValue.mockReturnValue([
        {
          ...mockSubscription,
          metadata: { ...mockSubscription.metadata, namespace: 'custom-acm-namespace' },
        },
      ])

      const { result } = renderHook(() => useMultiClusterHubConsoleUrl())
      expect(result.current).toBe(
        '/k8s/ns/custom-acm-namespace/operators.coreos.com~v1alpha1~ClusterServiceVersion/advanced-cluster-management.v2.15.0/operator.open-cluster-management.io~v1~MultiClusterHub/multiclusterhub/yaml'
      )
    })

    test('falls back to default namespace when subscription has no namespace', () => {
      // Mock a subscription without namespace
      mockUseRecoilValue.mockReturnValue([
        {
          ...mockSubscription,
          metadata: { ...mockSubscription.metadata, namespace: undefined },
        },
      ])

      const { result } = renderHook(() => useMultiClusterHubConsoleUrl())
      expect(result.current).toBe(
        '/k8s/ns/open-cluster-management/operators.coreos.com~v1alpha1~ClusterServiceVersion/advanced-cluster-management.v2.15.0/operator.open-cluster-management.io~v1~MultiClusterHub/multiclusterhub/yaml'
      )
    })
  })

  describe('when ACM operator is not installed', () => {
    beforeEach(() => {
      mockUseOperatorCheck.mockReturnValue({
        operator: SupportedOperator.acm,
        installed: false,
        version: undefined,
        pending: false,
      })
    })

    test('returns null', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl())
      expect(result.current).toBeNull()
    })

    test('returns null regardless of parameters', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl('test-hub', 'details'))
      expect(result.current).toBeNull()
    })
  })

  describe('when ACM operator is installed but version is unavailable', () => {
    beforeEach(() => {
      mockUseOperatorCheck.mockReturnValue({
        operator: SupportedOperator.acm,
        installed: true,
        version: undefined,
        pending: false,
      })
    })

    test('returns null', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl())
      expect(result.current).toBeNull()
    })
  })

  describe('when ACM operator check is pending', () => {
    beforeEach(() => {
      mockUseOperatorCheck.mockReturnValue({
        operator: SupportedOperator.acm,
        installed: false,
        version: undefined,
        pending: true,
      })
    })

    test('returns null while pending', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl())
      expect(result.current).toBeNull()
    })
  })

  describe('when no ACM operator subscriptions exist', () => {
    beforeEach(() => {
      mockUseOperatorCheck.mockReturnValue({
        operator: SupportedOperator.acm,
        installed: true,
        version: 'advanced-cluster-management.v2.15.0',
        pending: false,
      })
      mockUseRecoilValue.mockReturnValue([]) // Empty subscription array
    })

    test('returns null when no subscriptions', () => {
      const { result } = renderHook(() => useMultiClusterHubConsoleUrl())
      expect(result.current).toBeNull()
    })
  })

  test('correctly calls useOperatorCheck with ACM operator', () => {
    mockUseOperatorCheck.mockReturnValue({
      operator: SupportedOperator.acm,
      installed: true,
      version: 'advanced-cluster-management.v2.14.0',
      pending: false,
    })

    renderHook(() => useMultiClusterHubConsoleUrl())

    expect(mockUseOperatorCheck).toHaveBeenCalledWith(SupportedOperator.acm, { selector: 'mock-selector' })
  })
})
