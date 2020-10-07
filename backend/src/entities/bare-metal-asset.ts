import { Arg, Ctx, Field, ObjectType, Query, Resolver } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { IUserContext } from '../lib/user-context'
import { Resource } from './common/resource'

export const bareMetalAssetService = new CustomObjectService<BareMetalAsset>({
    plural: 'baremetalassets',
    group: 'inventory.open-cluster-management.io',
    version: 'v1alpha1',
})

@ObjectType()
export class BareMetalAssetSpecBmc {
    @Field()
    address: string

    @Field()
    credentialsName: string
}

@ObjectType()
export class BareMetalAssetSpec {
    @Field()
    bmc: BareMetalAssetSpecBmc
}

@ObjectType()
export class BareMetalAsset extends Resource {
    @Field()
    spec: BareMetalAssetSpec
}

@Resolver(/* istanbul ignore next */ (of) => BareMetalAsset)
export class BareMetalAssetResolver {
    @Query((returns) => [BareMetalAsset])
    bareMetalAssets(
        @Ctx() userContext: IUserContext,
        @Arg('fieldSelector', { nullable: true }) fieldSelector?: string,
        @Arg('labelSelector', { nullable: true }) labelSelector?: string
    ): Promise<BareMetalAsset[]> {
        return bareMetalAssetService.query(userContext.token, fieldSelector, labelSelector)
    }
}
