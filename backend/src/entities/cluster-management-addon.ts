import { Arg, Ctx, Field, ObjectType, Query, Resolver } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { IUserContext } from '../lib/user-context'
import { Resource } from './common/resource'

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
    decription: string

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
}

@Resolver(/* istanbul ignore next */ (of) => ClusterManagementAddOn)
export class ClusterManagementAddOnResolver {
    @Query((returns) => [ClusterManagementAddOn])
    clusterManagementAddOns(
        @Ctx() userContext: IUserContext,
        @Arg('fieldSelector', { nullable: true }) fieldSelector?: string,
        @Arg('labelSelector', { nullable: true }) labelSelector?: string
    ): Promise<ClusterManagementAddOn[]> {
        return clusterManagementAddOnService.query(userContext.token, fieldSelector, labelSelector)
    }
}
