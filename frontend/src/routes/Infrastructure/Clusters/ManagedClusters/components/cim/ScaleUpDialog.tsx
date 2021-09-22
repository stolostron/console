/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, waitForAll } from 'recoil'
import { useParams } from 'react-router'
import { CIM } from 'openshift-assisted-ui-lib'
import { agentsState, clusterDeploymentsState } from '../../../../../../atoms'
import { AgentK8sResource } from 'openshift-assisted-ui-lib/dist/src/cim'
import { patchResource } from '../../../../../../resources/utils/resource-request'

const { ScaleUpModal } = CIM

type ScaleUpDialogProps = {
    isOpen: boolean
    closeDialog: VoidFunction
}

const ScaleUpDialog = ({ isOpen, closeDialog }: ScaleUpDialogProps) => {
    const { id: clusterId } = useParams<{ id?: string }>()
    const [clusterDeployments, agents] = useRecoilValue(waitForAll([clusterDeploymentsState, agentsState]))

    const clusterDeployment = clusterDeployments.find(
        (cd) => cd.metadata.name === clusterId && cd.metadata.namespace === clusterId
    )

    const addHostsToCluster = async (agentsToAdd: AgentK8sResource[]) => {
        const name = clusterDeployment?.metadata?.name
        const namespace = clusterDeployment?.metadata?.namespace
        await Promise.all(
            agentsToAdd.map((agent) => {
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
        )
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
