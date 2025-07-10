/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render } from '@testing-library/react'
import i18next from 'i18next'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: jest.fn(),
}))
import { clusterManagementAddonsState, configMapsState, managedClusterInfosState } from '../../atoms'
import { ConfigMapApiVersion, ConfigMapKind } from '../../resources'
import { ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../../resources/managed-cluster-info'
import {
  CreateApplicationTopologyLink,
  CreateDetailsLink,
  CreateExternalLink,
  CreateExternalVMLink,
  CreateGlobalSearchDetailsLink,
  FormatLabels,
  FormatPolicyReportCategories,
  FormatPolicyReportPolicies,
  GetAge,
  getSearchDefinitions,
  GetUrlSearchParam,
  VMLaunchLinks,
  VMSnapshotIndications,
} from './searchDefinitions'
const t = i18next.t.bind(i18next)

import { useFlag } from '@openshift-console/dynamic-plugin-sdk'
const mockUseFlag = useFlag as jest.MockedFunction<typeof useFlag>

describe('GetAge', () => {
  beforeEach(() => {
    mockUseFlag.mockReturnValue(true) // default to flag enabled
  })
  it('renders timestamp with ISO format', () => {
    const item = {
      name: 'testName',
      namespace: 'testNamespace',
      created: '2020-11-30T14:34:20Z',
    }

    const { container } = render(<div>{GetAge(item, 'created')}</div>)

    expect(container).toBeInTheDocument()
  })

  it('renders timestamp without T format', () => {
    const item = {
      name: 'testName',
      namespace: 'testNamespace',
      created: '2020-11-3014:34:20Z',
    }

    const { container } = render(<div>{GetAge(item, 'created')}</div>)

    expect(container).toBeInTheDocument()
  })

  it('renders dash for missing timestamp', () => {
    const item = {
      name: 'testName',
      namespace: 'testNamespace',
    }

    const { container } = render(<div>{GetAge(item, 'created')}</div>)

    expect(container).toHaveTextContent('-')
  })
})

test('Correctly returns CreateDetailsLink - Cluster', () => {
  mockUseFlag.mockReturnValue(true)
  const item = {
    name: 'testClusterName',
    namespace: 'testClusterNamespace',
    kind: 'Cluster',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - ACM-Application', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testApplicationName',
    namespace: 'testApplicationNamespace',
    kind: 'Application',
    apigroup: 'app.k8s.io',
    cluster: 'cluster',
    apiversion: 'v1beta1',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - NON-Application', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testApplicationName',
    namespace: 'testApplicationNamespace',
    kind: 'Application',
    cluster: 'testCluster',
    selfLink: '/self/link',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - HUB-Policy', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testPolicyName',
    namespace: 'testPolicyNamespace',
    kind: 'Policy',
    _hubClusterResource: true,
    apigroup: 'policy.open-cluster-management.io',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - Managed-Policy', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testPolicyName',
    namespace: 'testPolicyNamespace',
    kind: 'Policy',
    cluster: 'testCluster',
    selfLink: '/self/link',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - PolicyReport', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testPolicyReport',
    namespace: 'testPolicyReportNamespace',
    kind: 'PolicyReport',
    cluster: 'testCluster',
    selfLink: '/self/link',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - Default', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testPodName',
    namespace: 'testPodNamespace',
    kind: 'Pod',
    cluster: 'testCluster',
    selfLink: '/self/link',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed hub default resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testPodName',
    namespace: 'testPodNamespace',
    kind: 'Pod',
    cluster: 'testCluster',
    selfLink: '/self/link',
    managedHub: 'global-hub',
  }
  const { baseElement } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(managedClusterInfosState, [
          {
            apiVersion: ManagedClusterInfoApiVersion,
            kind: ManagedClusterInfoKind,
            metadata: {
              name: 'testCluster',
              namespace: 'testCluster',
            },
            status: {
              consoleURL: 'https://testCluster.com',
              conditions: [],
              version: '1.17',
            },
          },
        ])
      }}
    >
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed cluster default resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testPodName',
    namespace: 'testPodNamespace',
    kind: 'Pod',
    cluster: 'testCluster',
    selfLink: '/self/link',
    managedHub: 'leaf-hub',
  }
  const { baseElement } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(managedClusterInfosState, [
          {
            apiVersion: ManagedClusterInfoApiVersion,
            kind: ManagedClusterInfoKind,
            metadata: {
              name: 'leaf-hub',
              namespace: 'leaf-hub',
            },
            status: {
              consoleURL: 'https://leaf-hub.com',
              conditions: [],
              version: '1.17',
            },
          },
        ])
      }}
    >
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed hub Cluster resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testClusterName',
    namespace: 'testClusterNamespace',
    kind: 'Cluster',
    managedHub: 'global-hub',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed cluster Cluster resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testClusterName',
    namespace: 'testClusterNamespace',
    kind: 'Cluster',
    managedHub: 'leaf-hub',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed hub Application resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    apigroup: 'app.k8s.io',
    apiversion: 'v1beta1',
    name: 'testClusterName',
    namespace: 'testClusterNamespace',
    kind: 'Application',
    managedHub: 'global-hub',
    cluster: 'local-cluster',
    _hubClusterResource: 'true',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed cluster Application resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    apigroup: 'app.k8s.io',
    apiversion: 'v1beta1',
    name: 'testClusterName',
    namespace: 'testClusterNamespace',
    kind: 'Application',
    managedHub: 'global-hub',
    cluster: 'leaf-cluster',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed hub Policy resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    cluster: 'leaf-hub',
    compliant: 'NonCompliant',
    kind: 'Policy',
    managedHub: 'global-hub',
    name: 'hub-a-policy-test',
    namespace: 'default',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed cluster Policy resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    cluster: 'local-cluster',
    compliant: 'NonCompliant',
    kind: 'Policy',
    managedHub: 'global-hub',
    name: 'global-policy',
    namespace: 'default',
    _hubClusterResource: 'true',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed hub PolicyReport resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    apigroup: 'wgpolicyk8s.io',
    apiversion: 'v1alpha2',
    name: 'local-cluster-policyreport',
    namespace: 'testClusterNamespace',
    kind: 'PolicyReport',
    managedHub: 'global-hub',
    cluster: 'local-cluster',
    _hubClusterResource: 'true',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateGlobalSearchDetailsLink managed cluster PolicyReport resource', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    apigroup: 'wgpolicyk8s.io',
    apiversion: 'v1alpha2',
    name: 'leaf-cluster-policyreport',
    namespace: 'testClusterNamespace',
    kind: 'PolicyReport',
    managedHub: 'global-hub',
    cluster: 'leaf-cluster',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateGlobalSearchDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateApplicationTopologyLink', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testApp',
    namespace: 'testNamespace',
    kind: 'Application',
    apiversion: 'v1beta1',
    apigroup: 'app.k8s.io',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateApplicationTopologyLink item={item} t={t} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateApplicationTopologyLink - global search', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testApp',
    namespace: 'testNamespace',
    kind: 'Application',
    apiversion: 'v1beta1',
    apigroup: 'app.k8s.io',
    managedHub: 'global-hub',
    cluster: 'test-cluster',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateApplicationTopologyLink item={item} t={t} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns empty CreateApplicationTopologyLink', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    dashboard: '',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateApplicationTopologyLink item={item} t={t} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateExternalLink from consoleURL', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    consoleURL: 'http://consoleurl',
  }
  const result = CreateExternalLink(item, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns CreateExternalLink from clusterip', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    clusterip: 'http://clusterip',
  }
  const result = CreateExternalLink(item, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns empty CreateExternalLink', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
  }
  const result = CreateExternalLink(item, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns label components', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    label: 'testlabel=label1; testlabel=label2',
  }
  const result = FormatLabels(item)
  expect(result).toMatchSnapshot()
})

