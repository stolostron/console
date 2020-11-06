import { V1ObjectMeta } from '@kubernetes/client-node'

// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19

export interface IResource {
    apiVersion: string
    kind: string
    metadata: V1ObjectMeta
}

export interface ResourceList<Resource extends IResource> {
    items: Resource[]
}
