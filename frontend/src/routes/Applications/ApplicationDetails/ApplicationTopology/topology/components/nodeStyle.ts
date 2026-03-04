/* Copyright Contributors to the Open Cluster Management project */
import capitalize from 'lodash/capitalize'
import { NodeStatus } from '@patternfly/react-topology'
import { typeToIconMap } from './nodeIconsMap'
import { statusToIconMap } from './nodeStatusIconMap'
import './nodeStatusIcons.css'

export const NODE_WIDTH = 65
export const NODE_HEIGHT = 65
export const X_SPACER = 80
export const Y_SPACER = 60

export const getNodeStyle = (
  d: {
    uid: string
    specs: any
    type: string
    name: string
    namespace: string
  },
  offset: { dx: number; dy: number } | undefined
) => {
  const type = d.type
  const specs = d.specs
  const label = getLabel(type, specs)
  const { status, statusIcon, isDisabled } = getStatus(d)
  /* istanbul ignore next */
  const shape = typeToIconMap[type]?.shape || 'customresource'

  /* istanbul ignore next */
  const { dx, dy } = offset || { dx: 0, dy: 0 }
  return {
    dx,
    dy,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    status,
    statusIcon,
    type,
    specs: d.specs,
    name: d.name,
    namespace: d.namespace,
    shape,
    label,
    isDisabled,
    id: d.uid,
    uid: d.uid,
  }
}

function getLabel(type: string | undefined, specs: any) {
  /* istanbul ignore else */
  switch (type) {
    case 'cluster':
      return specs.clustersNames.length === 1 ? specs.clustersNames[0] : 'Multiple Clusters'
    case 'applicationset':
      return `${specs.isAppSetPullModel ? 'Pull' : 'Push'} Application Set`
    default:
      if (type) {
        return capitalize(type).replace('Argocd', 'Argo CD').replace('Ocpa', 'OCP A')
      } else {
        return ''
      }
  }
}

const getStatus = (node: {
  type: any
  specs?: { clusterStatus: { hasWarning: any; hasFailure: any; isDisabled: any; hasViolations: any; isOffline: any } }
}) => {
  const { type, specs } = node

  // status icon
  let status
  let statusIcon = statusToIconMap['spinner']
  let disabled = false
  if (type === 'cluster') {
    // determine icon
    if (/* istanbul ignore next */ specs?.clusterStatus) {
      const { hasWarning, hasFailure, isDisabled, hasViolations, isOffline } = specs.clusterStatus
      status = NodeStatus.success
      if (hasFailure || hasViolations || isOffline) {
        status = NodeStatus.danger
        statusIcon = statusToIconMap['error']
      } else if (hasWarning) {
        status = NodeStatus.warning
        statusIcon = statusToIconMap['warning']
      }
      disabled = isDisabled
    }
  }

  const pulse = get(node, 'specs.pulse', '')

  switch (pulse) {
    case 'red':
      status = NodeStatus.danger
      statusIcon = statusToIconMap['error']
      break
    case 'yellow':
      status = NodeStatus.warning
      statusIcon = statusToIconMap['warning']
      break
    case 'orange':
      status = NodeStatus.default
      statusIcon = statusToIconMap['pending']
      break
    case 'green':
      status = NodeStatus.success
      statusIcon = statusToIconMap['success']
      break
    case 'spinner':
      status = NodeStatus.default
      statusIcon = statusToIconMap['spinner']
      break
    case 'blocked':
      status = NodeStatus.success
      statusIcon = statusToIconMap['blocked']
      break
    /* istanbul ignore next */
    default:
      break
  }

  return { status, statusIcon, isDisabled: disabled }
}
