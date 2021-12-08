/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState, useMemo } from 'react'
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
    canEditHost,
    fetchNMState,
    fetchSecret,
    getAIConfigMap,
    getClusterDeploymentLink,
    getOnCreateBMH,
    getOnDeleteHost,
    getOnSaveISOParams,
    onApproveAgent,
    onDiscoveryHostsNext,
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
import { CIM } from 'openshift-assisted-ui-lib'
import { AgentK8sResource } from 'openshift-assisted-ui-lib/cim'
const {
    ClusterDeploymentWizard,
    FeatureGateContextProvider,
    ACM_ENABLED_FEATURES,
    LoadingState,
    getAgentsHostsNames,
    isAgentOfInfraEnv,
} = CIM

type EditAIClusterProps = RouteComponentProps<{ namespace: string; name: string }>

const EditAICluster: React.FC<EditAIClusterProps> = ({
    match: {
        params: { namespace, name },
    },
}) => {
    const [patchingHoldInstallation, setPatchingHoldInstallation] = useState(true)
    const history = useHistory()
    const [editAgent, setEditAgent] = useState<AgentK8sResource | undefined>()
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

    // Specific for the AI flow which has single&dedicated InfraEnv per Cluster
    const agentsOfSingleInfraEnvCluster = useMemo(
        () =>
            agents.filter((a) =>
                // TODO(mlibra): extend here once we can "disable" hosts
                isAgentOfInfraEnv(infraEnv, a)
            ),
        [agents, infraEnv]
    )

    const hostActions = {
        canEditHost: () => true,
        onEditHost: (agent: AgentK8sResource) => {
            setEditAgent(agent)
        },
        canEditRole: () => true,
        onEditRole: (agent: AgentK8sResource, role: string | undefined) => {
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
                                op: agentClusterInstall.spec.holdInstallation === false ? 'replace' : 'add',
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
                // effectively, the property gets deleted instead of holding "false" value by that change
                {
                    op:
                        agentClusterInstall.spec?.holdInstallation ||
                        agentClusterInstall.spec?.holdInstallation === false
                            ? 'replace'
                            : 'add',
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
                usedClusterNames={[] /* We are in Edit flow - cluster name can not be changed. */}
                onClose={history.goBack}
                onSaveDetails={onSaveDetails}
                onSaveNetworking={(values) => onSaveNetworking(agentClusterInstall, values)}
                onSaveHostsSelection={(values) => onHostsNext({ values, clusterDeployment, agents })}
                onApproveAgent={onApproveAgent}
                onDeleteHost={getOnDeleteHost(filteredBMHs)}
                canDeleteAgent={canDeleteAgent}
                onSaveAgent={onSaveAgent}
                canEditHost={canEditHost}
                onSaveBMH={onSaveBMH}
                onCreateBMH={getOnCreateBMH(infraEnv) /* AI Flow specific. Not called for CIM. */}
                onSaveISOParams={getOnSaveISOParams(infraEnv) /* AI Flow specific. Not called for CIM. */}
                isBMPlatform={
                    /* So far AI Flow specific - used in Add host modal only. Fix in case CIM ever needs it. Not called for CIM. */
                    isBMPlatform(infraEnv)
                }
                // onFormSaveError={setErrorHandler}
                onSaveHostsDiscovery={(values) =>
                    onDiscoveryHostsNext({ values, clusterDeployment, agents: agentsOfSingleInfraEnvCluster })
                }
                fetchSecret={fetchSecret}
                fetchNMState={fetchNMState}
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
