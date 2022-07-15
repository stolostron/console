/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useMemo, useState, useEffect } from 'react'
import { isEqual } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue, waitForAll } from 'recoil'

import { useTranslation } from '../../../../../../../lib/acm-i18next'
import {
    ConfigMap,
    patchResource,
    createResource,
    getResource,
    ClusterImageSet,
    listClusterImageSets,
    listResources,
    ManagedClusterApiVersion,
    ManagedClusterKind,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
} from '../../../../../../../resources'
import {
    agentClusterInstallsState,
    agentsState,
    bareMetalAssetsState,
    clusterDeploymentsState,
    configMapsState,
    infraEnvironmentsState,
    provisioningsState,
} from '../../../../../../../atoms'
import { NavigationPath } from '../../../../../../../NavigationPath'
import { ModalProps } from './types'
import { deleteResources } from '../../../../../../../lib/delete-resources'
import { IBulkActionModelProps } from '../../../../../../../components/BulkActionModel'
import { AgentK8sResource, BareMetalHostK8sResource } from 'openshift-assisted-ui-lib/cim'

const {
    getAnnotationsFromAgentSelector,
    AGENT_BMH_NAME_LABEL_KEY,
    INFRAENV_GENERATED_AI_FLOW,
    getBareMetalHostCredentialsSecret,
    getBareMetalHost,
    isAgentOfCluster,
    BMH_HOSTNAME_ANNOTATION,
} = CIM

type OnHostsNext = {
    values: any
    clusterDeployment: CIM.ClusterDeploymentK8sResource
    agentClusterInstall: CIM.AgentClusterInstallK8sResource
    agents: CIM.AgentK8sResource[]
}

type OnDiscoverHostsNext = {
    clusterDeployment: CIM.ClusterDeploymentK8sResource
    agentClusterInstall: CIM.AgentClusterInstallK8sResource
    agents: CIM.AgentK8sResource[]
}

const addAgentsToCluster = async ({
    agents,
    name,
    namespace,
    hostIds,
}: {
    agents: CIM.AgentK8sResource[]
    name: string
    namespace: string
    hostIds: string[]
}) => {
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
}

export const setProvisionRequirements = (
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
            op: agentClusterInstall.spec?.provisionRequirements ? 'replace' : 'add',
            path: '/spec/provisionRequirements',
            value: provisionRequirements,
        },
    ]).promise
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
                {
                    op: 'replace',
                    path: '/spec/role',
                    value: '',
                },
            ]).promise
        })
    )

    await addAgentsToCluster({ agents, name, namespace, hostIds })

    const masterCount = agentClusterInstall.spec?.provisionRequirements?.controlPlaneAgents
    if (masterCount) {
        let workerCount = hostIds.length - masterCount
        workerCount = workerCount > 0 ? workerCount : 0

        await setProvisionRequirements(agentClusterInstall, workerCount, masterCount)
    }

    //if (clusterDeployment) {
    await patchResource(clusterDeployment, [
        {
            op: clusterDeployment.metadata.annotations ? 'replace' : 'add',
            path: '/metadata/annotations',
            value: getAnnotationsFromAgentSelector(clusterDeployment, values),
        },
    ]).promise
    //}
}

