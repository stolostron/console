/* Copyright Contributors to the Open Cluster Management project */
import { ProgressStepper, Stack, StackItem } from '@patternfly/react-core'
import {
    HostedClusterK8sResource,
    NodePoolK8sResource,
    ClusterImageSetK8sResource,
} from 'openshift-assisted-ui-lib/cim'
import HostedClusterProgress from './HostedClusterProgress'
import NodePoolsProgress from './NodePoolsProgress'

import './HypershiftClusterInstallProgress.css'
import { useCallback, useState } from 'react'

type HypershiftClusterInstallProgressProps = {
    hostedCluster: HostedClusterK8sResource
    nodePools: NodePoolK8sResource[]
    clusterImages: ClusterImageSetK8sResource[]
    launchToOCP: (urlSuffix: string, newTab: boolean) => void
}

const HypershiftClusterInstallProgress = ({
    hostedCluster,
    launchToOCP,
    ...rest
}: HypershiftClusterInstallProgressProps) => {
    const [nodePoolTableWidth, setNodePoolTableWidth] = useState<number>()
    const useNodePoolTableWidthCallback = () => {
        const setRef = useCallback((node) => {
            if (node) {
                setNodePoolTableWidth(node.offsetWidth * 0.95)
            }
        }, [])

        return [setRef]
    }

    const [nodePoolTableWidthRef] = useNodePoolTableWidthCallback()

    return (
        <Stack hasGutter>
            <div id="hypershift-cluster-install-progress" ref={nodePoolTableWidthRef}>
                <StackItem>
                    <ProgressStepper isVertical>
                        <HostedClusterProgress hostedCluster={hostedCluster} launchToOCP={launchToOCP} />
                        <NodePoolsProgress {...rest} nodePoolTableWidth={nodePoolTableWidth} />
                    </ProgressStepper>
                </StackItem>
            </div>
        </Stack>
    )
}

export default HypershiftClusterInstallProgress
