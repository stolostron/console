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
}

const HypershiftClusterInstallProgress = ({ hostedCluster, ...rest }: HypershiftClusterInstallProgressProps) => (
  <Stack hasGutter>
    <StackItem>
      <ProgressStepper isVertical>
        <HostedClusterProgress hostedCluster={hostedCluster} />
        <NodePoolsProgress {...rest} />
      </ProgressStepper>
    </StackItem>
  </Stack>
)

export default HypershiftClusterInstallProgress
