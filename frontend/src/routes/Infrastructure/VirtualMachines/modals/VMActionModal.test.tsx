/* Copyright Contributors to the Open Cluster Management project */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { isFineGrainedRbacEnabledState } from '../../../../atoms'
import { fleetResourceRequest } from '../../../../resources/utils/fleet-resource-request'
import { fetchRetry } from '../../../../resources/utils/resource-request'
import { VMActionModal } from './VMActionModal'

jest.mock('../../../../resources/utils/resource-request', () => ({
  getRequest: jest.fn((url) => {
    if (url === '/virtualmachines/get/local-cluster/testVM/testVMNamespace') {
      return {
        promise: Promise.resolve({
          apiVersion: 'kubevirt.io/v1',
          kind: 'VirtualMachine',
          metadata: {
            name: 'test-vm',
            namespace: 'testVMNamespace',
          },
        }),
      }
    } else {
      return Promise.resolve()
    }
  }),
  getBackendUrl: jest.fn(() => ''),
  fetchRetry: jest.fn(({ url }) => {
    if (url === '/apis/subresources.kubevirt.io/v1/namespaces/testVMNamespace/virtualmachines/testVM/noop') {
      return Promise.reject(new Error())
    } else if (
      url === '/apis/subresources.kubevirt.io/v1/namespaces/testVMNamespace/virtualmachines/testVM/unauthorized'
    ) {
      return Promise.reject(new Error('Error: Unauthorized'))
    }
    return Promise.resolve()
  }),
}))

jest.mock('../../../../resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: jest.fn(() =>
    Promise.resolve({
      apiVersion: 'kubevirt.io/v1',
      kind: 'VirtualMachine',
      metadata: {
        name: 'test-vm',
        namespace: 'testVMNamespace',
      },
    })
  ),
}))

