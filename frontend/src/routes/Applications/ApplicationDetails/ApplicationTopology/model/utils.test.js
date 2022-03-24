/* Copyright Contributors to the Open Cluster Management project */

import { getClusterName, createChildNode, addClusters, getApplicationData } from './utils'

describe('getClusterName', () => {
    it('get the cluster name from the id', () => {
        const nodeId =
            'member--deployed-resource--member--clusters--local-cluster--feng-error-app--helloworld-app-svc--service'
        expect(getClusterName(nodeId)).toEqual('local-cluster')
    })

    it('node id is undefined', () => {
        expect(getClusterName(undefined)).toEqual('')
    })
})

describe('createChildNode', () => {
    it('create child node from given data', () => {
        const parent = {
            type: 'cluster',
            id: 'member--clusters--local-cluster',
            name: 'test-cluster',
            namespace: 'test-ns',
        }
        const result = {
            id: 'member--member--deployable--member--clusters--local-cluster--service--test-cluster',
            name: 'test-cluster',
            namespace: 'test-ns',
            specs: {
                parent: {
                    parentId: 'member--clusters--local-cluster',
                    parentName: 'test-cluster',
                    parentType: 'cluster',
                },
            },
            type: 'service',
            uid: 'member--member--deployable--member--clusters--local-cluster--service--test-cluster',
        }
        expect(createChildNode(parent, 'service', [], [])).toEqual(result)
    })
})

describe('addClusters', () => {
    it('create cluster from given data', () => {
        const parentId = 'member--subscription--feng-error-app--feng-error-app-subscription-1'
        const subscription = {
            metadata: {
                name: 'test',
            },
        }
        const clusterNames = ['local-cluster']
        const managedClusterNames = ['console-managed', 'local-cluster', 'rbrunopi-aws-01']
        const topology = {
            nodes: [
                {
                    id: 'member--clusters--',
                    specs: {
                        appClusters: [],
                        targetNamespaces: [],
                    },
                },
            ],
        }
        const result = 'member--clusters--local-cluster--test'
        expect(addClusters(parentId, subscription, '', clusterNames, managedClusterNames, [], [], topology)).toEqual(
            result
        )
    })
})

describe('getApplicationData', () => {
    it('returns subscription app data from given nodes', () => {
        const nodes = [
            {
                type: 'application',
                specs: {
                    raw: {
                        apiVersion: 'app.k8s.io/v1beta1',
                    },
                },
            },
            {
                type: 'subscription',
                name: 'my-subscription',
            },
            {
                type: 'cluster',
            },
            {
                type: 'replicaset',
            },
        ]
        const result = {
            isArgoApp: false,
            relatedKinds: ['application', 'subscription', 'cluster', 'replicaset', 'pod'],
            subscription: 'my-subscription',
        }
        expect(getApplicationData(nodes)).toEqual(result)
    })

    it('returns argo app data from given nodes', () => {
        const nodes = [
            {
                type: 'application',
                specs: {
                    raw: {
                        apiVersion: 'argoproj.io/v1alpha1',
                    },
                },
            },
            {
                type: 'cluster',
            },
            {
                type: 'replicaset',
            },
        ]
        const result = {
            cluster: 'local-cluster',
            isArgoApp: true,
            relatedKinds: ['replicaset', 'pod'],
            source: {},
            subscription: null,
        }
        expect(getApplicationData(nodes)).toEqual(result)
    })
})
