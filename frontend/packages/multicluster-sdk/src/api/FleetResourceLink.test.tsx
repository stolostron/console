/* Copyright Contributors to the Open Cluster Management project */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceLink: ({ name, groupVersionKind, children, ...props }: any) => (
    <div data-testid="resource-link-mock" {...props}>
      ResourceLink: {name} ({groupVersionKind?.kind}){children}
    </div>
  ),
  ResourceIcon: ({ groupVersionKind }: any) => (
    <span data-testid="resource-icon-mock">Icon: {groupVersionKind?.kind}</span>
  ),
}))

const mockUseHubClusterName = jest.fn()
const mockUseFleetClusterNames = jest.fn()
const mockUseLocation = jest.fn()

jest.mock('./useHubClusterName', () => ({
  useHubClusterName: () => mockUseHubClusterName(),
}))

jest.mock('./useFleetClusterNames', () => ({
  useFleetClusterNames: () => mockUseFleetClusterNames(),
}))

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => mockUseLocation(),
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

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

// NOW import FleetResourceLink after all mocks are set up
import { FleetResourceLink } from './FleetResourceLink'

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
    // Set default mock values that work
    mockUseHubClusterName.mockReturnValue(['local-cluster', true, null])
    mockUseFleetClusterNames.mockReturnValue([['local-cluster', 'managed-cluster-1'], true, null])
    mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure' })
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
    it('should link to first-class page for VirtualMachine on hub cluster in multicloud path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/multicloud/infrastructure/virtualmachines' })

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="local-cluster" />
        </MemoryRouter>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/multicloud/infrastructure/virtualmachines/local-cluster/default/test-vm')
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
  })

  describe('Managed cluster cases', () => {
    it('should link to first-class page for VirtualMachine on managed cluster', () => {
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

    it('should link to first-class page for VirtualMachineInstance on managed cluster', () => {
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

  describe('No cluster specified', () => {
    it('should fallback to ResourceLink when no cluster is provided', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} /> {/* no cluster prop */}
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
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
            inline={true}
            truncate={true}
          />
        </MemoryRouter>
      )

      const wrapper = screen.getByText('test-vm').closest('span')
      expect(wrapper).toHaveClass(
        'co-resource-item',
        'custom-class',
        'co-resource-item--inline',
        'co-resource-item--truncate'
      )
    })

    it('should handle hideIcon prop', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1" hideIcon={true} />
        </MemoryRouter>
      )

      expect(screen.queryByTestId('resource-icon-mock')).not.toBeInTheDocument()
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
      expect(link).toHaveAttribute('data-test-id', 'test-vm')
    })

    it('should handle children prop', () => {
      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="managed-cluster-1">
            <div data-testid="child-content">Child Content</div>
          </FleetResourceLink>
        </MemoryRouter>
      )

      expect(screen.getByTestId('child-content')).toHaveTextContent('Child Content')
    })

    it('should handle children prop in fallback ResourceLink', () => {
      mockUseFleetClusterNames.mockReturnValue([[], true, null]) // no fleet available

      render(
        <MemoryRouter>
          <FleetResourceLink {...defaultProps} cluster="test-cluster">
            <div data-testid="child-content">Child Content</div>
          </FleetResourceLink>
        </MemoryRouter>
      )

      expect(screen.getByTestId('resource-link-mock')).toBeInTheDocument()
      expect(screen.getByTestId('child-content')).toHaveTextContent('Child Content')
    })
  })
})
