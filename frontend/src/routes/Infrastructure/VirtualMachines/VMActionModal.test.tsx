/* Copyright Contributors to the Open Cluster Management project */
import { act, render, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { wait } from '../../../lib/test-util'
import { fetchRetry } from '../../../resources/utils/resource-request'
import { handleVMActions, VMActionModal } from './VMActionModal'

jest.mock('../../../resources/utils/resource-request', () => ({
  getBackendUrl: jest.fn(() => ''),
  fetchRetry: jest.fn(() => {
    return Promise.resolve()
  }),
}))

describe('VMActionModal', () => {
  it('should render modal with props', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()

    render(
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

    await act(async () => {
      await wait() // Test that the component has rendered correctly
      await waitFor(() => expect(screen.queryByText('start VirtualMachine?')).toBeInTheDocument())
      await waitFor(() =>
        expect(
          screen.queryByText('Are you sure you want to start testVM in namespace testVMNamespace?')
        ).toBeInTheDocument()
      )
    })
  })

  it('should call the virtualmachine action with a successful response', async () => {
    const toastContextMock: any = {
      addAlert: jest.fn(),
    }
    const t = jest.fn()
    const abortController = new AbortController()
    const refetchVM = () => {}
    handleVMActions(
      'stop',
      'PUT',
      {
        name: 'testVM',
        namespace: 'testVMNamespace',
        cluster: 'test-cluster',
        _hubClusterResource: 'true',
      },
      {},
      refetchVM,
      toastContextMock,
      t
    )

    // Assert that vm action is called with the correct parameters
    expect(fetchRetry).toHaveBeenCalledWith({
      data: {
        body: {},
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
      url: '/apis/subresources.kubevirt.io/v1/namespaces/testVMNamespace/virtualmachines/testVM/stop',
    })

    // Simulate the promise resolution of vm action
    await Promise.resolve()
  })
})
