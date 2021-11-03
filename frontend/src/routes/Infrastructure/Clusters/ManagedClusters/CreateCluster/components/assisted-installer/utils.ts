/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { isEqual } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue, waitForAll } from 'recoil'

import {
    ConfigMap,
    patchResource,
    deleteResource,
    createResource,
    getResource,
    listNamespacedResources,
} from '../../../../../../../resources'
import {
    agentClusterInstallsState,
    clusterDeploymentsState,
    configMapsState,
    infraEnvironmentsState,
} from '../../../../../../../atoms'
import { NavigationPath } from '../../../../../../../NavigationPath'
import { ModalProps } from './types'

const {
    getAnnotationsFromAgentSelector,
    AGENT_BMH_HOSTNAME_LABEL_KEY,
    getBareMetalHostCredentialsSecret,
    getBareMetalHost,
} = CIM

type OnHostsNext = {
    values: any
    clusterDeployment: CIM.ClusterDeploymentK8sResource
    agents: CIM.AgentK8sResource[]
}

type OnDiscoverHostsNext = {
    values: CIM.ClusterDeploymentHostsDiscoveryValues
}

export const onHostsNext = async ({ values, clusterDeployment, agents }: OnHostsNext) => {
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
}

export const onDiscoverHostsNext = async ({ values }: OnDiscoverHostsNext) => {
    // TODO(mlibra)
    console.log('--- onDiscoverHostsNext, persisting: ', values)
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

export const useAIConfigMap = () => {
    const [configMaps] = useRecoilValue(waitForAll([configMapsState]))
    return useMemo(() => getAIConfigMap(configMaps), [configMaps])
}

export const useClusterDeployment = ({ name, namespace }: { name: string; namespace: string }) => {
    const [clusterDeployments] = useRecoilValue(waitForAll([clusterDeploymentsState]))
    return useMemo(
        () => clusterDeployments.find((cd) => cd.metadata.name === name && cd.metadata.namespace === namespace),
        [name, namespace, clusterDeployments]
    )
}

export const useAgentClusterInstall = ({ name, namespace }: { name: string; namespace: string }) => {
    const [agentClusterInstalls] = useRecoilValue(waitForAll([agentClusterInstallsState]))
    return useMemo(
        () => agentClusterInstalls.find((aci) => aci.metadata.name === name && aci.metadata.namespace === namespace),
        [name, namespace, agentClusterInstalls]
    )
}

export const useInfraEnv = ({ name, namespace }: { name: string; namespace: string }) => {
    const [infraEnvs] = useRecoilValue(waitForAll([infraEnvironmentsState]))
    return useMemo(
        () => infraEnvs.find((ie) => ie.metadata.name === name && ie.metadata.namespace === namespace),
        [name, namespace, infraEnvs]
    )
}

export const onApproveAgent = (agent: CIM.AgentK8sResource) => {
    patchResource(agent, [
        {
            op: 'replace',
            path: '/spec/approved',
            value: true,
        },
    ])
}

export const getClusterDeploymentLink = ({ name }: { name: string }) =>
    NavigationPath.clusterDetails.replace(':id', name)

export const canDeleteAgent = (agent?: CIM.AgentK8sResource, bmh?: CIM.BareMetalHostK8sResource) => !!agent || !!bmh

export const fetchNMState = async (namespace: string, bmhName: string) => {
    const nmStates = await listNamespacedResources(
        { apiVersion: 'agent-install.openshift.io/v1beta1', kind: 'NMStateConfig', metadata: { namespace } },
        [AGENT_BMH_HOSTNAME_LABEL_KEY]
    ).promise
    return nmStates.find((nm) => nm.metadata?.labels?.[AGENT_BMH_HOSTNAME_LABEL_KEY] === bmhName)
}

export const fetchSecret = (namespace: string, name: string) =>
    getResource({ apiVersion: 'v1', kind: 'Secret', metadata: { namespace, name } }).promise

export const getOnDeleteHost =
    (bareMetalHosts: CIM.BareMetalHostK8sResource[]) =>
    async (agent?: CIM.AgentK8sResource, bareMetalHost?: CIM.BareMetalHostK8sResource) => {
        let bmh = bareMetalHost
        if (agent) {
            await deleteResource(agent).promise
            const bmhName = agent.metadata.labels?.[AGENT_BMH_HOSTNAME_LABEL_KEY]
            if (bmhName) {
                bmh = bareMetalHosts.find(
                    ({ metadata }) => metadata.name === bmhName && metadata.namespace === agent.metadata.namespace
                )
            }
        }
        if (bmh) {
            await deleteResource(bmh).promise
            deleteResource({
                apiVersion: 'v1',
                kind: 'Secret',
                metadata: {
                    namespace: bmh.metadata.namespace,
                    name: bmh.spec.bmc.credentialsName,
                },
            })

            const nmState = await fetchNMState(bmh.metadata.namespace, bmh.metadata.name)
            if (nmState) {
                await deleteResource(nmState).promise
            }
        }
    }

export const onSaveBMH =
    (editModal: ModalProps | undefined) => async (values: CIM.AddBmcValues, nmState: CIM.NMStateK8sResource) => {
        let newSecret
        if (editModal?.secret) {
            const patches: any[] = []
            appendPatch(patches, '/data/username', btoa(values.username), editModal.secret.data.username)
            appendPatch(patches, '/data/password', btoa(values.password), editModal.secret.data.password)
            if (patches.length) {
                await patchResource(editModal.secret, patches).promise
            }
        } else {
            const secret = getBareMetalHostCredentialsSecret(values, editModal?.bmh?.metadata.namespace)
            newSecret = await createResource<any>(secret).promise
        }

        if (editModal?.nmState) {
            const patches: any[] = []
            appendPatch(patches, '/spec/config', nmState.spec.config, editModal.nmState.spec.config)
            appendPatch(patches, '/spec/interfaces', nmState.spec.interfaces, editModal.nmState.spec.interfaces)
            if (patches.length) {
                await patchResource(editModal.nmState, patches).promise
            }
        } else if (nmState) {
            await createResource<any>(nmState).promise
        }

        if (editModal?.bmh) {
            const patches: any[] = []
            appendPatch(patches, '/spec/bmc/address', values.bmcAddress, editModal.bmh.spec.bmc.address)
            appendPatch(
                patches,
                '/spec/bmc/disableCertificateVerification',
                values.disableCertificateVerification,
                editModal.bmh.spec.bmc.disableCertificateVerification
            )
            appendPatch(patches, '/spec/bootMACAddress', values.bootMACAddress, editModal.bmh.spec.bootMACAddress)
            appendPatch(patches, '/spec/online', values.online, editModal.bmh.spec.online)

            if (newSecret) {
                appendPatch(
                    patches,
                    '/spec/bmc/credentialsName',
                    newSecret.metadata.name,
                    editModal.bmh.spec.bmc.credentialsName
                )
            }
            if (patches.length) {
                await patchResource(editModal.bmh, patches).promise
            }
        }
    }

export const getOnCreateBMH =
    (infraEnv: CIM.InfraEnvK8sResource) => async (values: CIM.AddBmcValues, nmState: CIM.NMStateK8sResource) => {
        const secret = getBareMetalHostCredentialsSecret(values, infraEnv.metadata.namespace)
        const secretRes = await createResource<any>(secret).promise
        if (nmState) {
            await createResource<any>(nmState).promise
            const matchLabels = { infraEnv: infraEnv.metadata.name }
            if (!isEqual(infraEnv.spec.nmStateConfigLabelSelector?.matchLabels, matchLabels)) {
                const op = Object.prototype.hasOwnProperty.call(infraEnv.spec, 'nmStateConfigLabelSelector')
                    ? 'replace'
                    : 'add'
                await patchResource(infraEnv, [
                    {
                        op: op,
                        path: `/spec/nmStateConfigLabelSelector`,
                        value: {
                            matchLabels,
                        },
                    },
                ]).promise
            }
        }
        const bmh: CIM.BareMetalHostK8sResource = getBareMetalHost(values, infraEnv, secretRes)
        return createResource(bmh).promise
    }

export const onSaveAgent = async (agent: CIM.AgentK8sResource, hostname: string) =>
    patchResource(agent, [
        {
            op: 'replace',
            path: '/spec/hostname',
            value: hostname,
        },
    ]).promise
