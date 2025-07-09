/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import VMRedirect from './VMRedirect'
import { useFlag } from '@openshift-console/dynamic-plugin-sdk'

// mocking useParams and Navigate
const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: jest.fn(),
}))

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: () => mockUseParams(),
  Navigate: ({ to, replace }: { to: string; replace: boolean }) => {
    mockNavigate(to, replace)
    return <div data-testid="navigate-mock">Redirecting to: {to}</div>
  },
}))

describe('VMRedirect', () => {
  const mockUseFlag = jest.mocked(useFlag)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderVMRedirect = () => {
    return render(
      <MemoryRouter>
        <VMRedirect />
      </MemoryRouter>
    )
  }

  const expectSearchPageRedirect = (cluster: string, namespace?: string, name?: string) => {
    const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

    expect(urlCalled).toContain('/multicloud/search/resources')
    expect(replaceFlag).toBe(true)

    // decoding the URL to check readable parameters
    const decodedUrl = decodeURIComponent(urlCalled)
    expect(decodedUrl).toContain(`cluster=${cluster}`)
    expect(decodedUrl).toContain('kind=VirtualMachine')
    expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')

    if (namespace) {
      expect(decodedUrl).toContain(`namespace=${namespace}`)
    }
    if (name) {
      expect(decodedUrl).toContain(`name=${name}`)
    }
  }

  describe('when KUBEVIRT_DYNAMIC_ACM flag is enabled', () => {
    beforeEach(() => {
      mockUseFlag.mockReturnValue(true)
    })

    it('should redirect to search page with correct parameters', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster',
        namespace: 'default',
        name: 'test-vm',
      })

      renderVMRedirect()

      expectSearchPageRedirect('test-cluster', 'default', 'test-vm')
    })

    it('should redirect with special characters in cluster name', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster-01',
        namespace: 'kube-system',
        name: 'my-vm-test',
      })

      renderVMRedirect()

      expectSearchPageRedirect('test-cluster-01', 'kube-system', 'my-vm-test')
    })

    it('should redirect with empty namespace', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster',
        namespace: '',
        name: 'test-vm',
      })

      renderVMRedirect()

      const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

      expect(urlCalled).toContain('/multicloud/search/resources')
      expect(replaceFlag).toBe(true)

      const decodedUrl = decodeURIComponent(urlCalled)
      expect(decodedUrl).toContain('cluster=test-cluster')
      expect(decodedUrl).toContain('kind=VirtualMachine')
      expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
      expect(decodedUrl).toContain('name=test-vm')
      expect(decodedUrl).not.toContain('namespace=')
    })

    it('should redirect with missing parameters', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster',
        namespace: undefined,
        name: undefined,
      })

      renderVMRedirect()

      const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

      expect(urlCalled).toContain('/multicloud/search/resources')
      expect(replaceFlag).toBe(true)

      const decodedUrl = decodeURIComponent(urlCalled)
      expect(decodedUrl).toContain('cluster=test-cluster')
      expect(decodedUrl).toContain('kind=VirtualMachine')
      expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
      // namespace and name should not appear when missing
      expect(decodedUrl).not.toContain('namespace=')
      expect(decodedUrl).not.toContain('name=')
    })

    it('should handle complex VM names and namespaces', () => {
      mockUseParams.mockReturnValue({
        cluster: 'prod-cluster',
        namespace: 'my-app-namespace',
        name: 'web-server-vm-001',
      })

      renderVMRedirect()

      expectSearchPageRedirect('prod-cluster', 'my-app-namespace', 'web-server-vm-001')
    })
  })

  describe('when KUBEVIRT_DYNAMIC_ACM flag is disabled', () => {
    beforeEach(() => {
      mockUseFlag.mockReturnValue(false)
    })

    it('should redirect to search page with correct parameters', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster',
        namespace: 'default',
        name: 'test-vm',
      })

      renderVMRedirect()

      expectSearchPageRedirect('test-cluster', 'default', 'test-vm')
    })

    it('should redirect with special characters in cluster name', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster-01',
        namespace: 'kube-system',
        name: 'my-vm-test',
      })

      renderVMRedirect()

      expectSearchPageRedirect('test-cluster-01', 'kube-system', 'my-vm-test')
    })

    it('should redirect with empty namespace', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster',
        namespace: '',
        name: 'test-vm',
      })

      renderVMRedirect()

      const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

      expect(urlCalled).toContain('/multicloud/search/resources')
      expect(replaceFlag).toBe(true)

      const decodedUrl = decodeURIComponent(urlCalled)
      expect(decodedUrl).toContain('cluster=test-cluster')
      expect(decodedUrl).toContain('kind=VirtualMachine')
      expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
      expect(decodedUrl).toContain('name=test-vm')
      expect(decodedUrl).not.toContain('namespace=')
    })

    it('should redirect with missing parameters', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster',
        namespace: undefined,
        name: undefined,
      })

      renderVMRedirect()

      const [urlCalled, replaceFlag] = mockNavigate.mock.calls[0]

      expect(urlCalled).toContain('/multicloud/search/resources')
      expect(replaceFlag).toBe(true)

      const decodedUrl = decodeURIComponent(urlCalled)
      expect(decodedUrl).toContain('cluster=test-cluster')
      expect(decodedUrl).toContain('kind=VirtualMachine')
      expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')
      // namespace and name should not appear when missing
      expect(decodedUrl).not.toContain('namespace=')
      expect(decodedUrl).not.toContain('name=')
    })

    it('should handle complex VM names and namespaces', () => {
      mockUseParams.mockReturnValue({
        cluster: 'prod-cluster',
        namespace: 'my-app-namespace',
        name: 'web-server-vm-001',
      })

      renderVMRedirect()

      expectSearchPageRedirect('prod-cluster', 'my-app-namespace', 'web-server-vm-001')
    })
  })

  describe('behavior consistency', () => {
    it('should always use replace navigation regardless of flag state', () => {
      mockUseParams.mockReturnValue({
        cluster: 'cluster',
        namespace: 'ns',
        name: 'vm',
      })

      // Test with flag enabled
      mockUseFlag.mockReturnValue(true)
      renderVMRedirect()
      expect(mockNavigate.mock.calls[0][1]).toBe(true)

      jest.clearAllMocks()

      // Test with flag disabled
      mockUseFlag.mockReturnValue(false)
      renderVMRedirect()
      expect(mockNavigate.mock.calls[0][1]).toBe(true)
    })

    it('should always redirect to VirtualMachine kind regardless of flag state', () => {
      mockUseParams.mockReturnValue({
        cluster: 'any-cluster',
        namespace: 'any-namespace',
        name: 'any-name',
      })

      // test with the flag enabled
      mockUseFlag.mockReturnValue(true)
      renderVMRedirect()

      const [urlCalled] = mockNavigate.mock.calls[0] // ✅ FIXED: Use const
      const decodedUrl = decodeURIComponent(urlCalled) // ✅ FIXED: Use const
      expect(decodedUrl).toContain('kind=VirtualMachine')
      expect(decodedUrl).toContain('apiversion=kubevirt.io/v1')

      jest.clearAllMocks()

      // test with the flag disabled
      mockUseFlag.mockReturnValue(false)
      renderVMRedirect()

      const [urlCalled2] = mockNavigate.mock.calls[0]
      const decodedUrl2 = decodeURIComponent(urlCalled2)
      expect(decodedUrl2).toContain('kind=VirtualMachine')
      expect(decodedUrl2).toContain('apiversion=kubevirt.io/v1')
    })
  })

  describe('flag integration', () => {
    it('should call useFlag with correct flag name', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster',
        namespace: 'default',
        name: 'test-vm',
      })

      renderVMRedirect()

      expect(mockUseFlag).toHaveBeenCalledWith('KUBEVIRT_DYNAMIC_ACM')
    })

    it('should call useFlag exactly once', () => {
      mockUseParams.mockReturnValue({
        cluster: 'test-cluster',
        namespace: 'default',
        name: 'test-vm',
      })

      renderVMRedirect()

      expect(mockUseFlag).toHaveBeenCalledTimes(1)
    })
  })
})
