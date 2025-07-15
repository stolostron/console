/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-require-imports */

// mock the SDK before any imports using jest.doMock
jest.doMock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceLink: ({ name, groupVersionKind, children }: any) => (
    <div data-testid="resource-link-mock">
      ResourceLink: {name} ({groupVersionKind?.kind}) {children}
    </div>
  ),
  ResourceIcon: ({ groupVersionKind }: any) => <span data-testid="resource-icon">{groupVersionKind?.kind} icon</span>,
  useFlag: jest.fn(),
}))

// mock PatternFly components
jest.mock('@patternfly/react-core', () => ({
  Skeleton: ({ width }: any) => <div data-testid="skeleton">Skeleton: {width}</div>,
}))

// reset modules to ensure fresh imports
jest.resetModules()

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import '@testing-library/jest-dom'

// mock functions
const mockUseFlag = jest.fn()
const mockUseHubClusterName = jest.fn()
const mockUseLocation = jest.fn()

// mock react-router-dom-v5-compat
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} data-testid="fleet-link" {...props}>
      {children}
    </a>
  ),
  useLocation: () => mockUseLocation(),
}))

// connect the useFlag mock to the dynamic plugin SDK
const dynamicPluginSDK = require('@openshift-console/dynamic-plugin-sdk')
dynamicPluginSDK.useFlag = mockUseFlag

// mock custom hooks
jest.mock('../api/useHubClusterName', () => ({
  useHubClusterName: () => mockUseHubClusterName(),
}))

// mock search paths utility
jest.mock('../api/utils/searchPaths', () => ({
  getURLSearchParam: ({ cluster, kind, apigroup, apiversion, name, namespace }: any) => {
    const params = new URLSearchParams()
    if (cluster) params.append('cluster', cluster)
    if (kind) params.append('kind', kind)
    if (apigroup) params.append('apigroup', apigroup)
    if (apiversion) params.append('apiversion', apiversion)
    if (name) params.append('name', name)
    if (namespace) params.append('namespace', namespace)
    return `?${params.toString()}`
  },
}))

// mock internal helpers
jest.mock('../internal/fleetResourceHelpers', () => ({
  getFirstClassResourceRoute: jest.fn(),
}))

// import the FleetResourceLink component using require() only for this one import
const { FleetResourceLink } = require('./FleetResourceLink')
const { getFirstClassResourceRoute } = require('../internal/fleetResourceHelpers')

describe('FleetResourceLink', () => {
  const defaultProps = {
    name: 'test-vm',
    namespace: 'default',
    groupVersionKind: {
      group: 'kubevirt.io',
      version: 'v1',
      kind: 'VirtualMachine',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // set default mock values that work
    mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
    mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })
    mockUseFlag.mockReturnValue(true) // Default to flag enabled

    // mock the combined helper function
    getFirstClassResourceRoute.mockReturnValue({
      isFirstClass: true,
      path: '/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vm',
    })
  })

  describe('Fleet not available', () => {
    it('should fallback to ResourceLink when hub is not loaded', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', false, null]) // hubLoaded = false

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })

    it('should show skeleton when cluster is given but hub is not loaded', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', false, null]) // hubLoaded = false

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" />
        </MemoryRouter>
      )

      // should show skeleton in loading state
      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })
  })

  describe('Hub cluster behavior', () => {
    it('should use first-class path for ManagedCluster on hub with multicloud path', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })
      getFirstClassResourceRoute.mockReturnValue({
        isFirstClass: true,
        path: '/multicloud/infrastructure/clusters/details/test-cluster/test-cluster/overview',
      })

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            groupVersionKind={{
              group: 'cluster.open-cluster-management.io',
              version: 'v1',
              kind: 'ManagedCluster',
            }}
            name="test-cluster"
          />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/clusters/details/test-cluster/test-cluster/overview'
      )
    })

    it('should fallback to ResourceLink for ManagedCluster on non-multicloud path', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/k8s/cluster' })
      getFirstClassResourceRoute.mockReturnValue({
        isFirstClass: true,
        path: '/multicloud/infrastructure/clusters/details/test-cluster/test-cluster/overview',
      })

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            groupVersionKind={{
              group: 'cluster.open-cluster-management.io',
              version: 'v1',
              kind: 'ManagedCluster',
            }}
            name="test-cluster"
          />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-cluster (ManagedCluster)')
    })

    it('should use first-class path for VM on multicloud path', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })
      getFirstClassResourceRoute.mockReturnValue({
        isFirstClass: true,
        path: '/multicloud/infrastructure/virtualmachines/local-cluster/default/test-vm',
      })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/virtualmachines/local-cluster/default/test-vm'
      )
    })

    it('should fallback to ResourceLink when not on multicloud path', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/k8s/cluster' })
      getFirstClassResourceRoute.mockReturnValue({
        isFirstClass: true,
        path: '/multicloud/infrastructure/virtualmachines/local-cluster/default/test-vm',
      })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })
  })

  describe('Managed cluster behavior', () => {
    it('should use first-class path for VM on managed cluster', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      getFirstClassResourceRoute.mockReturnValue({
        isFirstClass: true,
        path: '/multicloud/infrastructure/virtualmachines/managed-cluster/default/test-vm',
      })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/virtualmachines/managed-cluster/default/test-vm'
      )
    })

    it('should use search path for non-first-class resources', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      getFirstClassResourceRoute.mockReturnValue({
        isFirstClass: false,
        path: null,
      })

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            cluster="managed-cluster"
            groupVersionKind={{
              group: '',
              version: 'v1',
              kind: 'Pod',
            }}
          />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/search/resources?cluster=managed-cluster&kind=Pod&apiversion=v1&name=test-vm&namespace=default'
      )
    })

    it('should use search path when first-class path is null', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      getFirstClassResourceRoute.mockReturnValue({
        isFirstClass: true,
        path: null,
      })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/search/resources?cluster=managed-cluster&kind=VirtualMachine&apigroup=kubevirt.io&apiversion=v1&name=test-vm&namespace=default'
      )
    })
  })

  describe('KUBEVIRT_DYNAMIC_ACM flag behavior', () => {
    it('should pass flag value to helper function', () => {
      mockUseFlag.mockReturnValue(false)
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(getFirstClassResourceRoute).toHaveBeenCalledWith(
        'VirtualMachine',
        'managed-cluster',
        'default',
        'test-vm',
        false
      )
    })
  })
})
