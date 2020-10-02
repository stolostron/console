import { ObjectType, Field, Resolver, FieldResolver, Root } from 'type-graphql'

@ObjectType()
export class Metadata {
    @Field()
    creationTimestamp: string

    @Field()
    uid: string

    @Field()
    name: string

    @Field({ nullable: true })
    namespace?: string

    @Field((type) => [String])
    labels: string[]
}

@Resolver((of) => Metadata)
export class MetadataResolver {
    @FieldResolver(/*istanbul ignore next*/ (type) => [String])
    labels(@Root() metadata: Metadata): string[] {
        const labels = (metadata.labels as unknown) as Record<string, string>
        if (!labels) {
            return []
        }
        return Object.keys(metadata.labels).map((key) => `${key}=${labels[key]}`)
    }
}
