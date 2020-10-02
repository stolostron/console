import { Arg, Ctx, ObjectType, Query, Resolver } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { IUserContext } from '../lib/user-context'
import { Resource } from './common/resource'

export const clusterImageSetService = new CustomObjectService<ClusterImageSet>({
    plural: 'clusterimagesets',
    group: 'hive.openshift.io',
    version: 'v1',
})

@ObjectType()
export class ClusterImageSet extends Resource {}

@Resolver(/* istanbul ignore next */ (of) => ClusterImageSet)
export class ClusterImageSetResolver {
    @Query((returns) => [ClusterImageSet])
    async clusterImageSets(
        @Ctx() userContext: IUserContext,
        @Arg('fieldSelector', { nullable: true }) fieldSelector?: string,
        @Arg('labelSelector', { nullable: true }) labelSelector?: string
    ): Promise<ClusterImageSet[]> {
        return clusterImageSetService.query(userContext.token, fieldSelector, labelSelector)
    }
}
