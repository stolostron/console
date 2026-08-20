/* Copyright Contributors to the Open Cluster Management project */

import * as yaml from 'js-yaml'
import { noop } from 'lodash'
import {
  AWSClusterControllerIdentity,
  AWSClusterControllerIdentityApiVersion,
  AWSClusterControllerIdentityKind,
  AWS_CLUSTER_CONTROLLER_IDENTITY_DEFAULT_NAME,
  CapiClusterKind,
  createProject,
  IResource,
  ManagedClusterKind,
  NamespaceApiVersion,
  NamespaceKind,
  ROSAClusterKind,
  ROSAControlPlaneKind,
  Secret,
  SecretApiVersion,
  SecretKind,
} from '../resources'
import {
  createResource,
  deleteResource,
  getResource,
  replaceResource,
  ResourceError,
  ResourceErrorCode,
} from '../resources/utils/resource-request'

export interface RosaHcpOcmCredentials {
  client_id: string
  client_secret: string
}

export const ROSA_HCP_DEFAULT_OCM_API_URL = 'https://api.openshift.com'

function parseYamlResources(yamlString: string): IResource[] {
  return (yaml.loadAll(yamlString) as (IResource | null | undefined)[]).filter(
    (doc): doc is IResource => !!doc && typeof doc === 'object' && !!doc.kind
  )
}

async function ignoreAlreadyExists(promise: Promise<unknown>): Promise<boolean> {
  try {
    await promise
    return true
  } catch (err) {
    if (err instanceof ResourceError && err.code === ResourceErrorCode.Conflict) return false
    throw err
  }
}

async function createOrReplace<T extends IResource>(resource: T): Promise<void> {
  const created = await ignoreAlreadyExists(createResource(resource).promise)
  if (!created) {
    const existing = await getResource(resource).promise
    const merged = {
      ...resource,
      metadata: { ...resource.metadata, resourceVersion: existing.metadata?.resourceVersion },
    }
    await replaceResource(merged).promise
  }
}

function buildCredentialsSecret(clusterName: string, ocmCredentials: RosaHcpOcmCredentials): Secret {
  return {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
      name: `${clusterName}-creds`,
      namespace: clusterName,
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
      },
    },
    stringData: {
      ocmClientID: Buffer.from(ocmCredentials.client_id, 'base64').toString('utf-8'),
      ocmClientSecret: Buffer.from(ocmCredentials.client_secret, 'base64').toString('utf-8'),
      ocmApiUrl: ROSA_HCP_DEFAULT_OCM_API_URL,
    },
    type: 'Opaque',
  } as Secret
}

async function rollback(createdResources: IResource[]): Promise<void> {
  for (const resource of [...createdResources].reverse()) {
    await deleteResource(resource).promise.catch(noop)
  }
}

export async function createRosaHcpCluster(
  yamlString: string,
  ocmCredentials: RosaHcpOcmCredentials
): Promise<{ clusterName: string }> {
  const resources = parseYamlResources(yamlString)

  const controlPlane = resources.find((r) => r.kind === ROSAControlPlaneKind)
  const clusterName = controlPlane?.metadata?.name ?? resources.find((r) => r.kind === CapiClusterKind)?.metadata?.name

  if (!clusterName) {
    throw new Error('Unable to determine the cluster name from the generated resources.')
  }

  const createdResources: IResource[] = []

  try {
    // 1. Namespace for the cluster's resources (idempotent - ignore already-exists).
    const namespaceCreated = await ignoreAlreadyExists(createProject(clusterName).promise)
    if (namespaceCreated) {
      createdResources.push({
        apiVersion: NamespaceApiVersion,
        kind: NamespaceKind,
        metadata: { name: clusterName },
      })
    }

    // 2. Cluster-scoped singleton identity CAPA uses to reconcile AWS-backed resources.
    //    Shared across all ROSA HCP clusters on the hub, so never rolled back on failure.
    const identity: AWSClusterControllerIdentity = {
      apiVersion: AWSClusterControllerIdentityApiVersion,
      kind: AWSClusterControllerIdentityKind,
      metadata: { name: AWS_CLUSTER_CONTROLLER_IDENTITY_DEFAULT_NAME },
      spec: { allowedNamespaces: {} },
    }
    await ignoreAlreadyExists(createResource(identity).promise)

    // 3. OCM API credentials referenced by ROSAControlPlane.spec.credentialsSecretRef.
    const credentialsSecret = buildCredentialsSecret(clusterName, ocmCredentials)
    await createOrReplace(credentialsSecret)
    createdResources.push(credentialsSecret)

    // 4. Infra + control plane + ACM registration, in dependency order.
    for (const kind of [ROSAClusterKind, ROSAControlPlaneKind, ManagedClusterKind]) {
      const resource = resources.find((r) => r.kind === kind)
      if (!resource) continue
      await createOrReplace(resource)
      createdResources.push(resource)
    }

    // 5. Cluster ties the infrastructure and control plane resources together; created last,
    //    analogous to Hive's ClusterDeployment / Hypershift's HostedCluster being the "trigger".
    const capiCluster = resources.find((r) => r.kind === CapiClusterKind)
    if (capiCluster) {
      await createOrReplace(capiCluster)
      createdResources.push(capiCluster)
    }

    return { clusterName }
  } catch (err) {
    await rollback(createdResources)
    throw err instanceof Error ? err : new Error('Failed to create the ROSA HCP cluster.')
  }
}
