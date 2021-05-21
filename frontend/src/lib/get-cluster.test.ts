/* Copyright Contributors to the Open Cluster Management project */

import { ClusterDeployment, ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../resources/cluster-deployment'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../resources/managed-cluster'
import {
    ManagedClusterInfo,
    ManagedClusterInfoApiVersion,
    ManagedClusterInfoKind,
} from '../resources/managed-cluster-info'
import { ClusterCurator, ClusterCuratorApiVersion, ClusterCuratorKind } from '../resources/cluster-curator'
import { getDistributionInfo } from './get-cluster'
export const clusterName = 'test-cluster'
const mockClusterCurator: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: clusterName,
        namespace: clusterName,
    },
}
const conditionCuratorJobRunning = {
    reason: 'Job_has_finished',
    status: 'False',
    type: 'clustercurator-job',
}
const conditionCuratorUpdating = {
    reason: 'Job_has_finished',
    status: 'False',
    type: 'upgrade-cluster',
}
const conditionCuratorMonitoring = {
    reason: 'Job_has_finished',
    status: 'False',
    type: 'monitor-upgrade',
    message: 'Upgrade status Working towards 4.6.13: 11% complete',
}
const mockClusterCuratorUpdating: ClusterCurator = {
    ...mockClusterCurator,
    spec: {
        desiredCuration: 'upgrade',
        upgrade: {
            desiredUpdate: '1.2.4',
        },
    },
    status: {
        conditions: [conditionCuratorJobRunning, conditionCuratorUpdating],
    },
}
const mockClusterCuratorMonitoring: ClusterCurator = {
    ...mockClusterCurator,
    spec: {
        desiredCuration: 'upgrade',
        upgrade: {
            desiredUpdate: '1.2.4',
        },
    },
    status: {
        conditions: [conditionCuratorJobRunning, conditionCuratorMonitoring],
    },
}
const mockClusterCuratorSelectingChannel: ClusterCurator = {
    ...mockClusterCurator,
    spec: {
        desiredCuration: 'upgrade',
        upgrade: {
            channel: 'stable-1.3',
        },
    },
    status: {
        conditions: [conditionCuratorJobRunning, conditionCuratorUpdating],
    },
}
const mockClusterCuratorRunningOther: ClusterCurator = {
    ...mockClusterCurator,
    spec: {
        desiredCuration: 'scale',
    },
    status: {
        conditions: [conditionCuratorJobRunning],
    },
}

const mockManagedClusterInfoHasAvailableUpdates: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: clusterName, namespace: clusterName },
    status: {
        distributionInfo: {
            ocp: {
                version: '1.2.3',
                availableUpdates: [], //deprecated
                versionAvailableUpdates: [{ version: '1.2.4', image: 'abc' }],
                desiredVersion: '', //deprecated
                upgradeFailed: false,
                channel: 'stable-1.2',
                desired: {
                    channels: ['stable-1.3', 'stable-1.2'],
                    version: '1.2.3',
                    image: 'abc',
                },
            },
            type: 'OCP',
        },
    },
}
const mockManagedClusterInfoFailedInstall: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: clusterName, namespace: clusterName },
    status: {
        distributionInfo: {
            ocp: {
                version: '1.2.3',
                availableUpdates: [], //deprecated
                versionAvailableUpdates: [{ version: '1.2.4', image: 'abc' }],
                desiredVersion: '', //deprecated
                upgradeFailed: true,
                channel: 'stable-1.2',
                desired: {
                    channels: ['stable-1.3', 'stable-1.2'],
                    version: '1.2.3',
                    image: 'abc',
                },
            },
            type: 'OCP',
        },
    },
}
const mockManagedClusterInfoUpdating: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: clusterName, namespace: clusterName },
    status: {
        distributionInfo: {
            ocp: {
                version: '1.2.3',
                availableUpdates: [], //deprecated
                versionAvailableUpdates: [{ version: '1.2.4', image: 'abc' }],
                desiredVersion: '', //deprecated
                upgradeFailed: false,
                channel: 'stable-1.2',
                desired: {
                    channels: ['stable-1.3', 'stable-1.2'],
                    version: '1.2.4',
                    image: 'abc',
                },
            },
            type: 'OCP',
        },
    },
}
const mockManagedClusterInfoFailedUpdating: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: clusterName, namespace: clusterName },
    status: {
        distributionInfo: {
            ocp: {
                version: '1.2.3',
                availableUpdates: [], //deprecated
                versionAvailableUpdates: [{ version: '1.2.4', image: 'abc' }],
                desiredVersion: '', //deprecated
                upgradeFailed: true,
                channel: 'stable-1.2',
                desired: {
                    channels: ['stable-1.3', 'stable-1.2'],
                    version: '1.2.4',
                    image: 'abc',
                },
            },
            type: 'OCP',
        },
    },
}

