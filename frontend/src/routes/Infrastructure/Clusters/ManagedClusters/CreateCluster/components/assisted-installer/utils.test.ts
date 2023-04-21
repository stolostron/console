/* Copyright Contributors to the Open Cluster Management project */
import {
  AGENT_BMH_NAME_LABEL_KEY,
  AgentClusterInstallK8sResource,
  AgentK8sResource,
  BareMetalHostK8sResource,
  ClusterDeploymentK8sResource,
  InfraEnvK8sResource,
} from 'openshift-assisted-ui-lib/cim'
import {
  getDefault,
  getTemplateValue,
  getNetworkingPatches,
  getDeleteHostAction,
  setProvisionRequirements,
  onHostsNext,
  onEditProxy,
} from './utils'
import { AgentClusterInstallApiVersion, AgentClusterInstallKind } from '../../../../../../../resources'

describe('assisted-installer utils', () => {
  it('getDefault', () => {
    expect(getDefault([])).toBe('')
    expect(getDefault(['a', undefined, 'b'])).toBe('a')
    expect(getDefault([undefined, undefined, 'c'])).toBe('c')
    expect(getDefault([undefined, undefined, undefined])).toBe('')
  })
})

describe('getTemplateValue utils', () => {
  const templateYaml =
    'apiVersion: app.k8s.io/v1beta1\nkind: Application\nmetadata:\n  name:\n  namespace:\nspec:\n  componentKinds:\n  - group: apps.open-cluster-management.io\n    kind: Subscription\n  descriptor: {}\n  selector:\n    matchExpressions:\n      - key: app\n        operator: In\n        values: \n          - \n---\napiVersion: apps.open-cluster-management.io/v1\nkind: Channel\nmetadata:\n  annotations:\n    apps.open-cluster-management.io/reconcile-rate: medium\n  name: \n  namespace: -ns\nspec:\n  type: Git\n---\napiVersion: apps.open-cluster-management.io/v1\nkind: Subscription\nmetadata:\n  annotations:\n    apps.open-cluster-management.io/git-branch: \n    apps.open-cluster-management.io/git-path: \n    apps.open-cluster-management.io/reconcile-option: merge\n  labels:\n    app: \n  name: -subscription-1\n  namespace: \nspec:\n  channel: -ns/\n  placement:\n    placementRef:\n      kind: Placement\n      name: -placement-1\n---\napiVersion: cluster.open-cluster-management.io/v1beta1\nkind: Placement\nmetadata:\n  labels:\n    app: \n  name: -placement-1\n  namespace: \nspec:\n  predicates:\n    - requiredClusterSelector:\n        labelSelector:\n          matchExpressions:\n  clusterSets:\n'
  it('get index value', () => {
    expect(getTemplateValue(templateYaml, 'namespace', '', 0)).toBe('')
  })
})

describe('networking patch utils', () => {
  it('enables user networking', () => {
    const aci: AgentClusterInstallK8sResource = {
      spec: {
        networking: {
          userManagedNetworking: false,
        },
        platformType: 'None',
        provisionRequirements: {
          controlPlaneAgents: 0,
        },
        apiVIP: '10.10.10.10',
        ingressVIP: '10.10.10.10',
      },
    }
    const patches = getNetworkingPatches(aci, {
      managedNetworkingType: 'userManaged',
      enableProxy: false,
      editProxy: false,
    })
    expect(patches.length).toBe(5)
  })
  it('enables cluster networking', () => {
    const aci: AgentClusterInstallK8sResource = {
      spec: {
        networking: {
          userManagedNetworking: true,
        },
        platformType: 'None',
        provisionRequirements: {
          controlPlaneAgents: 0,
        },
      },
    }
    const patches = getNetworkingPatches(aci, {
      managedNetworkingType: 'clusterManaged',
      enableProxy: false,
      editProxy: false,
      apiVip: '10.10.10.10',
      ingressVip: '10.10.10.10',
    })
    expect(patches.length).toBe(5)
  })
})

describe('getDeleteHostAction utils', () => {
  it('matches agent to bmh', () => {
    const bmh: BareMetalHostK8sResource = {
      metadata: {
        name: 'foo',
        namespace: 'bar',
      },
    }
    const agent: AgentK8sResource = {
      metadata: {
        namespace: 'bar',
        labels: {
          [AGENT_BMH_NAME_LABEL_KEY]: 'foo',
        },
      },
      spec: {
        approved: false,
        role: 'auto-assign',
      },
    }
    expect(getDeleteHostAction([bmh], undefined, undefined, agent)).toBeDefined()
  })
})

jest.mock('../../../../../../../resources', () => {
  return {
    patchResource: () => {
      return {
        promise: undefined,
      }
    },
  }
})

describe('setProvisionRequirements', () => {
  it('adds provision requirements if none are set', () => {
    const mockAgentClusterInstall = {
      apiVersion: AgentClusterInstallApiVersion,
      kind: AgentClusterInstallKind,
      spec: {
        provisionRequirements: undefined,
      },
    }
    setProvisionRequirements(mockAgentClusterInstall as unknown as AgentClusterInstallK8sResource, undefined, undefined)
    //expect(patchResource).toHaveBeenCalledWith(mockAgentClusterInstall, [
    //  { op: 'add', path: '/spec/provisionRequirements', value: {} },
    //])
  })

  it('updates provisioning requirements if some are already set', () => {
    const mockAgentClusterInstall = {
      apiVersion: AgentClusterInstallApiVersion,
      kind: AgentClusterInstallKind,
      spec: {
        provisionRequirements: {
          workerAgents: 3,
          controlPlaneAgents: 3,
        },
      },
    }
    setProvisionRequirements(mockAgentClusterInstall as unknown as AgentClusterInstallK8sResource, 4, 3)
    /*
    expect(patchResource).toHaveBeenCalledWith(mockAgentClusterInstall, [
      {
        op: 'replace',
        path: '/spec/provisionRequirements',
        value: {
          workerAgents: 4,
          controlPlaneAgents: 3,
        },
      },
    ])
    */
  })
})

describe('onHostsNext', () => {
  it('adds provision requirements if none are set', () => {
    const clusterDeployment: ClusterDeploymentK8sResource = {
      metadata: {
        name: 'foo',
        namespace: 'bar',
      },
    }
    const agentClusterInstall: AgentClusterInstallK8sResource = {}
    onHostsNext({
      values: { selectedHostIds: [], agentLabels: [], locations: [] },
      clusterDeployment,
      agents: [],
      agentClusterInstall,
    })
  })
})

describe('onEditProxy', () => {
  it('enables proxy', () => {
    const infraEnv: InfraEnvK8sResource = {
      metadata: {
        name: 'foo',
        namespace: 'bar',
      },
    }
    onEditProxy(
      {
        httpProxy: 'foo',
        httpsProxy: 'bar',
        noProxy: 'baz',
      },
      infraEnv
    )
  })
})
