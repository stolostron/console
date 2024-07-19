/* Copyright Contributors to the Open Cluster Management project */
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { wait } from '../../../lib/test-util'
import { deleteResource, fireManagedClusterAction } from '../../../resources'
import { DeleteResourceModal } from './DeleteResourceModal'

jest.mock('../../../../lib/rbac-util', () => ({
  canUser: jest.fn(() => ({
    promise: Promise.resolve({ status: { allowed: true } }),
    abort: jest.fn(),
  })),
}))

jest.mock('../../../../resources/utils/resource-request', () => ({
  deleteResource: jest.fn(() => ({ promise: Promise.resolve() })),
}))

jest.mock('../../../../resources/managedclusteraction', () => ({
  fireManagedClusterAction: jest.fn(() => Promise.resolve({ actionDone: 'ActionDone' })),
}))

describe('DeleteResourceModal', () => {
  it('should render component with props', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()

    render(
      <RecoilRoot>
        <MemoryRouter>
          <DeleteResourceModal
            open={true}
            close={() => {}}
            cluster={'local-cluster'}
            resource={{
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: {
                name: 'testPod',
                namespace: 'testNamespace',
              },
            }}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    await act(async () => {
      await wait() // Test that the component has rendered correctly
      await waitFor(() => expect(screen.getByText('Are you sure that you want to delete testPod?')).toBeInTheDocument())
    })
  })

  it('should call the delete resource mutation with a successful response for local-cluster resource', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const mockOnCloseModal = jest.fn()

    const { getByTestId } = render(
      <RecoilRoot>
        <MemoryRouter>
          <DeleteResourceModal
            open={true}
            close={mockOnCloseModal}
            cluster={'local-cluster'}
            resource={{
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: {
                name: 'testPod',
                namespace: 'testNamespace',
              },
            }}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    await act(async () => {
      await wait() // Test that the component has rendered correctly
      await waitFor(() => expect(screen.getByText('Are you sure that you want to delete testPod?')).toBeInTheDocument())

      const deleteBtn = getByTestId('delete-resource-button')
      await waitFor(() => expect(deleteBtn).toBeInTheDocument())
      userEvent.click(deleteBtn)

      // Assert that deleteResource is called with the correct parameters
      expect(deleteResource).toHaveBeenCalledWith({
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: 'testPod',
          namespace: 'testNamespace',
        },
      })

      // Simulate the promise resolution of deleteResource
      await Promise.resolve()

      expect(mockOnCloseModal).toHaveBeenCalled()
    })
  })

  it('should call the delete resource mutation with a successful response for managed cluster resource', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const mockOnCloseModal = jest.fn()

    const { getByTestId } = render(
      <RecoilRoot>
        <MemoryRouter>
          <DeleteResourceModal
            open={true}
            close={mockOnCloseModal}
            cluster={'test-cluster'}
            resource={{
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: {
                name: 'testPod',
                namespace: 'testNamespace',
              },
            }}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    await act(async () => {
      await wait() // Test that the component has rendered correctly
      await waitFor(() => expect(screen.getByText('Are you sure that you want to delete testPod?')).toBeInTheDocument())

      const deleteBtn = getByTestId('delete-resource-button')
      await waitFor(() => expect(deleteBtn).toBeInTheDocument())
      userEvent.click(deleteBtn)

      // Assert that deleteResource is called with the correct parameters
      expect(fireManagedClusterAction).toHaveBeenCalledWith(
        'Delete',
        'test-cluster',
        'Pod',
        'v1',
        'testPod',
        'testNamespace'
      )

      // Simulate the promise resolution of fireManagedClusterAction
      await Promise.resolve({ actionDone: 'ActionDone' })

      expect(mockOnCloseModal).toHaveBeenCalled()
    })
  })
})
