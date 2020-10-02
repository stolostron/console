import { Field, ObjectType } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { Resource } from './common/resource'

export const klusterletAddonConfigService = new CustomObjectService({
    group: 'agent.open-cluster-management.io',
    version: 'v1',
    plural: 'klusterletaddonconfigs',
})

@ObjectType()
export class KlusterletAddonConfigClusterLabels {
    @Field()
    cloud: string

    @Field()
    vendor: string
}

@ObjectType()
export class KlusterletAddonConfigAddon {
    @Field()
    enabled: boolean
}

@ObjectType()
export class KlusterletAddonConfigSpec {
    @Field()
    clusterName: string

    @Field()
    clusterNamespace: string

    @Field((type) => KlusterletAddonConfigClusterLabels)
    clusterLabels: KlusterletAddonConfigClusterLabels

    @Field((type) => KlusterletAddonConfigAddon)
    applicationManager: KlusterletAddonConfigAddon

    @Field((type) => KlusterletAddonConfigAddon)
    policyController: KlusterletAddonConfigAddon

    @Field((type) => KlusterletAddonConfigAddon)
    searchCollector: KlusterletAddonConfigAddon

    @Field((type) => KlusterletAddonConfigAddon)
    certPolicyController: KlusterletAddonConfigAddon

    @Field((type) => KlusterletAddonConfigAddon)
    iamPolicyController: KlusterletAddonConfigAddon

    @Field()
    version: string
}

@ObjectType()
export class KlusterletAddonConfig extends Resource {
    @Field((type) => KlusterletAddonConfigSpec)
    spec: KlusterletAddonConfigSpec
}