describe('VMActionModal', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })
  test('renders VMActionModal correctly and successfully calls start action on hub vm', async () => {
    const abortController = new AbortController()
    const { getByTestId } = render(
      <RecoilRoot>
        <VMActionModal
          open={true}
          close={() => {}}
          action={'start'}
          method={'PUT'}
          item={{
            kind: 'VirtualMachine',
            name: 'testVM',
            namespace: 'testVMNamespace',
            cluster: 'local-cluster',
            _hubClusterResource: 'true',
          }}
        />
      </RecoilRoot>
    )
    await waitFor(() => expect(screen.queryByText('start VirtualMachine?')).toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to start testVM in namespace testVMNamespace?')
      ).toBeInTheDocument()
    )

    // verify click launch button
    const confirmButton = getByTestId('vm-modal-confirm')
    expect(confirmButton).toBeTruthy()
    userEvent.click(confirmButton)

    expect(fetchRetry).toHaveBeenCalledWith({
      data: {
        managedCluster: 'local-cluster',
        reqBody: {},
        vmName: 'testVM',
        vmNamespace: 'testVMNamespace',
      },
      disableRedirectUnauthorizedLogin: true,
      headers: {
        Accept: '*/*',
      },
      method: 'PUT',
      retries: 0,
      signal: abortController.signal,
      url: '/virtualmachines/start',
    })
  })

  test('renders VMActionModal correctly and successfully calls unpause action on hub vm', async () => {
    const abortController = new AbortController()
    const { getByTestId } = render(
      <RecoilRoot>
        <VMActionModal
          open={true}
          close={() => {}}
          action={'unpause'}
          method={'PUT'}
          item={{
            kind: 'VirtualMachine',
            name: 'testVM',
            namespace: 'testVMNamespace',
            cluster: 'local-cluster',
            _hubClusterResource: 'true',
          }}
        />
      </RecoilRoot>
    )
    await waitFor(() => expect(screen.queryByText('unpause VirtualMachine?')).toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to unpause testVM in namespace testVMNamespace?')
      ).toBeInTheDocument()
    )

    // verify click launch button
    const confirmButton = getByTestId('vm-modal-confirm')
    expect(confirmButton).toBeTruthy()
    userEvent.click(confirmButton)

    expect(fetchRetry).toHaveBeenCalledWith({
      data: {
        managedCluster: 'local-cluster',
        reqBody: {},
        vmName: 'testVM',
        vmNamespace: 'testVMNamespace',
      },
      disableRedirectUnauthorizedLogin: true,
      headers: {
        Accept: '*/*',
      },
      method: 'PUT',
      retries: 0,
      signal: abortController.signal,
      url: '/virtualmachineinstances/unpause',
    })
  })

  test('renders VMActionModal correctly and successfully calls delete vm action', async () => {
    const abortController = new AbortController()
    const { getByTestId } = render(
      <RecoilRoot>
        <VMActionModal
          open={true}
          close={() => {}}
          action={'delete'}
          method={'DELETE'}
          item={{
            kind: 'VirtualMachine',
            name: 'testVM',
            namespace: 'testVMNamespace',
            cluster: 'local-cluster',
            _hubClusterResource: 'true',
          }}
        />
      </RecoilRoot>
    )
    await waitFor(() => expect(screen.queryByText('delete VirtualMachine?')).toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to delete testVM in namespace testVMNamespace?')
      ).toBeInTheDocument()
    )

    // verify click launch button
    const confirmButton = getByTestId('vm-modal-confirm')
    expect(confirmButton).toBeTruthy()
    userEvent.click(confirmButton)

    expect(fetchRetry).toHaveBeenCalledWith({
      data: {
        managedCluster: 'local-cluster',
        reqBody: {},
        vmName: 'testVM',
        vmNamespace: 'testVMNamespace',
      },
      disableRedirectUnauthorizedLogin: true,
      headers: {
        Accept: '*/*',
      },
      method: 'DELETE',
      retries: 0,
      signal: abortController.signal,
      url: '/virtualmachines/delete',
    })
  })

  test('renders VMActionModal correctly and successfully calls restore snapshot action with fine grained RBAC', async () => {
    Date.now = jest.fn(() => 1234)
    const abortController = new AbortController()
    const { getByTestId } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(isFineGrainedRbacEnabledState, true)
        }}
      >
        <VMActionModal
          open={true}
          close={() => {}}
          action={'restore'}
          method={'POST'}
          item={{
            kind: 'VirtualMachineSnapshot',
            name: 'testVM-snapshot',
            namespace: 'testVMNamespace',
            cluster: 'local-cluster',
            sourceName: 'testVM',
            _hubClusterResource: 'true',
          }}
        />
      </RecoilRoot>
    )
    await waitFor(() => expect(screen.queryByText('restore VirtualMachineSnapshot?')).toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to restore testVM from snapshot testVM-snapshot')
      ).toBeInTheDocument()
    )

    // verify click launch button
    const confirmButton = getByTestId('vm-modal-confirm')
    expect(confirmButton).toBeTruthy()
    userEvent.click(confirmButton)

    expect(fetchRetry).toHaveBeenCalledWith({
      data: {
        managedCluster: 'local-cluster',
        reqBody: {
          apiVersion: 'snapshot.kubevirt.io/v1beta1',
          kind: 'VirtualMachineRestore',
          metadata: {
            name: 'testVM-snapshot-1234',
            namespace: 'testVMNamespace',
            ownerReferences: [
              {
                apiVersion: 'kubevirt.io/v1',
                blockOwnerDeletion: false,
                kind: 'VirtualMachine',
                name: 'test-vm',
                uid: undefined,
              },
            ],
          },
          spec: {
            target: {
              apiGroup: 'kubevirt.io',
              kind: 'VirtualMachine',
              name: 'test-vm',
            },
            virtualMachineSnapshotName: 'testVM-snapshot',
          },
        },
        vmName: 'testVM',
        vmNamespace: 'testVMNamespace',
      },
      disableRedirectUnauthorizedLogin: true,
      headers: {
        Accept: '*/*',
      },
      method: 'POST',
      retries: 0,
      signal: abortController.signal,
      url: '/virtualmachinerestores',
    })
  })

  test('renders VMActionModal correctly and returns action error', async () => {
    const { getByTestId } = render(
      <RecoilRoot>
        <VMActionModal
          open={true}
          close={() => {}}
          action={'noop'}
          method={'PUT'}
          item={{
            kind: 'VirtualMachine',
            name: 'testVM',
            namespace: 'testVMNamespace',
            cluster: 'test-cluster',
            _hubClusterResource: 'true',
          }}
        />
      </RecoilRoot>
    )
    await waitFor(() => expect(screen.queryByText('noop VirtualMachine?')).toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to noop testVM in namespace testVMNamespace?')
      ).toBeInTheDocument()
    )

    // verify click launch button
    const confirmButton = getByTestId('vm-modal-confirm')
    expect(confirmButton).toBeTruthy()
    userEvent.click(confirmButton)

    expect(fetchRetry).toThrow()
  })

  test('renders VMActionModal correctly and returns unauthorized error', async () => {
    const { getByTestId } = render(
      <RecoilRoot>
        <VMActionModal
          open={true}
          close={() => {}}
          action={'unauthorized'}
          method={'PUT'}
          item={{
            kind: 'VirtualMachine',
            name: 'testVM',
            namespace: 'testVMNamespace',
            cluster: 'test-cluster',
            _hubClusterResource: 'true',
          }}
        />
      </RecoilRoot>
    )
    await waitFor(() => expect(screen.queryByText('unauthorized VirtualMachine?')).toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to unauthorized testVM in namespace testVMNamespace?')
      ).toBeInTheDocument()
    )

    // verify click launch button
    const confirmButton = getByTestId('vm-modal-confirm')
    expect(confirmButton).toBeTruthy()
    userEvent.click(confirmButton)

    expect(fetchRetry).toThrow()
  })

  test('renders VMActionModal correctly and calls fleetResourceRequest when restoring snapshot without fine-grained RBAC', async () => {
    Date.now = jest.fn(() => 1234)
    const abortController = new AbortController()
    const { getByTestId } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(isFineGrainedRbacEnabledState, false)
        }}
      >
        <VMActionModal
          open={true}
          close={() => {}}
          action={'restore'}
          method={'POST'}
          item={{
            kind: 'VirtualMachineSnapshot',
            name: 'testVM-snapshot',
            namespace: 'testVMNamespace',
            cluster: 'local-cluster',
            sourceName: 'testVM',
            _hubClusterResource: 'true',
          }}
        />
      </RecoilRoot>
    )
    await waitFor(() => expect(screen.queryByText('restore VirtualMachineSnapshot?')).toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to restore testVM from snapshot testVM-snapshot')
      ).toBeInTheDocument()
    )

    // Wait for fleetResourceRequest to be called
    await waitFor(() => {
      expect(fleetResourceRequest).toHaveBeenCalledWith('GET', 'local-cluster', {
        apiVersion: 'kubevirt.io/v1',
        kind: 'VirtualMachine',
        name: 'testVM',
        namespace: 'testVMNamespace',
      })
    })

    // Wait for button to be enabled (vmLoading should be false after fleetResourceRequest resolves)
    const confirmButton = await waitFor(() => {
      const button = getByTestId('vm-modal-confirm')
      expect(button).not.toBeDisabled()
      return button
    })
    expect(confirmButton).toBeTruthy()
    userEvent.click(confirmButton)

    expect(fetchRetry).toHaveBeenCalledWith({
      data: {
        managedCluster: 'local-cluster',
        reqBody: {
          apiVersion: 'snapshot.kubevirt.io/v1beta1',
          kind: 'VirtualMachineRestore',
          metadata: {
            name: 'testVM-snapshot-1234',
            namespace: 'testVMNamespace',
            ownerReferences: [
              {
                apiVersion: 'kubevirt.io/v1',
                blockOwnerDeletion: false,
                kind: 'VirtualMachine',
                name: 'test-vm',
                uid: undefined,
              },
            ],
          },
          spec: {
            target: {
              apiGroup: 'kubevirt.io',
              kind: 'VirtualMachine',
              name: 'test-vm',
            },
            virtualMachineSnapshotName: 'testVM-snapshot',
          },
        },
        vmName: 'testVM',
        vmNamespace: 'testVMNamespace',
      },
      disableRedirectUnauthorizedLogin: true,
      headers: {
        Accept: '*/*',
      },
      method: 'POST',
      retries: 0,
      signal: abortController.signal,
      url: '/virtualmachinerestores',
    })
  })

  test('renders VMActionModal catches error on fleetResourceRequest', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Mock fleetResourceRequest to return an error for this test
    ;(fleetResourceRequest as jest.MockedFunction<typeof fleetResourceRequest>).mockResolvedValueOnce({
      errorMessage: 'Failed to fetch VirtualMachine',
    })

    Date.now = jest.fn(() => 1234)
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(isFineGrainedRbacEnabledState, false)
        }}
      >
        <VMActionModal
          open={true}
          close={() => {}}
          action={'restore'}
          method={'POST'}
          item={{
            kind: 'VirtualMachineSnapshot',
            name: 'testVM-snapshot',
            namespace: 'testVMNamespace',
            cluster: 'local-cluster',
            sourceName: 'testVM',
            _hubClusterResource: 'true',
          }}
        />
      </RecoilRoot>
    )
    await waitFor(() => expect(screen.queryByText('restore VirtualMachineSnapshot?')).toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.queryByText('Are you sure you want to restore testVM from snapshot testVM-snapshot')
      ).toBeInTheDocument()
    )

    // Wait for fleetResourceRequest to be called
    await waitFor(() => {
      expect(fleetResourceRequest).toHaveBeenCalledWith('GET', 'local-cluster', {
        apiVersion: 'kubevirt.io/v1',
        kind: 'VirtualMachine',
        name: 'testVM',
        namespace: 'testVMNamespace',
      })
    })

    // Wait for error to be logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching parent VM: Failed to fetch VirtualMachine')
    })

    consoleErrorSpy.mockRestore()
  })
})
