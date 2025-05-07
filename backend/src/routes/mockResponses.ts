/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable no-constant-condition */

export const accessControlResponse = {
    metadata: { _continue: '', resourceVersion: '1', continue: "" },
    items: [
        {
            apiVersion: 'clusterview.open-cluster-management.io/v11',
            kind: 'AccessControl',
            metadata: {
                annotations: {},
                creationTimestamp: '2025-04-28T07:08:26Z',
                finalizers: [{}],
                generation: 3,
                labels: [{}],
                managedFields: [{}],
                name: 'd9316f95-7138-4c45-8a92-38fa25923111',
                namespace: 'jg-test-1',
                resourceVersion: '227021',
                uid: '99b9ba60-f9be-490c-97c8-2a12cc3aed11'
            },
            data: {
                id: '2b84f22b-e4b3-4d8b-9d0d-f20dbb87cb20',
                namespaces: ["ns1", "ns2"],
                cluster: "jg-test-1",
                users: ["user1", "user2"],
                roles: ["role1", "role2"],
                creationTimestamp: '2025-04-01T04:56:17Z',
                isActive: true,
            },
        },
        {
            apiVersion: 'clusterview.open-cluster-management.io/v11',
            kind: 'AccessControl',
            metadata: {
                annotations: {},
                creationTimestamp: '2025-04-28T07:08:26Z',
                finalizers: [{}],
                generation: 3,
                labels: [{}],
                managedFields: [{}],
                name: 'd9316f95-7138-4c45-8a92-38fa25923112',
                namespace: 'jg-test-1',
                resourceVersion: '227021',
                uid: '99b9ba60-f9be-490c-97c8-2a12cc3aed12'
            },
            data: {
                id: '2b84f22b-e4b3-4d8b-9d0d-f20dbb87cb21',
                namespaces: ["*"],
                cluster: "local-cluster",
                users: ["*"],
                roles: ["*"],
                creationTimestamp: '2025-04-02T04:56:17Z',
                isActive: true,
            },
        },
        {
            apiVersion: 'clusterview.open-cluster-management.io/v11',
            kind: 'AccessControl',
            metadata: {
                annotations: {},
                creationTimestamp: '2025-04-28T07:08:26Z',
                finalizers: [{}],
                generation: 3,
                labels: [{}],
                managedFields: [{}],
                name: 'd9316f95-7138-4c45-8a92-38fa25923113',
                namespace: 'jg-test-1',
                resourceVersion: '227021',
                uid: '99b9ba60-f9be-490c-97c8-2a12cc3aed13'
            },
            data: {
                id: '2b84f22b-e4b3-4d8b-9d0d-f20dbb87cb22',
                namespaces: ["ns1"],
                cluster: "jg-test-1",
                users: ["user1"],
                roles: ["role2"],
                creationTimestamp: '2025-04-03T04:56:17Z',
                isActive: true,
            },
        },
        {
            apiVersion: 'clusterview.open-cluster-management.io/v11',
            kind: 'AccessControl',
            metadata: {
                annotations: {},
                creationTimestamp: '2025-04-28T07:08:26Z',
                finalizers: [{}],
                generation: 3,
                labels: [{}],
                managedFields: [{}],
                name: 'd9316f95-7138-4c45-8a92-38fa25923114',
                namespace: 'jg-test-1',
                resourceVersion: '227021',
                uid: '99b9ba60-f9be-490c-97c8-2a12cc3aed14'
            },
            data: {
                id: '2b84f22b-e4b3-4d8b-9d0d-f20dbb87cb23',
                namespaces: ["ns3"],
                cluster: "local-cluster",
                groups: ["group1", "group2"],
                roles: ["role1"],
                creationTimestamp: '2025-04-04T04:56:17Z',
                isActive: true,
            },
        },
        {
            apiVersion: 'clusterview.open-cluster-management.io/v11',
            kind: 'AccessControl',
            metadata: {
                annotations: {},
                creationTimestamp: '2025-04-28T07:08:26Z',
                finalizers: [{}],
                generation: 3,
                labels: [{}],
                managedFields: [{}],
                name: 'd9316f95-7138-4c45-8a92-38fa25923115',
                namespace: 'jg-test-1',
                resourceVersion: '227021',
                uid: '99b9ba60-f9be-490c-97c8-2a12cc3aed15'
            },
            data: {
                id: '2b84f22b-e4b3-4d8b-9d0d-f20dbb87cb24',
                namespaces: Array(5).fill(0).map((e, index) => `ns${index + 1}`),
                cluster: "local-cluster",
                users: Array(9).fill(0).map((e, index) => `user${index + 1}`),
                roles: Array(25).fill(0).map((e, index) => `role${index + 1}`),
                creationTimestamp: '2025-04-05T04:56:17Z',
                isActive: false,
            },
        },
        {
            apiVersion: 'clusterview.open-cluster-management.io/v11',
            kind: 'AccessControl',
            metadata: {
                annotations: {},
                creationTimestamp: '2025-04-28T07:08:26Z',
                finalizers: [{}],
                generation: 3,
                labels: [{}],
                managedFields: [{}],
                name: 'd9316f95-7138-4c45-8a92-38fa25923116',
                namespace: 'jg-test-1',
                resourceVersion: '227021',
                uid: '99b9ba60-f9be-490c-97c8-2a12cc3aed16'
            },
            data: {
                id: '2b84f22b-e4b3-4d8b-9d0d-f20dbb87cb25',
                namespaces: ["*"],
                cluster: "*",
                groups: ["*"],
                roles: ["*"],
                creationTimestamp: '2025-04-06T04:56:17Z',
                isActive: true,
            },
        },
    ]
}