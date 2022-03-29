/* Copyright Contributors to the Open Cluster Management project */
import { useCallback } from 'react'
import { useRecoilValue, waitForAll } from 'recoil'
import { CIM } from 'openshift-assisted-ui-lib'

import { agentsState } from '../../../../../../atoms'
import { patchResource } from '../../../../../../resources/utils/resource-request'
import { useClusterDeployment, onSaveAgent } from '../../CreateCluster/components/assisted-installer/utils'

const { ScaleUpModal } = CIM

type ScaleUpDialogProps = {
    isOpen: boolean
    closeDialog: VoidFunction
    clusterName?: string
}

const ScaleUpDialog = ({ isOpen, closeDialog, clusterName }: ScaleUpDialogProps) => {
    const [agents] = useRecoilValue(waitForAll([agentsState]))
    const clusterDeployment = useClusterDeployment({ name: clusterName, namespace: clusterName })
    console.log('--- clusterDeployment: ', clusterDeployment)

    const addHostsToCluster = useCallback(
        async (agentsToAdd: CIM.AgentK8sResource[]) => {
            const name = clusterDeployment?.metadata?.name
            const namespace = clusterDeployment?.metadata?.namespace

            if (!name || !namespace) throw new Error(`The cluster deployment ${clusterName} does not exist.`)

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

            await Promise.all(promises)
        },
        [clusterDeployment, clusterName]
    )

    if (!clusterName || !isOpen || !clusterDeployment || !agents) {
        return null
    }

    return (
        <ScaleUpModal
            isOpen={isOpen}
            onClose={closeDialog}
            clusterDeployment={clusterDeployment}
            agents={agents}
            addHostsToCluster={addHostsToCluster}
            onChangeHostname={onSaveAgent}
        />
    )
}

export default ScaleUpDialog
