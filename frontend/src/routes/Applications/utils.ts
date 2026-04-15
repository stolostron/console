/* Copyright Contributors to the Open Cluster Management project */
import { IApplicationResource } from './model/application-resource'
import { OCPAppResource } from '../../resources/ocp-app-resource'
import { ApplicationStatus } from './model/application-status'
import { sha256 } from 'js-sha256'
import { ApplicationSet, ApplicationSetKind, IResource } from '../../resources'

/**
 * Check if a resource is an OCP app resource
 * @param resource - The resource to check
 * @returns True if the resource is an OCP app resource, false otherwise
 */
const isOCPAppResource = (
  resource: IApplicationResource | IResource
): resource is OCPAppResource<ApplicationStatus> & { id: string } => 'label' in resource

/**
 * Get the application id from a resource. The id is name+namespace+ hash of the clusters.
 * @param resource
 * @param clusters
 * @returns The application id
 */
const getApplicationId = (resource: IResource, clusters: string[]): string => {
  const stringified = JSON.stringify(clusters)
  const hash = sha256(stringified)
  return `${resource.metadata?.name}-${resource.metadata?.namespace}-${hash}`
}

/**
 * Get the labels from an application resource
 * @param resource - The application resource
 * @returns The labels in the format { key1: value1, key2: value2, ... }
 */
const getLabels = (resource: IApplicationResource | IResource): Record<string, string> => {
  if (isOCPAppResource(resource)) {
    return (
      resource.label?.split(';').reduce<Record<string, string>>((acc, label) => {
        const trimmed = label.trim()
        const eqIndex = trimmed.indexOf('=')
        return eqIndex === -1 ? acc : { ...acc, [trimmed.slice(0, eqIndex).trim()]: trimmed.slice(eqIndex + 1).trim() }
      }, {}) ?? {}
    )
  }

  if (resource.kind === ApplicationSetKind) {
    const appSet = resource as unknown as ApplicationSet
    return appSet.spec?.template?.metadata?.labels ?? {}
  }

  return resource.metadata?.labels ?? {}
}

export { isOCPAppResource, getApplicationId, getLabels }
