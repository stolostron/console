/* Copyright Contributors to the Open Cluster Management project */
import { postPlacementDebug } from './placement-debug'
import { IPlacement } from '../wizards/common/resources/IPlacement'

jest.mock('./utils/resource-request', () => ({
  postRequest: jest.fn((_url: string, body: unknown) => ({
    promise: Promise.resolve(body),
    abort: jest.fn(),
  })),
  getBackendUrl: jest.fn(() => 'https://localhost'),
}))

const { postRequest } = jest.requireMock('./utils/resource-request') as { postRequest: jest.Mock }

describe('postPlacementDebug', () => {
  it('sends placement metadata and spec to backend', () => {
    const placement: IPlacement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default' },
      spec: { clusterSets: ['my-set'] },
    }

    const result = postPlacementDebug(placement)

    expect(postRequest).toHaveBeenCalledWith('https://localhost/placement-debug', {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default' },
      spec: { clusterSets: ['my-set'] },
    })
    expect(result).toHaveProperty('promise')
    expect(result).toHaveProperty('abort')
  })

  it('only sends apiVersion, kind, metadata, and spec', () => {
    const placement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default', uid: 'abc', resourceVersion: '1' },
      spec: {},
      status: { conditions: [{ type: 'Satisfied' }] },
    } as IPlacement

    postPlacementDebug(placement)

    const body = postRequest.mock.calls[postRequest.mock.calls.length - 1][1]
    expect(body).toHaveProperty('apiVersion')
    expect(body).toHaveProperty('kind')
    expect(body).toHaveProperty('metadata')
    expect(body).toHaveProperty('spec')
    expect(body).not.toHaveProperty('status')
  })
})
