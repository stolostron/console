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
}: HypershiftClusterInstallProgressProps) => (
    <Stack hasGutter>
        <StackItem>
            <ProgressStepper isVertical>
                <HostedClusterProgress hostedCluster={hostedCluster} launchToOCP={launchToOCP} />
                <NodePoolsProgress {...rest} />
            </ProgressStepper>
        </StackItem>
    </Stack>
)

export default HypershiftClusterInstallProgress
