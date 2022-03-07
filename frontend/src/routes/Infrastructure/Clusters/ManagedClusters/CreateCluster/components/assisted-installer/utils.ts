/* Copyright Contributors to the Open Cluster Management project */
import { ConfigMap, patchResource } from '../../../../../../../resources'
import { isEqual } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'

const { getAnnotationsFromAgentSelector } = CIM

const setProvisionRequirements = (
    agentClusterInstall: CIM.AgentClusterInstallK8sResource,
    workerCount: number | undefined,
    masterCount: number | undefined
) => {
    const provisionRequirements = { ...(agentClusterInstall.spec?.provisionRequirements || {}) }
    if (workerCount !== undefined) {
        provisionRequirements.workerAgents = workerCount
    }
    if (masterCount !== undefined) {
        provisionRequirements.controlPlaneAgents = masterCount
    }

    return patchResource(agentClusterInstall, [
        {
            op: agentClusterInstall.spec?.provisionRequirements ? 'add' : 'replace',
            path: '/spec/provisionRequirements',
            value: provisionRequirements,
        },
    ]).promise
}

type OnHostsNext = {
    values: any
    clusterDeployment: CIM.ClusterDeploymentK8sResource
    agents: CIM.AgentK8sResource[]
    agentClusterInstall: CIM.AgentClusterInstallK8sResource
}

export const onHostsNext = async ({ values, clusterDeployment, agents, agentClusterInstall }: OnHostsNext) => {
    const hostIds = values.autoSelectHosts ? values.autoSelectedHostIds : values.selectedHostIds
    const name = clusterDeployment.metadata.name
    const namespace = clusterDeployment.metadata.namespace
    const releasedAgents = agents.filter(
        (a) =>
            !hostIds.includes(a.metadata.uid) &&
            a.spec?.clusterDeploymentName?.name === name &&
            a.spec?.clusterDeploymentName?.namespace === namespace
    )

    await Promise.all(
        releasedAgents.map((agent) => {
            return patchResource(agent, [
                {
                    op: 'remove',
                    path: '/spec/clusterDeploymentName',
                },
            ]).promise
        })
    )

    const addAgents = agents.filter(
        (a) =>
            hostIds.includes(a.metadata.uid) &&
            (a.spec?.clusterDeploymentName?.name !== name || a.spec?.clusterDeploymentName?.namespace !== namespace)
    )
    await Promise.all(
        addAgents.map((agent) => {
            return patchResource(agent, [
                {
                    op: agent.spec?.clusterDeploymentName ? 'replace' : 'add',
                    path: '/spec/clusterDeploymentName',
                    value: {
                        name,
                        namespace,
                    },
                },
            ]).promise
        })
    )

    if (clusterDeployment) {
        await patchResource(clusterDeployment, [
            {
                op: clusterDeployment.metadata.annotations ? 'replace' : 'add',
                path: '/metadata/annotations',
                value: getAnnotationsFromAgentSelector(clusterDeployment, values),
            },
        ]).promise
    }

    const masterCount = agentClusterInstall.spec?.provisionRequirements?.controlPlaneAgents
    if (masterCount) {
        let workerCount = hostIds.length - masterCount
        workerCount = workerCount > 0 ? workerCount : 0

        await setProvisionRequirements(agentClusterInstall, workerCount, masterCount)
    }
}

const appendPatch = (patches: any, path: string, newVal: object | string | boolean, existingVal?: object | string) => {
    if (!isEqual(newVal, existingVal)) {
        patches.push({
            op: existingVal ? 'replace' : 'add',
            path,
            value: newVal,
        })
    }
}

export const getNetworkingPatches = (agentClusterInstall: CIM.AgentClusterInstallK8sResource, values: any) => {
    const agentClusterInstallPatches: any = []

    appendPatch(
        agentClusterInstallPatches,
        '/spec/sshPublicKey',
        values.sshPublicKey,
        agentClusterInstall.spec.sshPublicKey
    )

    appendPatch(
        agentClusterInstallPatches,
        '/spec/networking/clusterNetwork',
        [
            {
                cidr: values.clusterNetworkCidr,
                hostPrefix: values.clusterNetworkHostPrefix,
            },
        ],
        agentClusterInstall.spec?.networking?.clusterNetwork
    )

    appendPatch(
        agentClusterInstallPatches,
        '/spec/networking/serviceNetwork',
        [values.serviceNetworkCidr],
        agentClusterInstall.spec?.networking?.serviceNetwork
    )

    // Setting Machine network CIDR is forbidden when cluster is not in vip-dhcp-allocation mode (which is not soppurted ATM anyway)
    if (values.vipDhcpAllocation) {
        const hostSubnet = values.hostSubnet?.split(' ')?.[0]
        const machineNetworkValue = hostSubnet ? [{ cidr: hostSubnet }] : []
        appendPatch(
            agentClusterInstallPatches,
            '/spec/networking/machineNetwork',
            machineNetworkValue,
            agentClusterInstall.spec?.networking?.machineNetwork
        )
    }

    appendPatch(agentClusterInstallPatches, '/spec/holdInstallation', false, agentClusterInstall.spec?.holdInstallation)

    if (
        agentClusterInstall?.spec?.provisionRequirements?.controlPlaneAgents === 1 &&
        values.hostSubnet !== 'NO_SUBNET_SET'
    ) {
        appendPatch(
            agentClusterInstallPatches,
            '/spec/networking/machineNetwork',
            [{ cidr: values.hostSubnet }],
            agentClusterInstall.spec?.networking?.machineNetwork?.[0]?.cidr
        )
    } else {
        appendPatch(agentClusterInstallPatches, '/spec/apiVIP', values.apiVip, agentClusterInstall.spec?.apiVIP)
        appendPatch(
            agentClusterInstallPatches,
            '/spec/ingressVIP',
            values.ingressVip,
            agentClusterInstall.spec?.ingressVIP
        )
    }

    return agentClusterInstallPatches
}

export const onSaveNetworking = async (
    agentClusterInstall: CIM.AgentClusterInstallK8sResource,
    values: CIM.ClusterDeploymentNetworkingValues
) => {
    try {
        const patches = getNetworkingPatches(agentClusterInstall, values)
        if (patches.length > 0) {
            await patchResource(agentClusterInstall, patches).promise
        }
    } catch (e) {
        if (e instanceof Error) {
            throw Error(`Failed to patch the AgentClusterInstall resource: ${e.message}`)
        }
        throw Error('Failed to patch the AgentClusterInstall resource')
    }
}

export const getAIConfigMap = (configMaps: ConfigMap[]) =>
    configMaps.find(
        (cm) => cm.metadata.name === 'assisted-service-config' && cm.metadata.namespace === 'assisted-installer'
    ) ||
    configMaps.find(
        (cm) =>
            cm.metadata.name === 'assisted-service' &&
            (cm.metadata.namespace === 'rhacm' || cm.metadata.namespace === 'open-cluster-management')
    )
