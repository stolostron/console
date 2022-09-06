/* Copyright Contributors to the Open Cluster Management project */
import { Cluster, ClusterStatus, MachinePool, MachinePoolApiVersion, MachinePoolKind } from '../../../../../resources'
import { Provider } from '../../../../../ui-components'

export const clusterName = 'test-cluster'

export const mockCluster: Cluster = {
    name: clusterName,
    displayName: clusterName,
    namespace: clusterName,
    uid: clusterName,
    status: ClusterStatus.ready,
    distribution: {
        k8sVersion: '1.19',
        ocp: undefined,
        displayVersion: '1.19',
        isManagedOpenShift: false,
    },
    labels: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            installConfig: '',
        },
    },
    isHive: true,
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isSNOCluster: false,
    owner: {},
    kubeconfig: '',
    kubeadmin: '',
    isHypershift: false,
    provider: Provider.aws,
    nodes: {
        ready: 0,
        unhealthy: 0,
        unknown: 0,
        nodeList: [
            {
                name: 'ip-10-0-134-240.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-west-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                conditions: [
                    {
                        status: 'True',
                        type: 'Ready',
                    },
                ],
            },
            {
                name: 'ip-10-0-134-241.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-west-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                conditions: [
                    {
                        status: 'True',
                        type: 'Ready',
                    },
                ],
            },
            {
                name: 'ip-10-0-134-242.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-west-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                conditions: [
                    {
                        status: 'True',
                        type: 'Ready',
                    },
                ],
            },
            {
                name: 'ip-10-0-130-30.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                    'node-role.kubernetes.io/master': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                capacity: {
                    cpu: '4',
                    memory: '15944104Ki',
                },
                conditions: [
                    {
                        status: 'Unknown',
                        type: 'Ready',
                    },
                ],
            },
            {
                name: 'ip-10-0-151-254.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-south-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                    'node-role.kubernetes.io/master': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                capacity: {
                    cpu: '4',
                    memory: '8194000Pi',
                },
                conditions: [
                    {
                        status: 'False',
                        type: 'Ready',
                    },
                ],
            },
        ],
    },
}

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
