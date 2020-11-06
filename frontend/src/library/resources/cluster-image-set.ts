import { V1ObjectMeta } from '@kubernetes/client-node'

export const ClusterImageSetApiVersion = 'hive.openshift.io/v1'
export type ClusterImageSetApiVersionType = 'hive.openshift.io/v1'

export const ClusterImageSetKind = 'ClusterImageSet'
export type ClusterImageSetKindType = 'ClusterImageSet'

export type ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersionType
    kind: ClusterImageSetKindType
    metadata: V1ObjectMeta
}
