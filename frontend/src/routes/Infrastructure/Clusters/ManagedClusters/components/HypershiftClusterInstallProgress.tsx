/* Copyright Contributors to the Open Cluster Management project */
import { ProgressStepper, Stack, StackItem } from '@patternfly/react-core'
import {
    HostedClusterK8sResource,
    NodePoolK8sResource,
    SecretK8sResource,
    ClusterImageSetK8sResource,
} from 'openshift-assisted-ui-lib/cim'
import HypershiftKubeconfigDownload from './HypershiftKubeconfigDownload'
import HostedClusterProgress from './HostedClusterProgress'
import NodePoolsProgress from './NodePoolsProgress'

import './HypershiftClusterInstallProgress.css'

type HypershiftClusterInstallProgressProps = {
    hostedCluster: HostedClusterK8sResource
    fetchSecret: (name: string, namespace: string) => Promise<SecretK8sResource>
    nodePools: NodePoolK8sResource[]
    clusterImages: ClusterImageSetK8sResource[]
    launchToOCP: (urlSuffix: string, newTab: boolean) => void
}

const HypershiftClusterInstallProgress = ({
    hostedCluster,
    fetchSecret,
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
        <StackItem>
            <HypershiftKubeconfigDownload hostedCluster={hostedCluster} fetchSecret={fetchSecret} />
        </StackItem>
    </Stack>
)

export default HypershiftClusterInstallProgress
