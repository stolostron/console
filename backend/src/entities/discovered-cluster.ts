import { Arg, Ctx, Field, FieldResolver, ObjectType, Query, Resolver, Root } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { IUserContext } from '../lib/user-context'
import { Capacity } from './common/capacity'
import { Condition } from './common/condition'
import { ManagedClusterInfo, managedClusterInfoService } from './managed-cluster-info'
import { Resource } from './common/resource'
import { Metadata } from './common/metadata'

export const discoveredClusterService = new CustomObjectService<DiscoveredCluster>({
    plural: 'discoveredclusters',
    group: 'discovery.open-cluster-management.io',
    version: 'v1',
})

@ObjectType()
export class DiscoveredClusterInfo {
    @Field({ nullable: true })
    activity_timestamp: string

    @Field({ nullable: true })
    apiUrl: string

    @Field({ nullable: true })
    cloudProvider: string

    @Field({ nullable: true })
    console: string

    @Field({ nullable: true })
    healthState: string

    @Field({ nullable: true })
    managed: boolean

    @Field({ nullable: true })
    name: string

    @Field({ nullable: true })
    openshiftVersion: string

    @Field({ nullable: true })
    product: string

    @Field({ nullable: true })
    region: string

    @Field({ nullable: true })
    state: string

    @Field({ nullable: true })
    status: string

    @Field({ nullable: true })
    support_level: string

    @Field({ nullable: true })
    creation_timestamp: string
}

@ObjectType()
export class DiscoveredCluster extends Resource {
    @Field()
    info: DiscoveredClusterInfo

    @Field()
    metadata: Metadata
}

@Resolver((of) => DiscoveredCluster)
export class DiscoveredClusterResolver {
    @Query((returns) => [DiscoveredCluster])
    async discoveredClusters(
        @Ctx() userContext: IUserContext,
        @Arg('fieldSelector', { nullable: true }) fieldSelector?: string,
        @Arg('labelSelector', { nullable: true }) labelSelector?: string
    ): Promise<DiscoveredCluster[]> {
        return discoveredClusterService.query(userContext.token, fieldSelector, labelSelector)
    }
}
