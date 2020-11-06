import { V1Secret } from '@kubernetes/client-node'
import * as YAML from 'yamljs'
import { InstallConfig } from '../resources/install-config'
import { ProjectRequestApiVersion, ProjectRequestKind, projectRequestMethods } from '../resources/project'
import { providerConnectionMethods, ProviderConnection } from '../resources/provider-connection'
import { ClusterDeployment } from '../resources/cluster-deployment'
import { SecretApiVersion, SecretKind, secretMethods } from '../resources/secret'
import { clusterDeploymentMethods } from '../resources/cluster-deployment'
import { createManagedCluster } from '../resources/managed-cluster'
import { createKlusterletAddonConfig } from '../resources/klusterlet-add-on-config'
import { ClusterCurator } from '../resources/cluster-curator'

export async function getProviderConnection(curator: ClusterCurator) {
    let providerConnectionResult = await providerConnectionMethods.get(
        curator.spec.job.providerConnection.name,
        curator.spec.job.providerConnection.name
    )
    const providerConnection = providerConnectionResult.data
    return providerConnection
}

export async function createClusterNamespace(curator: ClusterCurator) {
    let projectResult = await projectRequestMethods.create({
        apiVersion: ProjectRequestApiVersion,
        kind: ProjectRequestKind,
        metadata: { name: curator.metadata.namespace },
    })
    return projectResult.data
}

export async function createClusterPullSecret(curator: ClusterCurator, providerConnection: ProviderConnection) {
    const pullSecretResult = await secretMethods.create({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: { name: `${curator.metadata.name}-pull-secret`, namespace: curator.metadata.namespace },
        stringData: { '.dockerconfigjson': providerConnection.spec!.pullSecret },
        type: 'kubernetes.io/dockerconfigjson',
    })
    const pullSecret = pullSecretResult.data
    return pullSecret
}

export function createClusterInstallConfig(curator: ClusterCurator, providerConnection: ProviderConnection) {
    const job = curator.spec.job
    const installConfig: InstallConfig = {
        apiVersion: 'v1',
        metadata: { name: curator.metadata.name },
        platform: {},
        networking: {
            clusterNetwork: [
                {
                    cidr: job.networking?.clusterCidr ?? '10.128.0.0/14',
                    hostPrefix: job.networking?.hostPrefix ?? 23,
                },
            ],
            machineCIDR: job.networking?.machineCidr ?? '10.0.0.0/16',
            networkType: job.networking?.networkType ?? 'OvnKubernetes',
            serviceNetwork: [job.networking?.serviceCidr ?? '172.30.0.0/16'],
        },
        pullSecret: '',
        sshKey: providerConnection.spec!.sshPublickey,
    }

    if (job.aws) {
        installConfig.baseDomain = job.aws?.baseDomain
        installConfig.platform.aws = {
            region: job.aws.region,
        }
        installConfig.controlPlane = {
            hyperthreading: 'Enabled',
            name: 'master',
            replicas: 3,
            platform: {
                aws: {
                    type: job.aws.controlPlane.instanceType,
                    rootVolume: {
                        size: job.aws.controlPlane.storage ?? 100,
                        iops: job.aws.controlPlane.iops ?? 4000,
                        type: 'io1',
                    },
                },
            },
        }
        installConfig.compute = job.aws.workerPools.map((workerPool) => {
            return {
                hyperthreading: 'Enabled',
                name: workerPool.name,
                replicas: workerPool.nodeCount,
                platform: {
                    aws: {
                        rootVolume: {
                            iops: 2000,
                            size: workerPool.storage,
                            type: 'io1',
                        },
                        type: workerPool.instanceType,
                        zones: workerPool.zones,
                    },
                },
            }
        })
    }

    return installConfig
}

export async function createClusterInstallConfigSecret(options: ClusterCurator, installConfig: InstallConfig) {
    const installConfigSecretResult = await secretMethods.create({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: { name: `${options.metadata.name}-install-config`, namespace: options.metadata.namespace },
        stringData: { 'install-config.yaml': YAML.stringify(installConfig) },
    })
    const installConfigSecret = installConfigSecretResult.data
    return installConfigSecret
}

export async function createClusterSshPrivateKeySecret(
    options: ClusterCurator,
    providerConnection: ProviderConnection
) {
    const sshPrivateKeySecretResult = await secretMethods.create({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: { name: `${options.metadata.name}-ssh-private-key`, namespace: options.metadata.namespace },
        stringData: { 'ssh-privatekey': providerConnection.spec!.sshPrivatekey },
    })
    const sshPrivateKeySecret = sshPrivateKeySecretResult.data
    return sshPrivateKeySecret
}

export async function createClusterProviderCredentialsSecret(
    options: ClusterCurator,
    providerConnection: ProviderConnection
) {
    const providerCredentialsSecretResult = await secretMethods.create({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: { name: `${options.metadata.name}-aws-creds`, namespace: options.metadata.namespace },
        stringData: {
            aws_access_key_id: providerConnection.spec!.awsAccessKeyID!,
            aws_secret_access_key: providerConnection.spec!.awsSecretAccessKeyID!,
        },
    })
    const providerCredentialsSecret = providerCredentialsSecretResult.data
    return providerCredentialsSecret
}

