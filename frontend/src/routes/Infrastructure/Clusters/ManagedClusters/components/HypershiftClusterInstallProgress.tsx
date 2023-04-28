/* Copyright Contributors to the Open Cluster Management project */
import { ProgressStepper, Stack, StackItem } from '@patternfly/react-core'
import {
  HostedClusterK8sResource,
  NodePoolK8sResource,
  ClusterImageSetK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import HostedClusterProgress from './HostedClusterProgress'
import NodePoolsProgress from './NodePoolsProgress'

import './HypershiftClusterInstallProgress.css'
import { createContext, useEffect, useLayoutEffect, useRef, useState } from 'react'

type HypershiftClusterInstallProgressProps = {
  hostedCluster: HostedClusterK8sResource
  nodePools: NodePoolK8sResource[]
  clusterImages: ClusterImageSetK8sResource[]
  handleModalToggle: () => void
}

export const NodePoolTableWidthContext = createContext(1024)

const percentWidth = 0.9

const HypershiftClusterInstallProgress = ({
  hostedCluster,
  handleModalToggle,
  ...rest
}: HypershiftClusterInstallProgressProps) => {
  const [width, setWidth] = useState<number>(1024)

  const nodePoolTableWidthRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    /* istanbul ignore if */
    if (nodePoolTableWidthRef.current?.clientWidth) setWidth(nodePoolTableWidthRef.current.clientWidth * percentWidth)
  }, [])

  useEffect(() => {
    function handleWindowResize() {
      /* istanbul ignore if */
      if (nodePoolTableWidthRef.current?.clientWidth)
        setWidth(nodePoolTableWidthRef.current?.clientWidth * percentWidth)
    }

    window.addEventListener('resize', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [])

  return (
    <Stack hasGutter>
      <div id="hypershift-cluster-install-progress" ref={nodePoolTableWidthRef}>
        <StackItem>
          <ProgressStepper isVertical>
            <HostedClusterProgress hostedCluster={hostedCluster} handleModalToggle={handleModalToggle} />
          </ProgressStepper>
          <ProgressStepper isVertical>
            <NodePoolTableWidthContext.Provider value={width}>
              <NodePoolsProgress {...rest} />
            </NodePoolTableWidthContext.Provider>
          </ProgressStepper>
        </StackItem>
      </div>
    </Stack>
  )
}

export default HypershiftClusterInstallProgress
