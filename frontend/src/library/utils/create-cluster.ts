import { V1Secret } from '@kubernetes/client-node'
import * as YAML from 'yamljs'
import { InstallConfig } from '../resources/install-config'
import { projectRequestMethods } from '../../lib/Project'
import { providerConnectionMethods, ProviderConnection } from '../../lib/ProviderConnection'
import { secretMethods } from '../../lib/Secret'
import { clusterDeploymentMethods } from '../resources/cluster-deployment'
import { createManagedCluster } from '../../lib/ManagedCluster'
import { createKlusterletAddonConfig } from '../../lib/KlusterletAddonConfig'

interface ICreateClusterOptions {
    clusterName: string
    providerConnectionName: string
    providerConnectionNamespace: string
    baseDomain: string
    clusterImageSetName: string
    region: string
    networking: {
        clusterCidr: string
        machineCidr: string
        networkType: string
        serviceCidr: string
        hostPrefix: string
    }
    controlPlane: {
        zones: string
        instanceType: string
        storage: number
    }
    workerPools: {
        name: string
        zones: string[]
        instanceType: string
        nodeCount: number
        storage: number
    }[]
}

export async function getProviderConnection(options: ICreateClusterOptions) {
    let providerConnectionResult = await providerConnectionMethods.getNamespaceResource(
        options.providerConnectionName,
        options.providerConnectionNamespace
    )
    const providerConnection = providerConnectionResult.data
    return providerConnection
}

export async function createClusterNamespace(options: ICreateClusterOptions) {
    let projectResult = await projectRequestMethods.create({
        metadata: { name: options.clusterName },
    })
    return projectResult.data
}

export async function createClusterPullSecret(options: ICreateClusterOptions, providerConnection: ProviderConnection) {
    const pullSecretResult = await secretMethods.create({
        metadata: { name: `${options.clusterName}-pull-secret`, namespace: options.clusterName },
        stringData: { '.dockerconfigjson': providerConnection.spec!.pullSecret },
        type: 'kubernetes.io/dockerconfigjson',
    })
    const pullSecret = pullSecretResult.data
    return pullSecret
}

export function createClusterInstallConfig(options: ICreateClusterOptions, providerConnection: ProviderConnection) {
    const installConfig: InstallConfig = {
        apiVersion: 'v1',
        metadata: { name: options.clusterName },
        baseDomain: options.baseDomain,
        networking: {
            clusterNetwork: [
                {
                    cidr: options.networking.clusterCidr,
                    hostPrefix: Number(options.networking.hostPrefix),
                },
            ],
            machineCIDR: options.networking.machineCidr,
            networkType: options.networking.networkType,
            serviceNetwork: [options.networking.serviceCidr],
        },
        platform: {
            aws: {
                region: options.region,
            },
        },
        pullSecret: '',
        sshKey: providerConnection.spec!.sshPublickey,
        controlPlane: {
            hyperthreading: 'Enabled',
            name: 'master',
            replicas: 3,
            platform: {
                aws: {
                    type: options.controlPlane.instanceType,
                    rootVolume: {
                        size: options.controlPlane.storage,
                        iops: 4000,
                        type: 'io1',
                    },
                },
            },
        },
        compute: options.workerPools.map((workerPool) => {
            return {
                hyperthreading: 'Enabled',
                name: workerPool.name,
                replicas: workerPool.nodeCount,
                platform: {
                    aws: {
                        rootVolume: { iops: 2000, size: workerPool.storage, type: 'io1' },
                        type: workerPool.instanceType,
                        zones: workerPool.zones,
                    },
                },
            }
        }),
    }
    return installConfig
}

export async function createClusterInstallConfigSecret(options: ICreateClusterOptions, installConfig: InstallConfig) {
    const installConfigSecretResult = await secretMethods.create({
        metadata: { name: `${options.clusterName}-install-config`, namespace: options.clusterName },
        stringData: { 'install-config.yaml': YAML.stringify(installConfig) },
    })
    const installConfigSecret = installConfigSecretResult.data
    return installConfigSecret
}

export async function createClusterSshPrivateKeySecret(
    options: ICreateClusterOptions,
    providerConnection: ProviderConnection
) {
    const sshPrivateKeySecretResult = await secretMethods.create({
        metadata: { name: `${options.clusterName}-ssh-private-key`, namespace: options.clusterName },
        stringData: { 'ssh-privatekey': providerConnection.spec!.sshPrivatekey },
    })
    const sshPrivateKeySecret = sshPrivateKeySecretResult.data
    return sshPrivateKeySecret
}

