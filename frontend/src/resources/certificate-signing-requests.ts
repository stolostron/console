import { V1ObjectMeta } from '@kubernetes/client-node'
import { listClusterResources } from '../lib/resource-request'
import { IResource } from './resource'

export const CertificateSigningRequestApiVersion = 'certificates.k8s.io/v1beta1'
export type CertificateSigningRequestApiVersionType = 'certificates.k8s.io/v1beta1'

export const CertificateSigningRequestKind = 'CertificateSigningRequest'
export type CertificateSigningRequestKindType = 'CertificateSigningRequest'

export interface CertificateSigningRequest extends IResource {
    apiVersion: CertificateSigningRequestApiVersionType
    kind: CertificateSigningRequestKindType
    metadata: V1ObjectMeta
    status?: {
        certificate?: string
    }
}

export const CSR_CLUSTER_LABEL = 'open-cluster-management.io/cluster-name'
export const clusterCsrLabel = (cluster?: string) => `${CSR_CLUSTER_LABEL}${cluster ? `%3D${cluster}` : ''}`

export function listCertificateSigningRequests(cluster?: string) {
    return listClusterResources<CertificateSigningRequest>(
        {
            apiVersion: CertificateSigningRequestApiVersion,
            kind: CertificateSigningRequestKind,
        },
        undefined,
        [clusterCsrLabel(cluster)]
    )
}
