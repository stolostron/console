/* Copyright Contributors to the Open Cluster Management project */

import { canUser } from '../../lib/rbac-util'
import { ActionType, fireManagedClusterAction, ManagedClusterActionDefinition } from '../managedclusteraction'
import { fireManagedClusterView, ManagedClusterViewDefinition } from '../managedclusterview'
import { IResource } from '../resource'
import { managedClusterProxyRequest } from './managed-cluster-proxy-request'

function getMCAMethod(method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE'): ActionType {
  switch (method) {
    case 'DELETE':
      return 'Delete'
    case 'PUT':
    case 'PATCH':
      return 'Update'
    case 'POST':
      return 'Create'
    default:
      return 'Create'
  }
}

/**
 * Performs a fine-grained RBAC resource request on a managed cluster.
 * Checks if the user has permission to create ManagedClusterView (for GET) or ManagedClusterAction (for other methods).
 * If permitted, uses ManagedClusterView/Action; otherwise falls back to managed cluster proxy request.
 *
 * @param method HTTP method to use for the request: 'PUT' | 'GET' | 'POST' | 'PATCH' | 'DELETE'
 * @param cluster The name of the managed cluster
 * @param resource Object containing the resource details: { apiVersion: string; kind: string; namespace?: string; name: string }
 * @param data Optional request body data to send with the request
 * @returns Promise that resolves to either the IResource or an object with an errorMessage property
 */
export async function fleetResourceRequest(
  method: 'PUT' | 'GET' | 'POST' | 'PATCH' | 'DELETE',
  cluster: string,
  resource: { apiVersion: string; kind: string; namespace?: string; name: string },
  data?: any
): Promise<IResource | { errorMessage: string }> {
  const { apiVersion, kind, namespace, name } = resource
  const isMCV = method === 'GET'

  if (!cluster || !apiVersion || !kind || !name) {
    return { errorMessage: 'Invalid request parameters' }
  }

  try {
    // Can user create MCV/MCA
    const canCreateManagedClusterViewAction = canUser(
      'create',
      isMCV ? ManagedClusterViewDefinition : ManagedClusterActionDefinition
    )
    const result = await canCreateManagedClusterViewAction.promise
    const isAllowed = result.status?.allowed!
    if (isAllowed) {
      if (isMCV) {
        // MCV handles GET requests
        const viewResponse = await fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
        if (viewResponse.message) {
          throw new Error(viewResponse.message)
        } else {
          return viewResponse?.result
        }
      } else {
        // MCA handles Create, Update, Delete
        const actionResponse = await fireManagedClusterAction(
          getMCAMethod(method),
          cluster,
          kind,
          apiVersion,
          name,
          namespace,
          data
        )
        if (actionResponse.actionDone === 'ActionDone') {
          return actionResponse
        } else {
          throw new Error(actionResponse?.message || 'Action failed')
        }
      }
    } else {
      // User does not have MCV/MCA permisson -> user cluster-proxy request
      const reqResource: {
        apiVersion: string
        kind: string
        namespace?: string
        name: string
      } = {
        apiVersion,
        kind,
        name,
      }
      if (namespace) reqResource.namespace = namespace
      const proxyResponse = await managedClusterProxyRequest(
        method,
        cluster,
        {
          apiVersion,
          kind,
          namespace,
          name,
        },
        data
      )
      if ('errorMessage' in proxyResponse) {
        throw new Error(proxyResponse.errorMessage)
      }
      return proxyResponse
    }
  } catch (err: any) {
    console.error(`Error performing ${method} request for ${kind} ${name}: `, err)
    return { errorMessage: err?.message ?? 'Unknown error occurred' }
  }
}
