/* Copyright Contributors to the Open Cluster Management project */
import { noop } from 'lodash'
import React from 'react'

export type NodePoolFormValue = {
  clusterName: string
  releaseImage: string
  nodePoolName: string
  count: number
  useAutoscaling: boolean
  autoscaling: {
    minReplicas: number
    maxReplicas: number
  }
  agentLabels: { key: string; value: string }[]
}

export type HypershiftAgentContextType = {
  controllerAvailabilityPolicy: string
  setControllerAvailabilityPolicy: (policy: string) => void
  nodePools?: NodePoolFormValue[]
  setNodePools: (nodePools: any) => void
  isAdvancedNetworking: boolean
  setIsAdvancedNetworking: (isAdvanced: boolean) => void
  clusterName: string
  setClusterName: (name: string) => void
  releaseImage: string
  setReleaseImage: (img: string) => void
  infraEnvNamespace: string
  setInfraEnvNamespace: (ns: string) => void
  sshPublicKey: string
  setSshPublicKey: (key: string) => void
}

export const HypershiftAgentContext = React.createContext<HypershiftAgentContextType>({
  controllerAvailabilityPolicy: '',
  setControllerAvailabilityPolicy: noop,
  nodePools: [],
  setNodePools: noop,
  isAdvancedNetworking: false,
  setIsAdvancedNetworking: noop,
  clusterName: '',
  setClusterName: noop,
  releaseImage: '',
  setReleaseImage: noop,
  infraEnvNamespace: '',
  setInfraEnvNamespace: noop,
  sshPublicKey: '',
  setSshPublicKey: noop,
})

export const useHypershiftContextValues = (): HypershiftAgentContextType => {
  const [nodePools, setNodePools] = React.useState()
  const [isAdvancedNetworking, setIsAdvancedNetworking] = React.useState(false)
  const [clusterName, setClusterName] = React.useState('')
  const [releaseImage, setReleaseImage] = React.useState('')
  const [infraEnvNamespace, setInfraEnvNamespace] = React.useState('')
  const [sshPublicKey, setSshPublicKey] = React.useState('')
  const [controllerAvailabilityPolicy, setControllerAvailabilityPolicy] = React.useState('')

  return {
    controllerAvailabilityPolicy,
    setControllerAvailabilityPolicy,
    nodePools,
    setNodePools,
    isAdvancedNetworking,
    setIsAdvancedNetworking,
    clusterName,
    setClusterName,
    releaseImage,
    setReleaseImage,
    infraEnvNamespace,
    setInfraEnvNamespace,
    sshPublicKey,
    setSshPublicKey,
  }
}
