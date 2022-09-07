/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { ExpandableSectionToggle, ProgressStep, Spinner, Stack, StackItem } from '@patternfly/react-core'
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens'
import { CheckCircleIcon, InProgressIcon } from '@patternfly/react-icons'
import { NodePoolK8sResource, ClusterImageSetK8sResource, ConfigMapK8sResource } from 'openshift-assisted-ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { TFunction } from 'i18next'
import NodePoolsTable from './NodePoolsTable'
import './HypershiftClusterInstallProgress.css'

export type NodePoolStatus = {
    type: 'error' | 'pending' | 'ok' | 'warning'
    text: string
    icon: React.ReactNode
}

export const getNodePoolStatus = (nodePool: NodePoolK8sResource, t: TFunction): NodePoolStatus => {
    return nodePool.status?.conditions?.find(({ type }: { type: string }) => type === 'Ready')?.status === 'True'
        ? {
              type: 'ok',
              icon: <CheckCircleIcon color={okColor.value} />,
              text: t('Ready'),
          }
        : {
              type: 'pending',
              icon: <InProgressIcon />,
              text: t('Not ready'),
          }
}

const getNodePoolsStatus = (nodePools: NodePoolK8sResource[], t: TFunction): React.ReactNode => {
    const nodePoolMap = nodePools.reduce<{
        [key: string]: { status: NodePoolStatus }
    }>((acc, np) => {
        const status = getNodePoolStatus(np, t)
        acc[np.metadata?.uid || ''] = {
            status,
        }
        return acc
    }, {})

    const nodePoolsStatus: { type: string; icon: React.ReactNode } = {
        type: 'ok',
        icon: <CheckCircleIcon color={okColor.value} />,
    }

    for (const property in nodePoolMap) {
        const { status } = nodePoolMap[property]
        if (status.type === 'error') {
            nodePoolsStatus.type = 'error'
            nodePoolsStatus.icon = status.icon
            break
        }
        if (status.type === 'warning') {
            nodePoolsStatus.type = 'warning'
            nodePoolsStatus.icon = status.icon
        }
        if (status.type === 'pending' && nodePoolsStatus.type !== 'warning') {
            nodePoolsStatus.type = 'pending'
            nodePoolsStatus.icon = <Spinner size="md" />
        }
    }
    return nodePoolsStatus.icon
}

type NodePoolsProgressProps = {
    nodePools: NodePoolK8sResource[]
    onRemoveNodePool: (nodePool: NodePoolK8sResource) => Promise<unknown>
    onUpdateNodePool: (
        nodePool: NodePoolK8sResource,
        nodePoolPatches: {
            op: string
            value: unknown
            path: string
        }[]
    ) => Promise<void>
    onAddNodePool: (nodePool: NodePoolK8sResource) => Promise<void>
    clusterImages: ClusterImageSetK8sResource[]
    supportedVersionsCM?: ConfigMapK8sResource
}

const NodePoolsProgress = ({ nodePools, ...rest }: NodePoolsProgressProps) => {
    const { t } = useTranslation()
    const [isExpanded, setExpanded] = React.useState(true)

    return (
        <ProgressStep icon={getNodePoolsStatus(nodePools, t)}>
            <Stack hasGutter>
                <StackItem>
                    <ExpandableSectionToggle
                        isExpanded={isExpanded}
                        onToggle={setExpanded}
                        className="nodepool-progress-item__header"
                    >
                        {t('Cluster nodepools')}
                    </ExpandableSectionToggle>
                </StackItem>
                {isExpanded && (
                    <StackItem className="nodepool-progress-item__body">
                        <NodePoolsTable nodePools={nodePools} {...rest} />
                    </StackItem>
                )}
            </Stack>
        </ProgressStep>
    )
}

export default NodePoolsProgress
