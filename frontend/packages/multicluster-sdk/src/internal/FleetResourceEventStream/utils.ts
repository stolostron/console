/* Copyright Contributors to the Open Cluster Management project */
import {
  GroupVersionKind,
  K8sModel,
  K8sResourceCommon,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk'
import * as _ from 'lodash'
import { EventKind } from './constants'

export const EventModel: K8sModel = {
  apiVersion: 'v1',
  label: 'Event',
  // t('public~Event')
  labelKey: 'public~Event',
  plural: 'events',
  abbr: 'E',
  namespaced: true,
  kind: 'Event',
  id: 'event',
  labelPlural: 'Events',
  // t('public~Events')
  labelPluralKey: 'public~Events',
}

export const NodeModel: K8sModel = {
  apiVersion: 'v1',
  label: 'Node',
  // t('public~Node')
  labelKey: 'public~Node',
  plural: 'nodes',
  abbr: 'N',
  kind: 'Node',
  id: 'node',
  labelPlural: 'Nodes',
  // t('public~Nodes')
  labelPluralKey: 'public~Nodes',
}

export const getFirstTime = (event: EventKind): string | undefined => event.firstTimestamp || event.eventTime
export const getLastTime = (event: EventKind): string | undefined => {
  const lastObservedTime = event.series ? event.series.lastObservedTime : null
  return event.lastTimestamp || lastObservedTime || event.eventTime
}

export const sortEvents = (events: EventKind[]) => {
  return _.orderBy(events, [getLastTime, getFirstTime, 'name'], ['desc', 'desc', 'asc'])
}

const isHTMLElement = (n: Node): n is HTMLElement => {
  return n.nodeType === Node.ELEMENT_NODE
}

export const getParentScrollableElement = (node: HTMLElement) => {
  let parentNode: Node | null = node
  while (parentNode) {
    if (isHTMLElement(parentNode)) {
      let overflow = parentNode.style?.overflow
      if (!overflow.includes('scroll') && !overflow.includes('auto')) {
        overflow = window.getComputedStyle(parentNode).overflow
      }
      if (overflow.includes('scroll') || overflow.includes('auto')) {
        return parentNode
      }
    }
    parentNode = parentNode.parentNode
  }
  return undefined
}

export const referenceFor = ({ kind, apiVersion }: K8sResourceCommon): GroupVersionKind => {
  if (!kind) {
    return ''
  }
  const { group, version } = groupVersionFor(apiVersion || '')

  return [group || 'core', version, kind].join('~')
}

export const groupVersionFor = (apiVersion: string) => ({
  group: apiVersion.split('/').length === 2 ? apiVersion.split('/')[0] : 'core',
  version: apiVersion.split('/').length === 2 ? apiVersion.split('/')[1] : apiVersion,
})

export const resourcePathFromModel = (model: K8sModel, name?: string, namespace?: string) => {
  const { crd, namespaced, plural } = model

  let url = '/k8s/'

  if (!namespaced) {
    url += 'cluster/'
  }

  if (namespaced) {
    url += namespace ? `ns/${namespace}/` : 'all-namespaces/'
  }

  if (crd) {
    url += getGroupVersionKindForModel(model)
  } else if (plural) {
    url += plural
  }

  if (name) {
    // Some resources have a name that needs to be encoded. For instance,
    // Users can have special characters in the name like `#`.
    url += `/${encodeURIComponent(name)}`
  }

  return url
}

// Predicate function to filter by event "type" (normal, warning, or all)
export const typeFilter = (eventType: string, event: EventKind) => {
  if (eventType === 'all') {
    return true
  }
  const { type = 'normal' } = event
  return type.toLowerCase() === eventType
}
