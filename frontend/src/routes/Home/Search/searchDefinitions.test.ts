/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import searchDefinitions, {
    CreateApplicationTopologyLink,
    CreateDetailsLink,
    CreateExternalLink,
    FormatLabels,
    FormatPolicyReportCategories,
    FormatPolicyReportPolicies,
    GetAge,
    GetUrlSearchParam,
} from './searchDefinitions'

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
        kind: 'cluster',
    }
    const result = CreateDetailsLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - ACM-Application', () => {
    const item = {
        name: 'testApplicationName',
        namespace: 'testApplicationNamespace',
        kind: 'application',
        apigroup: 'app.k8s.io',
        cluster: 'cluster',
        apiversion: 'apiversion',
    }
    const result = CreateDetailsLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - NON-Application', () => {
    const item = {
        name: 'testApplicationName',
        namespace: 'testApplicationNamespace',
        kind: 'application',
        cluster: 'testCluster',
        selfLink: '/self/link',
    }
    const result = CreateDetailsLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - HUB-Policy', () => {
    const item = {
        name: 'testPolicyName',
        namespace: 'testPolicyNamespace',
        kind: 'policy',
        _hubClusterResource: true,
        apigroup: 'policy.open-cluster-management.io',
    }
    const result = CreateDetailsLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - Managed-Policy', () => {
    const item = {
        name: 'testPolicyName',
        namespace: 'testPolicyNamespace',
        kind: 'policy',
        cluster: 'testCluster',
        selfLink: '/self/link',
    }
    const result = CreateDetailsLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - PolicyReport', () => {
    const item = {
        name: 'testPolicyReport',
        namespace: 'testPolicyReportNamespace',
        kind: 'policyreport',
        cluster: 'testCluster',
        selfLink: '/self/link',
    }
    const result = CreateDetailsLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns CreateDetailsLink - Default', () => {
    const item = {
        name: 'testPodName',
        namespace: 'testPodNamespace',
        kind: 'pod',
        cluster: 'testCluster',
        selfLink: '/self/link',
    }
    const result = CreateDetailsLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns CreateApplicationTopologyLink', () => {
    const item = {
        name: 'testName',
        namespace: 'testNamespace',
        dashboard: 'http://dashboard',
    }
    const result = CreateApplicationTopologyLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns empty CreateApplicationTopologyLink', () => {
    const item = {
        name: 'testName',
        namespace: 'testNamespace',
        dashboard: '',
    }
    const result = CreateApplicationTopologyLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns CreateExternalLink from consoleURL', () => {
    const item = {
        name: 'testName',
        namespace: 'testNamespace',
        consoleURL: 'http://consoleurl',
    }
    const result = CreateExternalLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns CreateExternalLink from clusterip', () => {
    const item = {
        name: 'testName',
        namespace: 'testNamespace',
        clusterip: 'http://clusterip',
    }
    const result = CreateExternalLink(item)
    expect(result).toMatchSnapshot()
})

test('Correctly returns empty CreateExternalLink', () => {
    const item = {
        name: 'testName',
        namespace: 'testNamespace',
    }
    const result = CreateExternalLink(item)
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
        rules: 'AUTH_OPERATOR_PROXY_ERROR; CONTAINER_ROOT_PARTITION_SIZE; MASTER_DEFINED_AS_MACHINESETS; NODES_MINIMUM_REQUIREMENTS_NOT_MET; UNSUPPORT_SDN_PLUGIN',
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
        kind: 'pod',
        cluster: 'testCluster',
        label: 'testLabel=label; testLabel1=label1',
        selfLink: '/apigroup/cluster/name',
        created: '2021-01-01T00:00:00Z',
    }
    const defKeys = Object.keys(searchDefinitions)
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

test('Correctly returns url search params with all params & apigroup', () => {
    const item = {
        cluster: 'testCluster',
        kind: 'pods',
        apiGroup: 'apps',
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
        kind: 'pods',
        apigroup: 'apps',
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
