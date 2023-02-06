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
import { createContext, useState } from 'react'

type HypershiftClusterInstallProgressProps = {
  hostedCluster: HostedClusterK8sResource
  nodePools: NodePoolK8sResource[]
  clusterImages: ClusterImageSetK8sResource[]
}

export const NodePoolTableWidthContext = createContext(1024)

const HypershiftClusterInstallProgress = ({ hostedCluster, ...rest }: HypershiftClusterInstallProgressProps) => {
  const [width, setWidth] = useState<number>(1024)

  setWidth(1024)

  return (
    <Stack hasGutter>
      <StackItem>
        <ProgressStepper isVertical>
          <HostedClusterProgress hostedCluster={hostedCluster} />
        </ProgressStepper>
        <ProgressStepper isVertical>
          <NodePoolTableWidthContext.Provider value={width}>
            <NodePoolsProgress {...rest} />
          </NodePoolTableWidthContext.Provider>
        </ProgressStepper>
      </StackItem>
    </Stack>
  )
}

export default HypershiftClusterInstallProgress
