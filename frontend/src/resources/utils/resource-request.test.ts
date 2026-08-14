/* Copyright Contributors to the Open Cluster Management project */

import { ClusterCurator, ClusterCuratorApiVersion, ClusterCuratorKind } from '../cluster-curator'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../namespace'
import {
  ResourceError,
  ResourceErrorCode,
  createResource,
  createResources,
  deleteResources,
  listAnsibleTowerJobs,
  reconcileResources,
  updateResources,
} from './resource-request'
import { StatusApiVersion, StatusKind } from '../status'
import {
  nockAnsibleTower,
  nockCreate,
  nockCreateError,
  nockDelete,
  nockDeleteError,
  nockIgnoreApiPaths,
  nockReplace,
  nockReplaceError,
} from '../../lib/nock-util'

import nock from 'nock'

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
    }).rejects.toThrow(ResourceError)
  })
})

describe('createResource', () => {
  nockIgnoreApiPaths()
  it('catches error creating resource', async () => {
    nockCreate(mockClusterCurator, mockClusterCurator, 400)

    await expect(async () => {
      await createResource(mockClusterCurator).promise
    }).rejects.toThrow(ResourceError)
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
    }).rejects.toThrow(ResourceError)
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
    }).rejects.toThrow(ResourceError)
  })
  it('throws error when no name set', async () => {
    await expect(async () => {
      await deleteResources([{ apiVersion: ClusterCuratorApiVersion, kind: ClusterCuratorKind }])
    }).rejects.toThrow(ResourceError)
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

describe('listAnsibleTowerJobs', () => {
  nockIgnoreApiPaths()

  const secretRef = { namespace: 'test-ns', name: 'ansible-credential' }

  const mockJobTemplateResponse = {
    count: 2,
    results: [
      {
        id: '1',
        name: 'Test Job Template',
        type: 'job_template' as const,
        description: 'Test job',
      },
      {
        id: '2',
        name: 'Test Workflow',
        type: 'workflow_job_template' as const,
        description: 'Test workflow',
      },
    ],
  }

  it('ACM-30375: fallback to controller paths when gateway paths return 404', async () => {
    // Mock gateway paths returning 404 (AAP 2.4 doesn't have these paths)
    nockAnsibleTower(
      {
        secretNamespace: secretRef.namespace,
        secretName: secretRef.name,
        ansiblePath: '/api/controller/v2/job_templates/',
      },
      {
        kind: StatusKind,
        apiVersion: StatusApiVersion,
        code: 404,
        message: 'Not Found',
        status: 'Failure',
      } as any,
      404
    )
    nockAnsibleTower(
      {
        secretNamespace: secretRef.namespace,
        secretName: secretRef.name,
        ansiblePath: '/api/controller/v2/workflow_job_templates/',
      },
      {
        kind: StatusKind,
        apiVersion: StatusApiVersion,
        code: 404,
        message: 'Not Found',
        status: 'Failure',
      } as any,
      404
    )

    // Mock controller paths returning success (AAP 2.4 has these paths)
    nockAnsibleTower(
      { secretNamespace: secretRef.namespace, secretName: secretRef.name, ansiblePath: '/api/v2/job_templates/' },
      { results: [mockJobTemplateResponse.results[0]] }
    )
    nockAnsibleTower(
      {
        secretNamespace: secretRef.namespace,
        secretName: secretRef.name,
        ansiblePath: '/api/v2/workflow_job_templates/',
      },
      { results: [mockJobTemplateResponse.results[1]] }
    )

    const result = await listAnsibleTowerJobs(secretRef).promise

    expect(result.results).toHaveLength(2)
    expect(result.results[0].name).toBe('Test Job Template')
    expect(result.results[1].name).toBe('Test Workflow')
  })

  it('returns jobs when gateway paths work (AAP 2.5+)', async () => {
    // Mock gateway paths returning success
    nockAnsibleTower(
      {
        secretNamespace: secretRef.namespace,
        secretName: secretRef.name,
        ansiblePath: '/api/controller/v2/job_templates/',
      },
      { results: [mockJobTemplateResponse.results[0]] }
    )
    nockAnsibleTower(
      {
        secretNamespace: secretRef.namespace,
        secretName: secretRef.name,
        ansiblePath: '/api/controller/v2/workflow_job_templates/',
      },
      { results: [mockJobTemplateResponse.results[1]] }
    )

    // Negative assertions: Controller fallback paths (/api/v2/*) should NOT be called
    // If code regresses and calls these paths, they will return 500 errors causing test failure
    // Using .optionally() so test passes when paths aren't called (expected behavior)
    nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
      .post('/ansibletower', (body: any) => body.ansiblePath === '/api/v2/job_templates/')
      .optionally()
      .reply(
        500,
        {
          kind: StatusKind,
          apiVersion: StatusApiVersion,
          code: 500,
          message: 'TEST FAILURE: Controller path /api/v2/job_templates/ should not be called when gateway succeeds',
          status: 'Failure',
        },
        {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Credentials': 'true',
        }
      )

    nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
      .post('/ansibletower', (body: any) => body.ansiblePath === '/api/v2/workflow_job_templates/')
      .optionally()
      .reply(
        500,
        {
          kind: StatusKind,
          apiVersion: StatusApiVersion,
          code: 500,
          message:
            'TEST FAILURE: Controller path /api/v2/workflow_job_templates/ should not be called when gateway succeeds',
          status: 'Failure',
        },
        {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Credentials': 'true',
        }
      )

    const result = await listAnsibleTowerJobs(secretRef).promise

    expect(result.results).toHaveLength(2)
    expect(result.results[0].name).toBe('Test Job Template')
    expect(result.results[1].name).toBe('Test Workflow')
  })

  it('re-throws non-404 errors (auth, network, etc.)', async () => {
    // Mock gateway paths returning 401 Unauthorized
    nockAnsibleTower(
      {
        secretNamespace: secretRef.namespace,
        secretName: secretRef.name,
        ansiblePath: '/api/controller/v2/job_templates/',
      },
      {
        kind: StatusKind,
        apiVersion: StatusApiVersion,
        code: 401,
        message: 'Unauthorized',
        status: 'Failure',
      } as any,
      401
    )

    await expect(async () => {
      await listAnsibleTowerJobs(secretRef).promise
    }).rejects.toThrow(ResourceError)
  })

  it('throws raw 404 error when all paths return 404 (wrong URL or misconfigured)', async () => {
    // Mock ALL paths returning 404 (wrong base URL, misconfigured Ansible Tower, etc.)
    nockAnsibleTower(
      {
        secretNamespace: secretRef.namespace,
        secretName: secretRef.name,
        ansiblePath: '/api/controller/v2/job_templates/',
      },
      {
        kind: StatusKind,
        apiVersion: StatusApiVersion,
        code: 404,
        message: 'Not Found',
        status: 'Failure',
      } as any,
      404
    )
    nockAnsibleTower(
      {
        secretNamespace: secretRef.namespace,
        secretName: secretRef.name,
        ansiblePath: '/api/controller/v2/workflow_job_templates/',
      },
      {
        kind: StatusKind,
        apiVersion: StatusApiVersion,
        code: 404,
        message: 'Not Found',
        status: 'Failure',
      } as any,
      404
    )
    nockAnsibleTower(
      { secretNamespace: secretRef.namespace, secretName: secretRef.name, ansiblePath: '/api/v2/job_templates/' },
      {
        kind: StatusKind,
        apiVersion: StatusApiVersion,
        code: 404,
        message: 'Not Found',
        status: 'Failure',
      } as any,
      404
    )
    nockAnsibleTower(
      {
        secretNamespace: secretRef.namespace,
        secretName: secretRef.name,
        ansiblePath: '/api/v2/workflow_job_templates/',
      },
      {
        kind: StatusKind,
        apiVersion: StatusApiVersion,
        code: 404,
        message: 'Not Found',
        status: 'Failure',
      } as any,
      404
    )

    const error = await listAnsibleTowerJobs(secretRef).promise.catch((e) => e)

    expect(error).toBeInstanceOf(ResourceError)
    expect(error.code).toBe(ResourceErrorCode.NotFound)
    // Should return the raw 404 error message from the server
    expect(error.message).toBe('Not Found')
  })
})
