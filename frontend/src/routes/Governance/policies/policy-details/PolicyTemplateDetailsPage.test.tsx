/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor, within } from '@testing-library/react'
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
                      _relatedUids: ['test-cluster/6cdec79f-980f-4947-95ab-3ce9789b270f'],
                      _uid: 'test-cluster/436cd10e-a08b-4afd-a42e-e2d608eb7dca',
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
                    {
                      _hubClusterResource: 'true',
                      _relatedUids: ['test-cluster/b56b0432-75f8-4440-ac53-86a993c3c2f6'],
                      _uid: 'test-cluster/97c60893-ea66-47ac-8e2f-0c191246ad32',
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
                      numRuleViolations: '1',
                      _policyViolationCounts: 'require-owner-labels=1',
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
  test.skip('Should render Policy Template Details Page', async () => {
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
    expect(screen.getByRole('link', { name: 'test' })).toBeInTheDocument()
    await waitForText('v1')
    await waitForText('No violations', true)
    await waitForText('Resource found as expected')

    // wait for template yaml to load correctly
    await waitForText('YAML')
    const yamlButton = container.querySelectorAll('.pf-c-nav__link')
    expect(yamlButton).not.toBeNull()

    userEvent.click(yamlButton[1])

    await waitForText('Yaml Editor Open')

    // Check violation badge
    const heading = screen.getByRole('heading', {
      name: 'CP config-policy No violations',
    })
    within(heading).getByText('No violations')
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
    await waitForText('test')

    const name = screen.getByRole('link', { name: 'test' })
    expect(name.getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=${clusterName}&kind=Namespace&apiversion=v1&name=test`
    )

    // Check violation badge
    const heading = screen.getByRole('heading', {
      name: 'CP config-policy No violations',
    })
    within(heading).getByText('No violations')
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

    await waitForText('Audit violations')

    expect(within(screen.getByText('Audit violations')).getByText('2')).toBeInTheDocument()

    await waitForText('Audit violations')

    expect(within(screen.getByText('Audit violations')).getByText('2')).toBeInTheDocument()

    const firstRowName = screen.getByRole('link', { name: 'default' })
    expect(firstRowName.getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=test-cluster&kind=Namespace&apiversion=v1&name=default`
    )

    const SecondRowName = screen.getByRole('link', {
      name: 'default-broker',
    })
    expect(SecondRowName.getAttribute('href')).toEqual(
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

    // Check violation badge
    const view = screen.getByText('Audit violations')
    within(view).getByText('2')
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

    const row = screen.getByRole('row', {
      name: /Deployment Available/i,
    })

    const firstRowName = within(row).getByRole('link', { name: 'quay-operator.v3.8.15' })
    expect(firstRowName.getAttribute('href')).toEqual(
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

    // Check violation badge
    const heading = screen.getByRole('heading', {
      name: 'OP oppol-no-group No violations',
    })

    within(heading).getByText('No violations')
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

    // Check violation badge
    waitForText('No violations')
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

    // Check violation badge
    waitForText('No violations')
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

  test.skip('Should render discovered policy detail page successfully', async () => {
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

    waitForText('No violations', true)

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

    // Check violation badge
    await waitForText('No violations')
  })

  test('Should render ValidatingAdmissionPolicyBinding page successfully without parameter references', async () => {
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

    await waitForText('Parameter resources')
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
                      kinds: ['Namespace'],
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

    const getClusterPolicyReportResourceRequest1 = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: '9a2fe25b8fc3171745ff8d0ead2ecc6998a60d8a',
        namespace: 'local-cluster',
        labels: {
          viewName: '9a2fe25b8fc3171745ff8d0ead2ecc6998a60d8a',
        },
      },
      spec: {
        scope: {
          name: '6cdec79f-980f-4947-95ab-3ce9789b270f',
          resource: 'clusterpolicyreport.v1alpha2.wgpolicyk8s.io',
        },
      },
    }
    const getClusterPolicyResourceResponse1 = JSON.parse(JSON.stringify(getClusterPolicyReportResourceRequest1))
    getClusterPolicyResourceResponse1.status = {
      conditions: [
        {
          message: 'Watching resources successfully',
          reason: 'GetResourceProcessing',
          status: 'True',
          type: 'Processing',
        },
      ],
      result: {
        apiVersion: 'wgpolicyk8s.io/v1alpha2',
        kind: 'ClusterPolicyReport',
        metadata: {
          name: '6cdec79f-980f-4947-95ab-3ce9789b270f',
        },
        results: [
          {
            message:
              'validation error: The label `owner` is required. rule require-labels failed at path /metadata/labels/owner/',
            policy: 'require-owner-labels',
            result: 'fail',
            rule: 'require-labels',
            scored: true,
            severity: 'medium',
            source: 'kyverno',
            timestamp: {
              nanos: 0,
              seconds: 1731688479,
            },
          },
        ],
      },
    }

    const getReportResourceNock1 = nockGet(getClusterPolicyReportResourceRequest1, getClusterPolicyResourceResponse1)

    const getClusterPolicyReportResourceRequest2 = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: 'b500ccd03fe8c300b294c3a9ecdb1eed50842142',
        namespace: 'local-cluster',
        labels: {
          viewName: 'b500ccd03fe8c300b294c3a9ecdb1eed50842142',
        },
      },
      spec: {
        scope: {
          name: 'b56b0432-75f8-4440-ac53-86a993c3c2f6',
          resource: 'clusterpolicyreport.v1alpha2.wgpolicyk8s.io',
        },
      },
    }
    const getClusterPolicyResourceResponse2 = JSON.parse(JSON.stringify(getClusterPolicyReportResourceRequest2))
    getClusterPolicyResourceResponse2.status = {
      conditions: [
        {
          message: 'Watching resources successfully',
          reason: 'GetResourceProcessing',
          status: 'True',
          type: 'Processing',
        },
      ],
      result: {
        apiVersion: 'wgpolicyk8s.io/v1alpha2',
        kind: 'ClusterPolicyReport',
        metadata: {
          name: 'b56b0432-75f8-4440-ac53-86a993c3c2f6',
        },
        results: [
          {
            message:
              'validation error: The label `owner` is required. rule require-labels failed at path /metadata/labels',
            policy: 'require-owner-labels',
            result: 'fail',
            rule: 'require-labels',
            scored: true,
            severity: 'medium',
            source: 'kyverno',
            timestamp: {
              nanos: 0,
              seconds: 1731688479,
            },
          },
        ],
      },
    }

    const getReportResourceNock2 = nockGet(getClusterPolicyReportResourceRequest2, getClusterPolicyResourceResponse2)

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
    await waitForNocks([getReportResourceNock1, getReportResourceNock2, getResourceNock])

    // wait for page load - looking for breadcrumb items
    await waitForText('Discovered policies')

    expect(screen.getByRole('link', { name: 'require-owner-labels' })).toBeInTheDocument()

    await waitForText('Audit violations')

    expect(within(screen.getByText('Audit violations')).getByText('2')).toBeInTheDocument()

    await waitForText('ClusterPolicy details')

    // ClusterPolicyReport and PolicyReport should be filtered
    await waitForNotText('ClusterPolicyReport')

    // Related table also has this
    waitForText('API version', true)
    waitForText('kyverno.io/v1')
    // VAPB link
    expect(screen.getByRole('link', { name: 'require-owner-labels-binding' })).toBeInTheDocument()

    // Verify the "Related resources" table rows

    await waitFor(
      () => {
        // Wait until policyReport messages are up
        const myappRow = screen.getByRole('row', {
          name: /my-app - namespace v1 violations view report require-labels: validation error: the label `owner` is required\. rule require-labels failed at path \/metadata\/labels/i,
        })
        expect(myappRow).toBeInTheDocument()

        const openshiftRow = screen.getByRole('row', {
          name: /validation error: the label `owner` is required\. rule require-labels failed at path \/metadata\/labels\/owner\//i,
        })
        expect(openshiftRow).toBeInTheDocument()
      },
      { timeout: 5000, interval: 1000 }
    )

    // Verify openshift-etcd-operator row
    const openshiftRow = screen.getByRole('row', {
      name: /openshift-etcd-operator - namespace v1 violations view report require-labels: validation error: the label `owner` is required. rule require-labels failed at path \/metadata\/labels\/owner\//i,
    })
    const violationPolicyReportLink = within(openshiftRow).getByRole('link', { name: 'View report' })
    expect(violationPolicyReportLink.getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=local-cluster&kind=ClusterPolicyReport&apiversion=wgpolicyk8s.io%2Fv1alpha2&name=6cdec79f-980f-4947-95ab-3ce9789b270f`
    )
    screen.getByRole('link', {
      name: /openshift-etcd-operator/i,
    })

    const passingRow = screen.getByRole('row', {
      name: /my-app - namespace v1 violations view report require-labels: validation error: the label `owner` is required\. rule require-labels failed at path \/metadata\/labels/i,
    })
    const passingPolicyReportLink = within(passingRow).getByRole('link', { name: 'View report' })
    expect(passingPolicyReportLink.getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=local-cluster&kind=ClusterPolicyReport&apiversion=wgpolicyk8s.io%2Fv1alpha2&name=b56b0432-75f8-4440-ac53-86a993c3c2f6`
    )

    // Check violation badge next to title
    waitForText('Audit violations')
    const view = screen.getByText('Audit violations')
    within(view).getByText('2')
  })

  test('Should render ValidatingAdmissionPolicyBinding with paramRefs successfully', async () => {
    ;(useSearchResultRelatedItemsLazyQuery as jest.Mock).mockReturnValue([
      jest.fn(),
      {
        data: {
          searchResult: [
            {
              related: [
                {
                  kind: 'Cluster',
                  items: [
                    {
                      HubAcceptedManagedCluster: 'True',
                      ManagedClusterConditionAvailable: 'True',
                      ManagedClusterConditionClockSynced: 'True',
                      ManagedClusterImportSucceeded: 'True',
                      ManagedClusterJoined: 'True',
                      _hubClusterResource: 'true',
                      _relatedUids: ['local-cluster/0d76dcdd-c5d6-4b61-a85c-34079188b16c'],
                      _uid: 'cluster__local-cluster',
                      addon:
                        'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=false; work-manager=true',
                      apigroup: 'internal.open-cluster-management.io',
                      created: '2024-11-18T18:45:44Z',
                      cluster: 'local-cluster',
                      kind: 'Cluster',
                      kind_plural: 'managedclusterinfos',
                      name: 'local-cluster',
                    },
                  ],
                },
                {
                  kind: 'ValidatingAdmissionPolicy',
                  items: [
                    {
                      _hubClusterResource: 'true',
                      _relatedUids: ['local-cluster/0d76dcdd-c5d6-4b61-a85c-34079188b16c'],
                      _uid: 'local-cluster/368581e0-c545-4db3-a391-453ec407b7dc',
                      apigroup: 'admissionregistration.k8s.io',
                      apiversion: 'v1',
                      cluster: 'local-cluster',
                      created: '2024-11-18T19:04:01Z',
                      kind: 'ValidatingAdmissionPolicy',
                      kind_plural: 'validatingadmissionpolicies',
                      name: 'demo-policy.example.com',
                    },
                  ],
                },
                {
                  kind: 'Pod',
                  items: [
                    {
                      _hubClusterResource: 'true',
                      _relatedUids: ['local-cluster/0d76dcdd-c5d6-4b61-a85c-34079188b16c'],
                      _uid: 'local-cluster/87d5f570-f7ef-406d-bda5-51102a4cef95',
                      apiversion: 'v1',
                      cluster: 'local-cluster',
                      container: 'nginx',
                      created: '2024-11-18T19:05:47Z',
                      hostIP: '10.0.60.97',
                      image: 'nginx:1.7.9',
                      kind: 'Pod',
                      kind_plural: 'pods',
                      label: 'test=cat',
                      name: 'nginx-pod-a',
                      namespace: 'default',
                      podIP: '',
                      restarts: '0',
                      startedAt: '2024-11-18T19:05:47Z',
                      status: 'ContainerCreating',
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

    const getClusterPolicyResourceRequest = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: 'b3c6b989b041fcb8019f04c750c54bfecf631100',
        namespace: 'test-cluster',
        labels: {
          viewName: 'b3c6b989b041fcb8019f04c750c54bfecf631100',
        },
      },
      spec: {
        scope: {
          name: 'demo-binding-test.example.com',
          resource: 'validatingadmissionpolicybinding.v1.admissionregistration.k8s.io',
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
        apiVersion: 'admissionregistration.k8s.io/v1',
        kind: 'ValidatingAdmissionPolicyBinding',
        metadata: {
          name: 'demo-binding-test.example.com',
        },
        spec: {
          matchResources: {
            matchPolicy: 'Equivalent',
            namespaceSelector: {
              matchLabels: {
                environment: 'dd',
              },
            },
            objectSelector: {},
          },
          paramRef: {
            parameterNotFoundAction: 'Deny',
            selector: {
              matchLabels: {
                test: 'cat',
              },
            },
          },
          policyName: 'demo-policy.example.com',
          validationActions: ['Deny', 'Audit'],
        },
      },
    }

    const getResourceNock = nockGet(getClusterPolicyResourceRequest, getClusterPolicyResourceResponse)

    // load the page:
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
              templateName: 'demo-binding-test.example.com',
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

    expect(screen.getByRole('link', { name: 'demo-binding-test.example.com' })).toBeInTheDocument()

    await waitForText('ValidatingAdmissionPolicyBinding details')

    // Find ValidatingAdmissionPolicy name
    await waitForText('demo-policy.example.com', true)
    expect(screen.getByRole('link', { name: 'demo-policy.example.com' })).toBeInTheDocument()

    await waitForText('Parameter resources')

    // Check for some text from the parameter ref pod
    await waitForText('nginx-pod-a')

    const name = screen.getByRole('link', { name: 'nginx-pod-a' })
    expect(name.getAttribute('href')).toEqual(
      `/multicloud/search/resources/yaml?cluster=local-cluster&kind=Pod&apiversion=v1&name=nginx-pod-a&namespace=default`
    )
  })
})
