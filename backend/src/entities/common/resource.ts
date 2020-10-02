import { Field, ObjectType } from 'type-graphql'
import { Metadata } from './metadata'

@ObjectType()
export class Resource {
    @Field()
    apiVersion: string

    @Field()
    kind: string

    @Field((type) => Metadata)
    metadata: Metadata
}

@ObjectType()
export class ResourceRef {
    @Field()
    name: string
}
