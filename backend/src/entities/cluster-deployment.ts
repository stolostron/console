import { V1Namespace, V1ObjectMeta } from '@kubernetes/client-node'
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import * as YAML from 'yamljs'
import { CustomObjectService } from '../lib/custom-object-service'
import { getCoreV1API } from '../lib/kube-api'
import { logError } from '../lib/logger'
import { IUserContext } from '../lib/user-context'
import { InstallConfig } from './install-config'
import { klusterletAddonConfigService, KlusterletAddonConfigSpec } from './klusterlet-addon-config'
import { machinePoolService, MachinePoolSpec } from './machine-pool'
import { managedClusterService, ManagedClusterSpec } from './managed-cluster'
import { Resource, ResourceRef } from './common/resource'
import { ProviderConnectionLabel, providerConnectionService } from './provider-connection'
import { secretService } from './secret'

class ClusterDeploymentsService extends CustomObjectService<ClusterDeployment> {
    async createClusterDeployment(token: string, input: ClusterDeploymentInput): Promise<boolean> {
        const coreV1API = getCoreV1API(token)

        // Provider Connection Secret
        const providerConnections = await providerConnectionService.query(
            token,
            `metadata.name=${input.providerConnectionName}`,
            ProviderConnectionLabel
        )
        if (providerConnections.length === 0) {
            throw new Error(`Provider connection ${input.providerConnectionName} not found`)
        }
        const providerConnection = providerConnections[0]

        // Namespace
        const namespace: V1Namespace = {
            metadata: {
                namespace: input.clusterName,
                labels: { 'cluster.open-cluster-management.io/managedCluster': input.clusterName },
            },
        }
        try {
            await coreV1API.createNamespace(namespace)
        } catch (err) {
            logError('create namespace error', err)
            // throw new Error(`Namespace ${clusterNamespace} is terminating. Wait until it is terminated or use a different namespace.`);
            // throw new Error(`A ManagedCluster of the name "${clusterNamespace}" already exists.`);
            // throw new Error(`Namespace "${clusterNamespace}" already contains a ClusterDeployment resource`);
            throw err
        }

        // Pull Secret
        const pullSecret = await secretService.createSecret(token, {
            name: `${input.clusterName}-pull-secret`,
            namespace: input.clusterName,
            stringData: { '.dockerconfigjson': providerConnection.data.pullSecret },
            type: 'kubernetes.io/dockerconfigjson',
        })

        // Install Config
        const installConfig: InstallConfig = {
            apiVersion: 'v1',
            metadata: { name: input.clusterName },
            baseDomain: input.clusterName,
            controlPlane: {
                hyperthreading: 'Enabled',
                name: 'master',
                replicas: 3,
                platform: { aws: { rootVolume: { iops: 4000, size: 100, type: 'io1' }, type: 'm5.xlarge' } },
            },
            compute: [
                {
                    hyperthreading: 'Enabled',
                    name: 'worker',
                    replicas: 1,
                    platform: { aws: { rootVolume: { iops: 2000, size: 100, type: 'io1' }, type: 'm5.xlarge' } },
                },
            ],
            networking: {
                clusterNetwork: [{ cidr: '10.128.0.0/14', hostPrefix: 23 }],
                machineCIDR: '10.0.0.0/16',
                networkType: 'OVNKubernetes',
                serviceNetwork: ['172.30.0.0/16'],
            },
            platform: { aws: { region: 'us-east-1' } },
            pullSecret: '',
            sshKey: providerConnection.data.sshPublickey,
        }

        // Install Config Secret
        const installConfigSecret = await secretService.createSecret(token, {
            name: `${input.clusterName}-install-config`,
            namespace: input.clusterName,
            stringData: { 'install-config.yaml': YAML.stringify(installConfig) },
        })

        // SSH Private Key Secret
        const sshPrivatekeySecret = await secretService.createSecret(token, {
            name: `${input.clusterName}-ssh-private-key`,
            namespace: input.clusterName,
            stringData: { 'ssh-privatekey': providerConnection.data.sshPrivatekey },
        })

        // Provider Credentials Secret
        const providerCredentialsSecret = await secretService.createSecret(token, {
            name: `${input.clusterName}-aws-creds`,
            namespace: input.clusterName,
            stringData: {
                aws_access_key_id: providerConnection.data.awsAccessKeyID,
                aws_secret_access_key: providerConnection.data.awsSecretAccessKeyID,
            },
        })

        // Cluster Deployment
        await super.create(token, {
            metadata: {
                name: input.clusterName,
                namespace: input.clusterName,
                labels: { cloud: 'AWS', region: 'us-east-1', vendor: 'OpenShift' },
            } as V1ObjectMeta,
            spec: {
                baseDomain: input.baseDomain,
                clusterName: input.clusterName,
                installed: false,
                platform: {
                    aws: {
                        credentialsSecretRef: { name: providerCredentialsSecret.metadata.name },
                        region: 'us-east-1',
                    },
                },
                provisioning: {
                    installConfigSecretRef: { name: installConfigSecret.metadata.name },
                    sshPrivateKeySecretRef: { name: sshPrivatekeySecret.metadata.name },
                    imageSetRef: { name: input.clusterImageSetName },
                },
                pullSecretRef: { name: pullSecret.metadata.name },
            } as ClusterDeploymentSpec,
        })

        // Machine Pool
        await machinePoolService.create(token, {
            metadata: { name: `${input.clusterName}-worker`, namespace: input.clusterName } as V1ObjectMeta,
            spec: {
                name: 'worker',
                platform: { aws: { rootVolume: { iops: 100, size: 100, type: 'gp2' }, type: 'm5.xlarge' } },
                replicas: 1,
                clusterDeploymentRef: { name: input.clusterName },
            } as MachinePoolSpec,
        })

        // Managed Cluster
        await managedClusterService.create(token, {
            metadata: {
                name: input.clusterName,
                labels: { cloud: 'Amazon', name: input.clusterName, vendor: 'OpenShift' },
            },
            spec: { hubAcceptsClient: 'true' } as Partial<ManagedClusterSpec>,
        })

        // Klusterlet Addon Config
        await klusterletAddonConfigService.create(token, {
            metadata: { name: input.clusterName, namespace: input.clusterName } as V1ObjectMeta,
            spec: {
                clusterName: input.clusterName,
                clusterNamespace: input.clusterName,
                clusterLabels: { cloud: 'Amazon', vendor: 'OpenShift' },
                applicationManager: { enabled: true },
                policyController: { enabled: true },
                searchCollector: { enabled: true },
                certPolicyController: { enabled: true },
                iamPolicyController: { enabled: true },
                version: '2.1.0',
            } as KlusterletAddonConfigSpec,
        })

        return true
    }
}
export const clusterDeploymentsService = new ClusterDeploymentsService({
    group: 'hive.openshift.io',
    version: 'v1',
    plural: 'clusterdeployments',
})

