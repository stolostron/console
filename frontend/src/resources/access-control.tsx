/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const AccessControlApiVersion = 'clusterview.open-cluster-management.io/v1'
export type AccessControlApiVersionType = 'clusterview.open-cluster-management.io/v1'

export const AccessControlKind = 'AccessControl'
export type AccessControlKindType = 'AccessControl'

export const AccessControlDefinition: IResourceDefinition = {
  apiVersion: AccessControlApiVersion,
  kind: AccessControlKind,
}

export interface AccessControl extends IResource {
  /**
   * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
   */
  apiVersion: AccessControlApiVersionType
  /**
   * Data contains the access control data. Each key must consist of alphanumeric characters, \'-\', \'_\' or \'.\'. The serialized form of the access control data is a base64 encoded string, representing the arbitrary (possibly non-string) data value here. Described in https://tools.ietf.org/html/rfc4648#section-4
   */
  // TODO: to properly define data
  data?: {
    id: string
    namespaces: string[]
    cluster: string
    users?: string[]
    groups?: string[]
    roles: string[]
    isActive?: boolean
    creationTimestamp: string
  }
  /**
   * Immutable, if set to true, ensures that data stored in the AccessControl cannot be updated (only object metadata can be modified). If not set to true, the field can be modified at any time. Defaulted to nil.
   */
  immutable?: boolean
  /**
   * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   */
  kind: AccessControlKindType
  metadata: Metadata
  /**
   * stringData allows specifying non-binary access control data in string form. It is provided as a write-only input field for convenience. All keys and values are merged into the data field on write, overwriting any existing values. The stringData field is never output when reading from the API.
   */
  stringData?: {
    [key: string]: string
  }
  /**
   * Used to facilitate programmatic handling of access control data.
   */
  type?: string
}
