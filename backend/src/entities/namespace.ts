import { Arg, Ctx, ObjectType, Query, Resolver } from 'type-graphql'
import { getCoreV1API } from '../lib/kube-api'
import { IUserContext } from '../lib/user-context'
import { Resource } from './common/resource'

class NamespacesService {
    async query(token: string, fieldSelector?: string, labelSelector?: string): Promise<Namespace[]> {
        const coreV1API = getCoreV1API(token)
        const response = await coreV1API.listNamespace(undefined, undefined, fieldSelector, labelSelector)
        return (response.body.items as unknown) as Namespace[]
    }
}
const namespaceService = new NamespacesService()

@ObjectType()
export class Namespace extends Resource {}

@Resolver(/* istanbul ignore next */ (of) => Namespace)
export class NamespaceResolver {
    @Query((returns) => [Namespace])
    namespaces(
        @Ctx() userContext: IUserContext,
        @Arg('fieldSelector', { nullable: true }) fieldSelector?: string,
        @Arg('labelSelector', { nullable: true }) labelSelector?: string
    ): Promise<Namespace[]> {
        return namespaceService.query(userContext.token, fieldSelector, labelSelector)
    }
}
