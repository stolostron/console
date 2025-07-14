/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { waitFor } from '@testing-library/react'
import { useFleetAccessReview } from './useFleetAccessReview'

describe('useFleetAccessReview', () => {
  const mockFleetK8sCreate = jest.fn(() => Promise.resolve({ status: { allowed: true } }))
  jest.mock('../internal/apiRequests', () => ({
    fleetK8sCreate: mockFleetK8sCreate,
  }))

  it('should return true if the check has failed', async () => {
    mockFleetK8sCreate.mockImplementationOnce(() => Promise.reject(new Error('oops')))
    const { result } = renderHook(() =>
      useFleetAccessReview({
        group: 'apps',
        resource: 'deployments',
        subresource: 'scale',
      })
    )

    await waitFor(() => expect(result.current[1]).toBeFalsy())
    expect(result.current[0]).toBe(true)
  })

  it('should return true if the user has access to the resource', async () => {
    const { result } = renderHook(() =>
      useFleetAccessReview({
        group: 'apps',
        resource: 'deployments',
        subresource: 'scale',
        verb: 'update',
        name: 'my-deployment',
        namespace: 'my-namespace',
      })
    )

    await waitFor(() => expect(result.current[1]).toBeFalsy())
    expect(result.current[0]).toBe(true)
  })

  it('should skip check when there is no group or resource', async () => {
    const { result } = renderHook(() =>
      useFleetAccessReview({
        subresource: 'scale',
        verb: 'update',
        name: 'my-deployment',
        namespace: 'my-namespace',
      })
    )

    await waitFor(() => expect(result.current[1]).toBeFalsy())
    expect(result.current[0]).toBe(false)
  })
})