test('Correctly returns policyreport policies', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    rules:
      'AUTH_OPERATOR_PROXY_ERROR; CONTAINER_ROOT_PARTITION_SIZE; MASTER_DEFINED_AS_MACHINESETS; NODES_MINIMUM_REQUIREMENTS_NOT_MET; UNSUPPORT_SDN_PLUGIN',
    category: 'testcategory=category1; testcategory=category2',
  }
  const result = FormatPolicyReportPolicies(item)
  expect(result).toMatchSnapshot()
})

test('Correctly returns category components', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    category: 'testcategory=category1; testcategory=category2',
  }
  const result = FormatPolicyReportCategories(item.category)
  expect(result).toMatchSnapshot()
})

test('Correctly returns empty labels', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
  }
  const result = FormatLabels(item)
  expect(result).toMatchSnapshot()
})

test('Correctly returns all resource definitions', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const testItem = {
    name: 'testName',
    namespace: 'testNamespace',
    kind: 'Pod',
    cluster: 'testCluster',
    label: 'testLabel=label; testLabel1=label1',
    selfLink: '/apigroup/cluster/name',
    created: '2021-01-01T00:00:00Z',
  }
  const searchDefinitions = getSearchDefinitions((key) => key)
  const defKeys = Object.keys(searchDefinitions) as (keyof typeof searchDefinitions)[]
  defKeys.forEach((key) => {
    const definition = searchDefinitions[key].columns.map((col: any) => {
      if (typeof col.cell === 'function') {
        col.cell = col.cell(testItem)
      }
      return col
    })
    expect(definition).toMatchSnapshot(`SearchDefinitions-${key}`)
  })
})

