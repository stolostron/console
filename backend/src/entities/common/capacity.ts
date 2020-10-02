import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class Capacity {
    @Field({ nullable: true })
    cpu: string

    @Field({ nullable: true })
    memory: string
}
