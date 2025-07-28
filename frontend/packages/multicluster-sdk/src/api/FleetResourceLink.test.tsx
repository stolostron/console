/* Copyright Contributors to the Open Cluster Management project */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { FleetResourceLink } from './FleetResourceLink'

// mock ResourceLink from OpenShift Console SDK
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceLink: ({ name, groupVersionKind }: any) => (
    <div id="resource-link-mock">
      ResourceLink: {name} ({groupVersionKind?.kind})
    </div>
  ),
  ResourceIcon: ({ groupVersionKind }: any) => <span id="resource-icon-mock">Icon: {groupVersionKind?.kind}</span>,
}))

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

  it('should render VM link with cluster for VirtualMachine', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink {...defaultProps} cluster="test-cluster" />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/k8s/cluster/test-cluster/ns/default/kubevirt.io~v1~VirtualMachine/test-vm')
    expect(link).toHaveTextContent('test-vm')
    expect(screen.getByTestId('resource-icon-mock')).toHaveTextContent('Icon: VirtualMachine')
  })

  it('should render search link for non-VM resources with cluster', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink
          name="test-pod"
          namespace="default"
          cluster="test-cluster"
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

    // test for encoded URL parts (since getURLSearchParam encodes)
    expect(href).toContain('/multicloud/search/resources')
    expect(href).toContain('cluster%3Dtest-cluster')
    expect(href).toContain('kind%3DPod')
    expect(href).toContain('apiversion%3Dv1')
    expect(href).toContain('namespace%3Ddefault')
    expect(href).toContain('name%3Dtest-pod')
  })

  it('should fallback to ResourceLink when no cluster is provided', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink {...defaultProps} />
      </MemoryRouter>
    )

    expect(screen.getByTestId('resource-link-mock')).toHaveTextContent('ResourceLink: test-vm (VirtualMachine)')
  })

  it('should handle displayName override', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink {...defaultProps} cluster="test-cluster" displayName="Custom VM Name" />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('Custom VM Name')
  })

  it('should handle missing namespace for VM', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink
          name="test-vm"
          cluster="test-cluster"
          groupVersionKind={{
            group: 'kubevirt.io',
            version: 'v1',
            kind: 'VirtualMachine',
          }}
          // namespace is undefined
        />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    const href = link.getAttribute('href')
    expect(href).toBeTruthy() // Assert href exists

    // should fall back to search URL, not VM URL
    expect(href).toContain('/multicloud/search/resources')

    const decodedUrl = decodeURIComponent(href!)
    expect(decodedUrl).toContain('cluster=test-cluster')
    expect(decodedUrl).toContain('kind=VirtualMachine')
    expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
    expect(decodedUrl).toContain('name=test-vm')
    // namespace should NOT appear since it's undefined
    expect(decodedUrl).not.toContain('namespace=')
  })

  it('should handle empty string namespace for VM by falling back to search', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink
          name="test-vm"
          cluster="test-cluster"
          namespace="" // empty string, not undefined
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
    expect(href).toBeTruthy() // Assert href exists

    // should fall back to search URL because empty string is falsy
    expect(href).toContain('/multicloud/search/resources')

    const decodedUrl = decodeURIComponent(href!)
    expect(decodedUrl).toContain('cluster=test-cluster')
    expect(decodedUrl).toContain('kind=VirtualMachine')
    expect(decodedUrl).toContain('name=test-vm')
    // namespace should NOT appear for empty string
    expect(decodedUrl).not.toContain('namespace=')
  })

  it('should handle className and styling props', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink
          {...defaultProps}
          cluster="test-cluster"
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
        <FleetResourceLink {...defaultProps} cluster="test-cluster" hideIcon={true} />
      </MemoryRouter>
    )

    expect(screen.queryByTestId('resource-icon-mock')).not.toBeInTheDocument()
  })

  it('should handle nameSuffix', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink {...defaultProps} cluster="test-cluster" nameSuffix=" (suffix)" />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('test-vm (suffix)')
  })

  it('should handle title and data-test attributes', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink {...defaultProps} cluster="test-cluster" title="VM Title" dataTest="custom-test-id" />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('title', 'VM Title')
    expect(link).toHaveAttribute('data-test', 'custom-test-id')
    expect(link).toHaveAttribute('data-test-id', 'test-vm')
  })

  it('should handle search link when no groupVersionKind provided', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink
          name="test-resource"
          cluster="test-cluster"
          // no groupVersionKind provided
        />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    const href = link.getAttribute('href')

    expect(href).toContain('/multicloud/search/resources')
    expect(href).toContain('cluster%3Dtest-cluster')
    expect(href).toContain('name%3Dtest-resource')
    expect(link).toHaveTextContent('test-resource')
  })

  it('should handle children prop', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink {...defaultProps} cluster="test-cluster">
          <div id="child-content">Child Content</div>
        </FleetResourceLink>
      </MemoryRouter>
    )

    expect(screen.getByTestId('child-content')).toHaveTextContent('Child Content')
  })

  it('should handle search link for resource with apigroup', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink
          name="test-deployment"
          namespace="default"
          cluster="test-cluster"
          groupVersionKind={{
            group: 'apps',
            version: 'v1',
            kind: 'Deployment',
          }}
        />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    const href = link.getAttribute('href')

    expect(href).toContain('apiversion%3Dapps%2Fv1') // encoded = and /
  })

  it('should handle search link for core resource without apigroup', () => {
    render(
      <MemoryRouter>
        <FleetResourceLink
          name="test-service"
          namespace="default"
          cluster="test-cluster"
          groupVersionKind={{
            group: '',
            version: 'v1',
            kind: 'Service',
          }}
        />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    const href = link.getAttribute('href')

    expect(href).toContain('apiversion%3Dv1') // encoded =
    expect(href).not.toContain('apiversion%3D%2Fv1') // should not have encoded /
  })
})
