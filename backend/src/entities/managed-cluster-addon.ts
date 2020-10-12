import { Arg, Ctx, Field, FieldResolver, ObjectType, Query, Resolver, Root } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { IUserContext } from '../lib/user-context'
import { Condition } from './common/condition'
import { Resource } from './common/resource'

export const managedClusterAddOnService = new CustomObjectService<ManagedClusterAddOn>({
    group: 'addon.open-cluster-management.io',
    version: 'v1alpha1',
    plural: 'managedclusteraddons',
})

@ObjectType()
export class ObjectReference {
    @Field()
    group: string

    @Field()
    resource: string

    @Field()
    name: string
}

@ObjectType()
export class AddOnMeta {
    @Field()
    description: string

    @Field()
    displayName: string
}

@ObjectType()
export class AddOnConfigutation {
    @Field()
    crName: string

    @Field()
    crdName: string
}

@ObjectType()
export class ManagedClusterAddOnStatus {
    @Field((type) => [Condition])
    conditions: Condition[]

    @Field((type) => ObjectReference)
    relatedObjects: ObjectReference

    @Field()
    addOnMeta: AddOnMeta

    @Field()
    addOnConfiguration: AddOnConfigutation
}


@ObjectType()
export class ManagedClusterAddOn extends Resource {
    @Field({ defaultValue: "Disabled"})
    displayAddOnStatus: string

    @Field({ nullable: true })
    status: ManagedClusterAddOnStatus
}

@Resolver(/* istanbul ignore next */ (of) => ManagedClusterAddOn)
export class ManagedClusterAddOnResolver {
    @Query((returns) => [ManagedClusterAddOn])
    managedClusterAddOns(
        @Ctx() userContext: IUserContext,
      //  @Arg('namespace', { nullable: true, defaultValue: "leena-ocp" }) namespace?: string,
    ): Promise<ManagedClusterAddOn[]> {
        return managedClusterAddOnService.query(userContext.token)
    }

    @FieldResolver()
    displayAddOnStatus(@Root() managedClusterAddOn: ManagedClusterAddOn): string {
        if (managedClusterAddOn?.status?.conditions === undefined) {
            return 'Unknown'
        }
        const managedClusterAddOnConditionDegraded = managedClusterAddOn.status.conditions.find(
            (condition) => condition.type === 'Degraded'
        )
        if (managedClusterAddOnConditionDegraded?.status === 'True') {
            return 'Degraded'
        } 
        const managedClusterAddOnConditionProgressing = managedClusterAddOn.status.conditions.find(
            (condition) => condition.type === 'Progressing'
        )
        if (managedClusterAddOnConditionProgressing?.status === 'True') {
            return 'Progressing'
        }
        const  managedClusterAddOnConditionAvailable = managedClusterAddOn.status.conditions.find(
            (condition) => condition.type === 'Available'
        )   
        if (managedClusterAddOnConditionAvailable?.status === 'True') {
            return 'Available'
        }
        if ((managedClusterAddOnConditionAvailable?.status === 'False') && (managedClusterAddOnConditionProgressing?.status === 'False') && (managedClusterAddOnConditionDegraded?.status === 'False')) {
            return 'Progressing'
        }
    }
}