import { Arg, Ctx, Field, FieldResolver, ObjectType, Query, Resolver, Root } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { IUserContext } from '../lib/user-context'
import { Capacity } from './common/capacity'
import { Condition } from './common/condition'
import { ManagedClusterInfo, managedClusterInfoService } from './managed-cluster-info'
import { Resource } from './common/resource'

export const managedClusterService = new CustomObjectService<ManagedCluster>({
    plural: 'managedclusters',
    group: 'cluster.open-cluster-management.io',
    version: 'v1',
})

@ObjectType()
export class ManagedClusterVersion {
    @Field({ nullable: true })
    kubernetes: string
}

@ObjectType()
export class ManagedClusterStatus {
    @Field((type) => Capacity, { nullable: true })
    allocatable: Capacity

    @Field((type) => Capacity, { nullable: true })
    capacity: Capacity

    @Field((type) => [Condition])
    conditions: Condition[]

    @Field((type) => ManagedClusterVersion)
    version: ManagedClusterVersion
}

@ObjectType()
export class ManagedClusterSpec {
    @Field()
    hubAcceptsClient: string

    @Field((type) => Number)
    leaseDurationSeconds: number
}

@ObjectType()
export class ManagedCluster extends Resource {
    @Field()
    spec: ManagedClusterSpec

    @Field()
    displayStatus: string

    @Field({ nullable: true })
    status: ManagedClusterStatus

    @Field((type) => ManagedClusterInfo, { nullable: true })
    info: ManagedClusterInfo
}

@Resolver((of) => ManagedCluster)
export class ManagedClusterResolver {
    @Query((returns) => [ManagedCluster])
    async managedClusters(
        @Ctx() userContext: IUserContext,
        @Arg('fieldSelector', { nullable: true }) fieldSelector?: string,
        @Arg('labelSelector', { nullable: true }) labelSelector?: string
    ): Promise<ManagedCluster[]> {
        return managedClusterService.query(userContext.token, fieldSelector, labelSelector)
    }

    @FieldResolver()
    info(@Root() managedCluster: ManagedCluster, @Ctx() userContext: IUserContext): Promise<ManagedClusterInfo> {
        return managedClusterInfoService.get(
            userContext.token,
            managedCluster.metadata.name,
            managedCluster.metadata.name
        )
    }

    // @FieldResolver()
    // deployment(@Root() managedCluster: ManagedCluster, @Ctx() userContext: IUserContext): Promise<ManagedClusterInfo> {
    //     return clusterDeploymentService.get(
    //         userContext.token,
    //         managedCluster.metadata.name,
    //         managedCluster.metadata.name
    //     )
    // }

    // @FieldResolver()
    // addons(@Root() managedCluster: ManagedCluster, @Ctx() userContext: IUserContext): Promise<ManagedClusterInfo> {
    //     return addonService.get(
    //         userContext.token,
    //         managedCluster.metadata.name,
    //         managedCluster.metadata.name
    //     )
    // }

    @FieldResolver()
    displayStatus(@Root() managedCluster: ManagedCluster): string {
        if (managedCluster?.status?.conditions === undefined) {
            return 'Unknown'
        }
        const managedClusterConditionAvailable = managedCluster.status.conditions.find(
            (condition) => condition.type === 'ManagedClusterConditionAvailable'
        )
        if (managedClusterConditionAvailable?.status === 'True') {
            return 'Ready'
        } else {
            const HubAcceptedManagedCluster = managedCluster.status.conditions.find(
                (condition) => condition.type === 'HubAcceptedManagedCluster'
            )
            if (HubAcceptedManagedCluster?.status === 'True') {
                const ManagedClusterJoined = managedCluster.status.conditions.find(
                    (condition) => condition.type === 'ManagedClusterJoined'
                )
                if (ManagedClusterJoined?.status === 'True') {
                    return 'Offline'
                } else {
                    return 'Pending import'
                }
            } else {
                return 'Pending'
            }
        }
    }
}
