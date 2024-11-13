/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { generatePath, MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { managedClusterAddonsState } from '../../../../atoms'
import { nockGet, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { waitForNocks, waitForNotText, waitForText } from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import { ManagedClusterAddOn } from '../../../../resources'
import { PolicyTemplateDetailsPage } from './PolicyTemplateDetailsPage'
import { PolicyTemplateDetails } from './PolicyTemplateDetails'
import PolicyTemplateYaml from './PolicyTemplateYaml'
import {
  useSearchResultItemsLazyQuery,
  useSearchResultRelatedItemsLazyQuery,
} from '../../../Search/search-sdk/search-sdk'

jest.mock('../../../../components/YamlEditor', () => {
  return function YamlEditor() {
    return <div>Yaml Editor Open</div>
  }
})

jest.mock('../../../Search/search-sdk/search-sdk')

const getResourceRequest = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: '32fc4589b2b4925338be73f42098e9a9972c7cb9',
    namespace: 'test-cluster',
    labels: {
      viewName: '32fc4589b2b4925338be73f42098e9a9972c7cb9',
    },
  },
  spec: {
    scope: {
      name: 'config-policy',
      resource: 'configurationpolicy.policy.open-cluster-management.io.v1',
    },
  },
}

const getResourceResponse = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: '32fc4589b2b4925338be73f42098e9a9972c7cb9',
    namespace: 'test-cluster',
    labels: {
      viewName: '32fc4589b2b4925338be73f42098e9a9972c7cb9',
    },
  },
  spec: {
    scope: {
      name: 'config-policy',
      resource: 'configurationpolicy.policy.open-cluster-management.io.v1',
    },
  },
  status: {
    conditions: [
      {
        message: 'Watching resources successfully',
        reason: 'GetResourceProcessing',
        status: 'True',
        type: 'Processing',
      },
    ],
    result: {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'ConfigurationPolicy',
      metadata: {
        labels: {
          'cluster-name': 'test-cluster',
          'cluster-namespace': 'test-cluster',
          'policy.open-cluster-management.io/cluster-name': 'test-cluster',
          'policy.open-cluster-management.io/cluster-namespace': 'test-cluster',
        },
        name: 'config-policy',
        namespace: 'test-cluster',
        uid: '36c5e139-0982-428f-9248-7da6fc3d97e2',
      },
      spec: {
        namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
        'object-templates': [
          {
            complianceType: 'musthave',
            objectDefinition: { apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'test' } },
          },
        ],
        remediationAction: 'inform',
        severity: 'low',
      },
      status: {
        compliancyDetails: [
          {
            Compliant: 'Compliant',
            Validity: {},
            conditions: [
              {
                lastTransitionTime: '2022-02-22T13:32:41Z',
                message: 'namespaces [test] found as specified, therefore this Object template is compliant',
                reason: 'K8s `must have` object already exists',
                status: 'True',
                type: 'notification',
              },
            ],
          },
        ],
        compliant: 'Compliant',
        relatedObjects: [
          {
            compliant: 'Compliant',
            object: { apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'test' } },
            reason: 'Resource found as expected',
            cluster: 'test-cluster',
          },
        ],
      },
    },
  },
}

const getOppolResourceRequest = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: '49652c0ab8ad9bcdcf2eeb21707b98245bd81c03',
    namespace: 'local-cluster',
    labels: { viewName: '49652c0ab8ad9bcdcf2eeb21707b98245bd81c03' },
  },
  spec: {
    scope: {
      name: 'oppol-no-group',
      namespace: 'local-cluster',
      resource: 'operatorpolicy.v1beta1.policy.open-cluster-management.io',
    },
  },
}

