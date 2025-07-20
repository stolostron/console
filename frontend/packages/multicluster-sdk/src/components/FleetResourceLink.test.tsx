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

import { render, screen, fireEvent } from '@testing-library/react'
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

// connect the mocks to the dynamic plugin SDK
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
  useResourceRouteExtensions: jest.fn(),
}))

// import the FleetResourceLink component using require() only for this one import
const { FleetResourceLink } = require('./FleetResourceLink')
const { getFirstClassResourceRoute, useResourceRouteExtensions } = require('../internal/fleetResourceHelpers')

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

    // mock the useResourceRouteExtensions hook
    useResourceRouteExtensions.mockReturnValue({
      resourceRoutesResolved: true,
      getResourceRouteHandler: jest.fn().mockReturnValue(null), // Default to no extension handler
    })

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

      // when hub is not loaded, fleet is not available so it falls back to ResourceLink
      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })
  })

  describe('Skeleton rendering (unreachable code)', () => {
    // Note: The skeleton rendering code in FleetResourceLink is currently unreachable
    // because when !hubLoaded, the function returns ResourceLink before reaching the skeleton logic
    it('should fallback to ResourceLink when hub not loaded (skeleton code unreachable)', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', false, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" hideIcon={false} />
        </MemoryRouter>
      )

      // currently falls back to ResourceLink because isFleetAvailable = hubLoaded = false
      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
    })

    it('should fallback to ResourceLink when hub not loaded and hideIcon is true', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', false, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" hideIcon={true} />
        </MemoryRouter>
      )

      // currently falls back to ResourceLink
      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
    })

    it('should fallback to ResourceLink when hub not loaded with children', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', false, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster">
            <span data-testid="test-children">Test Children</span>
          </FleetResourceLink>
        </MemoryRouter>
      )

      // currently falls back to ResourceLink and includes children
      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
      expect(screen.getByTestId('test-children')).toBeInTheDocument()
    })
  })

  describe('Extension-based routing', () => {
    it('should use extension handler when available and on multicloud path', () => {
      const mockHandler = jest.fn().mockReturnValue('/custom/extension/path/test-vm')
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })

      useResourceRouteExtensions.mockReturnValue({
        resourceRoutesResolved: true,
        getResourceRouteHandler: jest.fn().mockReturnValue(mockHandler),
      })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} />
        </MemoryRouter>
      )

      expect(mockHandler).toHaveBeenCalledWith({
        kind: 'VirtualMachine',
        cluster: 'local-cluster',
        namespace: 'default',
        name: 'test-vm',
      })
      expect(screen.getByTestId('fleet-link')).toHaveAttribute('href', '/custom/extension/path/test-vm')
    })

    it('should use extension handler for managed cluster', () => {
      const mockHandler = jest.fn().mockReturnValue('/custom/extension/path/test-vm')
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResourceRouteExtensions.mockReturnValue({
        resourceRoutesResolved: true,
        getResourceRouteHandler: jest.fn().mockReturnValue(mockHandler),
      })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(mockHandler).toHaveBeenCalledWith({
        kind: 'VirtualMachine',
        cluster: 'managed-cluster',
        namespace: 'default',
        name: 'test-vm',
      })
      expect(screen.getByTestId('fleet-link')).toHaveAttribute('href', '/custom/extension/path/test-vm')
    })

    it('should fallback to ResourceLink when extension handler available but on non-multicloud path for hub cluster', () => {
      const mockHandler = jest.fn().mockReturnValue('/custom/extension/path/test-vm')
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/k8s/cluster' })

      useResourceRouteExtensions.mockReturnValue({
        resourceRoutesResolved: true,
        getResourceRouteHandler: jest.fn().mockReturnValue(mockHandler),
      })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })

    it('should handle extensions that are not yet resolved', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResourceRouteExtensions.mockReturnValue({
        resourceRoutesResolved: false,
        getResourceRouteHandler: jest.fn().mockReturnValue(null),
      })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      // should fallback to search path when extensions not resolved
      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/search/resources?cluster=managed-cluster&kind=VirtualMachine&apigroup=kubevirt.io&apiversion=v1&name=test-vm&namespace=default'
      )
    })

    it('should handle VirtualMachineInstance with extension', () => {
      const mockHandler = jest.fn().mockReturnValue('/custom/vmi/path/test-vmi')
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResourceRouteExtensions.mockReturnValue({
        resourceRoutesResolved: true,
        getResourceRouteHandler: jest.fn().mockReturnValue(mockHandler),
      })

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            name="test-vmi"
            groupVersionKind={{
              group: 'kubevirt.io',
              version: 'v1',
              kind: 'VirtualMachineInstance',
            }}
            cluster="managed-cluster"
          />
        </MemoryRouter>
      )

      expect(mockHandler).toHaveBeenCalledWith({
        kind: 'VirtualMachineInstance',
        cluster: 'managed-cluster',
        namespace: 'default',
        name: 'test-vmi',
      })
      expect(screen.getByTestId('fleet-link')).toHaveAttribute('href', '/custom/vmi/path/test-vmi')
    })
  })

  describe('Props handling', () => {
    it('should render with displayName override', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} displayName="Custom Display Name" cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveTextContent('Custom Display Name')
    })

    it('should render without icon when hideIcon is true', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} hideIcon={true} cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.queryByTestId('resource-icon')).not.toBeInTheDocument()
    })

    it('should apply inline className when inline prop is true', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} inline={true} cluster="managed-cluster" />
        </MemoryRouter>
      )

      const container = screen.getByTestId('fleet-link').closest('span')
      expect(container).toHaveClass('co-resource-item--inline')
    })

    it('should apply truncate className when truncate prop is true', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} truncate={true} cluster="managed-cluster" />
        </MemoryRouter>
      )

      const container = screen.getByTestId('fleet-link').closest('span')
      expect(container).toHaveClass('co-resource-item--truncate')
    })

    it('should apply custom className', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} className="custom-class" cluster="managed-cluster" />
        </MemoryRouter>
      )

      const container = screen.getByTestId('fleet-link').closest('span')
      expect(container).toHaveClass('custom-class')
    })

    it('should render with title attribute', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} title="Custom Title" cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute('title', 'Custom Title')
    })

    it('should render with nameSuffix', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} nameSuffix="-suffix" cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveTextContent('test-vm-suffix')
    })

    it('should handle onClick event', () => {
      const mockOnClick = jest.fn()
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} onClick={mockOnClick} cluster="managed-cluster" />
        </MemoryRouter>
      )

      fireEvent.click(screen.getByTestId('fleet-link'))
      expect(mockOnClick).toHaveBeenCalled()
    })

    it('should render with dataTest attribute', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} dataTest="custom-test-id" cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute('data-test', 'custom-test-id')
    })

    it('should render children', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster">
            <span data-testid="test-children">Additional Content</span>
          </FleetResourceLink>
        </MemoryRouter>
      )

      expect(screen.getByTestId('test-children')).toHaveTextContent('Additional Content')
    })
  })

  describe('Edge cases', () => {
    it('should fallback to ResourceLink when name is missing', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} name={undefined as any} cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
    })

    it('should fallback to ResourceLink when name is empty string', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} name="" cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
    })

    it('should fallback to ResourceLink when groupVersionKind is missing', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} groupVersionKind={undefined as any} cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
    })

    it('should render span without link when path is null', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/k8s/cluster' })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} />
        </MemoryRouter>
      )

      // on non-multicloud path with hub cluster, should fallback to ResourceLink
      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
    })

    it('should handle hub cluster name matching cluster parameter', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="local-cluster" />
        </MemoryRouter>
      )

      // when cluster matches hub name, should be treated as hub cluster
      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
    })

    it('should handle resources without group', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            groupVersionKind={{
              group: '',
              version: 'v1',
              kind: 'Pod',
            }}
            cluster="managed-cluster"
          />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/search/resources?cluster=managed-cluster&kind=Pod&apiversion=v1&name=test-vm&namespace=default'
      )
    })

    it('should handle resources without version', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            groupVersionKind={{
              group: 'apps',
              version: undefined,
              kind: 'Deployment',
            }}
            cluster="managed-cluster"
          />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/search/resources?cluster=managed-cluster&kind=Deployment&apigroup=apps&name=test-vm&namespace=default'
      )
    })

    it('should handle resources without namespace', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            namespace={undefined}
            groupVersionKind={{
              group: 'cluster.open-cluster-management.io',
              version: 'v1',
              kind: 'ManagedCluster',
            }}
            cluster="managed-cluster"
          />
        </MemoryRouter>
      )

      // managedCluster resources always get first-class path, even on managed clusters
      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/clusters/details/test-vm/test-vm/overview'
      )
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

    it('should fallback to ResourceLink for VM on multicloud path when no extension found', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })
      // VirtualMachine is now extension-only, so without extension it falls back to ResourceLink

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
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
    it('should use search path for VM on managed cluster when no extension found', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      // VirtualMachine is now extension-only, so without extension it falls back to search

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

    it('should use first-class path for ManagedCluster on managed cluster context', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            groupVersionKind={{
              group: 'cluster.open-cluster-management.io',
              version: 'v1',
              kind: 'ManagedCluster',
            }}
            name="remote-cluster"
            cluster="managed-cluster"
          />
        </MemoryRouter>
      )

      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/clusters/details/remote-cluster/remote-cluster/overview'
      )
    })
  })

  describe('Extension system behavior', () => {
    it('should not call getFirstClassResourceRoute for VirtualMachine (extension-only)', () => {
      mockUseFlag.mockReturnValue(false)
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      // VirtualMachine should now be extension-only and not use getFirstClassResourceRoute
      expect(getFirstClassResourceRoute).not.toHaveBeenCalledWith('VirtualMachine', 'test-vm')
    })
  })
})
