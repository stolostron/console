/* Copyright Contributors to the Open Cluster Management project */

import {
  ProviderConnectionStringData,
  ProviderConnection,
  ProviderConnectionApiVersion,
  ProviderConnectionKind,
  NamespaceApiVersion,
  NamespaceKind,
  Namespace,
} from '../resources'

export const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3', 'local-cluster'].map((name) => ({
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name },
}))

export function createProviderConnection(
  provider: string,
  stringData: ProviderConnectionStringData,
  common = false,
  name?: string,
  namespace?: string
): ProviderConnection {
  return {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    type: 'Opaque',
    metadata: {
      name: name ? name : `${provider}-connection`,
      namespace: namespace ? namespace : mockNamespaces[0].metadata.name,
      labels: {
        'cluster.open-cluster-management.io/type': provider,
        'cluster.open-cluster-management.io/credentials': '',
      },
    },
    stringData: common
      ? {
          ...stringData,
          ...{
            baseDomain: 'baseDomain',
            pullSecret: '{"pull":"secret"}\n',
            'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----\n',
            'ssh-publickey': 'ssh-rsa AAAAB1 fakeemail@redhat.com\n',
            httpProxy: '',
            httpsProxy: '',
            noProxy: '',
            additionalTrustBundle: '',
          },
        }
      : stringData,
  }
}