const getOppolResourceResponse = JSON.parse(JSON.stringify(getOppolResourceRequest))
getOppolResourceResponse.status = {
  conditions: [
    {
      message: 'Watching resources successfully',
      reason: 'GetResourceProcessing',
      status: 'True',
      type: 'Processing',
    },
  ],
  result: {
    apiVersion: 'policy.open-cluster-management.io/v1beta1',
    kind: 'OperatorPolicy',
    metadata: {
      labels: {
        'cluster-name': 'local-cluster',
        'cluster-namespace': 'local-cluster',
        'policy.open-cluster-management.io/cluster-name': 'local-cluster',
        'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
        'policy.open-cluster-management.io/policy': 'open-cluster-management-global-set.jk-quay-test',
      },
      name: 'oppol-no-group',
      namespace: 'local-cluster',
    },
    spec: {
      complianceType: 'musthave',
      remediationAction: 'enforce',
      severity: 'medium',
      subscription: {
        channel: 'stable-3.8',
        name: 'quay-operator',
        namespace: 'operator-policy-testns',
        source: 'redhat-operators',
        sourceNamespace: 'openshift-marketplace',
        startingCSV: 'quay-operator.v3.8.1',
      },
    },
    status: {
      compliant: 'Compliant',
      conditions: [
        {
          message: 'CatalogSource was found',
          reason: 'CatalogSourcesFound',
          status: 'False',
          type: 'CatalogSourcesUnhealthy',
        },
        {
          message: 'ClusterServiceVersion - install strategy completed with no errors',
          reason: 'InstallSucceeded',
          status: 'True',
          type: 'ClusterServiceVersionCompliant',
        },
        {
          message:
            'Compliant; the OperatorGroup matches what is required by the policy, the Subscription matches what is required by the policy, no InstallPlans requiring approval were found, ClusterServiceVersion - install strategy completed with no errors, all operator Deployments have their minimum availability, CatalogSource was found',
          reason: 'Compliant',
          status: 'True',
          type: 'Compliant',
        },
        {
          message: 'all operator Deployments have their minimum availability',
          reason: 'DeploymentsAvailable',
          status: 'True',
          type: 'DeploymentCompliant',
        },
        {
          message: 'no InstallPlans requiring approval were found',
          reason: 'NoInstallPlansRequiringApproval',
          status: 'True',
          type: 'InstallPlanCompliant',
        },
        {
          message: 'the OperatorGroup matches what is required by the policy',
          reason: 'OperatorGroupMatches',
          status: 'True',
          type: 'OperatorGroupCompliant',
        },
        {
          message: 'the Subscription matches what is required by the policy',
          reason: 'SubscriptionMatches',
          status: 'True',
          type: 'SubscriptionCompliant',
        },
        {
          message: 'message: no CRDs were found for the operator',
          reason: 'RelevantCRDNotFound',
          status: 'True',
          type: 'CustomResourceDefinitionCompliant',
        },
      ],
      relatedObjects: [
        {
          compliant: 'Compliant',
          object: {
            apiVersion: 'operators.coreos.com/v1alpha1',
            kind: 'CatalogSource',
            metadata: {
              name: 'redhat-operators',
              namespace: 'openshift-marketplace',
            },
          },
          reason: 'Resource found as expected',
        },
        {
          compliant: 'Compliant',
          object: {
            apiVersion: 'operators.coreos.com/v1alpha1',
            kind: 'ClusterServiceVersion',
            metadata: {
              name: 'quay-operator.v3.8.15',
              namespace: 'operator-policy-testns',
            },
          },
          reason: 'InstallSucceeded',
        },
        {
          compliant: 'UnknownCompliancy',
          object: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'quay-operator.v3.8.15',
              namespace: 'operator-policy-testns',
            },
          },
          reason: 'Deployment Available',
        },
        {
          object: {
            apiVersion: 'operators.coreos.com/v1alpha1',
            kind: 'InstallPlan',
            metadata: {
              name: 'install-4ftch',
              namespace: 'operator-policy-testns',
            },
          },
          reason: 'The InstallPlan is Complete',
        },
        {
          object: {
            apiVersion: 'operators.coreos.com/v1alpha1',
            kind: 'InstallPlan',
            metadata: {
              name: 'install-w7zpm',
              namespace: 'operator-policy-testns',
            },
          },
          reason: 'The InstallPlan is Complete',
        },
        {
          compliant: 'Compliant',
          object: {
            apiVersion: 'operators.coreos.com/v1',
            kind: 'OperatorGroup',
            metadata: {
              name: 'operator-policy-testns-k5pvq',
              namespace: 'operator-policy-testns',
            },
          },
          reason: 'Resource found as expected',
        },
        {
          compliant: 'Compliant',
          object: {
            apiVersion: 'operators.coreos.com/v1alpha1',
            kind: 'Subscription',
            metadata: {
              name: 'quay-operator',
              namespace: 'operator-policy-testns',
            },
          },
          reason: 'Resource found as expected',
        },
      ],
    },
  },
}

const getVapbResourceRequest = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: '9b3c685c8462128e263c6c950f89adb378c2ffcd',
    namespace: 'test-cluster',
    labels: { viewName: '9b3c685c8462128e263c6c950f89adb378c2ffcd' },
  },
  spec: {
    scope: {
      name: 'gatekeeper-ns-must-have-gk',
      resource: 'validatingadmissionpolicybinding.v1.admissionregistration.k8s.io',
    },
  },
}

const getVapbResourceResponse = JSON.parse(JSON.stringify(getVapbResourceRequest))
getVapbResourceResponse.status = {
  conditions: [
    {
      message: 'Watching resources successfully',
      reason: 'GetResourceProcessing',
      status: 'True',
      type: 'Processing',
    },
  ],
  result: {
    apiVersion: 'admissionregistration.k8s.io/v1',
    kind: 'ValidatingAdmissionPolicyBinding',
    metadata: {
      labels: {
        'cluster-name': 'local-cluster',
        'cluster-namespace': 'local-cluster',
        'policy.open-cluster-management.io/cluster-name': 'local-cluster',
        'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
      },
      name: 'gatekeeper-ns-must-have-gk',
    },
    spec: {
      policyName: 'gatekeeper-k8srequiredlabels',
      validationActions: ['Deny'],
      paramRef: { name: 'pod-1', namespace: 'test1' },
    },
  },
}

