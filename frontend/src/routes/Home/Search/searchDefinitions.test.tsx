/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render } from '@testing-library/react'
import i18next from 'i18next'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { isGlobalHubState, Settings, settingsState } from '../../../atoms'
import {
  CreateApplicationTopologyLink,
  CreateDetailsLink,
  CreateExternalLink,
  FormatLabels,
  FormatPolicyReportCategories,
  FormatPolicyReportPolicies,
  GetAge,
  getSearchDefinitions,
  GetUrlSearchParam,
} from './searchDefinitions'
const t = i18next.t.bind(i18next)

test('Correctly returns formatSearchbarSuggestions without T in timestamp', () => {
  Date.now = jest.fn(() => 1607028460000)
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    created: '2020-11-30T14:34:20Z',
  }
  const result = GetAge(item, 'created')
  expect(result).toMatchSnapshot()
})

test('Correctly returns formatSearchbarSuggestions with T in timestamp', () => {
  Date.now = jest.fn(() => 1607028460000)
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    created: '2020-11-3014:34:20Z',
  }
  const result = GetAge(item, 'created')
  expect(result).toMatchSnapshot()
})

test('Correctly returns formatSearchbarSuggestions no timestamp', () => {
  Date.now = jest.fn(() => 1607028460000)
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
  }
  const result = GetAge(item, 'created')
  expect(result).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - Cluster', () => {
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

test('Correctly returns GlobalHub CreateDetailsLink - Default', () => {
  const mockSettings: Settings = {
    globalSearchFeatureFlag: 'enabled',
  }
  const item = {
    name: 'testPodName',
    namespace: 'testPodNamespace',
    kind: 'Pod',
    cluster: 'testCluster',
    selfLink: '/self/link',
  }
  const { baseElement } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(isGlobalHubState, true), snapshot.set(settingsState, mockSettings)
      }}
    >
      <MemoryRouter>
        <CreateDetailsLink item={item} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('Correctly returns CreateApplicationTopologyLink', () => {
  const item = {
    name: 'testApp',
    namespace: 'testNamespace',
    kind: 'Application',
    apiversion: 'v1beta1',
    apigroup: 'app.k8s.io',
  }
  const result = CreateApplicationTopologyLink(item, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns empty CreateApplicationTopologyLink', () => {
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    dashboard: '',
  }
  const result = CreateApplicationTopologyLink(item, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns CreateExternalLink from consoleURL', () => {
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    consoleURL: 'http://consoleurl',
  }
  const result = CreateExternalLink(item, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns CreateExternalLink from clusterip', () => {
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    clusterip: 'http://clusterip',
  }
  const result = CreateExternalLink(item, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns empty CreateExternalLink', () => {
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
  }
  const result = CreateExternalLink(item, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns label components', () => {
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    label: 'testlabel=label1; testlabel=label2',
  }
  const result = FormatLabels(item)
  expect(result).toMatchSnapshot()
})

test('Correctly returns policyreport policies', () => {
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
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
    category: 'testcategory=category1; testcategory=category2',
  }
  const result = FormatPolicyReportCategories(item.category)
  expect(result).toMatchSnapshot()
})

test('Correctly returns empty labels', () => {
  const item = {
    name: 'testName',
    namespace: 'testNamespace',
  }
  const result = FormatLabels(item)
  expect(result).toMatchSnapshot()
})

test('Correctly returns all resource definitions', () => {
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

test('Correctly returns resource with managedHub column', () => {
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
  const item = {
    cluster: 'testCluster',
  }
  const result = GetUrlSearchParam(item)
  expect(result).toMatchSnapshot()
})