const mockManagedCluster: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: clusterName },
    spec: { hubAcceptsClient: true },
    status: {
        allocatable: { cpu: '', memory: '' },
        capacity: { cpu: '', memory: '' },
        version: { kubernetes: '' },
        clusterClaims: [],
        conditions: [],
    },
}

const mockManagedClusterOCM: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: clusterName },
    spec: { hubAcceptsClient: true },
    status: {
        allocatable: { cpu: '', memory: '' },
        capacity: { cpu: '', memory: '' },
        version: { kubernetes: '' },
        clusterClaims: [{ name: 'product.open-cluster-management.io', value: 'OpenShiftDedicated' }],
        conditions: [],
    },
}

const mockClusterDeployment: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
        labels: {
            cloud: 'AWS',
            'hive.openshift.io/cluster-platform': 'aws',
            'hive.openshift.io/cluster-region': 'us-east-1',
            region: 'us-east-1',
            vendor: 'OpenShift',
        },
        name: clusterName,
        namespace: clusterName,
    },
    spec: {
        baseDomain: 'dev02.test-chesterfield.com',
        clusterName: clusterName,
        installed: false,
        platform: {
            aws: {
                credentialsSecretRef: {
                    name: 'test-cluster-aws-creds',
                },
                region: 'us-east-1',
            },
        },
        provisioning: {
            imageSetRef: {
                name: 'img4.5.15-x86-64',
            },
            installConfigSecretRef: {
                name: 'test-cluster-install-config',
            },
            sshPrivateKeySecretRef: {
                name: 'test-cluster-ssh-private-key',
            },
        },
        pullSecretRef: {
            name: 'test-cluster-pull-secret',
        },
    },
    status: {
        cliImage:
            'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb',
        conditions: [],
        installerImage:
            'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
        provisionRef: {
            name: 'test-cluster-31-26h5q',
        },
    },
}

