/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState, useMemo } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { RouteComponentProps, useHistory } from 'react-router'
import { useRecoilValue, waitForAll } from 'recoil'
import { patchResource } from '../../../../../../resources'
import {
    agentClusterInstallsState,
    agentsState,
    clusterDeploymentsState,
    clusterImageSetsState,
    configMapsState,
} from '../../../../../../atoms'
import {
    canDeleteAgent,
    fetchNMState,
    fetchSecret,
    getAIConfigMap,
    getClusterDeploymentLink,
    getOnDeleteHost,
    getOnSaveISOParams,
    onApproveAgent,
    onHostsNext,
    onSaveAgent,
    onSaveBMH,
    onSaveNetworking,
    useBMHsOfAIFlow,
    useInfraEnv,
} from '../../CreateCluster/components/assisted-installer/utils'
import EditAgentModal from './EditAgentModal'
import { NavigationPath } from '../../../../../../NavigationPath'
import { isBMPlatform } from '../../../../InfraEnvironments/utils'

const { ClusterDeploymentWizard, FeatureGateContextProvider, ACM_ENABLED_FEATURES, LoadingState, getAgentsHostsNames } =
    CIM

type EditAIClusterProps = RouteComponentProps<{ namespace: string; name: string }>

const EditAICluster: React.FC<EditAIClusterProps> = ({
    match: {
        params: { namespace, name },
    },
}) => {
    const [patchingHoldInstallation, setPatchingHoldInstallation] = useState(true)
    const history = useHistory()
    const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()
    const [clusterImageSets, clusterDeployments, agentClusterInstalls, agents, configMaps] = useRecoilValue(
        waitForAll([
            clusterImageSetsState,
            clusterDeploymentsState,
            agentClusterInstallsState,
            agentsState,
            configMapsState,
        ])
    )

    const clusterDeployment = clusterDeployments.find(
        (cd) => cd.metadata.name === name && cd.metadata.namespace === namespace
    )
    const agentClusterInstall = agentClusterInstalls.find(
        (aci) => aci.metadata.name === name && aci.metadata.namespace === namespace
    )
    const infraEnv = useInfraEnv({ name, namespace })
    // TODO(mlibra): Arn't we missing Bare Metal Hosts in the tables???
    const filteredBMHs = useBMHsOfAIFlow({ name, namespace })

    const usedHostnames = useMemo(() => getAgentsHostsNames(agents), [agents])

    const aiConfigMap = getAIConfigMap(configMaps)

    const onSaveDetails = (values: any) => {
        return patchResource(agentClusterInstall, [
            {
                op: 'replace',
                path: '/spec/imageSetRef/name',
                value: values.openshiftVersion,
            },
        ]).promise
    }

    const hostActions = {
        canEditHost: () => true,
        onEditHost: (agent: CIM.AgentK8sResource) => {
            setEditAgent(agent)
        },
        canEditRole: () => true,
        onEditRole: (agent: CIM.AgentK8sResource, role: string | undefined) => {
            return patchResource(agent, [
                {
                    op: 'replace',
                    path: '/spec/role',
                    value: role,
                },
            ]).promise
        },
    }

    useEffect(() => {
        const patch = async () => {
            if (agentClusterInstall) {
                try {
                    if (!agentClusterInstall.spec.holdInstallation) {
                        await patchResource(agentClusterInstall, [
                            {
                                op: 'add',
                                path: '/spec/holdInstallation',
                                value: true,
                            },
                        ]).promise
                    }
                } finally {
                    setPatchingHoldInstallation(false)
                }
            }
        }
        patch()
    }, [agentClusterInstall])

    const onFinish = () => {
        const doItAsync = async () => {
            await patchResource(agentClusterInstall, [
                {
                    op: 'replace',
                    path: '/spec/holdInstallation',
                    value: false,
                },
            ]).promise

            history.push(
                NavigationPath.clusterCreateProgress
                    .replace(':namespace', agentClusterInstall.metadata.namespace)
                    .replace(':name', agentClusterInstall.metadata.name)
            )
        }
        doItAsync()
    }

    return patchingHoldInstallation ? (
        <LoadingState />
    ) : (
        <FeatureGateContextProvider features={ACM_ENABLED_FEATURES}>
            <ClusterDeploymentWizard
                className="cluster-deployment-wizard"
                clusterImages={clusterImageSets}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={agents}
                usedClusterNames={[]}
                onClose={history.goBack}
                onSaveDetails={onSaveDetails}
                onSaveNetworking={(values) => onSaveNetworking(agentClusterInstall, values)}
                onSaveHostsSelection={(values) => onHostsNext({ values, clusterDeployment, agents })}
                onApproveAgent={onApproveAgent}
                onDeleteHost={getOnDeleteHost(filteredBMHs)}
                canDeleteAgent={canDeleteAgent}
                onSaveAgent={onSaveAgent}
                onSaveBMH={onSaveBMH}
                onSaveISOParams={getOnSaveISOParams(infraEnv)}
                // onFormSaveError={setErrorHandler}
                // just for Day 2: onSaveHostsDiscovery={(values) => onDiscoverHostsNext({ values, clusterDeployment, agents })}
                fetchSecret={fetchSecret}
                fetchNMState={fetchNMState}
                isBMPlatform={isBMPlatform(infraEnv)}
                getClusterDeploymentLink={getClusterDeploymentLink}
                hostActions={hostActions}
                onFinish={onFinish}
                aiConfigMap={aiConfigMap}
                infraEnv={infraEnv}
            />
            <EditAgentModal agent={editAgent} setAgent={setEditAgent} usedHostnames={usedHostnames} />
        </FeatureGateContextProvider>
    )
}

export default EditAICluster
