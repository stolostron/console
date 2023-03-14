/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResourceDefinition } from './resource'
import { Secret } from './secret'
import { listResources } from './utils/resource-request'

export const ProviderConnectionApiVersion = 'v1'
export type ProviderConnectionApiVersionType = 'v1'

export const ProviderConnectionKind = 'Secret'
export type ProviderConnectionKindType = 'Secret'

export const ProviderConnectionDefinition: IResourceDefinition = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
}

export interface ProviderConnectionStringData {
  // AWS
  aws_access_key_id?: string
  aws_secret_access_key?: string

  // AWS S3
  bucket?: string
  credentials?: string
  region?: string

  // Azure
  baseDomainResourceGroupName?: string
  ['osServicePrincipal.json']?: string
  cloudName?: string

  // GCP
  projectID?: string
  ['osServiceAccount.json']?: string

  // vSphere
  username?: string
  password?: string
  vCenter?: string
  cacertificate?: string
  cluster?: string
  datacenter?: string
  defaultDatastore?: string
  vsphereDiskType?: string
  vsphereFolder?: string
  vsphereResourcePool?: string

  // Hive BareMetal
  libvirtURI?: string
  sshKnownHosts?: string
  imageMirror?: string
  bootstrapOSImage?: string
  clusterOSImage?: string
  disconnectedAdditionalTrustBundle?: string

  // OpenShift Cluster Manager
  ocmAPIToken?: string

  // OpenStack
  ['clouds.yaml']?: string
  cloud?: string
  os_ca_bundle?: string

  // Red Hat Virtualization
  ovirt_url?: string
  ovirt_fqdn?: string
  ovirt_username?: string
  ovirt_password?: string
  ovirt_ca_bundle?: string

  baseDomain?: string
  pullSecret?: string
  ['ssh-privatekey']?: string
  ['ssh-publickey']?: string

  httpProxy?: any
  httpsProxy?: any
  noProxy?: any
  imageContentSources?: any
  additionalTrustBundle?: string

  host?: string
  token?: string
}

export interface ProviderConnection {
  apiVersion: ProviderConnectionApiVersionType
  kind: ProviderConnectionKindType
  metadata: Metadata
  data?: ProviderConnectionStringData
  stringData?: ProviderConnectionStringData
  type: 'Opaque'
}

export function listProviderConnections() {
  const result = listResources<ProviderConnection>(
    {
      apiVersion: ProviderConnectionApiVersion,
      kind: ProviderConnectionKind,
    },
    ['cluster.open-cluster-management.io/credentials=']
  )
  return {
    promise: result.promise.then((providerConnections) => {
      return providerConnections.map(unpackProviderConnection)
    }),
    abort: result.abort,
  }
}

export function unpackProviderConnection(secret: ProviderConnection | Secret) {
  const providerConnection: ProviderConnection = {
    ...secret,
  } as ProviderConnection
  if (providerConnection.data) {
    if (!providerConnection.stringData) providerConnection.stringData = {}
    const data = providerConnection.data as Record<string, string>
    const stringData = providerConnection.stringData as Record<string, string>
    for (const key in providerConnection.data) {
      stringData[key] = Buffer.from(data[key], 'base64').toString('ascii')
    }
    delete providerConnection.data
  }
  return providerConnection
}

export function packProviderConnection(providerConnection: ProviderConnection) {
  if (!providerConnection.data) providerConnection.data = {}
  const data = providerConnection.data as Record<string, string>
  const stringData = providerConnection.stringData as Record<string, string>
  if (stringData !== undefined) {
    for (const key in stringData) {
      data[key] = Buffer.from(stringData[key], 'ascii').toString('base64')
    }
    delete providerConnection.stringData
  }
  return providerConnection
}
