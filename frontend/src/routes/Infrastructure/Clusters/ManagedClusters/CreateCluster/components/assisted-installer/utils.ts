/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useMemo, useState, useEffect, useContext } from 'react'
import { generatePath } from 'react-router-dom-v5-compat'
import { isEqual } from 'lodash'
import {
  getAnnotationsFromAgentSelector,
  AGENT_BMH_NAME_LABEL_KEY,
  getBareMetalHostCredentialsSecret,
  getBareMetalHost,
  isAgentOfCluster,
  BMH_HOSTNAME_ANNOTATION,
  ClusterDeploymentK8sResource,
  AgentClusterInstallK8sResource,
  ClusterDeploymentNetworkingValues,
  ConfigMapK8sResource,
  InfraEnvK8sResource,
  NMStateK8sResource,
  AddBmcValues,
  DiscoveryImageFormValues,
} from '@openshift-assisted/ui-lib/cim'

import { useTranslation } from '../../../../../../../lib/acm-i18next'
import {
  ClusterImageSet,
  listClusterImageSets,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  KlusterletAddonConfigApiVersion,
  KlusterletAddonConfigKind,
  IResource,
  ClusterCurator,
} from '../../../../../../../resources'
import {
  patchResource,
  createResource,
  getResource,
  listResources,
  createResources,
} from '../../../../../../../resources/utils'
import { NavigationPath } from '../../../../../../../NavigationPath'
import { ModalProps } from './types'
import { deleteResources } from '../../../../../../../lib/delete-resources'
import { BulkActionModalProps } from '../../../../../../../components/BulkActionModal'
import { AgentK8sResource, BareMetalHostK8sResource } from '@openshift-assisted/ui-lib/cim'
import { useSharedAtoms, useRecoilValue } from '../../../../../../../shared-recoil'
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { PluginContext } from '../../../../../../../lib/PluginContext'

type OnHostsNext = {
  values: any
  clusterDeployment: ClusterDeploymentK8sResource
  agentClusterInstall: AgentClusterInstallK8sResource
  agents: AgentK8sResource[]
}

type OnDiscoverHostsNext = {
  clusterDeployment: ClusterDeploymentK8sResource
  agentClusterInstall: AgentClusterInstallK8sResource
  agents: AgentK8sResource[]
}

