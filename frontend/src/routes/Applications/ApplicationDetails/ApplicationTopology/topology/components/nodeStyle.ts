/* Copyright Contributors to the Open Cluster Management project */
import { NodeStatus } from '@patternfly/react-topology'
import capitalize from 'lodash/capitalize'
import get from 'lodash/get'
import { typeToIconMap } from './nodeIconsMap'
import { statusToIconMap } from './nodeStatusIconMap'
import './nodeStatusIcons.css'

export const NODE_WIDTH = 65
export const NODE_HEIGHT = 65
export const X_SPACER = 70
export const Y_SPACER = 60
const MAX_LABEL_WIDTH = 18

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
    const shape = typeToIconMap[type]?.shape || 'customresource'

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
    if (type !== undefined) {
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
    if (get(node, 'type', '') !== 'cluster' || get(node, 'specs.clusterNames', []).length === 1) {
        label = node?.name ?? ''
        if (label.length > MAX_LABEL_WIDTH) {
            label = label.substr(0, MAX_LABEL_WIDTH / 3) + '..' + label.substr((-MAX_LABEL_WIDTH * 2) / 3)
        }
    }
    return label
}

const getStatus = (node: {
    type: any
    specs?:
        | { clusterStatus: { hasWarning: any; hasFailure: any; isDisabled: any; hasViolations: any; isOffline: any } }
        | undefined
}) => {
    const { type, specs } = node

    // status icon
    let status
    let statusIcon = statusToIconMap['pending']
    let disabled = false
    if (type === 'cluster') {
        // determine icon
        if (specs?.clusterStatus) {
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
        default:
            break
    }

    return { status, statusIcon, isDisabled: disabled }
}

// export const getType = (type: string | undefined) => {
//     return capitalize(startCase(type))
// }

// export const getNodeLabel = (node: { type: string | undefined }) => {
//     let label = getType(node.type)

//     if (label === 'Cluster') {
//         const nbOfClusters = _.get(node, 'specs.clusterNames', []).length
//         if (nbOfClusters > 1) {
//             label = `${nbOfClusters} Clusters`
//         }
//     }

//     return label
// }
