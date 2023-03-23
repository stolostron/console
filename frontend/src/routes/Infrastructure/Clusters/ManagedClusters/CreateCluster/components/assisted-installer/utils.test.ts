/* Copyright Contributors to the Open Cluster Management project */
import { AgentClusterInstallK8sResource } from 'openshift-assisted-ui-lib/cim'
import { getDefault, getTemplateValue, getNetworkingPatches } from './utils'

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
      },
    }
    const patches = getNetworkingPatches(aci, {
      managedNetworkingType: 'userManaged',
    })
    expect(patches.length).toBe(3)
  })
})
