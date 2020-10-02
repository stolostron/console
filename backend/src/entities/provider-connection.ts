import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import { IUserContext } from '../lib/user-context'
import { Secret, SecretsService } from './secret'
import * as YAML from 'yamljs'
import { getCoreV1API } from '../lib/kube-api'
import { V1Secret } from '@kubernetes/client-node'

export const ProviderConnectionLabel = 'cluster.open-cluster-management.io/cloudconnection='

class ProviderConnectionService extends SecretsService<ProviderConnection> {
    async query(token: string, fieldSelector?: string, labelSelector?: string): Promise<ProviderConnection[]> {
        const result = await super.query(token, fieldSelector, labelSelector)
        return result.map((providerConnection) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
            const metadata = ((providerConnection.data as unknown) as any).metadata as string
            if (metadata) {
                try {
                    const yaml = Buffer.from(metadata, 'base64').toString('ascii')
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    providerConnection.data = { ...providerConnection.data, ...YAML.parse(yaml) }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
                    delete ((providerConnection.data as unknown) as any).metadata
                } catch {
                    /* Do Nothing */
                }
            }
            return providerConnection
        })
    }

    async createProviderConnection(token: string, input: ProviderConnectionInput): Promise<void> {
        const { name, namespace, providerID } = input
        const secret: V1Secret = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name,
                namespace,
                labels: {
                    'cluster.open-cluster-management.io/cloudconnection': '',
                    'cluster.open-cluster-management.io/provider': providerID,
                },
            },
            stringData: { metadata: YAML.stringify(input.data) },
            type: 'Opaque',
        }
        const coreV1API = getCoreV1API(token)
        await coreV1API.createNamespacedSecret(namespace, secret, undefined)
    }
}
export const providerConnectionService = new ProviderConnectionService()

@ObjectType()
export class ProviderConnectionData {
    @Field({ nullable: true }) // AWS
    awsAccessKeyID?: string

    @Field({ nullable: true }) // AWS
    awsSecretAccessKeyID?: string

    @Field({ nullable: true }) // Azure
    baseDomainResourceGroupName?: string

    @Field({ nullable: true }) // Azure
    clientId?: string

    @Field({ nullable: true }) // Azure
    clientsecret?: string

    @Field({ nullable: true }) // Azure
    subscriptionid?: string

    @Field({ nullable: true }) // Azure
    tenantid?: string

    @Field({ nullable: true }) // GCP
    gcProjectID?: string

    @Field({ nullable: true }) // GCP
    gcServiceAccountKey?: string

    @Field({ nullable: true }) // VMWare
    username?: string

    @Field({ nullable: true }) // VMWare
    password?: string

    @Field({ nullable: true }) // VMWare
    vcenter?: string

    @Field({ nullable: true }) // VMWare
    cacertificate?: string

    @Field({ nullable: true }) // VMWare
    vmClusterName?: string

    @Field({ nullable: true }) // VMWare
    datacenter?: string

    @Field({ nullable: true }) // VMWare
    datastore?: string

    @Field({ nullable: true }) // BMC
    libvirtURI?: string

    // sshKnownHosts

    @Field()
    baseDomain: string

    @Field()
    pullSecret: string

    @Field()
    sshPrivatekey: string

    @Field()
    sshPublickey: string

    @Field({ nullable: true })
    isOcp?: boolean
}

@InputType()
export class ProviderConnectionDataInput {
    @Field({ nullable: true }) // AWS
    awsAccessKeyID?: string

    @Field({ nullable: true }) // AWS
    awsSecretAccessKeyID?: string

    @Field({ nullable: true }) // Azure
    baseDomainResourceGroupName?: string

    @Field({ nullable: true }) // Azure
    clientId?: string

    @Field({ nullable: true }) // Azure
    clientsecret?: string

    @Field({ nullable: true }) // Azure
    subscriptionid?: string

    @Field({ nullable: true }) // Azure
    tenantid?: string

    @Field({ nullable: true }) // GCP
    gcProjectID?: string

    @Field({ nullable: true }) // GCP
    gcServiceAccountKey?: string

    @Field({ nullable: true }) // VMWare
    username?: string

    @Field({ nullable: true }) // VMWare
    password?: string

    @Field({ nullable: true }) // VMWare
    vcenter?: string

    @Field({ nullable: true }) // VMWare
    cacertificate?: string

    @Field({ nullable: true }) // VMWare
    vmClusterName?: string

    @Field({ nullable: true }) // VMWare
    datacenter?: string

    @Field({ nullable: true }) // VMWare
    datastore?: string

    @Field({ nullable: true }) // BMC
    libvirtURI?: string

    @Field()
    baseDomain: string

    @Field()
    pullSecret: string

    @Field()
    sshPrivatekey: string

    @Field()
    sshPublickey: string

    @Field({ nullable: true })
    isOcp?: boolean
}

@InputType()
export class ProviderConnectionInput {
    @Field()
    name: string

    @Field()
    namespace: string

    @Field()
    providerID: 'aws' | 'azr' | 'gke' | 'vmw' | 'bmc'

    @Field((type) => ProviderConnectionDataInput)
    data: ProviderConnectionDataInput
}

@ObjectType()
export class ProviderConnection extends Secret {
    @Field((type) => ProviderConnectionData)
    data: ProviderConnectionData
}

@Resolver(/* istanbul ignore next */ (of) => ProviderConnection)
export class ProviderConnectionsResolver {
    @Query((returns) => [ProviderConnection])
    async providerConnections(@Ctx() userContext: IUserContext): Promise<ProviderConnection[]> {
        const result = await providerConnectionService.query(userContext.token, undefined, ProviderConnectionLabel)
        return result
    }

    @Mutation((returns) => Boolean, { nullable: true })
    createProviderConnection(
        @Ctx() userContext: IUserContext,
        @Arg('input') input: ProviderConnectionInput
    ): Promise<void> {
        return providerConnectionService.createProviderConnection(userContext.token, input)
    }

    @Mutation((returns) => Boolean, { nullable: true })
    deleteProviderConnection(
        @Ctx() userContext: IUserContext,
        @Arg('name') name: string,
        @Arg('namespace') namespace: string
    ): Promise<boolean> {
        return providerConnectionService.delete(userContext.token, name, namespace)
    }
}