@ObjectType()
export class ClusterDeploymentNodePoolInput {
    @Field() // AWS, GCP, AZR
    poolName: string

    @Field((type) => [String]) // AWS, AZR
    zones: string[]

    @Field() // AWS, GCP, AZR
    instanceType: string

    @Field() // AWS, GCP, AZR, VMW
    nodeCount: number

    @Field() // AWS, AZR, VMW
    rootStorage: number

    @Field() // VMW
    coresPerSocket: number

    @Field() // VMW
    cpus: number

    @Field() // VMW
    memory: number
}

@InputType()
export class ClusterDeploymentInput {
    @Field()
    clusterName: string

    @Field()
    providerName: string

    @Field()
    providerConnectionName: string

    @Field()
    clusterImageSetName: string

    @Field()
    baseDomain: string

    @Field()
    networkType: string

    @Field()
    clusterNetworkCidr: string

    @Field()
    networkHostPrefix: string

    @Field()
    serviceNetworkCidr: string

    @Field()
    machineCidr: string

    @Field()
    provisioningNetworkCidr: string

    @Field()
    provisioningNetworkInterface: string

    @Field()
    provisioningNetworkBridge: string

    @Field()
    externalNetworkBridge: string

    @Field()
    apiVip: string

    @Field()
    ingressVip: string

