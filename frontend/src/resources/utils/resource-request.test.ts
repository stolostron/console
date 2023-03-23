/* Copyright Contributors to the Open Cluster Management project */

import {
  nockCreate,
  nockCreateError,
  nockDelete,
  nockDeleteError,
  nockIgnoreApiPaths,
  nockReplace,
  nockReplaceError,
} from '../../lib/nock-util'
import { ClusterCurator, ClusterCuratorApiVersion, ClusterCuratorKind } from '../cluster-curator'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../namespace'
import {
  createResource,
  createResources,
  deleteResources,
  reconcileResources,
  ResourceError,
  updateResources,
} from './resource-request'

export const clusterName = 'test-cluster'

const mockClusterCurator: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: clusterName,
    namespace: clusterName,
    uid: '0',
  },
  spec: {
    upgrade: {
      desiredUpdate: '1.2.5',
    },
  },
}
const mockPatchedClusterCurator: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: clusterName,
    namespace: clusterName,
    uid: '0',
  },
  spec: {
    desiredCuration: 'upgrade',
    upgrade: {
      desiredUpdate: '1.2.5',
    },
  },
}

const mockClusterNamespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: clusterName,
    uid: '1',
  },
}

describe('reconcileResources', () => {
  nockIgnoreApiPaths()
  it('catches error creating namespace resource', async () => {
    nockCreate(mockClusterNamespace, mockClusterNamespace, 400)

    await expect(async () => {
      await reconcileResources([mockClusterCurator, mockClusterNamespace], [])
    }).rejects.toThrowError(ResourceError)
  })
})
describe('createResource', () => {
  nockIgnoreApiPaths()
  it('catches error creating resource', async () => {
    nockCreate(mockClusterCurator, mockClusterCurator, 400)

    await expect(async () => {
      await createResource(mockClusterCurator).promise
    }).rejects.toThrowError(ResourceError)
  })
})
describe('createResources', () => {
  it('detects ETIMEDOUT', async () => {
    nockCreateError(mockClusterCurator, { message: 'Timeout issue', code: 'ETIMEDOUT' })
    await expect(async () => {
      await createResources([mockClusterCurator])
    }).rejects.toThrowErrorMatchingInlineSnapshot(`"Timeout"`)
  })
})
describe('updateResources', () => {
  nockIgnoreApiPaths()
  it('catches error updating resource', async () => {
    nockReplace(mockClusterCurator, mockPatchedClusterCurator, 400)
    await expect(async () => {
      await updateResources([mockClusterCurator])
    }).rejects.toThrowError(ResourceError)
  })
  it('detects ECONNRESET', async () => {
    nockReplaceError(mockClusterCurator, { message: 'Reset', code: 'ECONNRESET' })
    await expect(async () => {
      await updateResources([mockClusterCurator])
    }).rejects.toThrowErrorMatchingInlineSnapshot(`"ConnectionReset"`)
  })
})
describe('deleteResources', () => {
  nockIgnoreApiPaths()
  it('catches error updating resource', async () => {
    nockDelete(mockClusterCurator, mockPatchedClusterCurator, 401)
    await expect(async () => {
      await deleteResources([mockClusterCurator])
    }).rejects.toThrowError(ResourceError)
  })
  it('throws error when no name set', async () => {
    await expect(async () => {
      await deleteResources([{ apiVersion: ClusterCuratorApiVersion, kind: ClusterCuratorKind }])
    }).rejects.toThrowError(ResourceError)
  })
  it('detects ETIMEDOUT', async () => {
    nockDeleteError(mockClusterCurator, { message: 'Missing', code: 'ENOTFOUND' })
    await expect(async () => {
      await deleteResources([mockClusterCurator])
    }).rejects.toThrowErrorMatchingInlineSnapshot(`"NotFound"`)
  })
  it('detects numeric error codes', async () => {
    nockDeleteError(mockClusterCurator, { message: 'Aborted', code: 800 })
    await expect(async () => {
      await deleteResources([mockClusterCurator])
    }).rejects.toThrowErrorMatchingInlineSnapshot(
      `"request to http://localhost/apis/cluster.open-cluster-management.io/v1beta1/namespaces/test-cluster/clustercurators/test-cluster failed, reason: Aborted"`
    )
  })
  it('handles unknown error codes"', async () => {
    nockDeleteError(mockClusterCurator, { message: 'Random', code: 'RANDOM_ERROR' })
    await expect(async () => {
      await deleteResources([mockClusterCurator])
    }).rejects.toThrowErrorMatchingInlineSnapshot(`"Unknown error code: RANDOM_ERROR"`)
  })
})
