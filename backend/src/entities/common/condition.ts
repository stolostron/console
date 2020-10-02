import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class Condition {
    @Field({ nullable: true })
    lastTransitionTime: string

    @Field({ nullable: true })
    message: string

    @Field({ nullable: true })
    reason: string

    @Field()
    status: string

    @Field()
    type: string
}
