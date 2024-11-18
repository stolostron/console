/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterDeploymentApiVersion,
  ClusterDeploymentKind,
  createResource,
  IResource,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  clusterPoolNamespaceLabels,
  AgentClusterInstallKind,
  createProject,
} from '../resources'
import { deleteResources } from './delete-resources'

export async function createCluster(resources: any[]) {
  let errors: any[] = []

  // get namespace and filter out any namespace resource
  // get ClusterDeployment and filter it out to create at the very end
  let response
  let managedClusterNamespace = ''
  let labels = undefined
  const clusterResources: any = []
  const projectResources: any = []
  resources = resources.filter((resource: any) => {
    const { kind, metadata = {}, spec = {} } = resource

    switch (kind) {
      case 'Namespace':
        managedClusterNamespace = metadata.name
        return false

      case 'Project':
        projectResources.push(resource)
        return false

      case 'ClusterPool':
        clusterResources.push(resource)
        ;({ namespace: managedClusterNamespace } = metadata)
        labels = clusterPoolNamespaceLabels
        return false

      case 'ClusterDeployment':
        clusterResources.push(resource)
        ;({ namespace: managedClusterNamespace } = metadata)
        return false

      case 'ManagedCluster':
        ;({ name: managedClusterNamespace } = metadata)
        break

      case 'HostedCluster':
        ;({ name: managedClusterNamespace } = metadata)
        break

      default:
        if (spec && spec.clusterNamespace) {
          managedClusterNamespace = spec.clusterNamespace
        }
        break
    }

    return true
  })

  // Create namespace for ManagedCluster and any other Project resources from the YAML
  const projectResults = [
    createProject(managedClusterNamespace, labels),
    ...projectResources.map((resource: any) => createResource(resource)),
  ]
  response = await Promise.allSettled(projectResults.map((result: any) => result.promise))
  response.forEach((result) => {
    if (result.status === 'rejected') {
      // ignore error if namespace already exists (409 conflict)
      if (result?.reason?.code !== 409) {
        return {
          status: 'ERROR',
          messages: [{ message: result.reason.message }],
        }
      }
    }
  })

  // create resources
  errors = []
  let results = resources.map((resource: any) => createResource(resource))
  response = await Promise.allSettled(results.map((result: any) => result.promise))
  response.forEach((result) => {
    if (result.status === 'rejected') {
      errors.push({ message: result.reason.message })
    }
  })

  // create cluster resources
  if (errors.length === 0 && clusterResources.length > 0) {
    results = clusterResources.map((resource: any) => createResource(resource))
    response = await Promise.allSettled(results.map((result) => result.promise))
    response.forEach((result) => {
      if (result.status === 'rejected') {
        errors.push({ message: result.reason.message })
      }
    })
  }

  // if there were errors, delete any cluster resources
  if (errors.length > 0) {
    let resourcesToDelete: IResource[] = []
    // if trying to create ManagedCluster, cleanup
    if (resources.find((r) => r.kind === ManagedClusterKind)) {
      resourcesToDelete = [
        {
          apiVersion: ManagedClusterApiVersion,
          kind: ManagedClusterKind,
          metadata: { name: managedClusterNamespace },
        },
        {
          apiVersion: ClusterDeploymentApiVersion,
          kind: ClusterDeploymentKind,
          metadata: { name: managedClusterNamespace, namespace: managedClusterNamespace },
        },
      ]
    }
    // if trying to create ClusterInstall, cleanup
    if (resources.find((r) => r.kind === AgentClusterInstallKind)) {
      resourcesToDelete = resources
        .filter((r) => r.apiVersion && r.kind && r.metadata?.name && r.metadata?.namespace)
        .map(
          (r) =>
            ({
              apiVersion: r.apiVersion,
              kind: r.kind,
              metadata: { name: r.metadata.name, namespace: r.metadata.namespace },
            }) as IResource
        )
    }

    try {
      await deleteResources(resourcesToDelete).promise
      return {
        status: 'ERROR',
        messages: errors,
      }
    } catch {
      return {
        status: 'ERROR',
        messages: errors,
      }
    }
  }

  return {
    status: errors.length > 0 ? 'ERROR' : 'DONE',
    messages: errors.length > 0 ? errors : null,
  }
}
