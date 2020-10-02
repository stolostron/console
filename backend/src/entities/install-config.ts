interface FluffyAws {
    region: string
}

interface WelcomePlatform {
    aws: FluffyAws
}

interface ClusterNetwork {
    cidr: string
    hostPrefix: number
}

interface Networking {
    clusterNetwork: ClusterNetwork[]
    machineCIDR: string
    networkType: string
    serviceNetwork: string[]
}

interface Metadata {
    name: string
}

interface RootVolume {
    iops: number
    size: number
    type: string
}

interface PurpleAws {
    rootVolume: RootVolume
    type: string
}

interface ControlPlanePlatform {
    aws: PurpleAws
}
interface ControlPlane {
    hyperthreading: string
    name: string
    replicas: number
    platform: ControlPlanePlatform
}

export interface InstallConfig {
    apiVersion: string
    metadata: Metadata
    baseDomain: string
    controlPlane: ControlPlane
    compute: ControlPlane[]
    networking: Networking
    platform: WelcomePlatform
    pullSecret: string
    sshKey: string
}
