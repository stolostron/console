/* Copyright Contributors to the Open Cluster Management project */
import { IApplicationResource } from './model/application-resource'
import { OCPAppResource } from '../../resources/ocp-app-resource'
import { ApplicationStatus } from './model/application-status'
import { sha256 } from 'js-sha256'
import { IResource } from '../../resources'

const isOCPAppResource = (
  resource: IApplicationResource | IResource
): resource is OCPAppResource<ApplicationStatus> & { id: string } => 'label' in resource

const getApplicationId = (resource: IResource, clusters: string[]): string => {
  const stringified = JSON.stringify(clusters)
  const hash = sha256(stringified)
  return `${resource.metadata?.name}-${resource.metadata?.namespace}-${hash}`
}

const getLabels = (resource: OCPAppResource<ApplicationStatus>): Record<string, string> =>
  resource.label?.split(';').reduce<Record<string, string>>((acc, label) => {
    const trimmed = label.trim()
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) return acc
    acc[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim()
    return acc
  }, {}) ?? {}

export { isOCPAppResource, getApplicationId, getLabels }
