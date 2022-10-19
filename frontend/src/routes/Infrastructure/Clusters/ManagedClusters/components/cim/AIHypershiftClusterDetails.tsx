/* Copyright Contributors to the Open Cluster Management project */
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'
import { useContext } from 'react'
import { ClusterInstallationProgress, getSupportedCM } from 'openshift-assisted-ui-lib/cim'
import { createResource, deleteResource, getResource, patchResource } from '../../../../../../resources'
import { AcmExpandableCard } from '../../../../../../ui-components'
import { launchToOCP } from '../../../../../../lib/ocp-utils'
import { useSharedAtoms, useSharedRecoil, useRecoilValue } from '../../../../../../shared-recoil'

const AIHypershiftClusterDetails: React.FC = () => {
    const { hostedCluster, agents } = useContext(ClusterContext)
    const { waitForAll } = useSharedRecoil()

    const { agentMachinesState, clusterImageSetsState, configMapsState, nodePoolsState } = useSharedAtoms()
    const [nodePools, clusterImageSets, agentMachines, configMaps] = useRecoilValue(
        waitForAll([nodePoolsState, clusterImageSetsState, agentMachinesState, configMapsState])
    )

    const clusterNodePools = nodePools.filter(
        (np) =>
            np.metadata.namespace === hostedCluster?.metadata.namespace &&
            np.spec.clusterName === hostedCluster?.metadata.name
    )

    const supportedVersionsCM = getSupportedCM(configMaps)

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
                        launchToOCP={(url, newTab) =>
                            launchToOCP(url, newTab, () => window.open(`${window.location.origin}/${url}`))
                        }
                        supportedVersionsCM={supportedVersionsCM}
                    />
                </AcmExpandableCard>
            </div>
        </>
    )
}

export default AIHypershiftClusterDetails
