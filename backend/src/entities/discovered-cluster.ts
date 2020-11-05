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
    group: 'operator.open-cluster-management.io',
    version: 'v1',
})

@ObjectType()
export class DiscoveredClusterInfo {
    @Field()
    activity_timestamp: string

    @Field()
    apiUrl: string

    @Field()
    cloudProvider: string

    @Field()
    console: string

    @Field()
    healthState: string

    @Field()
    managed: boolean

    @Field()
    name: string

    @Field()
    openshiftVersion: string

    @Field()
    product: string

    @Field()
    region: string

    @Field()
    state: string

    @Field()
    status: string

    @Field()
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
    async discoveredCluster(
        @Ctx() userContext: IUserContext,
        @Arg('fieldSelector', { nullable: true }) fieldSelector?: string,
        @Arg('labelSelector', { nullable: true }) labelSelector?: string
    ): Promise<DiscoveredCluster[]> {
        return discoveredClusterService.query(userContext.token, fieldSelector, labelSelector)
    }
}
