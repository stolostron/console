/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useState } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue, waitForAll } from 'recoil'
import { NetworkConfigurationValues } from 'openshift-assisted-ui-lib/dist/src/common/types/clusters'
import { patchResource, ClusterDeploymentKind } from '../../../../../../../resources'

import { agentClusterInstallsState, agentsState, clusterDeploymentsState } from '../../../../../../../atoms'

const { ACMClusterDeploymentNetworkingStep, LoadingState, EditAgentModal } = CIM

type FormControl = {
    active: NetworkConfigurationValues
    agentClusterInstall: CIM.AgentClusterInstallK8sResource
}

type NetworkFormProps = {
    control: FormControl
    handleCreateResource: (redirect: boolean) => any
    handleChange: (control: FormControl) => void
}

const NetworkForm: React.FC<NetworkFormProps> = ({ control, handleCreateResource, handleChange }) => {
    const [resourceJSON, setResourceJSON] = useState<any>()
    const [editAgent, setEditAgent] = useState()

    useEffect(() => {
        const resource = handleCreateResource(true) //await
        setResourceJSON(resource)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const [clusterDeployments, agentClusterInstalls, agents] = useRecoilValue(
        waitForAll([clusterDeploymentsState, agentClusterInstallsState, agentsState])
    )

    const cdName = resourceJSON?.createResources.find((r: any) => r.kind === ClusterDeploymentKind).metadata.name

    const clusterDeployment = clusterDeployments.find(
        (c) => c.metadata.name === cdName && c.metadata.namespace === cdName
    )
    const agentClusterInstall = agentClusterInstalls.find(
        (a) => a.metadata.name === cdName && a.metadata.namespace === cdName
    )

    useEffect(() => (control.agentClusterInstall = agentClusterInstall), [control, agentClusterInstall])

    const onValuesChanged = useCallback((values) => {
        control.active = values
        handleChange(control)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return clusterDeployment && agentClusterInstall ? (
        <>
            <ACMClusterDeploymentNetworkingStep
                onValuesChanged={onValuesChanged}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                pullSecretSet // TODO
                agents={agents}
                onEditHost={(host) => {
                    const agent = agents.find(({ metadata }) => metadata.uid === host.id)
                    setEditAgent(agent)
                }}
            />
            <EditAgentModal
                isOpen={!!editAgent}
                agent={editAgent}
                usedHostnames={[]}
                onClose={() => setEditAgent(undefined)}
                onSave={(agent, hostname) =>
                    patchResource(agent, [
                        {
                            op: 'replace',
                            path: '/spec/hostname',
                            value: hostname,
                        },
                    ]).promise
                }
                onFormSaveError={() => {}}
            />
        </>
    ) : (
        <LoadingState />
    )
}

export default NetworkForm
