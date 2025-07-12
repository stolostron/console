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

// reset modules to ensure fresh imports
jest.resetModules()

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import '@testing-library/jest-dom'

// mock functions
const mockUseFlag = jest.fn()
const mockUseHubClusterName = jest.fn()
const mockUseFleetClusterNames = jest.fn()
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
jest.mock('./useHubClusterName', () => ({
  useHubClusterName: () => mockUseHubClusterName(),
}))

jest.mock('./useFleetClusterNames', () => ({
  useFleetClusterNames: () => mockUseFleetClusterNames(),
}))

// mock search paths utility
jest.mock('./utils/searchPaths', () => ({
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
    mockUseFleetClusterNames.mockReturnValue([['local-cluster', 'managed-cluster-1'], true, null])
    mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })
    mockUseFlag.mockReturnValue(true) // Default to flag enabled
  })

  describe('Fleet not available', () => {
    it('should fallback to ResourceLink when no clusters are available', () => {
      mockUseFleetClusterNames.mockReturnValue([[], true, null]) // empty array = no fleet

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })

    it('should fallback to ResourceLink when clusters are not loaded', () => {
      mockUseFleetClusterNames.mockReturnValue([['local-cluster'], false, null]) // clustersLoaded = false

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })
  })

  describe('Hub cluster loading state', () => {
    it('should show skeleton when hub cluster is not loaded', () => {
      mockUseHubClusterName.mockReturnValue([undefined, false, null]) // hubLoaded = false

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster" />
        </MemoryRouter>
      )

      const skeleton = screen.getByText('test-vm')
      expect(skeleton).toHaveClass('pf-v5-c-skeleton')
    })
  })

  describe('Hub cluster cases', () => {
    it('should link to first-class page for VirtualMachine on hub cluster in multicloud path when flag enabled', () => {
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure/virtualmachines' })
      mockUseFlag.mockReturnValue(true) // KUBEVIRT_DYNAMIC_ACM enabled

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="local-cluster" />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/multicloud/infrastructure/virtualmachines/local-cluster/default/test-vm')
    })

    it('should fallback to ResourceLink for VirtualMachine on hub cluster when flag disabled', () => {
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure/virtualmachines' })
      mockUseFlag.mockReturnValue(false) // KUBEVIRT_DYNAMIC_ACM disabled

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="local-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })

    it('should link to first-class page for ManagedCluster on hub cluster in multicloud path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure/clusters' })

      render(
        <MemoryRouter>
          <FleetResourceLink
            name="managed-cluster-1"
            cluster="local-cluster"
            groupVersionKind={{
              group: 'cluster.open-cluster-management.io',
              version: 'v1',
              kind: 'ManagedCluster',
            }}
          />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/clusters/details/managed-cluster-1/managed-cluster-1/overview'
      )
    })

    it('should fallback to ResourceLink for first-class resource on hub cluster outside multicloud path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/k8s/cluster/nodes' }) // non-multicloud path

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="local-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })

    it('should fallback to ResourceLink for non-first-class resource on hub cluster', () => {
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })

      render(
        <MemoryRouter>
          <FleetResourceLink
            name="test-pod"
            cluster="local-cluster"
            groupVersionKind={{
              group: '',
              version: 'v1',
              kind: 'Pod', // non-first-class resource
            }}
          />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-pod (Pod)')
    })

    it('should handle no cluster as hub cluster case when flag enabled', () => {
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure/virtualmachines' })
      mockUseFlag.mockReturnValue(true)

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} /> {/* no cluster prop */}
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/multicloud/infrastructure/virtualmachines/local-cluster/default/test-vm')
    })

    it('should fallback to ResourceLink when no cluster and flag disabled', () => {
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure/virtualmachines' })
      mockUseFlag.mockReturnValue(false)

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} /> {/* no cluster prop */}
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })
  })

  describe('Managed cluster cases', () => {
    it('should link to first-class page for VirtualMachine on managed cluster when flag enabled', () => {
      mockUseFlag.mockReturnValue(true) // KUBEVIRT_DYNAMIC_ACM enabled

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1" />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/virtualmachines/managed-cluster-1/default/test-vm'
      )
    })

    it('should fallback to search for VirtualMachine on managed cluster when flag disabled', () => {
      mockUseFlag.mockReturnValue(false) // KUBEVIRT_DYNAMIC_ACM disabled

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1" />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      const href = link.getAttribute('href')
      expect(href).toContain('/multicloud/search/resources')
      expect(href).toContain('cluster=managed-cluster-1')
      expect(href).toContain('kind=VirtualMachine')
    })

    it('should link to first-class page for VirtualMachineInstance on managed cluster when flag enabled', () => {
      mockUseFlag.mockReturnValue(true)

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            cluster="managed-cluster-1"
            groupVersionKind={{
              group: 'kubevirt.io',
              version: 'v1',
              kind: 'VirtualMachineInstance',
            }}
          />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/virtualmachines/managed-cluster-1/default/test-vm'
      )
    })

    it('should link to search page for non-first-class resource on managed cluster', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink
            name="test-pod"
            namespace="default"
            cluster="managed-cluster-1"
            groupVersionKind={{
              group: '',
              version: 'v1',
              kind: 'Pod',
            }}
          />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      const href = link.getAttribute('href')
      expect(href).toContain('/multicloud/search/resources')
      expect(href).toContain('cluster=managed-cluster-1')
      expect(href).toContain('kind=Pod')
    })

    it('should fallback to search page for VirtualMachine without namespace on managed cluster', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink
            name="test-vm"
            cluster="managed-cluster-1"
            groupVersionKind={{
              group: 'kubevirt.io',
              version: 'v1',
              kind: 'VirtualMachine',
            }}
          />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      const href = link.getAttribute('href')
      expect(href).toContain('/multicloud/search/resources')
      expect(href).toContain('cluster=managed-cluster-1')
      expect(href).toContain('kind=VirtualMachine')
    })
  })

  describe('Styling and props', () => {
    it('should handle className and styling props', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            cluster="managed-cluster-1"
            className="custom-class"
            style={{ color: 'red' }}
          />
        </MemoryRouter>
      )

      // verify the link renders correctly (className may not be passed through)
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/virtualmachines/managed-cluster-1/default/test-vm'
      )
    })

    it('should handle hideIcon prop', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1" hideIcon={true} />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      // icon should be hidden
      expect(screen.queryByTestId('resource-icon')).not.toBeInTheDocument()
    })

    it('should handle displayName override', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1" displayName="Custom VM Name" />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveTextContent('Custom VM Name')
    })

    it('should handle nameSuffix', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1" nameSuffix=" (suffix)" />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveTextContent('test-vm (suffix)')
    })

    it('should handle title and data-test attributes', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1" title="VM Title" dataTest="custom-test-id" />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('title', 'VM Title')
      expect(link).toHaveAttribute('data-test', 'custom-test-id')
    })

    it('should handle children prop', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1">
            <span data-testid="child-content">Child Content</span>
          </FleetResourceLink>
        </MemoryRouter>
      )

      expect(screen.getByTestId('child-content')).toHaveTextContent('Child Content')
    })

    it('should handle children prop in fallback ResourceLink', () => {
      mockUseFleetClusterNames.mockReturnValue([[], true, null]) // no fleet - fallback to ResourceLink

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster">
            <span data-testid="child-content">Child Content</span>
          </FleetResourceLink>
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
      expect(screen.getByTestId('child-content')).toHaveTextContent('Child Content')
    })
  })

  describe('KUBEVIRT_DYNAMIC_ACM flag behavior', () => {
    it('should link to ACM VM page when flag is enabled and has namespace', () => {
      mockUseFlag.mockReturnValue(true) // flag is enabled

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1" />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/virtualmachines/managed-cluster-1/default/test-vm'
      )
    })

    it('should fallback to search when flag is disabled for managed cluster', () => {
      mockUseFlag.mockReturnValue(false) // flag is disabled

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1" />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      const href = link.getAttribute('href')
      expect(href).toContain('/multicloud/search/resources')
      expect(href).toContain('cluster=managed-cluster-1')
      expect(href).toContain('kind=VirtualMachine')
    })

    it('should fallback to search when flag is enabled but no namespace', () => {
      mockUseFlag.mockReturnValue(true) // flag is enabled

      render(
        <MemoryRouter>
          <FleetResourceLink
            name="test-vm"
            cluster="managed-cluster-1"
            groupVersionKind={{
              group: 'kubevirt.io',
              version: 'v1',
              kind: 'VirtualMachine',
            }}
            // No namespace prop
          />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      const href = link.getAttribute('href')
      expect(href).toContain('/multicloud/search/resources')
    })

    it('should handle VirtualMachineInstance with flag enabled', () => {
      mockUseFlag.mockReturnValue(true) // flag is enabled

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            cluster="managed-cluster-1"
            groupVersionKind={{
              group: 'kubevirt.io',
              version: 'v1',
              kind: 'VirtualMachineInstance',
            }}
          />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/virtualmachines/managed-cluster-1/default/test-vm'
      )
    })

    it('should handle VirtualMachineInstance with flag disabled', () => {
      mockUseFlag.mockReturnValue(false) // flag is disabled

      render(
        <MemoryRouter>
          <FleetResourceLink
            {...defaultProps}
            cluster="managed-cluster-1"
            groupVersionKind={{
              group: 'kubevirt.io',
              version: 'v1',
              kind: 'VirtualMachineInstance',
            }}
          />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      const href = link.getAttribute('href')
      expect(href).toContain('/multicloud/search/resources')
      expect(href).toContain('kind=VirtualMachineInstance')
    })

    it('should not affect ManagedCluster routing regardless of flag', () => {
      mockUseFlag.mockReturnValue(false) // flag is disabled
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure/clusters' })

      render(
        <MemoryRouter>
          <FleetResourceLink
            name="managed-cluster-1"
            cluster="local-cluster"
            groupVersionKind={{
              group: 'cluster.open-cluster-management.io',
              version: 'v1',
              kind: 'ManagedCluster',
            }}
          />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute(
        'href',
        '/multicloud/infrastructure/clusters/details/managed-cluster-1/managed-cluster-1/overview'
      )
    })

    it('should handle hub cluster VM with flag disabled outside multicloud path', () => {
      mockUseFlag.mockReturnValue(false) // flag is disabled
      mockUseLocation.mockReturnValue({ pathname: '/k8s/cluster/pods' }) // non-multicloud path

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="local-cluster" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
    })
  })
})
