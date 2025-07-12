/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useMemo, useState, useEffect } from 'react'
import { isEqual } from 'lodash'
import {
  getAnnotationsFromAgentSelector,
  AGENT_BMH_NAME_LABEL_KEY,
  isAgentOfCluster,
  BMH_HOSTNAME_ANNOTATION,
  ClusterDeploymentK8sResource,
  AgentClusterInstallK8sResource,
  ClusterDeploymentNetworkingValues,
  ConfigMapK8sResource,
  InfraEnvK8sResource,
  NMStateK8sResource,
} from '@openshift-assisted/ui-lib/cim'

import { useTranslation } from '../../../../../../../lib/acm-i18next'
import { ClusterImageSet, listClusterImageSets, IResource, ClusterCurator } from '../../../../../../../resources'
import { patchResource, getResource } from '../../../../../../../resources/utils'
import { deleteResources } from '../../../../../../../lib/delete-resources'
import { BulkActionModalProps } from '../../../../../../../components/BulkActionModal'
import { AgentK8sResource, BareMetalHostK8sResource } from '@openshift-assisted/ui-lib/cim'
import { useSharedAtoms, useRecoilValue } from '../../../../../../../shared-recoil'

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
  masterCount: number | undefined
) => {
  const provisionRequirements = { ...(agentClusterInstall.spec?.provisionRequirements || {}) }
  if (workerCount !== undefined) {
    provisionRequirements.workerAgents = workerCount
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
  if (masterCount) {
    let workerCount = hostIds.length - masterCount
    workerCount = workerCount > 0 ? workerCount : 0

    await setProvisionRequirements(agentClusterInstall, workerCount, masterCount)
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
  if (masterCount) {
    let workerCount = agents.length - masterCount
    workerCount = workerCount > 0 ? workerCount : 0

    await setProvisionRequirements(agentClusterInstall, workerCount, masterCount)
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
      throw Error(`Failed to patch the AgentClusterInstall resource: ${e.message}`)
    }
    throw Error('Failed to patch the AgentClusterInstall resource')
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
      const workerCount = (agentClusterInstall.spec?.provisionRequirements.workerAgents || 1) - 1
      // TODO(mlibra): include following promise in the returned one to handle errors
      setProvisionRequirements(agentClusterInstall, workerCount, masterCount)
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
