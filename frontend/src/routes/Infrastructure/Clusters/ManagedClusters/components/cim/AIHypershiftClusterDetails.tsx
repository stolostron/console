/* Copyright Contributors to the Open Cluster Management project */
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'
import { useContext } from 'react'
import {
  ClusterInstallationProgress,
  ConfigMapK8sResource,
  getSupportedCM,
  HostedClusterK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { createResource, deleteResource, getResource, IResource, patchResource } from '../../../../../../resources'
import { AcmExpandableCard } from '../../../../../../ui-components'
import { launchToOCP } from '../../../../../../lib/ocp-utils'
import { useSharedAtoms, useRecoilValue } from '../../../../../../shared-recoil'

const AIHypershiftClusterDetails: React.FC = () => {
  const { hostedCluster, agents } = useContext(ClusterContext)

  const { agentMachinesState, configMapsState, nodePoolsState } = useSharedAtoms()
  const nodePools = useRecoilValue(nodePoolsState)
  const agentMachines = useRecoilValue(agentMachinesState)
  const configMaps = useRecoilValue(configMapsState)

  const clusterNodePools = nodePools.filter(
    (np) =>
      np.metadata?.namespace === hostedCluster?.metadata?.namespace &&
      np.spec.clusterName === hostedCluster?.metadata?.name
  )

  const supportedVersionsCM = getSupportedCM(configMaps as ConfigMapK8sResource[])

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <AcmExpandableCard title="Cluster installation progress" id="aiprogress">
          <ClusterInstallationProgress
            agents={agents || []}
            agentMachines={agentMachines}
            hostedCluster={hostedCluster as HostedClusterK8sResource}
            fetchSecret={(name, namespace) =>
              getResource({ kind: 'Secret', apiVersion: 'v1', metadata: { name, namespace } }).promise
            }
            nodePools={clusterNodePools}
            onRemoveNodePool={(np) => deleteResource(np as IResource).promise}
            onUpdateNodePool={(nodePool, patches) => patchResource(nodePool as IResource, patches).promise}
            onAddNodePool={(nodePool) => createResource(nodePool as IResource).promise}
            launchToOCP={(url) => launchToOCP(url)}
            supportedVersionsCM={supportedVersionsCM}
          />
        </AcmExpandableCard>
      </div>
    </>
  )
}

export default AIHypershiftClusterDetails
