import { V1ObjectMeta } from '@kubernetes/client-node'

export type ClusterImageSet = {
    apiVersion: 'hive.openshift.io/v1'
    kind: 'ClusterImageSet'
    metadata: V1ObjectMeta
}