/** AI-specific version for the CIM-flow's onHostsNext() callback */
export const onDiscoveryHostsNext = async ({ clusterDeployment, agents, agentClusterInstall }: OnDiscoverHostsNext) => {
    const name = clusterDeployment.metadata.name
    const namespace = clusterDeployment.metadata.namespace

    await addAgentsToCluster({
        agents,
        name,
        namespace,
        hostIds: agents.map((a) => a.metadata.uid),
    })

    const masterCount = agentClusterInstall.spec?.provisionRequirements?.controlPlaneAgents
    if (masterCount) {
        let workerCount = agents.length - masterCount
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

    if (values.enableProxy) {
        const proxySettings: {
            httpProxy?: string
            httpsProxy?: string
            noProxy?: string
        } = {}
        if (values.httpProxy) {
            proxySettings.httpProxy = values.httpProxy
        }
        if (values.httpsProxy) {
            proxySettings.httpsProxy = values.httpsProxy
        }
        if (values.noProxy) {
            proxySettings.noProxy = values.noProxy
        }
        appendPatch(agentClusterInstallPatches, '/spec/proxy', proxySettings, agentClusterInstall.spec?.proxy)
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

export const useClusterDeployment = ({
    name,
    namespace,
}: {
    name?: string
    namespace?: string
}): CIM.ClusterDeploymentK8sResource | undefined => {
    const [clusterDeployments] = useRecoilValue(waitForAll([clusterDeploymentsState]))
    return useMemo(
        () =>
            name
                ? clusterDeployments.find((cd) => cd.metadata.name === name && cd.metadata.namespace === namespace)
                : undefined,
        [name, namespace, clusterDeployments]
    )
}

export const useAgentClusterInstall = ({
    name,
    namespace,
}: {
    name?: string
    namespace?: string
}): CIM.AgentClusterInstallK8sResource | undefined => {
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

export const useProvisioningResource = () => {
    const [provisionings] = useRecoilValue(waitForAll([provisioningsState]))
    return useMemo(
        // One of its kind
        () => provisionings.find((prov) => prov.metadata.name === 'provisioning-configuration'),
        [provisionings]
    )
}

export const onApproveAgent = (agent: CIM.AgentK8sResource) =>
    patchResource(agent, [
        {
            op: 'replace',
            path: '/spec/approved',
            value: true,
        },
    ]).promise

export const getClusterDeploymentLink = ({ name }: { name: string }) =>
    NavigationPath.clusterDetails.replace(':id', name)

export const fetchSecret = (namespace: string, name: string) =>
    getResource({ apiVersion: 'v1', kind: 'Secret', metadata: { namespace, name } }).promise

export const fetchManagedClusters = () =>
    listResources({ apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind }).promise

export const fetchKlusterletAddonConfig = () =>
    listResources({ apiVersion: KlusterletAddonConfigApiVersion, kind: KlusterletAddonConfigKind }).promise

export const getDeleteHostAction =
    (
        bareMetalHosts: CIM.BareMetalHostK8sResource[],
        agentClusterInstall?: CIM.AgentClusterInstallK8sResource,
        nmStates?: CIM.NMStateK8sResource[],
        agent?: CIM.AgentK8sResource,
        bareMetalHost?: CIM.BareMetalHostK8sResource
    ) =>
    () => {
        const resources = []
        let bmh = bareMetalHost
        if (agent) {
            resources.push(agent)
            const bmhName = agent.metadata.labels?.[AGENT_BMH_NAME_LABEL_KEY]
            if (bmhName) {
                bmh = bareMetalHosts.find(
                    ({ metadata }) => metadata.name === bmhName && metadata.namespace === agent.metadata.namespace
                )
            }
        }
        if (bmh) {
            resources.push(bmh)
            resources.push({
                apiVersion: 'v1',
                kind: 'Secret',
                metadata: {
                    namespace: bmh.metadata.namespace,
                    name: bmh.spec.bmc.credentialsName,
                },
            })

            const bmhNMStates = (nmStates || []).filter(
                (nm) => nm.metadata?.labels?.[AGENT_BMH_NAME_LABEL_KEY] === bmh.metadata.name
            )
            resources.push(...bmhNMStates)
        }

        if (agentClusterInstall) {
            const masterCount = undefined /* Only workers can be removed */
            const workerCount = (agentClusterInstall.spec.provisionRequirements.workerAgents || 1) - 1
            // TODO(mlibra): include following promise in the returned one to handle errors
            setProvisionRequirements(agentClusterInstall, workerCount, masterCount)
        }

        return deleteResources(resources)
    }

export const getAgentName = (resource: CIM.AgentK8sResource | CIM.BareMetalHostK8sResource): string =>
    resource.spec?.hostname || resource.metadata?.name || '-'

export const agentNameSortFunc = (
    a: CIM.AgentK8sResource | CIM.BareMetalHostK8sResource,
    b: CIM.AgentK8sResource | CIM.BareMetalHostK8sResource
) => getAgentName(a).localeCompare(getAgentName(b))

export const useOnDeleteHost = (
    toggleDialog: (props: IBulkActionModelProps | { open: false }) => void,
    bareMetalHosts: CIM.BareMetalHostK8sResource[],
    agentClusterInstall?: CIM.AgentClusterInstallK8sResource,
    nmStates?: CIM.NMStateK8sResource[]
) => {
    const { t } = useTranslation()

    return useCallback(
        (agent?: CIM.AgentK8sResource, bmh?: CIM.BareMetalHostK8sResource) => {
            toggleDialog({
                open: true,
                title: t('host.action.title.delete'),
                action: t('delete'),
                processing: t('deleting'),
                resources: [agent, bmh].filter(Boolean),
                description: t('host.action.message.delete'),
                columns: [
                    {
                        header: t('infraEnv.tableHeader.name'),
                        cell: getAgentName,
                        sort: agentNameSortFunc,
                    },
                    {
                        header: t('infraEnv.tableHeader.namespace'),
                        cell: 'metadata.namespace',
                        sort: 'metadata.namespace',
                    },
                ],
                keyFn: (resource: CIM.AgentK8sResource | CIM.BareMetalHostK8sResource) =>
                    resource.metadata?.uid as string,
                actionFn: getDeleteHostAction(bareMetalHosts, agentClusterInstall, nmStates, agent, bmh),
                close: () => {
                    toggleDialog({ open: false })
                },
                isDanger: true,
                icon: 'warning',
            })
        },
        [toggleDialog, bareMetalHosts, nmStates]
    )
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
            appendPatch(
                patches,
                `/metadata/annotations/${BMH_HOSTNAME_ANNOTATION.replace('/', '~1')}`,
                values.hostname,
                editModal.bmh.metadata.annotations?.[BMH_HOSTNAME_ANNOTATION]
            )
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

export const onChangeBMHHostname = async (bmh: CIM.BareMetalHostK8sResource, hostname: string) =>
    patchResource(bmh, [
        {
            op: 'replace',
            path: `/metadata/annotations/${BMH_HOSTNAME_ANNOTATION.replace('/', '~1')}`,
            value: hostname,
        },
    ]).promise

export const useAgentsOfAIFlow = ({ name, namespace }: { name: string; namespace: string }): AgentK8sResource[] => {
    const [agents] = useRecoilValue(waitForAll([agentsState]))
    return useMemo(() => agents.filter((a) => isAgentOfCluster(a, name, namespace)), [agents]) || []
}

export const useBMHsOfAIFlow = ({
    name,
    namespace,
}: {
    name?: string
    namespace?: string
}): BareMetalHostK8sResource[] => {
    const [bmhs] = useRecoilValue(waitForAll([bareMetalAssetsState]))
    return (
        useMemo(
            () =>
                // TODO(mlibra): make that happen!
                /* That label is added to the InfraEnv along creating ClusterDeployment, specific for the AI flow */
                bmhs.filter(
                    (bmh: CIM.BareMetalHostK8sResource) =>
                        namespace &&
                        name &&
                        bmh.metadata?.labels?.[INFRAENV_GENERATED_AI_FLOW] === `${namespace}-${name}`
                ),
            [bmhs]
        ) || []
    )
}
export const useClusterImages = () => {
    const [clusterImages, setClusterImages] = useState<ClusterImageSet[]>()
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const images = await listClusterImageSets().promise
                if (!isEqual(images, clusterImages)) {
                    setClusterImages(images)
                }
            } catch {
                setClusterImages([])
            }
        }
        fetchImages()
    }, [])
    return clusterImages
}

const refetchInfraEnv = async (infraEnv: CIM.InfraEnvK8sResource) =>
    await getResource<CIM.InfraEnvK8sResource>({
        apiVersion: infraEnv.apiVersion,
        kind: infraEnv.kind,
        metadata: { namespace: infraEnv.metadata.namespace, name: infraEnv.metadata.name },
    }).promise

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getOnSaveISOParams =
    (infraEnv: CIM.InfraEnvK8sResource) => async (values: CIM.DiscoveryImageFormValues) => {
        const patches: any[] = []
        if (values.sshPublicKey) {
            appendPatch(patches, '/spec/sshAuthorizedKey', values.sshPublicKey, infraEnv.spec?.sshAuthorizedKey)
        } else if (infraEnv.spec?.sshAuthorizedKey) {
            patches.push({
                op: 'remove',
                path: '/spec/sshAuthorizedKey',
            })
        }

        const proxy = values.enableProxy
            ? {
                  httpProxy: values.httpProxy,
                  httpsProxy: values.httpsProxy,
                  noProxy: values.noProxy,
              }
            : undefined

        if (proxy) {
            appendPatch(patches, '/spec/proxy', proxy, infraEnv.spec?.proxy)
        } else if (infraEnv.spec?.proxy) {
            patches.push({
                op: 'remove',
                path: '/spec/proxy',
            })
        }

        // TODO(mlibra): Once implemented on the backend, persist values.imageType

        // TODO(mlibra): Why is oldIsoCreatedTimestamp not from a condition? I would expect infraEnv.status?.conditions?.find((condition) => condition.type === 'ImageCreated')
        const oldIsoCreatedTimestamp = infraEnv.status?.createdTime

        if (patches.length) {
            await patchResource(infraEnv, patches).promise
            // Keep the handleIsoConfigSubmit() promise going until ISO is regenerated - the Loading status will be present in the meantime
            // TODO(mlibra): there is MGMT-7255 WIP to add image streaming service when this waiting will not be needed and following code can be removed, just relying on infraEnv's isoDownloadURL to be always up-to-date.
            // For that reason we keep following polling logic here and not moving it to the calling components where it could rely on a watcher.
            let polledInfraEnv: CIM.InfraEnvK8sResource = await refetchInfraEnv(infraEnv)
            let maxPollingCounter = 10
            while (polledInfraEnv.status?.createdTime === oldIsoCreatedTimestamp && --maxPollingCounter) {
                await sleep(5 * 1000)
                polledInfraEnv = await refetchInfraEnv(infraEnv)
            }
            // quit anyway ...
        }
    }

export const saveSSHKey = async (values: any, infraEnv: CIM.InfraEnvK8sResource) => {
    const patches: any[] = []
    appendPatch(patches, '/spec/sshAuthorizedKey', values.sshPublicKey, infraEnv.spec.sshAuthorizedKey)
    if (patches.length) {
        return patchResource(infraEnv, patches).promise
    }
}

export const savePullSecret = (values: any, infraEnv: CIM.InfraEnvK8sResource) => {
    const secret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
            namespace: infraEnv.metadata.namespace,
            name: infraEnv.spec?.pullSecretRef?.name,
        },
    }
    if (values.createSecret) {
        return createResource<any>({
            ...secret,
            data: {
                '.dockerconfigjson': btoa(values.pullSecret),
            },
            type: 'kubernetes.io/dockerconfigjson',
        }).promise
    } else {
        return patchResource(secret, [
            {
                op: 'replace',
                path: '/data/.dockerconfigjson',
                value: btoa(values.pullSecret),
            },
        ]).promise
    }
}