test('Correctly returns Cluster resource definitions in global search', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const testItem = {
    name: 'test-cluster',
    namespace: 'test-cluster',
    kind: 'Cluster',
    cluster: 'test-cluster',
    managedHub: 'global-hub',
    label: 'testLabel=label; testLabel1=label1',
    created: '2021-01-01T00:00:00Z',
  }
  const searchDefinitions = getSearchDefinitions((key) => key, true)
  const definition = searchDefinitions['cluster'].columns.map((col: any) => {
    if (typeof col.cell === 'function') {
      col.cell = col.cell(testItem)
    }
    return col
  })
  expect(definition).toMatchSnapshot(`SearchDefinitions-Cluster-globalhub`)
})

test('Correctly returns resource with managedHub column', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const testItem = {
    cluster: 'testCluster',
    managedHub: 'testManagedHub',
    kind: 'Node',
    apiversion: 'v1',
    name: 'node.1',
  }

  const nodeDefinition = getSearchDefinitions((key) => key).node
  const definition = nodeDefinition.columns.map((col: any) => {
    if (typeof col.cell === 'function') {
      col.cell = col.cell(testItem)
    }
    return col
  })
  expect(definition).toMatchSnapshot('SearchDefinitions-global-node')
})

test('Correctly returns url search params with all params & apigroup', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    cluster: 'testCluster',
    kind: 'Pod',
    apiversion: 'v1',
    name: 'testName',
    namespace: 'testNamespace',
  }
  const result = GetUrlSearchParam(item)
  expect(result).toMatchSnapshot()
})

test('Correctly returns url search params with all params without apigroup', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    cluster: 'testCluster',
    kind: 'Pod',
    apiversion: 'v1',
    name: 'testName',
    namespace: 'testNamespace',
  }
  const result = GetUrlSearchParam(item)
  expect(result).toMatchSnapshot()
})

test('Correctly returns url search params with 0 params', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    cluster: 'testCluster',
  }
  const result = GetUrlSearchParam(item)
  expect(result).toMatchSnapshot()
})

test('Correctly returns CreateExternalVMLink', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    cluster: 'testCluster',
    name: 'testVM',
    namespace: 'testVM',
  }
  const { baseElement } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(managedClusterInfosState, [
          {
            apiVersion: ManagedClusterInfoApiVersion,
            kind: ManagedClusterInfoKind,
            metadata: {
              name: 'testCluster',
              namespace: 'testCluster',
            },
            status: {
              consoleURL: 'https://testCluster.com',
              conditions: [],
              version: '1.17',
            },
          },
        ])
      }}
    >
      <MemoryRouter>
        <CreateExternalVMLink item={item} t={t} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns empty CreateExternalVMLink', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    cluster: 'testCluster',
    name: 'testVM',
    namespace: 'testVM',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <CreateExternalVMLink item={item} t={t} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns VMLaunchLinks', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    cluster: 'testCluster',
    name: 'testVM',
    namespace: 'testVM',
  }
  const { baseElement } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(configMapsState, [
          {
            apiVersion: ConfigMapApiVersion,
            kind: ConfigMapKind,
            metadata: {
              name: 'grafana-dashboard-acm-openshift-virtualization-single-vm-view',
              namespace: 'open-cluster-management',
            },
            data: {
              'acm-openshift-virtualization-single-vm-view.json': '{ "uid": "dashboardID" }',
            },
          },
        ])
        snapshot.set(clusterManagementAddonsState, [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ClusterManagementAddOn',
            metadata: {
              annotations: {
                'console.open-cluster-management.io/launch-link': 'https://testURL.com',
              },
              labels: {
                'installer.name': 'multiclusterhub',
                'installer.namespace': 'open-cluster-management',
              },
              name: 'observability-controller',
            },
            spec: {},
          },
        ])
      }}
    >
      <MemoryRouter>
        <VMLaunchLinks item={item} t={t} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns VirtualMachineSnapshot indications', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'test-snapshot',
    namespace: 'testNamespace',
    indications: 'indication1; indication2',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <VMSnapshotIndications item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns empty VirtualMachineSnapshot indications', () => {
  mockUseFlag.mockReturnValue(true) // default to flag enabled
  const item = {
    name: 'test-snapshot',
    namespace: 'testNamespace',
  }
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <VMSnapshotIndications item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})
