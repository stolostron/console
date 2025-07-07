/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import VMRedirect from './VMRedirect'

// mock useParams and Navigate
const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: () => mockUseParams(),
  Navigate: ({ to, replace }: { to: string; replace: boolean }) => {
    mockNavigate(to, replace)
    return <div data-testid="navigate-mock">Redirecting to: {to}</div>
  },
}))

describe('VMRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect to search page with correct parameters for VM', () => {
    mockUseParams.mockReturnValue({
      cluster: 'test-cluster',
      namespace: 'default',
      name: 'test-vm',
    })

    render(
      <MemoryRouter>
        <VMRedirect />
      </MemoryRouter>
    )

    const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

    expect(urlCalled).toContain('/multicloud/search/resources')

    // Decode the URL to check readable parameters
    const decodedUrl = decodeURIComponent(urlCalled)
    expect(decodedUrl).toContain('cluster=test-cluster')
    expect(decodedUrl).toContain('kind=VirtualMachine')
    expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
    expect(decodedUrl).toContain('namespace=default')
    expect(decodedUrl).toContain('name=test-vm')
    expect(replaceFlag).toBe(true)
  })

  it('should redirect with special characters in cluster name', () => {
    mockUseParams.mockReturnValue({
      cluster: 'test-cluster-01',
      namespace: 'kube-system',
      name: 'my-vm-test',
    })

    render(
      <MemoryRouter>
        <VMRedirect />
      </MemoryRouter>
    )

    const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

    expect(urlCalled).toContain('/multicloud/search/resources')

    const decodedUrl = decodeURIComponent(urlCalled)
    expect(decodedUrl).toContain('cluster=test-cluster-01')
    expect(decodedUrl).toContain('kind=VirtualMachine')
    expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
    expect(decodedUrl).toContain('namespace=kube-system')
    expect(decodedUrl).toContain('name=my-vm-test')
    expect(replaceFlag).toBe(true)
  })

  it('should redirect with empty namespace', () => {
    mockUseParams.mockReturnValue({
      cluster: 'test-cluster',
      namespace: '',
      name: 'test-vm',
    })

    render(
      <MemoryRouter>
        <VMRedirect />
      </MemoryRouter>
    )

    const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

    expect(urlCalled).toContain('/multicloud/search/resources')

    const decodedUrl = decodeURIComponent(urlCalled)
    expect(decodedUrl).toContain('cluster=test-cluster')
    expect(decodedUrl).toContain('kind=VirtualMachine')
    expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
    expect(decodedUrl).toContain('name=test-vm')
    expect(decodedUrl).not.toContain('namespace=')
    expect(replaceFlag).toBe(true)
  })

  it('should redirect with missing parameters', () => {
    mockUseParams.mockReturnValue({
      cluster: 'test-cluster',
      namespace: undefined,
      name: undefined,
    })

    render(
      <MemoryRouter>
        <VMRedirect />
      </MemoryRouter>
    )

    const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

    expect(urlCalled).toContain('/multicloud/search/resources')

    const decodedUrl = decodeURIComponent(urlCalled)
    expect(decodedUrl).toContain('cluster=test-cluster')
    expect(decodedUrl).toContain('kind=VirtualMachine')
    expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
    // namespace and name should not appear when missing
    expect(decodedUrl).not.toContain('namespace=')
    expect(decodedUrl).not.toContain('name=')
    expect(replaceFlag).toBe(true)
  })

  it('should always use replace navigation', () => {
    mockUseParams.mockReturnValue({
      cluster: 'cluster',
      namespace: 'ns',
      name: 'vm',
    })

    render(
      <MemoryRouter>
        <VMRedirect />
      </MemoryRouter>
    )

    const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

    expect(urlCalled).toContain('/multicloud/search/resources')
    expect(replaceFlag).toBe(true)
  })

  it('should handle complex VM names and namespaces', () => {
    mockUseParams.mockReturnValue({
      cluster: 'prod-cluster',
      namespace: 'my-app-namespace',
      name: 'web-server-vm-001',
    })

    render(
      <MemoryRouter>
        <VMRedirect />
      </MemoryRouter>
    )

    const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

    expect(urlCalled).toContain('/multicloud/search/resources')

    const decodedUrl = decodeURIComponent(urlCalled)
    expect(decodedUrl).toContain('cluster=prod-cluster')
    expect(decodedUrl).toContain('kind=VirtualMachine')
    expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
    expect(decodedUrl).toContain('namespace=my-app-namespace')
    expect(decodedUrl).toContain('name=web-server-vm-001')
    expect(replaceFlag).toBe(true)
  })

  it('should always redirect to VirtualMachine kind regardless of input', () => {
    mockUseParams.mockReturnValue({
      cluster: 'any-cluster',
      namespace: 'any-namespace',
      name: 'any-name',
    })

    render(
      <MemoryRouter>
        <VMRedirect />
      </MemoryRouter>
    )

    const [urlCalled] = mockNavigate.mock.calls[0]

    // should always hardcode VM-specific values
    const decodedUrl = decodeURIComponent(urlCalled)
    expect(decodedUrl).toContain('kind=VirtualMachine')
    expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
  })
})
