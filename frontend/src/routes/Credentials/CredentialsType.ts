/* Copyright Contributors to the Open Cluster Management project */
import { Provider } from '../../ui-components'

const credentialsTypes = [
  Provider.ansible,
  Provider.aws,
  Provider.awss3,
  Provider.azure,
  Provider.gcp,
  Provider.hostinventory,
  Provider.hybrid,
  Provider.kubevirt,
  Provider.openstack,
  Provider.redhatcloud,
  Provider.redhatvirtualization,
  Provider.vmware,
] as const

export type CredentialsType = typeof credentialsTypes[number]

export const isCredentialsType = (credentialsType: string): credentialsType is CredentialsType =>
  (credentialsTypes as unknown as string[]).includes(credentialsType)

export const CREDENTIALS_TYPE_PARAM = 'type'
