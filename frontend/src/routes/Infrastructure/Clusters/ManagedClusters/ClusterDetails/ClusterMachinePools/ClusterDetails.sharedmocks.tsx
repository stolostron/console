/* Copyright Contributors to the Open Cluster Management project */
import { MachinePool, MachinePoolApiVersion, MachinePoolKind } from '../../../../../../resources'

export const clusterName = 'test-cluster'

export const mockMachinePoolManual: MachinePool = {
    apiVersion: MachinePoolApiVersion,
    kind: MachinePoolKind,
    metadata: {
        name: `${clusterName}-manual`,
        namespace: clusterName,
    },
    spec: {
        clusterDeploymentRef: {
            name: clusterName,
        },
        name: 'worker',
        platform: {
            aws: {
                rootVolume: {
                    iops: 100,
                    size: 22,
                    type: 'gp2',
                },
                type: 'm4.xlarge',
            },
        },
        replicas: 3,
    },
    status: {
        replicas: 3,
        machineSets: [
            {
                maxReplicas: 1,
                minReplicas: 1,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1a`,
                replicas: 1,
            },
            {
                maxReplicas: 1,
                minReplicas: 1,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1b`,
                replicas: 1,
            },
            {
                maxReplicas: 1,
                minReplicas: 1,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1c`,
                replicas: 1,
            },
            {
                maxReplicas: 0,
                minReplicas: 0,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1d`,
                replicas: 0,
            },
            {
                maxReplicas: 0,
                minReplicas: 0,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1e`,
                replicas: 0,
            },
            {
                maxReplicas: 0,
                minReplicas: 0,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1f`,
                replicas: 0,
            },
        ],
    },
}

export const mockMachinePoolAuto: MachinePool = {
    apiVersion: MachinePoolApiVersion,
    kind: MachinePoolKind,
    metadata: {
        name: `${clusterName}-auto`,
        namespace: clusterName,
    },
    spec: {
        clusterDeploymentRef: {
            name: clusterName,
        },
        name: 'worker',
        platform: {
            aws: {
                rootVolume: {
                    iops: 100,
                    size: 22,
                    type: 'gp2',
                },
                type: 'm4.xlarge',
            },
        },
        autoscaling: {
            minReplicas: 1,
            maxReplicas: 3,
        },
    },
    status: {
        replicas: 3,
        machineSets: [
            {
                maxReplicas: 1,
                minReplicas: 1,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1a`,
                replicas: 1,
            },
            {
                maxReplicas: 1,
                minReplicas: 1,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1b`,
                replicas: 1,
            },
            {
                maxReplicas: 1,
                minReplicas: 1,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1c`,
                replicas: 1,
            },
            {
                maxReplicas: 0,
                minReplicas: 0,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1d`,
                replicas: 0,
            },
            {
                maxReplicas: 0,
                minReplicas: 0,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1e`,
                replicas: 0,
            },
            {
                maxReplicas: 0,
                minReplicas: 0,
                name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1f`,
                replicas: 0,
            },
        ],
    },
}