describe('Policy Template Details Page', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    ;(useSearchResultItemsLazyQuery as jest.Mock).mockReturnValue([
      jest.fn(),
      {
        data: {
          searchResult: [
            {
              items: [
                {
                  _hubClusterResource: 'true',
                  _ownedByGatekeeper: 'true',
                  _uid: 'local-cluster/acc7a127-8af9-4f66-ae6a-2bdbfe022e1a',
                  apigroup: 'admissionregistration.k8s.io',
                  apiversion: 'v1',
                  cluster: 'local-cluster',
                  created: '2024-10-28T15:15:59Z',
                  kind: 'ValidatingAdmissionPolicyBinding',
                  kind_plural: 'validatingadmissionpolicybindings',
                  name: 'gatekeeper-all-must-have-owner',
                  policyName: 'gatekeeper-k8srequiredlabels',
                  validationActions: 'deny',
                },
              ],
              __typename: 'SearchResult',
            },
          ],
        },
        loading: false,
        error: undefined,
      },
    ])()
    ;(useSearchResultRelatedItemsLazyQuery as jest.Mock).mockReturnValue([
      jest.fn(),
      {
        data: {
          searchResult: [
            {
              related: [
                {
                  kind: 'Namespace',
                  items: [
                    {
                      _hubClusterResource: 'true',
                      _relatedUids: ['local-cluster/a9c329fb-db5b-4514-8688-01862b16d22f'],
                      _uid: 'local-cluster/6cdec79f-980f-4947-95ab-3ce9789b270f',
                      apiversion: 'v1',
                      cluster: 'local-cluster',
                      created: '2024-10-31T11:10:45Z',
                      kind: 'Namespace',
                      kind_plural: 'namespaces',
                      label:
                        'kubernetes.io/metadata.name=openshift-etcd-operator; olm.operatorgroup.uid/4a2d0c68-f76d-4078-8ed6-26f586a3cc75=; openshift.io/cluster-monitoring=true; openshift.io/run-level=0; pod-security.kubernetes.io/audit=restricted; pod-security.kubernetes.io/enforce=restricted; pod-security.kubernetes.io/warn=restricted',
                      name: 'openshift-etcd-operator',
                      status: 'Active',
                    },
                  ],
                },
                {
                  kind: 'ClusterPolicyReport',
                  items: [
                    {
                      _hubClusterResource: 'true',
                      _relatedUids: ['local-cluster/6cdec79f-980f-4947-95ab-3ce9789b270f'],
                      _uid: 'local-cluster/436cd10e-a08b-4afd-a42e-e2d608eb7dca',
                      apigroup: 'wgpolicyk8s.io',
                      apiversion: 'v1alpha2',
                      category: '',
                      cluster: 'local-cluster',
                      created: '2024-10-31T16:23:15Z',
                      critical: '0',
                      important: '0',
                      kind: 'ClusterPolicyReport',
                      kind_plural: 'clusterpolicyreports',
                      label: 'app.kubernetes.io/managed-by=kyverno',
                      low: '0',
                      moderate: '0',
                      name: '6cdec79f-980f-4947-95ab-3ce9789b270f',
                      numRuleViolations: '1',
                      _policyViolationCounts: 'require-owner-labels=1',
                      rules: 'require-owner-labels',
                      scope: 'e2e-rbac-test-1',
                    },
                  ],
                },
                {
                  kind: 'Namespace',
                  items: [
                    {
                      _hubClusterResource: 'true',
                      _relatedUids: ['local-cluster/97c60893-ea66-47ac-8e2f-0c191246ad32'],
                      _uid: 'local-cluster/b56b0432-75f8-4440-ac53-86a993c3c2f6',
                      apiversion: 'v1',
                      cluster: 'local-cluster',
                      created: '2024-10-31T11:10:45Z',
                      kind: 'Namespace',
                      kind_plural: 'namespaces',
                      name: 'my-app',
                      status: 'Active',
                    },
                  ],
                },
                {
                  kind: 'ClusterPolicyReport',
                  items: [
                    {
                      _hubClusterResource: 'true',
                      _relatedUids: ['local-cluster/b56b0432-75f8-4440-ac53-86a993c3c2f6'],
                      _uid: 'local-cluster/97c60893-ea66-47ac-8e2f-0c191246ad32',
                      apigroup: 'wgpolicyk8s.io',
                      apiversion: 'v1alpha2',
                      category: '',
                      cluster: 'local-cluster',
                      created: '2024-10-31T16:23:15Z',
                      critical: '0',
                      important: '0',
                      kind: 'ClusterPolicyReport',
                      kind_plural: 'clusterpolicyreports',
                      label: 'app.kubernetes.io/managed-by=kyverno',
                      low: '0',
                      moderate: '0',
                      name: 'b56b0432-75f8-4440-ac53-86a993c3c2f6',
                      numRuleViolations: '0',
                      _policyViolationCounts: 'require-owner-labels=0',
                      rules: 'require-owner-labels',
                      scope: 'e2e-rbac-test-1',
                    },
                  ],
                },
              ],
            },
          ],
          loading: false,
          error: undefined,
        },
      },
    ])()
  })
  test('Should render Policy Template Details Page', async () => {
    const path =
      '/multicloud/governance/policies/details/test/parent-policy/template/test-cluster/' +
      'policy.open-cluster-management.io/v1/ConfigurationPolicy/config-policy'
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)
    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.policyTemplateDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.policyTemplateYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    // Wait for delete resource requests to finish
    await waitForNocks([getResourceNock])

    // wait for page load - looking for breadcrumb items
    await waitForText('Policies')
    await waitForText('parent-policy')
    await waitForText('config-policy', true) // config-policy is in breadcrumb and also the page header - so set multipleAllowed prop to true

    await waitForText('ConfigurationPolicy details')

    await waitForText('test-cluster')
    await waitForText('ConfigurationPolicy')

    // wait for related resources table to load correctly
    await waitForText('Related resources')
    await waitForText('test')
    await waitForText('v1')
    await waitForText('No violations', true)
    await waitForText('Resource found as expected')

    // wait for template yaml to load correctly
    await waitForText('YAML')
    const yamlButton = container.querySelectorAll('.pf-c-nav__link')
    expect(yamlButton).not.toBeNull()

    userEvent.click(yamlButton[1])

    await waitForText('Yaml Editor Open')
  })

  test('Should render Policy Template Details Page content correctly in hosted mode', async () => {
    const clusterName = 'customer-cluster'
    const hostingClusterName = 'hosting-cluster'
    const installNamespace = `${clusterName}-hosted`
    const path =
      `/multicloud/governance/policies/details/test/parent-policy/template/${clusterName}/` +
      'policy.open-cluster-management.io/v1/ConfigurationPolicy/config-policy'

    // Add one irrelevant addon not in hosted mode to ensure it gets ignored.
    const mockManagedClusterAddOnWork: ManagedClusterAddOn = {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        name: 'work-manager',
        namespace: clusterName,
      },
      spec: {},
    }
    const mockManagedClusterAddOnPolicy: ManagedClusterAddOn = {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        name: 'governance-policy-framework',
        namespace: clusterName,
        annotations: {
          'addon.open-cluster-management.io/hosting-cluster-name': hostingClusterName,
        },
      },
      spec: {
        installNamespace: installNamespace,
      },
    }

    const mockManagedClusterAddOn: Record<string, ManagedClusterAddOn[]> = {}
    mockManagedClusterAddOn[clusterName] = [mockManagedClusterAddOnWork, mockManagedClusterAddOnPolicy]

    const getResourceRequestCopy = JSON.parse(JSON.stringify(getResourceRequest))
    getResourceRequestCopy.metadata.namespace = hostingClusterName
    getResourceRequestCopy.metadata.name = '6b5d34f1f43b9ca1ea4d4e889bda37e4ae8d0435'
    getResourceRequestCopy.metadata.labels.viewName = '6b5d34f1f43b9ca1ea4d4e889bda37e4ae8d0435'

    const getResourceResponseCopy = JSON.parse(JSON.stringify(getResourceResponse))
    getResourceResponseCopy.metadata.namespace = hostingClusterName
    getResourceResponseCopy.status.result.metadata.namespace = installNamespace
    getResourceResponseCopy.metadata.name = '6b5d34f1f43b9ca1ea4d4e889bda37e4ae8d0435'
    getResourceResponseCopy.metadata.labels.viewName = '6b5d34f1f43b9ca1ea4d4e889bda37e4ae8d0435'
    getResourceResponseCopy.status.result.metadata.labels = {
      'cluster-name': clusterName,
      'cluster-namespace': installNamespace,
      'policy.open-cluster-management.io/cluster-name': clusterName,
      'policy.open-cluster-management.io/cluster-namespace': installNamespace,
    }

    const getResourceNock = nockGet(getResourceRequestCopy, getResourceResponseCopy)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, mockManagedClusterAddOn)
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.policyTemplateDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.policyTemplateYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    await waitForText('ConfigurationPolicy details')

    // Verify the template description section
    // Ensure the hosting cluster name isn't shown as the cluster name
    await waitForText(clusterName)
    await waitForText('ConfigurationPolicy')
    await waitForText('View YAML')
    const viewYamlLink = screen.getByText('View YAML')
    expect(viewYamlLink.getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=${clusterName}&kind=Namespace&apiversion=v1&name=test`
    )
  })

  test('Should render Policy Template Details Page content correctly with Gatekeeper content', async () => {
    const path =
      '/multicloud/governance/policies/details/test/parent-policy/template/test-cluster/' +
      'constraints.gatekeeper.sh/v1beta1/K8sRequiredLabels/ns-must-have-gk'

    const getResourceRequest = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: '2c4748c7114452970305fa911ee6192a2f20271f',
        namespace: 'test-cluster',
        labels: { viewName: '2c4748c7114452970305fa911ee6192a2f20271f' },
      },
      spec: {
        scope: {
          name: 'ns-must-have-gk',
          resource: 'k8srequiredlabels.v1beta1.constraints.gatekeeper.sh',
        },
      },
    }

    const getResourceResponse = JSON.parse(JSON.stringify(getResourceRequest))
    getResourceResponse.status = {
      conditions: [
        {
          message: 'Watching resources successfully',
          reason: 'GetResourceProcessing',
          status: 'True',
          type: 'Processing',
        },
      ],
      result: {
        apiVersion: 'constraints.gatekeeper.sh/v1beta1',
        kind: 'K8sRequiredLabels',
        metadata: {
          labels: {
            'cluster-name': 'test-cluster',
            'cluster-namespace': 'test-cluster',
            'policy.open-cluster-management.io/cluster-name': 'test-cluster',
            'policy.open-cluster-management.io/cluster-namespace': 'test-cluster',
            'policy.open-cluster-management.io/policy': 'open-cluster-management-global-set.gk-policy',
          },
          name: 'ns-must-have-gk',
        },
        spec: {
          enforcementAction: 'warn',
          match: {
            kinds: [{ apiGroups: ['networking.k8s.io', 'my-system.sh'], kinds: ['app'] }, { kinds: ['Pod'] }],
          },
          parameters: { labels: ['gatekeeper'] },
        },
        status: {
          auditTimestamp: '2023-04-19T14:36:50Z',
          byPod: [
            {
              constraintUID: '920387b5-5976-48d5-a51b-4a74db008dfa',
              enforced: true,
              id: 'gatekeeper-audit-7457d48b6c-rtjtf',
              observedGeneration: 1,
              operations: ['audit', 'status'],
            },
            {
              constraintUID: '920387b5-5976-48d5-a51b-4a74db008dfa',
              enforced: true,
              id: 'gatekeeper-controller-manager-758949dcb9-2vrrg',
              observedGeneration: 1,
              operations: ['webhook'],
            },
            {
              constraintUID: '920387b5-5976-48d5-a51b-4a74db008dfa',
              enforced: true,
              id: 'gatekeeper-controller-manager-758949dcb9-pxwll',
              observedGeneration: 1,
              operations: ['webhook'],
            },
          ],
          totalViolations: 2,
          violations: [
            {
              enforcementAction: 'warn',
              group: '',
              kind: 'Namespace',
              message: 'you must provide labels: {"gatekeeper"}',
              name: 'default',
              version: 'v1',
            },
            {
              enforcementAction: 'warn',
              group: '',
              kind: 'Namespace',
              message: 'you must provide labels: {"gatekeeper"}',
              name: 'default-broker',
              version: 'v1',
            },
          ],
        },
      },
    }

    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.policyTemplateDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.policyTemplateYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    await waitForText('K8sRequiredLabels details')

    // Verify the template description section
    await waitForText('ns-must-have-gk', true)
    await waitForText('K8sRequiredLabels')

    await waitForText('View YAML', true)

    await waitForText('Audit violations')

    expect(within(screen.getByText('Audit violations')).getByText('2')).toBeInTheDocument()

    const viewYamlLinks = screen.getAllByText('View YAML')
    expect(viewYamlLinks[0].getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=test-cluster&kind=Namespace&apiversion=v1&name=default`
    )
    expect(viewYamlLinks[1].getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=test-cluster&kind=Namespace&apiversion=v1&name=default-broker`
    )

    // Verify the generated ValidatingAdmissionPolicyBinding
    await waitForText('gatekeeper-ns-must-have-gk')
    await waitForText('Validating Admission Policy Binding')
    expect(screen.getByRole('link', { name: 'gatekeeper-ns-must-have-gk' })).toHaveAttribute(
      'href',
      generatePath(NavigationPath.discoveredPolicyDetails, {
        clusterName: 'test-cluster',
        apiVersion: 'v1',
        apiGroup: 'admissionregistration.k8s.io',
        kind: 'ValidatingAdmissionPolicyBinding',
        templateName: `gatekeeper-ns-must-have-gk`,
        templateNamespace: null,
      })
    )
  })

  test('Should render Policy Template Details Page content correctly with OperatorPolicy content', async () => {
    const path =
      '/multicloud/governance/policies/details/test/parent-policy/template/local-cluster/' +
      'policy.open-cluster-management.io/v1beta1/OperatorPolicy/oppol-no-group'

    const getResourceNock = nockGet(getOppolResourceRequest, getOppolResourceResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.policyTemplateDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.policyTemplateYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    await waitForText('OperatorPolicy details')

    // Verify the template description section
    await waitForText('oppol-no-group', true)
    await waitForText('OperatorPolicy')

    await waitForText('Message')
    await waitForText(
      'Compliant; the OperatorGroup matches what is required by the policy, the Subscription matches what is ' +
        'required by the policy, no InstallPlans requiring approval were found, ClusterServiceVersion - install ' +
        'strategy completed with no errors, all operator Deployments have their minimum availability, CatalogSource ' +
        'was found'
    )

    await waitForText('View YAML', true)

    const row = screen.getByRole('row', {
      name: /Deployment Available/i,
    })
    const viewYamlLink = within(row).getByRole('link', { name: /view yaml/i })
    expect(viewYamlLink.getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=local-cluster&kind=Deployment&apiversion=apps/v1&name=quay-operator.v3.8.15&namespace=operator-policy-testns`
    )
  })

  test('Should render OperatorPolicy content correctly with UnknownCompliance', async () => {
    const path =
      '/multicloud/governance/policies/details/test/parent-policy/template/local-cluster/' +
      'policy.open-cluster-management.io/v1beta1/OperatorPolicy/oppol-no-group'

    const replaceRelatedObj = [
      {
        compliant: 'Compliant',
        object: {
          apiVersion: 'operators.coreos.com/v1alpha1',
          kind: 'CatalogSource',
          metadata: {
            name: 'redhat-operators',
            namespace: 'openshift-marketplace',
          },
        },
        reason: 'Resource found as expected',
      },
      {
        compliant: 'Compliant',
        object: {
          apiVersion: 'operators.coreos.com/v1alpha1',
          kind: 'ClusterServiceVersion',
          metadata: {
            name: 'quay-operator.v3.8.15',
            namespace: 'operator-policy-testns',
          },
        },
        reason: 'InstallSucceeded',
      },
      {
        compliant: 'Compliant',
        object: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: {
            name: '-',
            namespace: '-',
          },
        },
        reason: 'No relevant deployments found',
      },
      {
        object: {
          apiVersion: 'operators.coreos.com/v1alpha1',
          kind: 'InstallPlan',
          metadata: {
            name: 'install-4ftch',
            namespace: 'operator-policy-testns',
          },
        },
        reason: 'The InstallPlan is Complete',
      },
      {
        object: {
          apiVersion: 'operators.coreos.com/v1alpha1',
          kind: 'InstallPlan',
          metadata: {
            name: 'install-w7zpm',
            namespace: 'operator-policy-testns',
          },
        },
        reason: 'The InstallPlan is Complete',
      },
      {
        compliant: 'Compliant',
        object: {
          apiVersion: 'operators.coreos.com/v1',
          kind: 'OperatorGroup',
          metadata: {
            name: 'operator-policy-testns-k5pvq',
            namespace: 'operator-policy-testns',
          },
        },
        reason: 'Resource found as expected',
      },
      {
        compliant: 'Compliant',
        object: {
          apiVersion: 'operators.coreos.com/v1alpha1',
          kind: 'Subscription',
          metadata: {
            name: 'quay-operator',
            namespace: 'operator-policy-testns',
          },
        },
        reason: 'Resource found as expected',
      },
      {
        compliant: 'UnknownCompliancy',
        object: {
          apiVersion: 'apiextensions.k8s.io/v1',
          kind: 'CustomResourceDefinition',
          metadata: {
            name: '-',
            namespace: '-',
          },
        },
        reason: 'No relevant CustomResourceDefinitions found',
      },
      {
        compliant: 'UnknownCompliancy',
        object: {
          apiVersion: 'v1',
          kind: 'Namespace',
          metadata: {
            name: '-',
          },
        },
        reason: 'Test UnknownCompliancy for No status case',
      },
    ]

    getOppolResourceResponse.status.result.status.relatedObjects = replaceRelatedObj
    const getResourceNock = nockGet(getOppolResourceRequest, getOppolResourceResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.policyTemplateDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.policyTemplateYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    await waitForText('OperatorPolicy details')

    // Verify the template description section
    await waitForText('oppol-no-group', true)
    await waitForText('OperatorPolicy')

    // Verify that 'Inapplicable' is displayed for certain relatedObjects
    await waitForText('Inapplicable', true)

    // Verify that 'No Status' is displayed for certain relatedObjects
    await waitForText('No status', true)
  })

  test('Should render correctly with relatedObject name is - when it is cluster scope', async () => {
    const path =
      '/multicloud/governance/policies/details/test/parent-policy/template/test-cluster/' +
      'policy.open-cluster-management.io/v1/ConfigurationPolicy/config-policy'

    const replaceRelatedObj = [
      {
        compliant: 'NonCompliant',
        object: { apiVersion: 'v1', kind: 'Namespace', metadata: { name: '-' } },
        reason: 'Resource found as expected',
        cluster: 'test-cluster',
      },
    ]
    getResourceResponse.status.result.status.relatedObjects = replaceRelatedObj
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.policyTemplateDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.policyTemplateYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    await waitForText('ConfigurationPolicy details')

    // wait for related resources table to load correctly
    await waitForText('Related resources')
    // Both namespace and name
    await waitForText('-', true)
    await waitForText('v1')
    await waitForNotText('View YAML')
  })

  test('Should render correctly with relatedObject name is - when it is namespace scope', async () => {
    const path =
      '/multicloud/governance/policies/details/test/parent-policy/template/test-cluster/' +
      'policy.open-cluster-management.io/v1/ConfigurationPolicy/config-policy'

    const replaceRelatedObj = [
      {
        compliant: 'NonCompliant',
        object: { apiVersion: 'networking.k8s.io/v1', kind: 'Ingress', metadata: { namespace: 'ohmyns', name: '-' } },
        reason: 'Resource found as expected',
        cluster: 'test-cluster',
      },
    ]
    getResourceResponse.status.result.status.relatedObjects = replaceRelatedObj
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.policyTemplateDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.policyTemplateYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    // wait for template yaml to load correctly
    await waitForText('ConfigurationPolicy details')

    // wait for related resources table to load correctly
    await waitForText('Related resources')
    await waitForText('-')
    await waitForText('networking.k8s.io/v1')
    await waitForNotText('View YAML')
  })

  test('Should show an error when displaying unsupported IamPolicy', async () => {
    const path =
      '/multicloud/governance/policies/details/test/parent-policy/template/test-cluster/' +
      'policy.open-cluster-management.io/v1/IamPolicy/limit-cluster-admins'

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.policyTemplateDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.policyTemplateYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('IamPolicy is no longer supported')
  })

  test('Should render discovered policy detail page successfully', async () => {
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)

    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredPolicyDetails, {
              clusterName: 'test-cluster',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
              kind: 'ConfigurationPolicy',
              templateName: 'config-policy',
              templateNamespace: 'open-cluster-management-policies',
            }),
          ]}
        >
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.discoveredPolicyDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.discoveredPolicyYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for delete resource requests to finish
    await waitForNocks([getResourceNock])

    // wait for page load - looking for breadcrumb items
    await waitForText('Discovered policies')

    expect(screen.getByRole('link', { name: 'config-policy' })).toBeInTheDocument()

    await waitForText('ConfigurationPolicy details')

    // wait for related resources table to load correctly
    await waitForText('Related resources')
    await waitForText('Resource found as expected')

    // config-policy is in breadcrumb and also the page header - so set multipleAllowed prop to true
    await waitForText('test-cluster', true)

    await waitForText('open-cluster-management-policies')
    await waitForText('config-policy', true)
    await waitForText('ConfigurationPolicy', true)

    // wait for template yaml to load correctly
    await waitForText('YAML')
    const yamlButton = container.querySelectorAll('.pf-c-nav__link')
    expect(yamlButton).not.toBeNull()

    userEvent.click(yamlButton[1])

    await waitForText('Yaml Editor Open')
  })

  test('Should render ValidatingAdmissionPolicyBinding page successfully', async () => {
    const getResourceNock = nockGet(getVapbResourceRequest, getVapbResourceResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredPolicyDetails, {
              clusterName: 'test-cluster',
              apiGroup: 'admissionregistration.k8s.io',
              apiVersion: 'v1',
              kind: 'ValidatingAdmissionPolicyBinding',
              templateName: 'gatekeeper-ns-must-have-gk',
              templateNamespace: '',
            }),
          ]}
        >
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.discoveredPolicyDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.discoveredPolicyYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for delete resource requests to finish
    await waitForNocks([getResourceNock])

    // wait for page load - looking for breadcrumb items
    await waitForText('Discovered policies')

    expect(screen.getByRole('link', { name: 'gatekeeper-ns-must-have-gk' })).toBeInTheDocument()

    await waitForText('ValidatingAdmissionPolicyBinding details')

    // Find ValidatingAdmissionPolicy name
    await waitForText('gatekeeper-k8srequiredlabels', true)
    expect(screen.getByRole('link', { name: 'gatekeeper-k8srequiredlabels' })).toBeInTheDocument()
  })

  test('Should render Kyverno policy page successfully', async () => {
    ;(useSearchResultItemsLazyQuery as jest.Mock).mockReturnValue([
      jest.fn(),
      {
        data: {
          searchResult: [
            {
              items: [
                {
                  _hubClusterResource: 'true',
                  _ownedByGatekeeper: 'true',
                  _uid: 'local-cluster/acc7a127-8af9-4f66-ae6a-2bdbfe022e1a',
                  apigroup: 'admissionregistration.k8s.io',
                  apiversion: 'v1',
                  cluster: 'local-cluster',
                  created: '2024-10-28T15:15:59Z',
                  kind: 'ValidatingAdmissionPolicyBinding',
                  kind_plural: 'validatingadmissionpolicybindings',
                  name: 'require-owner-labels-binding',
                  policyName: 'require-owner-labels',
                  validationActions: 'audit',
                },
              ],
              __typename: 'SearchResult',
            },
          ],
        },
        loading: false,
        error: undefined,
      },
    ])()

    const getClusterPolicyResourceRequest = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: 'ff0861ca95ffc8c791c974681ad9bf84341f9419',
        namespace: 'test-cluster',
        labels: {
          viewName: 'ff0861ca95ffc8c791c974681ad9bf84341f9419',
        },
      },
      spec: {
        scope: {
          name: 'require-owner-labels',
          resource: 'clusterpolicy.v1.kyverno.io',
        },
      },
    }

    const getClusterPolicyResourceResponse = JSON.parse(JSON.stringify(getClusterPolicyResourceRequest))
    getClusterPolicyResourceResponse.status = {
      conditions: [
        {
          message: 'Watching resources successfully',
          reason: 'GetResourceProcessing',
          status: 'True',
          type: 'Processing',
        },
      ],
      result: {
        apiVersion: 'kyverno.io/v1',
        kind: 'ClusterPolicy',
        metadata: {
          name: 'require-owner-labels',
          annotations: {
            'policies.kyverno.io/title': 'Require Owner Labels',
            'policies.kyverno.io/severity': 'medium',
          },
        },
        spec: {
          validationFailureAction: 'Audit',
          background: true,
          rules: [
            {
              name: 'require-labels',
              match: {
                any: [
                  {
                    resources: {
                      kinds: ['Ingress'],
                    },
                  },
                ],
              },
              validate: {
                message: 'The label `owner` is required',
                pattern: {
                  metadata: {
                    labels: {
                      owner: '?*',
                    },
                  },
                },
              },
            },
          ],
        },
      },
    }

    const getResourceNock = nockGet(getClusterPolicyResourceRequest, getClusterPolicyResourceResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, {})
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredPolicyDetails, {
              clusterName: 'test-cluster',
              apiGroup: 'kyverno.io',
              apiVersion: 'v1',
              kind: 'ClusterPolicy',
              templateName: 'require-owner-labels',
              templateNamespace: '',
            }),
          ]}
        >
          <Routes>
            <Route element={<PolicyTemplateDetailsPage />}>
              <Route path={NavigationPath.discoveredPolicyDetails} element={<PolicyTemplateDetails />} />
              <Route path={NavigationPath.discoveredPolicyYaml} element={<PolicyTemplateYaml />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for delete resource requests to finish
    await waitForNocks([getResourceNock])

    // wait for page load - looking for breadcrumb items
    await waitForText('Discovered policies')

    expect(screen.getByRole('link', { name: 'require-owner-labels' })).toBeInTheDocument()

    await waitForText('Audit violations')

    expect(within(screen.getByText('Audit violations')).getByText('1')).toBeInTheDocument()

    await waitForText('ClusterPolicy details')

    // ClusterPolicyReport and PoliyReport should be filtered
    await waitForNotText('ClusterPolicyReport')

    waitForText('API version')
    waitForText('kyverno.io/v1')

    waitForText('Namespace', true)

    // VAPB link
    expect(screen.getByRole('link', { name: 'require-owner-labels-binding' })).toBeInTheDocument()

    // Verify the "Related resources" table rows
    const violationRow = screen.getByRole('row', {
      name: 'openshift-etcd-operator - Namespace v1 Violations View report View YAML',
    })
    expect(violationRow).toBeInTheDocument()
    expect(within(violationRow).getByRole('link', { name: 'View YAML' })).toBeInTheDocument()

    await waitForText('View report', true)
    const violationPolicyReportLink = within(violationRow).getByRole('link', { name: 'View report' })
    expect(violationPolicyReportLink.getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=local-cluster&kind=ClusterPolicyReport&apiversion=wgpolicyk8s.io%2Fv1alpha2&name=6cdec79f-980f-4947-95ab-3ce9789b270f`
    )

    const passingRow = screen.getByRole('row', {
      name: 'my-app - Namespace v1 No violations View report View YAML',
    })
    expect(passingRow).toBeInTheDocument()
    await waitForText('View report', true)
    const passingPolicyReportLink = within(passingRow).getByRole('link', { name: 'View report' })
    expect(passingPolicyReportLink.getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=local-cluster&kind=ClusterPolicyReport&apiversion=wgpolicyk8s.io%2Fv1alpha2&name=b56b0432-75f8-4440-ac53-86a993c3c2f6`
    )
  })
})