export async function createClusterDeployment(
    options: ClusterCurator,
    pullSecret: V1Secret,
    installConfigSecret: V1Secret,
    sshPrivateKeySecret: V1Secret,
    providerCredentialsSecret: V1Secret
) {
    const clusterDeployment: ClusterDeployment = {
        apiVersion: 'hive.openshift.io/v1',
        kind: 'ClusterDeployment',
        metadata: {
            name: options.metadata.name,
            namespace: options.metadata.namespace,
            labels: {
                vendor: 'OpenShift',
                cloud: 'Amazon',
            },
        },
        spec: {
            clusterName: options.metadata.name,
            installed: false,
            provisioning: {
                installConfigSecretRef: { name: installConfigSecret.metadata!.name! },
                sshPrivateKeySecretRef: { name: sshPrivateKeySecret.metadata!.name! },
                imageSetRef: { name: options.spec.job.imageSetName },
            },
            pullSecretRef: { name: pullSecret.metadata!.name! },
        },
    }

    if (options.spec.job.aws) {
        clusterDeployment.metadata.labels!.cloud = 'Amazon'
        clusterDeployment.metadata.labels!.region = options.spec.job.aws.region
        clusterDeployment.spec.baseDomain = options.spec.job.aws.baseDomain
        clusterDeployment.spec.platform = {
            aws: {
                credentialsSecretRef: { name: providerCredentialsSecret.metadata!.name! },
                region: options.spec.job.aws.region,
            },
        }
    }

    const clusterDeployentResult = await clusterDeploymentMethods.create(clusterDeployment)
    return clusterDeployentResult.data
}

export async function createClusterManagedCluster(options: ClusterCurator) {
    return createManagedCluster({
        clusterName: options.metadata.name,
        clusterLabels: {
            cloud: 'Amazon',
            vendor: 'OpenShift',
            name: options.metadata.name,
        },
    })
}

export async function createClusterKlusterletAddonConfig(options: ClusterCurator) {
    return createKlusterletAddonConfig({
        clusterName: options.metadata.name,
        clusterLabels: {
            cloud: 'Amazon',
            vendor: 'OpenShift',
            name: options.metadata.name,
        },
    })
}

export async function createCluster(options: ClusterCurator) {
    let providerConnection: ProviderConnection
    try {
        providerConnection = await getProviderConnection(options)
    } catch (err) {
        throw new Error(
            `create cluster error - get provider connection error  clusterName=${options.metadata.name}  error=${err.message}`
        )
    }

    try {
        await createClusterNamespace(options)
    } catch (err) {
        throw new Error(
            `create cluster error - create namespace error  clusterName=${options.metadata.name}  error=${err.message}`
        )
    }

    let pullSecret: V1Secret
    try {
        pullSecret = await createClusterPullSecret(options, providerConnection)
    } catch (err) {
        throw new Error(
            `create cluster error - create pull secret error  clusterName=${options.metadata.name}  error=${err.message}`
        )
    }

    let installConfig: InstallConfig
    try {
        installConfig = createClusterInstallConfig(options, providerConnection)
    } catch (err) {
        throw new Error(
            `create cluster error - create install config error  clusterName=${options.metadata.name}  error=${err.message}`
        )
    }

    let installConfigSecret: V1Secret
    try {
        installConfigSecret = await createClusterInstallConfigSecret(options, installConfig)
    } catch (err) {
        throw new Error(
            `create cluster error - create install config secret error  clusterName=${options.metadata.name}  error=${err.message}`
        )
    }

    let sshPrivateKeySecret: V1Secret
    try {
        sshPrivateKeySecret = await createClusterSshPrivateKeySecret(options, providerConnection)
    } catch (err) {
        throw new Error(
            `create cluster error - create ssh private key secret error  clusterName=${options.metadata.name}  error=${err.message}`
        )
    }

    let providerCredentialsSecret: V1Secret
    try {
        providerCredentialsSecret = await createClusterProviderCredentialsSecret(options, providerConnection)
    } catch (err) {
        throw new Error(
            `create cluster error - create provider credentials secret error  clusterName=${options.metadata.name}  error=${err.message}`
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
            `create cluster error - create cluster deployment error  clusterName=${options.metadata.name}  error=${err.message}`
        )
    }

    try {
        await createClusterManagedCluster(options)
    } catch (err) {
        throw new Error(
            `create cluster error - create managed cluster error  clusterName=${options.metadata.name}  error=${err.message}`
        )
    }

    try {
        await createClusterKlusterletAddonConfig(options)
    } catch (err) {
        throw new Error(
            `create cluster error - create klusterlet addon config error  clusterName=${options.metadata.name}  error=${err.message}`
        )
    }
}
