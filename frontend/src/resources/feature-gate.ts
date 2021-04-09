/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
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