const addAgentsToCluster = async ({
  agents,
  name,
  namespace,
  hostIds,
}: {
  agents: AgentK8sResource[]
  name: string
  namespace: string
  hostIds: string[]
}) => {
  const addAgents = agents.filter(
    (a) =>
      hostIds.includes(a.metadata?.uid || '') &&
      (a.spec?.clusterDeploymentName?.name !== name || a.spec?.clusterDeploymentName?.namespace !== namespace)
  )
  await Promise.all(
    addAgents.map((agent) => {
      return patchResource(agent as IResource, [
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
  agentClusterInstall: AgentClusterInstallK8sResource,
  workerCount: number | undefined,
  arbiterCount: number | undefined,
  masterCount: number | undefined
) => {
  const provisionRequirements = { ...(agentClusterInstall.spec?.provisionRequirements || {}) }
  if (workerCount !== undefined) {
    provisionRequirements.workerAgents = workerCount
  }
  if (arbiterCount !== undefined) {
    provisionRequirements.arbiterAgents = arbiterCount
  }
  if (masterCount !== undefined) {
    provisionRequirements.controlPlaneAgents = masterCount
  }

  return patchResource(agentClusterInstall as IResource, [
    {
      op: agentClusterInstall.spec?.provisionRequirements ? 'replace' : 'add',
      path: '/spec/provisionRequirements',
      value: provisionRequirements,
    },
  ]).promise
}

export const onHostsNext = async ({ values, clusterDeployment, agents, agentClusterInstall }: OnHostsNext) => {
  const hostIds = values.autoSelectHosts ? values.autoSelectedHostIds : values.selectedHostIds
  const name = clusterDeployment.metadata?.name!
  const namespace = clusterDeployment.metadata?.namespace!
  const releasedAgents = agents.filter(
    (a) =>
      !hostIds.includes(a.metadata?.uid) &&
      a.spec?.clusterDeploymentName?.name === name &&
      a.spec?.clusterDeploymentName?.namespace === namespace
  )

  await Promise.all(
    releasedAgents.map((agent) => {
      return patchResource(agent as IResource, [
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
  const arbiterCount = agentClusterInstall.spec?.provisionRequirements?.arbiterAgents || 0
  if (masterCount) {
    let workerCount = hostIds.length - masterCount - arbiterCount
    workerCount = workerCount > 0 ? workerCount : 0

    await setProvisionRequirements(agentClusterInstall, workerCount, arbiterCount, masterCount)
  }

  //if (clusterDeployment) {
  await patchResource(clusterDeployment as IResource, [
    {
      op: clusterDeployment.metadata?.annotations ? 'replace' : 'add',
      path: '/metadata/annotations',
      value: getAnnotationsFromAgentSelector(clusterDeployment, values),
    },
  ]).promise
  //}
}

/** AI-specific version for the CIM-flow's onHostsNext() callback */
export const onDiscoveryHostsNext = async ({ clusterDeployment, agents, agentClusterInstall }: OnDiscoverHostsNext) => {
  const name = clusterDeployment.metadata?.name!
  const namespace = clusterDeployment.metadata?.namespace!

  await addAgentsToCluster({
    agents,
    name,
    namespace,
    hostIds: agents.map((a) => a.metadata?.uid!),
  })

  const masterCount = agentClusterInstall.spec?.provisionRequirements?.controlPlaneAgents
  const arbiterCount = agentClusterInstall.spec?.provisionRequirements?.arbiterAgents || 0
  if (masterCount) {
    let workerCount = agents.length - masterCount - arbiterCount
    workerCount = workerCount > 0 ? workerCount : 0

    await setProvisionRequirements(agentClusterInstall, workerCount, arbiterCount, masterCount)
  }
}

const appendPatch = (
  patches: any,
  path: string,
  newVal?: object | string | boolean,
  existingVal?: object | string | boolean
) => {
  if (!isEqual(newVal, existingVal)) {
    patches.push({
      op: existingVal ? 'replace' : 'add',
      path,
      value: newVal,
    })
  }
}

export const getNetworkingPatches = (
  agentClusterInstall: AgentClusterInstallK8sResource,
  values: ClusterDeploymentNetworkingValues
) => {
  const agentClusterInstallPatches: any = []

  appendPatch(
    agentClusterInstallPatches,
    '/spec/sshPublicKey',
    values.sshPublicKey,
    agentClusterInstall.spec?.sshPublicKey
  )

  appendPatch(
    agentClusterInstallPatches,
    '/spec/networking/clusterNetwork',
    values.clusterNetworks?.map((cn) => ({ cidr: cn.cidr, hostPrefix: cn.hostPrefix })),
    agentClusterInstall.spec?.networking?.clusterNetwork
  )

  appendPatch(
    agentClusterInstallPatches,
    '/spec/networking/serviceNetwork',
    values.serviceNetworks?.map((sn) => sn.cidr),
    agentClusterInstall.spec?.networking?.serviceNetwork
  )

  const machineNetworkValue = values.machineNetworks
    ?.filter((mn) => mn.cidr && mn.cidr !== 'NO_SUBNET_SET')
    .map((mn) => ({ cidr: mn.cidr }))

  if (machineNetworkValue && machineNetworkValue.length > 0) {
    appendPatch(
      agentClusterInstallPatches,
      '/spec/networking/machineNetwork',
      machineNetworkValue,
      agentClusterInstall.spec?.networking?.machineNetwork
    )
  }

  if (agentClusterInstall?.spec?.provisionRequirements?.controlPlaneAgents !== 1) {
    const isUserNetworking = values.managedNetworkingType === 'userManaged'
    appendPatch(
      agentClusterInstallPatches,
      '/spec/networking/userManagedNetworking',
      isUserNetworking,
      agentClusterInstall.spec?.networking?.userManagedNetworking
    )
    if (isUserNetworking) {
      if (agentClusterInstall.spec?.ingressVIP) {
        agentClusterInstallPatches.push({
          op: 'remove',
          path: '/spec/ingressVIP',
        })
      }

      if (agentClusterInstall.spec?.apiVIP) {
        agentClusterInstallPatches.push({
          op: 'remove',
          path: '/spec/apiVIP',
        })
      }
      if (agentClusterInstall.spec?.ingressVIPs?.length) {
        agentClusterInstallPatches.push({
          op: 'remove',
          path: '/spec/ingressVIPs',
        })
      }

      if (agentClusterInstall.spec?.apiVIPs?.length) {
        agentClusterInstallPatches.push({
          op: 'remove',
          path: '/spec/apiVIPs',
        })
      }
      if (agentClusterInstall.spec?.platformType == 'BareMetal') {
        appendPatch(agentClusterInstallPatches, '/spec/platformType', 'None', agentClusterInstall.spec?.platformType)
      }
    } else {
      if (agentClusterInstall.spec?.platformType == 'None') {
        appendPatch(
          agentClusterInstallPatches,
          '/spec/platformType',
          'BareMetal',
          agentClusterInstall.spec?.platformType
        )
      }
      appendPatch(agentClusterInstallPatches, '/spec/apiVIP', values.apiVips?.[0]?.ip, agentClusterInstall.spec?.apiVIP)
      appendPatch(
        agentClusterInstallPatches,
        '/spec/ingressVIP',
        values.ingressVips?.[0]?.ip,
        agentClusterInstall.spec?.ingressVIP
      )

      const apiVIPsValue = values.apiVips?.filter((v) => v.ip).map((v) => v.ip) || []
      appendPatch(agentClusterInstallPatches, '/spec/apiVIPs', apiVIPsValue, agentClusterInstall.spec?.apiVIPs)

      const ingressVIPsValue = values.ingressVips?.filter((v) => v.ip).map((v) => v.ip) || []
      appendPatch(
        agentClusterInstallPatches,
        '/spec/ingressVIPs',
        ingressVIPsValue,
        agentClusterInstall.spec?.ingressVIPs
      )
    }
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
  appendPatch(
    agentClusterInstallPatches,
    '/spec/networking/networkType',
    values.networkType,
    agentClusterInstall.spec?.networking.networkType
  )

  return agentClusterInstallPatches
}

export const onSaveNetworking = async (
  agentClusterInstall: AgentClusterInstallK8sResource,
  values: ClusterDeploymentNetworkingValues
) => {
  try {
    const patches = getNetworkingPatches(agentClusterInstall, values)
    if (patches.length > 0) {
      await patchResource(agentClusterInstall as IResource, patches).promise
    }
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Failed to patch the AgentClusterInstall resource: ${e.message}`)
    }
    throw new Error('Failed to patch the AgentClusterInstall resource')
  }
}

export const useAssistedServiceNamespace = () => {
  const { multiClusterEnginesState } = useSharedAtoms()
  const [multiClusterEngine] = useRecoilValue(multiClusterEnginesState)
  return useMemo(() => multiClusterEngine?.spec?.targetNamespace ?? 'multicluster-engine', [multiClusterEngine])
}

export const useAssistedServiceConfigMap = () => {
  const namespace = useAssistedServiceNamespace()
  const { configMapsState } = useSharedAtoms()
  const configMaps = useRecoilValue(configMapsState)
  return useMemo(
    () =>
      configMaps.find((cm) => cm.metadata.name === 'assisted-service' && cm.metadata.namespace === namespace) as
        | ConfigMapK8sResource
        | undefined,
    [configMaps]
  )
}

export const useClusterDeployment = ({
  name,
  namespace,
}: {
  name?: string
  namespace?: string
}): ClusterDeploymentK8sResource | undefined => {
  const { clusterDeploymentsState } = useSharedAtoms()
  const clusterDeployments = useRecoilValue(clusterDeploymentsState)
  return useMemo(
    () =>
      name
        ? (clusterDeployments.find(
            (cd) => cd.metadata?.name === name && cd.metadata?.namespace === namespace
          ) as ClusterDeploymentK8sResource)
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
}): AgentClusterInstallK8sResource | undefined => {
  const { agentClusterInstallsState } = useSharedAtoms()
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)
  return useMemo(
    () => agentClusterInstalls.find((aci) => aci.metadata?.name === name && aci.metadata?.namespace === namespace),
    [name, namespace, agentClusterInstalls]
  )
}

export const useInfraEnv = ({ name, namespace }: { name: string; namespace: string }) => {
  const { infraEnvironmentsState } = useSharedAtoms()
  const infraEnvs = useRecoilValue(infraEnvironmentsState)
  return useMemo(
    () => infraEnvs.find((ie) => ie.metadata?.name === name && ie.metadata?.namespace === namespace),
    [name, namespace, infraEnvs]
  )
}

export const useClusterDeploymentInfraEnv = (cdName: string, cdNamespace: string) => {
  const { infraEnvironmentsState } = useSharedAtoms()
  const infraEnvs = useRecoilValue(infraEnvironmentsState)
  return useMemo(
    () => findInfraEnvByClusterRef({ name: cdName, namespace: cdNamespace }, infraEnvs),
    [cdName, cdNamespace, infraEnvs]
  )
}

export const findInfraEnvByClusterRef = (
  clusterRef: { name: string; namespace: string },
  infraEnvs: InfraEnvK8sResource[]
) => {
  const { name, namespace } = clusterRef
  return infraEnvs.find((ie) => ie.spec?.clusterRef?.name === name && ie.spec?.clusterRef?.namespace === namespace)
}

export const onApproveAgent = (agent: AgentK8sResource) =>
  patchResource(agent as IResource, [
    {
      op: 'replace',
      path: '/spec/approved',
      value: true,
    },
  ]).promise as Promise<AgentK8sResource>

export const getClusterDeploymentLink = ({ name, namespace }: { name: string; namespace: string }) =>
  generatePath(NavigationPath.clusterDetails, { name, namespace })

export const fetchSecret = (namespace: string, name: string) =>
  getResource({ apiVersion: 'v1', kind: 'Secret', metadata: { namespace, name } }).promise

export const fetchManagedClusters = () =>
  listResources({ apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind }).promise as Promise<
    K8sResourceCommon[]
  >

export const fetchKlusterletAddonConfig = () =>
  listResources({ apiVersion: KlusterletAddonConfigApiVersion, kind: KlusterletAddonConfigKind }).promise as Promise<
    K8sResourceCommon[]
  >

export const getDeleteHostAction =
  (
    bareMetalHosts: BareMetalHostK8sResource[],
    agentClusterInstall?: AgentClusterInstallK8sResource,
    nmStates?: NMStateK8sResource[],
    agent?: AgentK8sResource,
    bareMetalHost?: BareMetalHostK8sResource
  ) =>
  () => {
    const resources = []
    let bmh = bareMetalHost
    if (agent) {
      resources.push(agent)
      const bmhName = agent.metadata?.labels?.[AGENT_BMH_NAME_LABEL_KEY]
      if (bmhName) {
        bmh = bareMetalHosts.find(
          ({ metadata }) => metadata?.name === bmhName && metadata?.namespace === agent.metadata?.namespace
        )
      }
    }
    if (bmh) {
      resources.push(bmh)

      const bmhNMStates = (nmStates || []).filter(
        (nm) => nm.metadata?.labels?.[AGENT_BMH_NAME_LABEL_KEY] === bmh?.metadata?.name
      )
      resources.push(...bmhNMStates)
    }

    if (agentClusterInstall) {
      const masterCount = undefined /* Only workers can be removed */
      const arbiterCount = agentClusterInstall.spec?.provisionRequirements.arbiterAgents || 0
      const workerCount = (agentClusterInstall.spec?.provisionRequirements.workerAgents || 1) - 1
      // TODO(mlibra): include following promise in the returned one to handle errors
      setProvisionRequirements(agentClusterInstall, workerCount, arbiterCount, masterCount)
    }

    return deleteResources(resources as IResource[])
  }

export const getAgentName = (resource?: AgentK8sResource | BareMetalHostK8sResource): string => {
  if (resource && 'spec' in resource && resource.spec && 'hostname' in resource.spec) {
    return resource.spec.hostname || resource?.metadata?.name || '-'
  }
  return resource?.metadata?.name || '-'
}

export const agentNameSortFunc = (
  a: AgentK8sResource | BareMetalHostK8sResource,
  b: AgentK8sResource | BareMetalHostK8sResource
) => getAgentName(a).localeCompare(getAgentName(b))

export const useOnDeleteHost = (
  toggleDialog: (props: BulkActionModalProps<AgentK8sResource | BareMetalHostK8sResource> | { open: false }) => void,
  bareMetalHosts: BareMetalHostK8sResource[],
  agentClusterInstall?: AgentClusterInstallK8sResource,
  nmStates?: NMStateK8sResource[]
) => {
  const { t } = useTranslation()

  return useCallback(
    (agent?: AgentK8sResource, bmh?: BareMetalHostK8sResource) => {
      toggleDialog({
        open: true,
        title: t('host.action.title.delete'),
        action: t('delete'),
        processing: t('deleting'),
        items: [agent, bmh].filter(Boolean) as (AgentK8sResource | BareMetalHostK8sResource)[],
        emptyState: undefined, // nothing displayed if neither agent nor bmh supplied
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
        keyFn: (resource: AgentK8sResource | BareMetalHostK8sResource) => resource.metadata?.uid as string,
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
  (editModal: ModalProps | undefined) => async (values: AddBmcValues, nmState?: NMStateK8sResource) => {
    let newSecret
    if (editModal?.secret) {
      const patches: any[] = []
      appendPatch(patches, '/data/username', btoa(values.username), editModal.secret.data?.username)
      appendPatch(patches, '/data/password', btoa(values.password), editModal.secret.data?.password)
      if (patches.length) {
        await patchResource(editModal.secret as IResource, patches).promise
      }
    } else {
      const secret = getBareMetalHostCredentialsSecret(values, editModal?.bmh?.metadata?.namespace || '')
      newSecret = await createResource<any>(secret).promise
    }

    if (editModal?.nmState) {
      const patches: any[] = []
      appendPatch(patches, '/spec/config', nmState?.spec?.config, editModal.nmState.spec?.config)
      appendPatch(patches, '/spec/interfaces', nmState?.spec?.interfaces || [], editModal.nmState.spec?.interfaces)
      appendPatch(
        patches,
        '/metadata/labels/configured-via',
        nmState?.metadata?.labels?.['configured-via'],
        editModal.nmState.metadata?.labels?.['configured-via']
      )
      if (patches.length) {
        await patchResource(editModal.nmState as IResource, patches).promise
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
        editModal.bmh.metadata?.annotations?.[BMH_HOSTNAME_ANNOTATION]
      )
      appendPatch(patches, '/spec/bmc/address', values.bmcAddress, editModal.bmh.spec?.bmc?.address)
      appendPatch(
        patches,
        '/spec/bmc/disableCertificateVerification',
        values.disableCertificateVerification,
        editModal.bmh.spec?.bmc?.disableCertificateVerification.toString()
      )
      appendPatch(patches, '/spec/bootMACAddress', values.bootMACAddress, editModal.bmh.spec?.bootMACAddress)
      appendPatch(patches, '/spec/online', values.online, editModal.bmh.spec?.online.toString())

      if (newSecret) {
        appendPatch(
          patches,
          '/spec/bmc/credentialsName',
          newSecret.metadata.name,
          editModal.bmh.spec?.bmc?.credentialsName
        )
      }
      if (patches.length) {
        await patchResource(editModal.bmh as IResource, patches).promise
      }
    }
  }

export const getOnCreateBMH =
  (infraEnv: InfraEnvK8sResource) => async (values: AddBmcValues, nmState?: NMStateK8sResource) => {
    const secret = getBareMetalHostCredentialsSecret(values, infraEnv.metadata?.namespace || '')
    const secretRes = await createResource<any>(secret).promise
    if (nmState) {
      await createResource<any>(nmState).promise
    }
    const bmh: BareMetalHostK8sResource = getBareMetalHost(values, infraEnv, secretRes)
    return createResource(bmh as IResource).promise as InfraEnvK8sResource
  }

export const onChangeHostname = async (agent: AgentK8sResource, hostname: string) =>
  patchResource(agent as IResource, [
    {
      op: 'replace',
      path: '/spec/hostname',
      value: hostname,
    },
  ]).promise as Promise<AgentK8sResource>

export const onChangeBMHHostname = async (bmh: BareMetalHostK8sResource, hostname: string) =>
  patchResource(bmh as IResource, [
    {
      op: 'replace',
      path: `/metadata/annotations/${BMH_HOSTNAME_ANNOTATION.replace('/', '~1')}`,
      value: hostname,
    },
  ]).promise as Promise<BareMetalHostK8sResource>

export const onEditHostRole = async (agent: AgentK8sResource, role?: string) =>
  patchResource(agent as IResource, [
    {
      op: 'replace',
      path: '/spec/role',
      value: role,
    },
  ]).promise as Promise<AgentK8sResource>

export const useAgentsOfAIFlow = ({ name, namespace }: { name: string; namespace: string }): AgentK8sResource[] => {
  const { agentsState } = useSharedAtoms()
  const agents = useRecoilValue(agentsState)
  return useMemo(() => agents.filter((a) => isAgentOfCluster(a, name, namespace)), [agents]) || []
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

const refetchInfraEnv = async (infraEnv: InfraEnvK8sResource) =>
  await getResource({
    apiVersion: infraEnv.apiVersion!,
    kind: infraEnv.kind!,
    metadata: { namespace: infraEnv.metadata?.namespace, name: infraEnv.metadata?.name },
  }).promise

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getOnSaveISOParams = (infraEnv: InfraEnvK8sResource) => async (values: DiscoveryImageFormValues) => {
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

  if (values.imageType) {
    appendPatch(patches, '/spec/imageType', values.imageType, infraEnv.spec?.imageType)
  }
  // TODO(mlibra): Why is oldIsoCreatedTimestamp not from a condition? I would expect infraEnv.status?.conditions?.find((condition) => condition.type === 'ImageCreated')
  const oldIsoCreatedTimestamp = infraEnv.status?.createdTime

  if (patches.length) {
    await patchResource(infraEnv as IResource, patches).promise
    // Keep the handleIsoConfigSubmit() promise going until ISO is regenerated - the Loading status will be present in the meantime
    // TODO(mlibra): there is MGMT-7255 WIP to add image streaming service when this waiting will not be needed and following code can be removed, just relying on infraEnv's isoDownloadURL to be always up-to-date.
    // For that reason we keep following polling logic here and not moving it to the calling components where it could rely on a watcher.
    let polledInfraEnv: InfraEnvK8sResource = await refetchInfraEnv(infraEnv)
    let maxPollingCounter = 10
    while (polledInfraEnv.status?.createdTime === oldIsoCreatedTimestamp && --maxPollingCounter) {
      await sleep(5 * 1000)
      polledInfraEnv = await refetchInfraEnv(infraEnv)
    }
    // quit anyway ...
  }
}

export const saveSSHKey = async (values: any, infraEnv: InfraEnvK8sResource) => {
  const patches: any[] = []
  appendPatch(patches, '/spec/sshAuthorizedKey', values.sshPublicKey, infraEnv.spec?.sshAuthorizedKey)
  if (patches.length) {
    return patchResource(infraEnv as IResource, patches).promise
  }
}

export const onEditProxy = async (values: any, infraEnv: InfraEnvK8sResource) => {
  const patches: any[] = []
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
  appendPatch(patches, '/spec/proxy', proxySettings, infraEnv.spec?.proxy)
  if (patches.length) {
    return patchResource(infraEnv as IResource, patches).promise
  }
}

export const savePullSecret = (values: any, infraEnv: InfraEnvK8sResource) => {
  const secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      namespace: infraEnv.metadata?.namespace,
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

export const onEditNtpSources = (values: any, infraEnv: InfraEnvK8sResource) => {
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
      infraEnv.spec?.additionalNTPSources
    )
  }
  return patchResource(infraEnv as IResource, patches).promise as Promise<InfraEnvK8sResource>
}

export const onMassDeleteHost = (
  agent?: AgentK8sResource,
  bmh?: BareMetalHostK8sResource,
  nmStates: NMStateK8sResource[] = []
) => {
  const toDelete = []
  if (agent) {
    toDelete.push(agent)
  }
  if (bmh) {
    toDelete.push(bmh)

    const bmhNMStates = (nmStates || []).filter(
      (nm) => nm.metadata?.labels?.[AGENT_BMH_NAME_LABEL_KEY] === bmh.metadata?.name
    )
    toDelete.push(...bmhNMStates)
  }
  return deleteResources(toDelete as IResource[]).promise
}

export const fetchInfraEnv = (name: string, namespace: string) =>
  getResource({ apiVersion: 'agent-install.openshift.io/v1beta1', kind: 'InfraEnv', metadata: { namespace, name } })
    .promise

export const importYaml = (yamlContent: unknown) => {
  return createResources(yamlContent as IResource[])
}

// Simple string search is _so far_ enough.
// Full key-path support would be ineffective when not actually needed.
export const getTemplateValue = (yaml: string, simpleKey: string, defaultValue: string, index = 0) => {
  const lines = yaml.split('\n')
  const regex = new RegExp(`^ *${simpleKey}: *`)
  let value

  const rows = lines.filter((l) => l.match(regex))

  if (rows.length === 0) {
    return defaultValue
  }

  if (rows.length > 1 && index) {
    value = rows[index].replace(regex, '').trim()
    return value
  }

  value = rows[0].replace(regex, '').trim()
  return value
}

export const getDefault = (values: (string | undefined)[]): string => values.filter(Boolean)?.[0] || ''

export const onSetInstallationDiskId = (agent: AgentK8sResource, diskId: string) => {
  return patchResource(agent as IResource, [
    {
      op: 'replace',
      path: '/spec/installation_disk_id',
      value: diskId,
    },
  ]).promise as Promise<AgentK8sResource>
}

export const useProvisioningConfiguration = (): [K8sResourceCommon | null, boolean, unknown] => {
  const {
    ocpApi: { useK8sWatchResource },
  } = useContext(PluginContext)
  const [config, loaded, error] = useK8sWatchResource<K8sResourceCommon>({
    name: 'provisioning-configuration',
    groupVersionKind: {
      group: 'metal3.io',
      version: 'v1alpha1',
      kind: 'Provisioning',
    },
  })
  const _error = error as { json?: { reason?: string } }
  if (_error?.json?.reason === 'NotFound') {
    return [null, true, null]
  }
  return [config, loaded || !!error, error]
}

export const onEditFinish = async (
  agentClusterInstall: AgentClusterInstallK8sResource,
  clusterCurator: ClusterCurator | undefined
) => {
  const res = await patchResource(agentClusterInstall as IResource, [
    // effectively, the property gets deleted instead of holding "false" value by that change
    {
      op:
        agentClusterInstall?.spec?.holdInstallation || agentClusterInstall?.spec?.holdInstallation === false
          ? 'replace'
          : 'add',
      path: '/spec/holdInstallation',
      value: false,
    },
  ]).promise

  if (
    clusterCurator &&
    !clusterCurator.spec?.desiredCuration &&
    (clusterCurator.spec?.install?.prehook?.length || clusterCurator.spec?.install?.posthook?.length)
  ) {
    await patchResource(clusterCurator, [
      {
        op: 'add',
        path: '/spec/desiredCuration',
        value: 'install',
      },
    ]).promise
  }

  return res as AgentClusterInstallK8sResource
}
