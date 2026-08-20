/* Copyright Contributors to the Open Cluster Management project */

import * as yaml from 'js-yaml'
import { createRosaHcpCluster, ROSA_HCP_DEFAULT_OCM_API_URL, RosaHcpOcmCredentials } from './create-rosa-hcp-cluster'
import {
  AWSClusterControllerIdentityApiVersion,
  AWSClusterControllerIdentityKind,
  AWS_CLUSTER_CONTROLLER_IDENTITY_DEFAULT_NAME,
  CapiCluster,
  CapiClusterApiVersion,
  CapiClusterKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  NamespaceApiVersion,
  NamespaceKind,
  ProjectRequestApiVersion,
  ProjectRequestKind,
  ROSACluster,
  ROSAClusterApiVersion,
  ROSAClusterKind,
  ROSAControlPlane,
  ROSAControlPlaneApiVersion,
  ROSAControlPlaneKind,
  Secret,
  SecretApiVersion,
  SecretKind,
} from '../resources'
import nock from 'nock'
import { nockCreate, nockDelete, nockGet, nockIgnoreApiPaths, nockReplace } from './nock-util'
import { waitForNocks } from './test-util'

const clusterName = 'my-rosa-cluster'

const ocmCredentials: RosaHcpOcmCredentials = {
  client_id: Buffer.from('client-id-value').toString('base64'),
  client_secret: Buffer.from('client-secret-value').toString('base64'),
}

const controlPlane: ROSAControlPlane = {
  apiVersion: ROSAControlPlaneApiVersion,
  kind: ROSAControlPlaneKind,
  metadata: { name: clusterName, namespace: clusterName },
  spec: {
    rosaClusterName: clusterName,
    version: '4.17.0',
    versionGate: 'WaitForAcknowledge',
    channelGroup: 'stable',
    region: 'us-east-1',
    endpointAccess: 'Public',
    credentialsSecretRef: { name: `${clusterName}-creds` },
  },
}

const managedCluster: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: clusterName, labels: { cloud: 'Amazon', vendor: 'OpenShift' } },
  spec: { hubAcceptsClient: true },
}

const capiCluster: CapiCluster = {
  apiVersion: CapiClusterApiVersion,
  kind: CapiClusterKind,
  metadata: { name: clusterName, namespace: clusterName },
  spec: {
    infrastructureRef: {
      apiVersion: ROSAClusterApiVersion,
      kind: ROSAClusterKind,
      name: clusterName,
      namespace: clusterName,
    },
    controlPlaneRef: {
      apiVersion: ROSAControlPlaneApiVersion,
      kind: ROSAControlPlaneKind,
      name: clusterName,
      namespace: clusterName,
    },
  },
}

const rosaCluster: ROSACluster = {
  apiVersion: ROSAClusterApiVersion,
  kind: ROSAClusterKind,
  metadata: { name: clusterName, namespace: clusterName },
}

const buildYamlString = (resources: unknown[]) => resources.map((resource) => yaml.dump(resource)).join('---\n')

const expectedProjectRequest = {
  apiVersion: ProjectRequestApiVersion,
  kind: ProjectRequestKind,
  metadata: { name: clusterName },
}

const expectedNamespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name: clusterName },
}

const expectedIdentity = {
  apiVersion: AWSClusterControllerIdentityApiVersion,
  kind: AWSClusterControllerIdentityKind,
  metadata: { name: AWS_CLUSTER_CONTROLLER_IDENTITY_DEFAULT_NAME },
  spec: { allowedNamespaces: {} },
}

const expectedCredsSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: `${clusterName}-creds`,
    namespace: clusterName,
    labels: { 'cluster.open-cluster-management.io/backup': 'cluster' },
  },
  stringData: {
    ocmClientID: 'client-id-value',
    ocmClientSecret: 'client-secret-value',
    ocmApiUrl: ROSA_HCP_DEFAULT_OCM_API_URL,
  },
  type: 'Opaque',
} as Secret

