/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { getResource, listNamespacedResources } from './utils/resource-request'

export const SecretApiVersion = 'v1'
export type SecretApiVersionType = 'v1'

export const SecretKind = 'Secret'
export type SecretKindType = 'Secret'

export const SecretDefinition: IResourceDefinition = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
}

export interface Secret extends IResource {
  /**
   * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
   */
  apiVersion: SecretApiVersionType
  /**
   * Data contains the secret data. Each key must consist of alphanumeric characters, \'-\', \'_\' or \'.\'. The serialized form of the secret data is a base64 encoded string, representing the arbitrary (possibly non-string) data value here. Described in https://tools.ietf.org/html/rfc4648#section-4
   */
  data?: {
    [key: string]: string
  }
  /**
   * Immutable, if set to true, ensures that data stored in the Secret cannot be updated (only object metadata can be modified). If not set to true, the field can be modified at any time. Defaulted to nil.
   */
  immutable?: boolean
  /**
   * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   */
  kind: SecretKindType
  metadata: Metadata
  /**
   * stringData allows specifying non-binary secret data in string form. It is provided as a write-only input field for convenience. All keys and values are merged into the data field on write, overwriting any existing values. The stringData field is never output when reading from the API.
   */
  stringData?: {
    [key: string]: string
  }
  /**
   * Used to facilitate programmatic handling of secret data.
   */
  type?: string
}

export function getSecret(metadata: { name: string; namespace: string }) {
  return getResource<Secret>({
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata,
  })
}

export function unpackSecret(secret: Secret | Partial<Secret>) {
  if (secret.data) {
    if (!secret.stringData) secret.stringData = {}
    for (const key in secret.data) {
      secret.stringData[key] = Buffer.from(secret.data[key], 'base64').toString('ascii')
    }
  }
  return secret
}

export function listNamespaceSecrets(namespace: string) {
  return listNamespacedResources<Secret>({
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: { namespace },
  })
}