describe('getDistributionInfo', () => {
    it('should have correct available updates and available channels', () => {
        const d = getDistributionInfo(
            mockManagedClusterInfoHasAvailableUpdates,
            mockManagedCluster,
            mockClusterDeployment,
            mockClusterCurator
        )
        expect(d?.upgradeInfo.availableUpdates).toEqual(['1.2.4'])
        expect(d?.upgradeInfo.availableChannels).toEqual(['stable-1.3', 'stable-1.2'])
        expect(d?.upgradeInfo.isUpgrading).toBeFalsy()
        expect(d?.upgradeInfo.isSelectingChannel).toBeFalsy()
        expect(d?.upgradeInfo.desiredChannel).toEqual('stable-1.2')
        expect(d?.upgradeInfo.desiredVersion).toEqual('1.2.3')
    })
    it('should get percentage information from curator when updating', () => {
        const d1 = getDistributionInfo(
            mockManagedClusterInfoUpdating,
            mockManagedCluster,
            mockClusterDeployment,
            mockClusterCuratorMonitoring
        )
        expect(d1?.upgradeInfo.isReadySelectChannels).toBeFalsy()
        expect(d1?.upgradeInfo.isReadyUpdates).toBeFalsy()
        expect(d1?.upgradeInfo.upgradePercentage).toEqual('11%')
        expect(d1?.upgradeInfo.isUpgrading).toBeTruthy()
    })
    it('should return false for ready for update if curator is running, or if currently updating, or if managed by ocm', () => {
        const d1 = getDistributionInfo(
            mockManagedClusterInfoUpdating,
            mockManagedCluster,
            mockClusterDeployment,
            mockClusterCuratorMonitoring
        )
        expect(d1?.upgradeInfo.isUpgrading).toBeTruthy()
        expect(d1?.upgradeInfo.isReadySelectChannels).toBeFalsy()
        expect(d1?.upgradeInfo.isReadyUpdates).toBeFalsy()
        const d2 = getDistributionInfo(
            mockManagedClusterInfoHasAvailableUpdates,
            mockManagedCluster,
            mockClusterDeployment,
            mockClusterCuratorUpdating
        )
        expect(d2?.upgradeInfo.isUpgrading).toBeTruthy()
        expect(d2?.upgradeInfo.isReadySelectChannels).toBeFalsy()
        expect(d2?.upgradeInfo.isReadyUpdates).toBeFalsy()
        const d3 = getDistributionInfo(
            mockManagedClusterInfoHasAvailableUpdates,
            mockManagedCluster,
            mockClusterDeployment,
            mockClusterCuratorRunningOther
        )
        expect(d3?.upgradeInfo.isUpgrading).toBeFalsy()
        expect(d3?.upgradeInfo.isReadySelectChannels).toBeFalsy()
        expect(d3?.upgradeInfo.isReadyUpdates).toBeFalsy()
    })
    it('should return false for ready to update if the cluster is managed by ocm', () => {
        const d1 = getDistributionInfo(
            mockManagedClusterInfoHasAvailableUpdates,
            mockManagedClusterOCM,
            mockClusterDeployment,
            mockClusterCurator
        )
        expect(d1?.upgradeInfo.isUpgrading).toBeFalsy()
        expect(d1?.upgradeInfo.isReadySelectChannels).toBeFalsy()
        expect(d1?.upgradeInfo.isReadyUpdates).toBeFalsy()
    })
    it('should return update failed only if update is failed', () => {
        const d1 = getDistributionInfo(
            mockManagedClusterInfoFailedUpdating,
            mockManagedCluster,
            mockClusterDeployment,
            mockClusterCuratorMonitoring
        )
        expect(d1?.upgradeInfo.isUpgrading).toBeTruthy()
        expect(d1?.upgradeInfo.upgradeFailed).toBeTruthy()
        const d2 = getDistributionInfo(
            mockManagedClusterInfoFailedInstall,
            mockManagedCluster,
            mockClusterDeployment,
            mockClusterCuratorMonitoring
        )
        expect(d2?.upgradeInfo.isUpgrading).toBeTruthy()
        expect(d2?.upgradeInfo.upgradeFailed).toBeFalsy()
    })
    it('should return updating correctly for ocm managedclusters', () => {
        const d2 = getDistributionInfo(
            mockManagedClusterInfoUpdating,
            mockManagedClusterOCM,
            mockClusterDeployment,
            mockClusterCurator
        )
        expect(d2?.upgradeInfo.currentVersion).toEqual('1.2.3')
        expect(d2?.upgradeInfo.desiredVersion).toEqual('1.2.4')
        expect(d2?.upgradeInfo.isUpgrading).toBeTruthy()
    })
    it('should return channel selecting if curator is running & having a desired channel', () => {
        const d1 = getDistributionInfo(
            mockManagedClusterInfoHasAvailableUpdates,
            mockManagedCluster,
            mockClusterDeployment,
            mockClusterCuratorSelectingChannel
        )
        expect(d1?.upgradeInfo.isSelectingChannel).toBeTruthy()
        expect(d1?.upgradeInfo.isUpgrading).toBeFalsy()
        expect(d1?.upgradeInfo.currentChannel).toEqual('stable-1.2')
        expect(d1?.upgradeInfo.desiredChannel).toEqual('stable-1.3')
    })
})
