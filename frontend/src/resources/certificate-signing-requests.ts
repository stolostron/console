import { V1ObjectMeta } from '@kubernetes/client-node'
import { listClusterResources } from '../lib/resource-request'
import { IResource, IResourceDefinition } from './resource'

export const CertificateSigningRequestApiVersion = 'certificates.k8s.io/v1beta1'
export type CertificateSigningRequestApiVersionType = 'certificates.k8s.io/v1beta1'

export const CertificateSigningRequestKind = 'CertificateSigningRequest'
export type CertificateSigningRequestKindType = 'CertificateSigningRequest'

export const CertificateSigningRequestDefinition: IResourceDefinition = {
    apiVersion: CertificateSigningRequestApiVersion,
    kind: CertificateSigningRequestKind,
}

export interface CertificateSigningRequest extends IResource {
    apiVersion: CertificateSigningRequestApiVersionType
    kind: CertificateSigningRequestKindType
    metadata: V1ObjectMeta
    status?: {
        certificate?: string
    }
}

export const CertificateSigningRequestListApiVersion = 'certificates.k8s.io/v1beta1'
export type CertificateSigningRequestListApiVersionType = 'certificates.k8s.io/v1beta1'

export const CertificateSigningRequestListKind = 'CertificateSigningRequestList'
export type CertificateSigningRequestListKindType = 'CertificateSigningRequestList'

export interface CertificateSigningRequestList extends IResource {
    apiVersion: CertificateSigningRequestListApiVersionType
    kind: CertificateSigningRequestListKindType
    items: CertificateSigningRequest[]
}

export const CSR_CLUSTER_LABEL = 'open-cluster-management.io/cluster-name'
export const clusterCsrLabel = (cluster?: string) => `${CSR_CLUSTER_LABEL}${cluster ? `%3D${cluster}` : ''}`

export function listCertificateSigningRequests(cluster?: string) {
    return listClusterResources<CertificateSigningRequest>(
        {
            apiVersion: CertificateSigningRequestApiVersion,
            kind: CertificateSigningRequestKind,
        },
        [clusterCsrLabel(cluster)]
    )
}
