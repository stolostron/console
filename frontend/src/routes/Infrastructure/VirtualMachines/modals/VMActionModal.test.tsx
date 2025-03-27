/* Copyright Contributors to the Open Cluster Management project */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { fetchRetry } from '../../../../resources/utils/resource-request'
import { VMActionModal } from './VMActionModal'

jest.mock('../../../../resources/utils/resource-request', () => ({
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

describe('VMActionModal', () => {
  afterEach(cleanup)
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
      data: {},
      disableRedirectUnauthorizedLogin: true,
      headers: {
        Accept: '*/*',
      },
      method: 'PUT',
      retries: 0,
      signal: abortController.signal,
      url: '/apis/subresources.kubevirt.io/v1/namespaces/testVMNamespace/virtualmachines/testVM/start',
    })
  })

  test('renders VMActionModal correctly and successfully calls start action on managed cluster vm', async () => {
    const abortController = new AbortController()
    const { getByTestId } = render(
      <RecoilRoot>
        <VMActionModal
          open={true}
          close={() => {}}
          action={'start'}
          method={'PUT'}
          item={{
            name: 'testVM',
            namespace: 'testVMNamespace',
            cluster: 'test-cluster',
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
        reqBody: {},
        managedCluster: 'test-cluster',
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

  test('renders VMActionModal correctly and returns action error', async () => {
    const { getByTestId } = render(
      <RecoilRoot>
        <VMActionModal
          open={true}
          close={() => {}}
          action={'noop'}
          method={'PUT'}
          item={{
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
})
