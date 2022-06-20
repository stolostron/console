/* Copyright Contributors to the Open Cluster Management project */
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'
import { useContext } from 'react'
import { AcmExpandableCard } from '@stolostron/ui-components'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue, waitForAll } from 'recoil'
import { clusterImageSetsState, nodePoolsState } from '../../../../../../atoms'
import { createResource, deleteResource, getResource, patchResource } from '../../../../../../resources'

const { ClusterInstallationProgress } = CIM

const AIHypershiftClusterDetails: React.FC = () => {
    const { hostedCluster, agents } = useContext(ClusterContext)

    const [nodePools, clusterImageSets] = useRecoilValue(waitForAll([nodePoolsState, clusterImageSetsState]))

    const clusterNodePools = nodePools.filter(
        (np) =>
            np.metadata.namespace === hostedCluster?.metadata.namespace &&
            np.spec.clusterName === hostedCluster?.metadata.name
    )

    return (
        <>
            <div style={{ marginBottom: '24px' }}>
                <AcmExpandableCard title="Cluster installation progress" id="aiprogress">
                    <ClusterInstallationProgress
                        agents={agents}
                        hostedCluster={hostedCluster}
                        fetchSecret={(name, namespace) =>
                            getResource({ kind: 'Secret', apiVersion: 'v1', metadata: { name, namespace } }).promise
                        }
                        nodePools={clusterNodePools}
                        clusterImages={clusterImageSets}
                        onRemoveNodePool={(np) => {
                            const agentsToPatch = agents?.filter(
                                (a) =>
                                    a.metadata.labels?.[
                                        'agentclusterinstalls.extensions.hive.openshift.io/nodePool'
                                    ] === np.metadata.name ||
                                    a.metadata.labels?.[
                                        'agentclusterinstalls.extensions.hive.openshift.io/nodePoolNs'
                                    ] === np.metadata.namespace
                            )
                            agentsToPatch?.forEach((a) => {
                                const newLabels = { ...(a.metadata.labels || {}) }
                                delete newLabels['agentclusterinstalls.extensions.hive.openshift.io/nodePool']
                                delete newLabels['agentclusterinstalls.extensions.hive.openshift.io/nodePoolNs']
                                const patches = [
                                    {
                                        op: a.metadata.labels ? 'replace' : 'add',
                                        path: '/metadata/labels',
                                        value: newLabels,
                                    }
                                ] as any[];
                                if (a.spec.clusterDeploymentName) {
                                    patches.push({
                                        op: 'remove',
                                        path: '/spec/clusterDeploymentName',
                                    })
                                }
                                patchResource(a, patches).promise
                            })
                            return deleteResource(np).promise
                        }}
                        onUpdateNodePool={async (nodePool, newAgents) => {
                            const agentsToPatch = newAgents.filter(
                                (a) =>
                                    a.metadata.labels?.[
                                        'agentclusterinstalls.extensions.hive.openshift.io/nodePool'
                                    ] !== nodePool.metadata.name ||
                                    a.metadata.labels?.[
                                        'agentclusterinstalls.extensions.hive.openshift.io/nodePoolNs'
                                    ] !== nodePool.metadata.namespace
                            )
                            const uids = newAgents.map((a) => a.metadata.uid)
                            const agentsToRemove = agents?.filter(
                                (a) =>
                                    !uids.includes(a.metadata.uid) &&
                                    a.metadata.labels?.[
                                        'agentclusterinstalls.extensions.hive.openshift.io/nodePool'
                                    ] === nodePool.metadata.name &&
                                    a.metadata.labels?.[
                                        'agentclusterinstalls.extensions.hive.openshift.io/nodePoolNs'
                                    ] === nodePool.metadata.namespace
                            )

                            agentsToPatch.forEach((a) => {
                                patchResource(a, [
                                    {
                                        op: a.metadata.labels ? 'replace' : 'add',
                                        path: '/metadata/labels',
                                        value: {
                                            ...(a.metadata.labels || {}),
                                            'agentclusterinstalls.extensions.hive.openshift.io/nodePool':
                                                nodePool.metadata.name,
                                            'agentclusterinstalls.extensions.hive.openshift.io/nodePoolNs':
                                                nodePool.metadata.namespace,
                                        },
                                    },
                                ]).promise
                            })
                            agentsToRemove?.forEach((a) => {
                                const newLabels = { ...(a.metadata.labels || {}) }
                                delete newLabels['agentclusterinstalls.extensions.hive.openshift.io/nodePool']
                                delete newLabels['agentclusterinstalls.extensions.hive.openshift.io/nodePoolNs']

                                const patches = [
                                    {
                                        op: a.metadata.labels ? 'replace' : 'add',
                                        path: '/metadata/labels',
                                        value: newLabels,
                                    }
                                ] as any[]
                                if (a.spec.clusterDeploymentName) {
                                    patches.push({
                                        op: 'remove',
                                        path: '/spec/clusterDeploymentName',
                                    })
                                }

                                patchResource(a, patches).promise
                            })
                            if (nodePool.spec.replicas !== newAgents.length) {
                                await patchResource(nodePool, [
                                    {
                                        op: 'replace',
                                        path: '/spec/replicas',
                                        value: newAgents.length,
                                    },
                                ]).promise
                            }
                        }}
                        onAddNodePool={async (nodePool, selectedAgents, matchLabels) => {
                            await createResource(nodePool).promise
                            selectedAgents.forEach((a) => {
                                patchResource(a, [
                                    {
                                        op: a.metadata.labels ? 'replace' : 'add',
                                        path: '/metadata/labels',
                                        value: {
                                            ...(a.metadata.labels || {}),
                                            ...matchLabels,
                                        },
                                    },
                                ]).promise
                            })
                        }}
                    />
                </AcmExpandableCard>
            </div>
        </>
    )
}

export default AIHypershiftClusterDetails
