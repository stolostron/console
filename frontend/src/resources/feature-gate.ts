import { V1ObjectMeta } from '@kubernetes/client-node'
import { getResource, listResources } from '../lib/resource-request'
import { IResource, IResourceDefinition } from './resource'

export const FeatureGateApiVersion = 'config.openshift.io/v1'
export type FeatureGateApiVersionType = 'config.openshift.io/v1'

export const FeatureGateKind = 'FeatureGate'
export type FeatureGateKindType = 'FeatureGate'

export const FeatureGateDefinition: IResourceDefinition = {
    apiVersion: FeatureGateApiVersion,
    kind: FeatureGateKind,
}

export interface FeatureGate extends IResource {
    apiVersion: FeatureGateApiVersionType
    kind: FeatureGateKindType
    metadata: V1ObjectMeta
    spec?: {
        featureSet: string
    }
}

export function getFeatureGate(name: string) {
    return getResource<FeatureGate>({
        apiVersion: FeatureGateApiVersion,
        kind: FeatureGateKind,
        metadata: {
            name: name,
        },
    })
}

export function listFeatureGates() {
    return listResources<FeatureGate>({
        apiVersion: FeatureGateApiVersion,
        kind: FeatureGateKind,
    })
}