    @Field((type) => [ClusterDeploymentNodePoolInput])
    nodePools: ClusterDeploymentNodePoolInput[]

    @Field((type) => [String])
    labels: string[]
}

@ObjectType()
class ClusterDeploymentClusterMetadata {
    @Field((type) => ResourceRef)
    adminKubeconfigSecretRef: ResourceRef

    @Field((type) => ResourceRef)
    adminPasswordSecretRef: ResourceRef

    @Field()
    clusterID: string

    @Field()
    infraID: string
}

@ObjectType()
class ClusterDeploymentProvisioning {
    @Field((type) => ResourceRef)
    imageSetRef: ResourceRef

    @Field((type) => ResourceRef)
    installConfigSecretRef: ResourceRef

    @Field((type) => ResourceRef)
    sshPrivateKeySecretRef: ResourceRef
}

@ObjectType()
class ClusterDeploymentPlatformAws {
    @Field((type) => ResourceRef)
    credentialsSecretRef: ResourceRef

    @Field()
    region: string
}

@ObjectType()
class ClusterDeploymentPlatform {
    @Field((type) => ClusterDeploymentPlatformAws)
    aws: ClusterDeploymentPlatformAws
}

@ObjectType()
class ClusterDeploymentSpec {
    @Field()
    clusterName: string

    @Field()
    baseDomain: string

    @Field()
    installed: boolean

    @Field((type) => ClusterDeploymentClusterMetadata)
    clusterMetadata?: ClusterDeploymentClusterMetadata

    @Field((type) => ClusterDeploymentPlatform)
    platform: ClusterDeploymentPlatform

    @Field((type) => ClusterDeploymentProvisioning)
    provisioning: ClusterDeploymentProvisioning

    @Field((type) => ResourceRef)
    pullSecretRef: ResourceRef
}

@ObjectType()
export class ClusterDeployment extends Resource {
    spec: ClusterDeploymentSpec
    status: {
        apiURL: string
        cliImage: string
        clusterVersionStatus: {
            availableUpdates: {
                force: boolean
                image: string
                version: string
            }[]
            conditions: {
                lastTransitionTime: string
                message: string
                status: string
                type: string
            }[]
            desired: {
                force: boolean
                image: string
                version: string
            }
            history: {
                completionTime: string
                image: string
                startedTime: string
                state: string
                verified: boolean
                version: string
            }[]
            observedGeneration: number
            versionHash: string
        }
        conditions: {
            lastProbeTime: string
            lastTransitionTime: string
            message: string
            reason: string
            status: string
            type: string
        }[]
        installedTimestamp: string
        installerImage: string
        provisionRef: {
            name: string
        }
        webConsoleURL: string
    }
}

@Resolver(/* istanbul ignore next */ (of) => ClusterDeployment)
export class ClusterDeploymentResolver {
    @Query((returns) => [ClusterDeployment])
    async clusterDeployments(
        @Ctx() userContext: IUserContext,
        @Arg('fieldSelector', { nullable: true }) fieldSelector?: string,
        @Arg('labelSelector', { nullable: true }) labelSelector?: string
    ): Promise<ClusterDeployment[]> {
        return clusterDeploymentsService.query(userContext.token, fieldSelector, labelSelector)
    }

    @Mutation((returns) => Boolean)
    createClusterDeployment(
        @Ctx() userContext: IUserContext,
        @Arg('input') input: ClusterDeploymentInput
    ): Promise<boolean> {
        return clusterDeploymentsService.createClusterDeployment(userContext.token, input)
    }
}
