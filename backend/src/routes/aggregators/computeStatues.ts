/* Copyright Contributors to the Open Cluster Management project */
import { ApplicationStatus, ApplicationStatuses } from './applications'
import { ISearchResource, SearchResult } from '../../resources/resource'

//////////////////////////////////////////////////////////////////
////////////// COMPUTE STATUSES /////////////////////////////////////////
//////////////////////////////////////////////////////////////////
const argoAppHealthyStatus = 'Healthy' //green
const argoAppDegradedStatus = 'Degraded' //red
// const argoAppMissingStatus = 'Missing'
// const argoAppProgressingStatus = 'Progressing'
// const argoAppUnknownStatus = 'Unknown'
// const argoAppSuspendedStatus = 'Suspended'

// const resGreenStates = ['running', 'bound']
const resErrorStates = [
  'err',
  'off',
  'invalid',
  'kill',
  'propagationfailed',
  'imagepullbackoff',
  'crashloopbackoff',
  'lost',
]
const resWarningStates = ['pending', 'creating', 'terminating']

export function computeAppHealthStatus(health: number[], app: ISearchResource) {
  switch (app.healthStatus) {
    case argoAppHealthyStatus:
      health[ApplicationStatus.healthy]++
      break
    case argoAppDegradedStatus:
      health[ApplicationStatus.danger]++
      break
    default:
      health[ApplicationStatus.warning]++
      break
  }
}

export function computeAppSyncStatus(synced: number[], app: ISearchResource) {
  switch (app.syncStatus) {
    case 'Synced':
      synced[ApplicationStatus.healthy]++
      break
    case 'OutOfSync':
      synced[ApplicationStatus.danger]++
      break
    case 'Unknown':
      synced[ApplicationStatus.warning]++
      break
    default:
      synced[ApplicationStatus.danger]++
      break
  }
}

function createResourceMap(related: SearchResult['related'], kind: string): Map<string, ISearchResource> {
  const map = new Map<string, ISearchResource>()
  const relatedItems = related.find((r) => r.kind === kind)
  relatedItems?.items.forEach((item: ISearchResource) => {
    map.set(item._relatedUids[0], item)
  })
  return map
}

export function computePodStatuses(
  related: SearchResult['related'],
  app2AppsetMap: Record<string, ApplicationStatuses>
) {
  const deploymentMap = createResourceMap(related, 'Deployment')
  const replicaSetMap = createResourceMap(related, 'ReplicaSet')
  const missingPods = Object.keys(app2AppsetMap)
  const podItems = related.find((r) => r.kind === 'Pod')?.items
  if (podItems) {
    podItems.forEach((item: ISearchResource) => {
      missingPods.splice(missingPods.indexOf(item._relatedUids[0]), 1)
      const appStatuses = app2AppsetMap[item._relatedUids[0]]
      if (appStatuses) {
        const deployment = computepDeployedStatus(deploymentMap.get(item._relatedUids[0]))
        const replicaSet = computepDeployedStatus(replicaSetMap.get(item._relatedUids[0]))
        if (deployment === ApplicationStatus.progress || replicaSet === ApplicationStatus.progress) {
          appStatuses.deployed[ApplicationStatus.progress]++
          return
        } else if (deployment === ApplicationStatus.danger || replicaSet === ApplicationStatus.danger) {
          appStatuses.deployed[ApplicationStatus.danger]++
          return
        }
        computePodStatus(appStatuses.deployed, item)
      }
    })
  }
  missingPods.forEach((pod) => {
    app2AppsetMap[pod].deployed[ApplicationStatus.danger]++
  })
}

export function computepDeployedStatus(item: ISearchResource) {
  if (item) {
    const available = Number(item.available) ?? 0
    const desired = Number(item.desired) ?? 0
    if (available === desired || item.desired === '0') {
      return ApplicationStatus.healthy
    } else if (available < desired) {
      return ApplicationStatus.progress
    } else if (!item.desired && available === 0) {
      return ApplicationStatus.danger
    }
  }
  return ApplicationStatus.healthy
}

// export function computeAnsibleStatus(deployed: number[], item: ISearchResource) {}

function computePodStatus(deployed: number[], item: ISearchResource) {
  const status = item.status.toLocaleLowerCase()
  if (resErrorStates.includes(status)) {
    deployed[ApplicationStatus.danger]++
  } else if (resWarningStates.includes(status)) {
    deployed[ApplicationStatus.warning]++
  }
  deployed[ApplicationStatus.healthy]++
}