export const onEditNtpSources = (values: any, infraEnv: CIM.InfraEnvK8sResource) => {
    const patches: any[] = []
    if (values.enableNtpSources === 'auto') {
        if (infraEnv.spec?.additionalNTPSources) {
            patches.push({
                op: 'remove',
                path: '/spec/additionalNTPSources',
            })
        }
    } else {
        appendPatch(
            patches,
            '/spec/additionalNTPSources',
            (values.additionalNtpSources as string).split(',').map((s) => s.trim()),
            infraEnv.spec.additionalNTPSources
        )
    }
    return patchResource(infraEnv, patches).promise
}

export const onMassDeleteHost = (
    agent: CIM.AgentK8sResource,
    bmh: CIM.BareMetalHostK8sResource,
    nmStates: CIM.NMStateK8sResource[] = []
) => {
    const toDelete = []
    if (agent) {
        toDelete.push(agent)
    }
    if (bmh) {
        toDelete.push(bmh)

        const bmhNMStates = (nmStates || []).filter(
            (nm) => nm.metadata?.labels?.[AGENT_BMH_NAME_LABEL_KEY] === bmh.metadata.name
        )
        toDelete.push(...bmhNMStates)
    }
    return deleteResources(toDelete).promise
}

export const fetchInfraEnv = (name: string, namespace: string) =>
    getResource({ apiVersion: 'agent-install.openshift.io/v1beta1', kind: 'InfraEnv', metadata: { namespace, name } })
        .promise
