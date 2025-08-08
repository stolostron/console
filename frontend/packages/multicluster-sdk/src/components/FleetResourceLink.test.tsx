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
  useK8sWatchResource: jest.fn(),
  useResolvedExtensions: jest.fn(),
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
require('@openshift-console/dynamic-plugin-sdk')

// mock custom hooks
jest.mock('../api/useHubClusterName', () => ({
  useHubClusterName: () => mockUseHubClusterName(),
}))

jest.mock('../api/useIsFleetAvailable', () => ({
  useIsFleetAvailable: jest.fn(),
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

// import the FleetResourceLink component using require() only for this one import
const { FleetResourceLink } = require('./FleetResourceLink')
const { useK8sWatchResource, useResolvedExtensions } = require('@openshift-console/dynamic-plugin-sdk')
const { useIsFleetAvailable } = require('../api/useIsFleetAvailable')

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

    // mock useK8sWatchResource for useFleetClusterNames
    useK8sWatchResource.mockReturnValue([
      [{ metadata: { name: 'cluster1' } }, { metadata: { name: 'cluster2' } }], // clusters
      true, // loaded
      null, // error
    ])

    // mock useIsFleetAvailable to return true by default
    useIsFleetAvailable.mockReturnValue(true)

    // mock the useResolvedExtensions hook
    useResolvedExtensions.mockReturnValue([[], true, []])
  })

  describe('Fleet not available', () => {
    it('should fallback to ResourceLink when fleet is not available', () => {
      useIsFleetAvailable.mockReturnValue(false) // fleet not available

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })

    it('should fallback to ResourceLink when fleet is not available (alternative test)', () => {
      useIsFleetAvailable.mockReturnValue(false) // fleet not available

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" />
        </MemoryRouter>
      )

      // when fleet is not available, it falls back to ResourceLink
      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })
  })

  describe('Fleet not available scenarios', () => {
    it('should fallback to ResourceLink when fleet not available and hideIcon is false', () => {
      useIsFleetAvailable.mockReturnValue(false) // fleet not available

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" hideIcon={false} />
        </MemoryRouter>
      )

      // falls back to ResourceLink because isFleetAvailable = false
      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
    })

    it('should fallback to ResourceLink when fleet not available and hideIcon is true', () => {
      useIsFleetAvailable.mockReturnValue(false) // fleet not available

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" hideIcon={true} />
        </MemoryRouter>
      )

      // falls back to ResourceLink
      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
    })

    it('should fallback to ResourceLink when fleet not available with children', () => {
      useIsFleetAvailable.mockReturnValue(false) // fleet not available

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster">
            <span data-testid="test-children">Test Children</span>
          </FleetResourceLink>
        </MemoryRouter>
      )

      // falls back to ResourceLink and includes children
      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
      expect(screen.getByTestId('test-children')).toBeInTheDocument()
    })
  })

  describe('Extension-based routing', () => {
    it('should use extension handler when available and on multicloud path', () => {
      const mockHandler = jest.fn().mockReturnValue('/custom/extension/path/test-vm')
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
        },
      ]
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })

      useResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} />
        </MemoryRouter>
      )

      expect(mockHandler).toHaveBeenCalledWith({
        cluster: 'local-cluster',
        namespace: 'default',
        name: 'test-vm',
        resource: {
          cluster: 'local-cluster',
          group: 'kubevirt.io',
          kind: 'VirtualMachine',
          version: 'v1',
          namespace: 'default',
          name: 'test-vm',
        },
        model: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' },
      })
      expect(screen.getByTestId('fleet-link')).toHaveAttribute('href', '/custom/extension/path/test-vm')
    })

    it('should use extension handler for managed cluster', () => {
      const mockHandler = jest.fn().mockReturnValue('/custom/extension/path/test-vm')
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
        },
      ]
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(mockHandler).toHaveBeenCalledWith({
        cluster: 'managed-cluster',
        namespace: 'default',
        name: 'test-vm',
        resource: {
          cluster: 'managed-cluster',
          group: 'kubevirt.io',
          kind: 'VirtualMachine',
          version: 'v1',
          namespace: 'default',
          name: 'test-vm',
        },
        model: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' },
      })
      expect(screen.getByTestId('fleet-link')).toHaveAttribute('href', '/custom/extension/path/test-vm')
    })

    it('should use extension handler when available regardless of path', () => {
      const mockHandler = jest.fn().mockReturnValue('/custom/extension/path/test-vm')
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
        },
      ]
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/k8s/cluster' })

      useResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} />
        </MemoryRouter>
      )

      expect(mockHandler).toHaveBeenCalledWith({
        cluster: 'local-cluster',
        namespace: 'default',
        name: 'test-vm',
        resource: {
          cluster: 'local-cluster',
          group: 'kubevirt.io',
          kind: 'VirtualMachine',
          version: 'v1',
          namespace: 'default',
          name: 'test-vm',
        },
        model: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' },
      })
      expect(screen.getByTestId('fleet-link')).toHaveAttribute('href', '/custom/extension/path/test-vm')
    })

    it('should handle extensions that are not yet resolved', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResolvedExtensions.mockReturnValue([[], false, []])

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
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachineInstance', version: 'v1' },
            handler: mockHandler,
          },
        },
      ]
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResolvedExtensions.mockReturnValue([mockExtensions, true, []])

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
        cluster: 'managed-cluster',
        namespace: 'default',
        name: 'test-vmi',
        resource: {
          cluster: 'managed-cluster',
          group: 'kubevirt.io',
          kind: 'VirtualMachineInstance',
          version: 'v1',
          namespace: 'default',
          name: 'test-vmi',
        },
        model: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachineInstance' },
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

    it('should use first-class path for ManagedCluster regardless of path', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
      mockUseLocation.mockReturnValue({ pathname: '/k8s/cluster' })

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

    it('should use search path when extension path is null', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

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
    it('should use extension system for VirtualMachine routing', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      // VirtualMachine should use the extension system, not hardcoded paths
      expect(useResolvedExtensions).toHaveBeenCalled()
    })

    it('should call extension handler with correct parameters', () => {
      const mockHandler = jest.fn().mockReturnValue(null)
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
        },
      ]
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      expect(mockHandler).toHaveBeenCalledWith({
        cluster: 'managed-cluster',
        namespace: 'default',
        name: 'test-vm',
        resource: {
          cluster: 'managed-cluster',
          group: 'kubevirt.io',
          kind: 'VirtualMachine',
          version: 'v1',
          namespace: 'default',
          name: 'test-vm',
        },
        model: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' },
      })
    })

    it('should handle when extension handler returns null', () => {
      const mockHandler = jest.fn().mockReturnValue(null)
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
        },
      ]
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      // Should fallback to search path when handler returns null
      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/search/resources?cluster=managed-cluster&kind=VirtualMachine&apigroup=kubevirt.io&apiversion=v1&name=test-vm&namespace=default'
      )
    })

    it('should handle when extension handler returns empty string', () => {
      const mockHandler = jest.fn().mockReturnValue('')
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
        },
      ]
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      // Should fallback to search path when handler returns empty string
      expect(screen.getByTestId('fleet-link')).toHaveAttribute(
        'href',
        '/multicloud/search/resources?cluster=managed-cluster&kind=VirtualMachine&apigroup=kubevirt.io&apiversion=v1&name=test-vm&namespace=default'
      )
    })
  })

  describe('Loading state', () => {
    it('should render loading state when cluster is provided but hub is not loaded', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', false, null]) // hubLoaded = false

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" />
        </MemoryRouter>
      )

      // Should render as span (not link) when hub is not loaded
      expect(screen.getByText('test-vm')).toBeInTheDocument()
      expect(screen.queryByTestId('fleet-link')).not.toBeInTheDocument()
      expect(screen.getByTestId('resource-icon')).toBeInTheDocument()
    })

    it('should render loading state without icon when hideIcon is true', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', false, null]) // hubLoaded = false

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster" hideIcon={true} />
        </MemoryRouter>
      )

      // Should render as span without icon when hub is not loaded and hideIcon is true
      expect(screen.getByText('test-vm')).toBeInTheDocument()
      expect(screen.queryByTestId('fleet-link')).not.toBeInTheDocument()
      expect(screen.queryByTestId('resource-icon')).not.toBeInTheDocument()
    })

    it('should render loading state with children', () => {
      mockUseHubClusterName.mockReturnValue(['local-cluster', false, null]) // hubLoaded = false

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster">
            <span data-testid="loading-children">Loading Children</span>
          </FleetResourceLink>
        </MemoryRouter>
      )

      // Should render children even in loading state
      expect(screen.getByText('test-vm')).toBeInTheDocument()
      expect(screen.getByTestId('loading-children')).toBeInTheDocument()
    })
  })

  describe('Extension handler parameter validation', () => {
    it('should pass hub cluster name when cluster is not provided', () => {
      const mockHandler = jest.fn().mockReturnValue('/custom/path')
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
        },
      ]
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} /> {/* no cluster prop */}
        </MemoryRouter>
      )

      expect(mockHandler).toHaveBeenCalledWith({
        cluster: 'local-cluster', // should use hub cluster name
        namespace: 'default',
        name: 'test-vm',
        resource: {
          cluster: 'local-cluster',
          group: 'kubevirt.io',
          kind: 'VirtualMachine',
          version: 'v1',
          namespace: 'default',
          name: 'test-vm',
        },
        model: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' },
      })
    })

    it('should pass provided cluster name when cluster is specified', () => {
      const mockHandler = jest.fn().mockReturnValue('/custom/path')
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
        },
      ]
      mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])

      useResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="custom-cluster" />
        </MemoryRouter>
      )

      expect(mockHandler).toHaveBeenCalledWith({
        cluster: 'custom-cluster', // should use provided cluster name
        namespace: 'default',
        name: 'test-vm',
        resource: {
          cluster: 'custom-cluster',
          group: 'kubevirt.io',
          kind: 'VirtualMachine',
          version: 'v1',
          namespace: 'default',
          name: 'test-vm',
        },
        model: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' },
      })
    })
  })
})
