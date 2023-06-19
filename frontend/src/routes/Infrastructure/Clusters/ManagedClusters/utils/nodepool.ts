/* Copyright Contributors to the Open Cluster Management project */

import {
    AgentK8sResource,
    AgentMachineK8sResource,
    HostedClusterK8sResource,
    NodePoolK8sResource,
} from '@openshift-assisted/ui-lib/cim'

const CLUSTER_NAME_LABEL = 'cluster.x-k8s.io/cluster-name'
const NODEPOOL_NAME_ANNOTATION = 'cluster.x-k8s.io/cloned-from-name'

export const getNodepoolAgents = (
    nodePool: NodePoolK8sResource,
    agents: AgentK8sResource[] | undefined,
    agentMachines: AgentMachineK8sResource[] | undefined,
    hostedCluster: HostedClusterK8sResource
) => {
    if (!agents || !agentMachines) {
        return []
    }
    const nodePoolAgentMachines = agentMachines
        .filter(
            (am) =>
                am.metadata?.namespace ===
                    `${hostedCluster.metadata?.namespace || ''}-${hostedCluster.metadata?.name || ''}` &&
                am.metadata?.labels?.[CLUSTER_NAME_LABEL] === hostedCluster.metadata?.name &&
                am.metadata?.annotations?.[NODEPOOL_NAME_ANNOTATION] === nodePool.metadata?.name &&
                am.status?.agentRef?.name &&
                am.status?.agentRef?.namespace
        )
        .reduce((acc, curr) => {
            acc[curr.status?.agentRef?.name || ''] = curr.status?.agentRef?.namespace
            return acc
        }, {} as { [key: string]: string | undefined })

    return agents.filter((a) => nodePoolAgentMachines[a.metadata?.name || ''] === a.metadata?.namespace)
}
