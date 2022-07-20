/* Copyright Contributors to the Open Cluster Management project */
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'
import { useContext } from 'react'
import { ClusterInstallationProgress } from 'openshift-assisted-ui-lib/cim'
import { useRecoilValue, waitForAll } from 'recoil'
import { agentMachinesState, clusterImageSetsState, nodePoolsState } from '../../../../../../atoms'
import { createResource, deleteResource, getResource, patchResource } from '../../../../../../resources'
import { AcmExpandableCard } from '../../../../../../ui-components'
import { launchToOCP } from '../../../../../../lib/ocp-utils'

const AIHypershiftClusterDetails: React.FC = () => {
    const { hostedCluster, agents } = useContext(ClusterContext)

    const [nodePools, clusterImageSets, agentMachines] = useRecoilValue(
        waitForAll([nodePoolsState, clusterImageSetsState, agentMachinesState])
    )

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
                        agents={agents || []}
                        agentMachines={agentMachines}
                        hostedCluster={hostedCluster}
                        fetchSecret={(name, namespace) =>
                            getResource({ kind: 'Secret', apiVersion: 'v1', metadata: { name, namespace } }).promise
                        }
                        nodePools={clusterNodePools}
                        clusterImages={clusterImageSets}
                        onRemoveNodePool={(np) => deleteResource(np).promise}
                        onUpdateNodePool={(nodePool, patches) => patchResource(nodePool, patches).promise}
                        onAddNodePool={(nodePool) => createResource(nodePool).promise}
                        launchToOCP={launchToOCP}
                    />
                </AcmExpandableCard>
            </div>
        </>
    )
}

export default AIHypershiftClusterDetails
