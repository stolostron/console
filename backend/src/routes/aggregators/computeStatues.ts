/* Copyright Contributors to the Open Cluster Management project */
import { ApplicationStatus } from './applications'
import { ISearchResource } from '../../resources/resource'

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

export function computeAppDeployedStatuses(deployed: number[], item: ISearchResource) {
  if (item.kind === 'Ansible') {
    // computeAnsibleStatus(deployed, item)
  } else if (item.desired !== undefined) {
    computeDeploymentStatus(deployed, item)
  } else if (item.status) {
    computePodStatus(deployed, item)
  } else {
    deployed[ApplicationStatus.healthy]++
  }
}

// export function computeAnsibleStatus(deployed: number[], item: ISearchResource) {}

function computeDeploymentStatus(deployed: number[], item: ISearchResource) {
  const available = Number(item.available) ?? 0
  const desired = Number(item.desired) ?? 0
  if (available === desired) {
    deployed[ApplicationStatus.healthy]++
  } else if (available < desired) {
    deployed[ApplicationStatus.progress]++
  } else if (desired <= 0) {
    deployed[ApplicationStatus.warning]++
  } else if (!desired && available === 0) {
    deployed[ApplicationStatus.danger]++
  } else {
    deployed[ApplicationStatus.healthy]++
  }
}

function computePodStatus(deployed: number[], item: ISearchResource) {
  const status = item.status.toLocaleLowerCase()
  if (resErrorStates.includes(status)) {
    deployed[ApplicationStatus.danger]++
  } else if (resWarningStates.includes(status)) {
    deployed[ApplicationStatus.warning]++
  }
  deployed[ApplicationStatus.healthy]++
}
