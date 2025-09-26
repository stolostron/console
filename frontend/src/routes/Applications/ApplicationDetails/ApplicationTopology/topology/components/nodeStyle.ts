/* Copyright Contributors to the Open Cluster Management project */
import capitalize from 'lodash/capitalize'
import get from 'lodash/get'
import { typeToIconMap } from './nodeIconsMap'
import { statusToIconMap } from './nodeStatusIconMap'
import './nodeStatusIcons.css'

export const NODE_WIDTH = 65
export const NODE_HEIGHT = 65
export const X_SPACER = 80
export const Y_SPACER = 60
const MAX_LABEL_WIDTH = 18

// 4.86 '@patternfly/react-topology'
import { NodeStatus } from './future/types'

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
  const label = getLabel(type)
  const secondaryLabel = getSecondaryLabel(d)
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
    secondaryLabel,
    isDisabled,
    id: d.uid,
    uid: d.uid,
  }
}

function getLabel(type: string | undefined) {
  /* istanbul ignore else */ if (type !== undefined) {
    const label = capitalize(type)
      .replace('Ocpa', 'OCP A')
      .replace('stream', 'Stream')
      .replace('channel', 'Channel')
      .replace('source', 'Source')
      .replace('reSource', 'Resource')
      .replace('definition', 'Definition')
      .replace('config', 'Config')
      .replace('account', 'Account')
      .replace('controller', 'Controller')
    return label
  } else {
    return ''
  }
}

function getSecondaryLabel(node: { name: any }) {
  let label = ''
  /* istanbul ignore if */
  if (get(node, 'type', '') !== 'cluster' || get(node, 'specs.clusterNames', []).length === 1) {
    label = node?.name ?? ''
    if (label.length > MAX_LABEL_WIDTH) {
      label = label.slice(0, MAX_LABEL_WIDTH / 3) + '..' + label.slice((-MAX_LABEL_WIDTH * 2) / 3)
    }
  }
  return label
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
