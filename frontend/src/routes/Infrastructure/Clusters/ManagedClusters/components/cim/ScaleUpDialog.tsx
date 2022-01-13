/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, waitForAll } from 'recoil'
import { useParams } from 'react-router'
import { CIM } from 'openshift-assisted-ui-lib'

import { agentsState } from '../../../../../../atoms'
import { patchResource } from '../../../../../../resources/utils/resource-request'
import {
    useClusterDeployment,
    useAgentClusterInstall,
    setProvisionRequirements,
} from '../../CreateCluster/components/assisted-installer/utils'

const { ScaleUpModal } = CIM

type ScaleUpDialogProps = {
    isOpen: boolean
    closeDialog: VoidFunction
}

const ScaleUpDialog = ({ isOpen, closeDialog }: ScaleUpDialogProps) => {
    const { id: clusterId } = useParams<{ id?: string }>()
    const [agents] = useRecoilValue(waitForAll([agentsState]))

    const clusterDeployment = useClusterDeployment({ name: clusterId, namespace: clusterId })
    const agentClusterInstall = useAgentClusterInstall({ name: clusterId, namespace: clusterId })

    const addHostsToCluster = async (agentsToAdd: CIM.AgentK8sResource[]) => {
        const name = clusterDeployment?.metadata?.name
        const namespace = clusterDeployment?.metadata?.namespace

        const promises = agentsToAdd.map((agent) => {
            return patchResource(agent, [
                {
                    op: agent.spec?.clusterDeploymentName ? 'replace' : 'add',
                    path: '/spec/clusterDeploymentName',
                    value: {
                        name,
                        namespace,
                    },
                },
                {
                    op: 'replace',
                    path: '/spec/role',
                    value: 'worker',
                },
            ]).promise
        })

        const masterCount = agentClusterInstall?.spec?.provisionRequirements?.controlPlaneAgents
        if (masterCount) {
            const workerCount = (agentClusterInstall.spec.provisionRequirements.workerAgents || 0) + agentsToAdd.length
            promises.push(setProvisionRequirements(agentClusterInstall, workerCount, masterCount))
        }

        await Promise.all(promises)
    }

    return (
        <ScaleUpModal
            isOpen={isOpen}
            onClose={closeDialog}
            clusterDeployment={clusterDeployment}
            agents={agents}
            addHostsToCluster={addHostsToCluster}
        />
    )
}

export default ScaleUpDialog
