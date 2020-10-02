import { Field, ObjectType } from 'type-graphql'
import { CustomObjectService } from '../lib/custom-object-service'
import { Resource, ResourceRef } from './common/resource'

export const machinePoolService = new CustomObjectService({
    group: 'hive.openshift.io',
    version: 'v1',
    plural: 'machinepools',
})

@ObjectType()
export class MachinePoolPrviderRootVolume {
    @Field()
    iops: number

    @Field()
    size: number

    @Field()
    type: string
}

@ObjectType()
export class MachinePoolPlatformAws {
    @Field((type) => MachinePoolPrviderRootVolume)
    rootVolume: MachinePoolPrviderRootVolume

    @Field()
    type: string
}

@ObjectType()
export class MachinePoolPlatform {
    @Field((type) => MachinePoolPlatformAws)
    aws: MachinePoolPlatformAws
}

@ObjectType()
export class MachinePoolSpec {
    @Field()
    name: string

    @Field((type) => ResourceRef)
    clusterDeploymentRef: ResourceRef

    @Field((type) => MachinePoolPlatform)
    platform: MachinePoolPlatform

    @Field()
    replicas: number
}

@ObjectType()
export class MachinePool extends Resource {
    @Field((type) => MachinePoolSpec)
    spec: MachinePoolSpec
}
