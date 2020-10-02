import { Field, ObjectType } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { Capacity } from './common/capacity'
import { Condition } from './common/condition'
import { Resource } from './common/resource'

export const managedClusterInfoService = new CustomObjectService<ManagedClusterInfo>({
    plural: 'managedclusterinfos',
    group: 'internal.open-cluster-management.io',
    version: 'v1beta1',
})

@ObjectType()
export class Node {
    @Field()
    name: string

    @Field((type) => Capacity)
    capacity: Capacity

    @Field((type) => [Condition])
    conditions: Condition[]
}

@ObjectType()
export class ManagedClusterInfoStatus {
    @Field((type) => [Condition])
    conditions: Condition[]

    @Field((type) => [Node], { nullable: true })
    nodeList: Node[]
}

@ObjectType()
export class ManagedClusterInfo extends Resource {
    @Field((type) => ManagedClusterInfoStatus, { nullable: true })
    status: ManagedClusterInfoStatus
}
