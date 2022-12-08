/* Copyright Contributors to the Open Cluster Management project */
import { NodeStatus } from './types'
import styles from '@patternfly/react-styles/css/components/Topology/topology-components'

export const StatusModifier = {
    [NodeStatus.default]: '',
    [NodeStatus.info]: styles.modifiers.info,
    [NodeStatus.success]: styles.modifiers.success,
    [NodeStatus.warning]: styles.modifiers.warning,
    [NodeStatus.danger]: styles.modifiers.danger,
}
