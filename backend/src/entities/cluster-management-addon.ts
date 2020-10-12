import { Arg, Ctx, Field, FieldResolver, ObjectType, Query, Resolver, Root } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { IUserContext } from '../lib/user-context'
import { Resource } from './common/resource'
import { ManagedClusterAddOn, managedClusterAddOnService } from './managed-cluster-addon'
import { ManagedCluster, managedClusterService } from './managed-cluster'

export const clusterManagementAddOnService = new CustomObjectService<ClusterManagementAddOn>({
    group: 'addon.open-cluster-management.io',
    version: 'v1alpha1',
    plural: 'clustermanagementaddons',
})

@ObjectType()
export class ClusterManagementAddOnConfigutation {
    @Field()
    crName: string

    @Field()
    crdName: string
}

@ObjectType()
export class ClusterManagementAddOnMeta {
    @Field()
    description: string

    @Field()
    displayName: string
}

@ObjectType()
export class ClusterManagementAddOnSpec {
    @Field()
    addOnConfiguration: ClusterManagementAddOnConfigutation

    @Field()
    addOnMeta: ClusterManagementAddOnMeta
}

@ObjectType()
export class ClusterManagementAddOn extends Resource {
    @Field()
    spec: ClusterManagementAddOnSpec

    // @Field((type) => ManagedClusterAddOn, { nullable: true})
    // managedClusterAddon: ManagedClusterAddOn
}

@Resolver(/* istanbul ignore next */ (of) => ClusterManagementAddOn)
export class ClusterManagementAddOnResolver {
    @Query((returns) => [ClusterManagementAddOn])
    clusterManagementAddOns(
        @Ctx() userContext: IUserContext,
        
    ): Promise<ClusterManagementAddOn[]> {
        return clusterManagementAddOnService.query(userContext.token)
    }

    //@Query((returns) => ManagedClusterAddOn)
    // @FieldResolver()
    // managedClusterAddon(
    //     @Root() clusterManagementAddOn: ClusterManagementAddOn,
    //     @Root() managedCluster: ManagedCluster,
    //     @Ctx() userContext: IUserContext,
    // ): Promise<ManagedClusterAddOn> {
    //     return managedClusterAddOnService.get(
    //         userContext.token,
    //         clusterManagementAddOn.metadata.name,
    //         managedCluster.metadata.name,
    //     )
        

    //       // return managedClusterInfoService.get(
    //     //     userContext.token,
    //     //     managedCluster.metadata.name,
    //     //     managedCluster.metadata.name
    //     // )
     //}


    // managedClusterAddon(
    //     @Root() clusterManagementAddOn: ClusterManagementAddOn, 
    //     @Ctx() userContext: IUserContext,
    //     @Arg('namespace', { nullable: true }) namespace?: string
    // ): Promise<ManagedClusterAddOn[]> {
    //     namespace="leena-ocp"
    //     if (namespace) {
    //         return managedClusterAddOnService.query(
    //             userContext.token,
    //             `metadata.name=${clusterManagementAddOn.metadata.name},metadata.namespace=${namespace},`
    //         )
    //     } else {
    //         return managedClusterAddOnService.query(
    //             userContext.token,
    //             `metadata.name=${clusterManagementAddOn.metadata.name}`
    //         )
    //     }
    // }
}