export async function createClusterProviderCredentialsSecret(
    options: ICreateClusterOptions,
    providerConnection: ProviderConnection
) {
    const providerCredentialsSecretResult = await secretMethods.create({
        metadata: { name: `${options.clusterName}-aws-creds`, namespace: options.clusterName },
        stringData: {
            aws_access_key_id: providerConnection.spec!.awsAccessKeyID!,
            aws_secret_access_key: providerConnection.spec!.awsSecretAccessKeyID!,
        },
    })
    const providerCredentialsSecret = providerCredentialsSecretResult.data
    return providerCredentialsSecret
}

export async function createClusterDeployment(
    options: ICreateClusterOptions,
    pullSecret: V1Secret,
    installConfigSecret: V1Secret,
    sshPrivateKeySecret: V1Secret,
    providerCredentialsSecret: V1Secret
) {
    const clusterDeployentResult = await clusterDeploymentMethods.create({
        apiVersion: 'hive.openshift.io/v1',
        kind: 'ClusterDeployment',
        metadata: {
            name: options.clusterName,
            namespace: options.clusterName,
            labels: {
                vendor: 'OpenShift',
                cloud: 'Amazon',
                region: options.region,
            },
        },
        spec: {
            baseDomain: options.baseDomain,
            clusterName: options.clusterName,
            installed: false,
            platform: {
                aws: {
                    credentialsSecretRef: { name: providerCredentialsSecret.metadata!.name! },
                    region: options.region,
                },
            },
            provisioning: {
                installConfigSecretRef: { name: installConfigSecret.metadata!.name! },
                sshPrivateKeySecretRef: { name: sshPrivateKeySecret.metadata!.name! },
                imageSetRef: { name: options.clusterImageSetName },
            },
            pullSecretRef: { name: pullSecret.metadata!.name! },
        },
    })
    return clusterDeployentResult.data
}

export async function createClusterManagedCluster(options: ICreateClusterOptions) {
    return createManagedCluster({
        clusterName: options.clusterName,
        clusterLabels: {
            cloud: 'Amazon',
            vendor: 'OpenShift',
            name: options.clusterName,
        },
    })
}

export async function createClusterKlusterletAddonConfig(options: ICreateClusterOptions) {
    return createKlusterletAddonConfig({
        clusterName: options.clusterName,
        clusterLabels: {
            cloud: 'Amazon',
            vendor: 'OpenShift',
            name: options.clusterName,
        },
    })
}

export async function createCluster(options: ICreateClusterOptions) {
    let providerConnection: ProviderConnection
    try {
        providerConnection = await getProviderConnection(options)
    } catch (err) {
        throw new Error(
            `create cluster error - get provider connection error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }

    try {
        await createClusterNamespace(options)
    } catch (err) {
        throw new Error(
            `create cluster error - create namespace error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }

    let pullSecret: V1Secret
    try {
        pullSecret = await createClusterPullSecret(options, providerConnection)
    } catch (err) {
        throw new Error(
            `create cluster error - create pull secret error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }

    let installConfig: InstallConfig
    try {
        installConfig = createClusterInstallConfig(options, providerConnection)
    } catch (err) {
        throw new Error(
            `create cluster error - create install config error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }

    let installConfigSecret: V1Secret
    try {
        installConfigSecret = await createClusterInstallConfigSecret(options, installConfig)
    } catch (err) {
        throw new Error(
            `create cluster error - create install config secret error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }

    let sshPrivateKeySecret: V1Secret
    try {
        sshPrivateKeySecret = await createClusterSshPrivateKeySecret(options, providerConnection)
    } catch (err) {
        throw new Error(
            `create cluster error - create ssh private key secret error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }

    let providerCredentialsSecret: V1Secret
    try {
        providerCredentialsSecret = await createClusterProviderCredentialsSecret(options, providerConnection)
    } catch (err) {
        throw new Error(
            `create cluster error - create provider credentials secret error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }

    try {
        await createClusterDeployment(
            options,
            pullSecret,
            installConfigSecret,
            sshPrivateKeySecret,
            providerCredentialsSecret
        )
    } catch (err) {
        throw new Error(
            `create cluster error - create cluster deployment error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }

    try {
        await createClusterManagedCluster(options)
    } catch (err) {
        throw new Error(
            `create cluster error - create managed cluster error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }

    try {
        await createClusterKlusterletAddonConfig(options)
    } catch (err) {
        throw new Error(
            `create cluster error - create klusterlet addon config error  clusterName=${options.clusterName}  error=${err.message}`
        )
    }
}
