/* Copyright Contributors to the Open Cluster Management project */

import { nockCreate, nockDelete, nockIgnoreApiPaths, nockReplace } from '../../lib/nock-util'
import { ClusterCurator, ClusterCuratorApiVersion, ClusterCuratorKind } from '../cluster-curator'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../namespace'
import { createResource, deleteResources, reconcileResources, ResourceError, updateResources } from './resource-request'

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

describe('reconcileResources negative testing', () => {
    nockIgnoreApiPaths()
    it('reconcileResources catches error creating namespace resource', async () => {
        nockCreate(mockClusterNamespace, mockClusterNamespace, 400)

        await expect(async () => {
            await reconcileResources([mockClusterCurator, mockClusterNamespace], [])
        }).rejects.toThrowError(ResourceError)
    })
    it('createResources catches error creating resource', async () => {
        nockCreate(mockClusterCurator, mockClusterCurator, 400)

        await expect(async () => {
            await createResource(mockClusterCurator).promise
        }).rejects.toThrowError(ResourceError)
    })
    it('updateResources catches error updating resource', async () => {
        nockReplace(mockClusterCurator, mockPatchedClusterCurator, 400)
        await expect(async () => {
            await updateResources([mockClusterCurator])
        }).rejects.toThrowError(ResourceError)
    })
    it('deleteResources catches error updating resource', async () => {
        nockDelete(mockClusterCurator, mockPatchedClusterCurator, 400)
        await expect(async () => {
            await deleteResources([mockClusterCurator])
        }).rejects.toThrowError(ResourceError)
    })
})
