/* Copyright Contributors to the Open Cluster Management project */
import _ from 'lodash'

// remove the kube stuff
const kube = [
  'managedFields',
  'creationTimestamp',
  'status',
  'uid',
  'deployables',
  'livenessProbe',
  'resourceVersion',
  'generation',
]

const filter = (value: unknown) => {
  if (typeof value === 'object') {
    return filterDeep(value)
  }
  return value
}

export const isFiltered = (key: string, parentObj: any) => {
  if (key === 'status' && parentObj && _.get(parentObj, 'type', '') === 'ManagedClusterConditionAvailable') {
    // for placement rule online option keep the status
    return false
  }
  if (kube.includes(key)) {
    return true
  }
  return false
}

export const filterDeep = (obj: object | null) => {
  const newObj: any = {}
  Object.entries(obj || {}).forEach(([k, v]) => {
    const value = filter(v)
    if (!isFiltered(k, obj)) {
      if (k === 'apps.open-cluster-management.io/github-branch') {
        k = 'apps.open-cluster-management.io/git-branch'
      }
      if (k === 'apps.open-cluster-management.io/github-path') {
        k = 'apps.open-cluster-management.io/git-path'
      }
      newObj[k] = value
    }
  })
  return newObj
}

export const getApplicationResources = (application: any) => {
  if (application) {
    const { app, subscriptions } = _.cloneDeep(application)

    const resources = []

    // application
    resources.push(filterDeep(app))

    // for each subscriptions, do channel and rule
    if (Array.isArray(subscriptions)) {
      subscriptions.forEach((subscription) => {
        const { channels, rules, placements } = subscription
        delete subscription.channels
        delete subscription.decisions
        delete subscription.placements
        resources.push(filterDeep(channels[0]))
        resources.push(filterDeep(subscription))
        if (rules && rules.length) {
          resources.push(filterDeep(rules[0]))
        }
        if (placements && placements.length) {
          resources.push(filterDeep(placements[0]))
        }
      })
    }
    return resources
  }
  return null
}
