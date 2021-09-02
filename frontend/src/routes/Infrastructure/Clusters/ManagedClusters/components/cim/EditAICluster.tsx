/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { RouteComponentProps, useHistory } from 'react-router'
import { useRecoilValue, waitForAll } from 'recoil'
import isMatch from 'lodash/isMatch'
import { patchResource } from '../../../../../../resources'
import {
    agentClusterInstallsState,
    agentsState,
    clusterDeploymentsState,
    clusterImageSetsState,
    infraEnvironmentsState,
} from '../../../../../../atoms'
import { getNetworkingPatches } from './utils'

const { ClusterDeploymentWizard, EditAgentModal } = CIM

type EditAIClusterProps = RouteComponentProps<{ namespace: string; name: string }>

const EditAICluster: React.FC<EditAIClusterProps> = ({
    match: {
        params: { namespace, name },
    },
}) => {
    const history = useHistory()
    const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()
    const [clusterImageSets, clusterDeployments, agentClusterInstalls, agents, infraEnvs] = useRecoilValue(
        waitForAll([
            clusterImageSetsState,
            clusterDeploymentsState,
            agentClusterInstallsState,
            agentsState,
            infraEnvironmentsState,
        ])
    )

    const clusterDeployment = clusterDeployments.find(
        (cd) => cd.metadata.name === name && cd.metadata.namespace === namespace
    )
    const agentClusterInstall = agentClusterInstalls.find(
        (aci) => aci.metadata.name === name && aci.metadata.namespace === namespace
    )
    const infraEnv = infraEnvs.find((ie) => ie.metadata.name === name && ie.metadata.namespace === namespace)

    const infraAgents =
        infraEnv && agents.filter((a) => isMatch(a.metadata.labels, infraEnv.status?.agentLabelSelector?.matchLabels))

    const defaultPullSecret = '' // Can be retrieved from c.rh.c . We can not query that here.

    const onSaveDetails = (values: any) => {
        return patchResource(agentClusterInstall, [
            {
                op: 'replace',
                path: '/spec/imageSetRef/name',
                value: values.openshiftVersion,
            },
        ]).promise
    }

    return (
        <>
            <ClusterDeploymentWizard
                className="cluster-deployment-wizard"
                defaultPullSecret={defaultPullSecret}
                clusterImages={clusterImageSets}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={infraAgents}
                pullSecretSet
                usedClusterNames={[]}
                onClose={history.goBack}
                onSaveDetails={onSaveDetails}
                onSaveNetworking={async (values) => {
                    try {
                        const patches = getNetworkingPatches(agentClusterInstall, values)
                        if (patches.length > 0) {
                            await patchResource(agentClusterInstall, patches).promise
                        }
                    } catch (e) {
                        if (e instanceof Error)
                            throw Error(`Failed to patch the AgentClusterInstall resource: ${e.message}`)
                    }
                }}
                canEditHost={() => true}
                onEditHost={(agent) => {
                    setEditAgent(agent)
                }}
                canEditRole={() => true}
                onEditRole={(agent, role) => {
                    patchResource(agent, [
                        {
                            op: 'replace',
                            path: '/spec/approved',
                            value: true,
                        },
                    ])
                    return patchResource(agent, [
                        {
                            op: 'replace',
                            path: '/spec/role',
                            value: role,
                        },
                    ]).promise
                }}
            />
            <EditAgentModal
                isOpen={!!editAgent}
                agent={editAgent}
                usedHostnames={[]}
                onClose={() => setEditAgent(undefined)}
                onSave={(agent, hostname) => {
                    return patchResource(agent, [
                        {
                            op: 'replace',
                            path: '/spec/hostname',
                            value: hostname,
                        },
                    ]).promise
                }}
                onFormSaveError={() => {}}
            />
        </>
    )
}

export default EditAICluster
