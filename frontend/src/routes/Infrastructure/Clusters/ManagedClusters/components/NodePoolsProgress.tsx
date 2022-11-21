/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { ExpandableSectionToggle, ProgressStep, Spinner, Stack, StackItem } from '@patternfly/react-core'
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens'
import { CheckCircleIcon, InProgressIcon } from '@patternfly/react-icons'
import { NodePoolK8sResource, ClusterImageSetK8sResource } from 'openshift-assisted-ui-lib/cim'
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

export const getNodePoolsStatus = (nodePools: NodePoolK8sResource[], t: TFunction): React.ReactNode => {
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
        if (status.type === 'pending') {
            nodePoolsStatus.type = 'pending'
            nodePoolsStatus.icon = <Spinner size="md" />
        }
    }
    return nodePoolsStatus.icon
}

type NodePoolsProgressProps = {
    nodePools: NodePoolK8sResource[]
    clusterImages: ClusterImageSetK8sResource[]
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
                        {t('Cluster node pools')}
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