describe('createRosaHcpCluster', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nockIgnoreApiPaths()
  })

  it('creates prerequisites and resources in order and resolves with the cluster name', async () => {
    const nocks = [
      nockCreate(expectedProjectRequest),
      nockCreate(expectedIdentity),
      nockCreate(expectedCredsSecret),
      nockCreate(rosaCluster),
      nockCreate(controlPlane),
      nockCreate(managedCluster),
      nockCreate(capiCluster),
    ]

    const yamlString = buildYamlString([controlPlane, managedCluster, capiCluster, rosaCluster])
    const result = await createRosaHcpCluster(yamlString, ocmCredentials)

    expect(result).toEqual({ clusterName })
    await waitForNocks(nocks)
  })

  it('builds the OCM credentials secret from the selected credential, defaulting ocmApiUrl', async () => {
    const nocks = [
      nockCreate(expectedProjectRequest),
      nockCreate(expectedIdentity),
      nockCreate(expectedCredsSecret),
      nockCreate(rosaCluster),
      nockCreate(controlPlane),
      nockCreate(managedCluster),
      nockCreate(capiCluster),
    ]

    const yamlString = buildYamlString([controlPlane, managedCluster, capiCluster, rosaCluster])
    await createRosaHcpCluster(yamlString, ocmCredentials)

    await waitForNocks(nocks)
  })

  it('ignores 409 conflicts when the namespace and shared identity already exist', async () => {
    const nocks = [
      nockCreate(expectedProjectRequest, undefined, 409),
      nockCreate(expectedIdentity, undefined, 409),
      nockCreate(expectedCredsSecret),
      nockCreate(rosaCluster),
      nockCreate(controlPlane),
      nockCreate(managedCluster),
      nockCreate(capiCluster),
    ]

    const yamlString = buildYamlString([controlPlane, managedCluster, capiCluster, rosaCluster])
    const result = await createRosaHcpCluster(yamlString, ocmCredentials)

    expect(result).toEqual({ clusterName })
    await waitForNocks(nocks)
  })

  it('rolls back already-created resources on mid-sequence failure and rethrows', async () => {
    const nocks = [
      nockCreate(expectedProjectRequest),
      nockCreate(expectedIdentity),
      nockCreate(expectedCredsSecret),
      nockCreate(rosaCluster),
      nockCreate(controlPlane, undefined, 500),
      nockDelete(rosaCluster),
      nockDelete(expectedCredsSecret),
      nockDelete(expectedNamespace),
    ]

    const yamlString = buildYamlString([controlPlane, managedCluster, capiCluster, rosaCluster])

    await expect(createRosaHcpCluster(yamlString, ocmCredentials)).rejects.toThrow()
    await waitForNocks(nocks)
  })

  it('rolls back the namespace when the credentials secret creation fails', async () => {
    const nocks = [
      nockCreate(expectedProjectRequest),
      nockCreate(expectedIdentity),
      nockCreate(expectedCredsSecret, undefined, 500),
      nockDelete(expectedNamespace),
    ]

    const yamlString = buildYamlString([controlPlane, managedCluster, capiCluster, rosaCluster])

    await expect(createRosaHcpCluster(yamlString, ocmCredentials)).rejects.toThrow()
    await waitForNocks(nocks)
  })

  it('replaces resources on retry instead of failing with already-exists', async () => {
    const existingCredsSecret = {
      ...expectedCredsSecret,
      metadata: { ...expectedCredsSecret.metadata, resourceVersion: '1' },
    } as Secret

    const nocks = [
      nockCreate(expectedProjectRequest, undefined, 409),
      nockCreate(expectedIdentity, undefined, 409),
      nockCreate(expectedCredsSecret, undefined, 409),
      nockGet(expectedCredsSecret, existingCredsSecret, 200, false),
      nockReplace(existingCredsSecret),
      nockCreate(rosaCluster),
      nockCreate(controlPlane),
      nockCreate(managedCluster),
      nockCreate(capiCluster),
    ]

    const yamlString = buildYamlString([controlPlane, managedCluster, capiCluster, rosaCluster])
    const result = await createRosaHcpCluster(yamlString, ocmCredentials)

    expect(result).toEqual({ clusterName })
    await waitForNocks(nocks)
  })

  it('does not delete a pre-existing namespace during rollback', async () => {
    const namespaceDeletionScope = nockDelete(expectedNamespace)

    const nocks = [
      nockCreate(expectedProjectRequest, undefined, 409),
      nockCreate(expectedIdentity),
      nockCreate(expectedCredsSecret, undefined, 500),
    ]

    const yamlString = buildYamlString([controlPlane, managedCluster, capiCluster, rosaCluster])
    await expect(createRosaHcpCluster(yamlString, ocmCredentials)).rejects.toThrow()
    await waitForNocks(nocks)

    expect(namespaceDeletionScope.isDone()).toBe(false)
    nock.cleanAll()
  })

  it('throws when the cluster name cannot be determined from the resources', async () => {
    nockIgnoreApiPaths()
    const yamlString = buildYamlString([managedCluster])

    await expect(createRosaHcpCluster(yamlString, ocmCredentials)).rejects.toThrow(
      'Unable to determine the cluster name from the generated resources.'
    )
  })
})
