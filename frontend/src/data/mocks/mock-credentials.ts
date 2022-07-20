/* Copyright Contributors to the Open Cluster Management project */
import { Secret } from '../../resources'

export const mockCredentials: Secret[] = [
    {
        apiVersion: 'v1',
        kind: 'Secret',
        type: 'Opaque',
        metadata: {
            name: 'mock-aws-credentials',
            namespace: 'connections',
            labels: {
                'cluster.open-cluster-management.io/credentials': '',
                'cluster.open-cluster-management.io/type': 'aws',
            },
        },
        stringData: {
            aws_access_key_id: 'abc123',
            aws_secret_access_key: 'abc123',
            baseDomain: 'abc123',
            pullSecret: 'abc123',
            'ssh-privatekey': 'abc123',
            'ssh-publickey': 'abc123',
        },
    },
]
