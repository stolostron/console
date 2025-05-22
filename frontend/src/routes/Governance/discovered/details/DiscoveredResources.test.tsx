/* Copyright Contributors to the Open Cluster Management project */
import { render, waitFor } from '@testing-library/react'
import { generatePath, MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import { DiscoveredDetailsContext } from './DiscoveredPolicyDetailsPage'
import { waitForNocks, waitForText } from '../../../../lib/test-util'
import { RecoilRoot } from 'recoil'
import { channelsState, helmReleaseState, subscriptionsState } from '../../../../atoms'
import { nockGet, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { DiscoveredResources } from './DiscoveredResources'

describe('DiscoveredResources', () => {
  test('Should render empty DiscoveredResources for ConfigurationPolicy', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      policyItems: [
        {
          id: 'incepted-policyConfigurationPolicypolicy.open-cluster-management.io',
          apigroup: 'policy.open-cluster-management.io',
          name: 'incepted-policy',
          kind: 'ConfigurationPolicy',
          severity: 'low',
          responseAction: 'inform',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/56bf4419-026b-4379-b65f-34f5a4b761f3',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2025-05-22T02:54:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              name: 'incepted-policy',
              namespace: 'default',
              responseAction: 'inform',
            },
          ],
        },
      ],
      relatedResources: [],
      policyKind: 'ConfigurationPolicy',
      apiGroup: 'policy.open-cluster-management.io',
      err: undefined,
    }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(channelsState, [])
          snapshot.set(helmReleaseState, [])
          snapshot.set(subscriptionsState, [])
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredResources, {
              kind: 'ConfigurationPolicy',
              policyName: 'incepted-policy',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredResources} element={<DiscoveredResources />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Related resources')
    await waitForText('No related resources')
  })
  test('Should render empty DiscoveredResources for Gatekeeper', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      policyItems: [
        {
          id: 'containerlivenessprobenotsetContainerLivenessprobeNotsetconstraints.gatekeeper.sh',
          apigroup: 'constraints.gatekeeper.sh',
          name: 'containerlivenessprobenotset',
          kind: 'ContainerLivenessprobeNotset',
          severity: 'unknown',
          responseAction: 'dryrun',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/c3c561d8-d32d-424f-a593-085908f2d1ba',
              apigroup: 'constraints.gatekeeper.sh',
              apiversion: 'v1beta1',
              cluster: 'local-cluster',
              created: '2025-05-22T06:11:35Z',
              kind: 'ContainerLivenessprobeNotset',
              kind_plural: 'containerlivenessprobenotset',
              name: 'containerlivenessprobenotset',
              responseAction: 'dryrun',
            },
          ],
        },
      ],
      relatedResources: [],
      policyKind: 'ContainerLivenessprobeNotset',
      apiGroup: 'constraints.gatekeeper.sh',
      err: undefined,
    }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(channelsState, [])
          snapshot.set(helmReleaseState, [])
          snapshot.set(subscriptionsState, [])
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredResources, {
              kind: 'ContainerLivenessprobeNotset',
              policyName: 'containerlivenessprobenotset',
              apiGroup: 'constraints.gatekeeper.sh',
              apiVersion: 'v1beta1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredResources} element={<DiscoveredResources />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Related resources')
    await waitForText('No related resources')
  })
  test('Should render DiscoveredResources for ConfigurationPolicy', async () => {
    const getResourceRequest = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: '9d431ce9ba1b1a1da748b56240a954881a039cc5',
        namespace: 'local-cluster',
        labels: {
          viewName: '9d431ce9ba1b1a1da748b56240a954881a039cc5',
        },
      },
      spec: {
        scope: {
          name: 'sample-objects',
          namespace: 'local-cluster',
          resource: 'configurationpolicy.v1.policy.open-cluster-management.io',
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
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'ConfigurationPolicy',
        metadata: {
          name: 'sample-objects',
          namespace: 'local-cluster',
        },
        spec: {
          'object-templates': [
            {
              complianceType: 'musthave',
              objectDefinition: {
                apiVersion: 'v1',
                data: {
                  fizz: 'buzz',
                  foo: 'bar',
                  hello: 'world',
                },
                kind: 'ConfigMap',
                metadata: {
                  name: 'sample',
                  namespace: 'default',
                },
              },
              recordDiff: 'InStatus',
              recreateOption: 'None',
            },
            {
              complianceType: 'mustnothave',
              objectDefinition: {
                apiVersion: 'rbac.authorization.k8s.io/v1',
                kind: 'Role',
                metadata: {
                  name: 'hopefully-nonexistent',
                  namespace: 'default',
                },
              },
              recordDiff: 'InStatus',
              recreateOption: 'None',
            },
          ],
          pruneObjectBehavior: 'None',
          remediationAction: 'enforce',
          severity: 'low',
        },
        status: {
          compliancyDetails: [
            {
              Compliant: 'Compliant',
              conditions: [
                {
                  message: 'configmaps [sample] found as specified in namespace default',
                  reason: 'K8s `must have` object already exists',
                  status: 'True',
                  type: 'notification',
                },
              ],
            },
            {
              Compliant: 'Compliant',
              conditions: [
                {
                  message: 'roles [hopefully-nonexistent] missing as expected in namespace default',
                  reason: 'K8s `must not have` object already missing',
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
              object: {
                apiVersion: 'v1',
                kind: 'ConfigMap',
                metadata: {
                  name: 'sample',
                  namespace: 'default',
                },
              },
              reason: 'Resource found as expected',
            },
            {
              compliant: 'Compliant',
              object: {
                apiVersion: 'rbac.authorization.k8s.io/v1',
                kind: 'Role',
                metadata: {
                  name: 'hopefully-nonexistent',
                  namespace: 'default',
                },
              },
              reason: 'Resource not found as expected',
            },
          ],
        },
      },
    }

    const context: DiscoveredDetailsContext = {
      isFetching: false,
      policyItems: [
        {
          id: 'sample-objectsConfigurationPolicypolicy.open-cluster-management.io',
          apigroup: 'policy.open-cluster-management.io',
          name: 'sample-objects',
          kind: 'ConfigurationPolicy',
          severity: 'low',
          responseAction: 'enforce',
          policies: [
            {
              _hubClusterResource: true,
              _isExternal: false,
              _missingResources:
                '[{"g":"rbac.authorization.k8s.io","v":"v1","k":"Role","ns":"default","n":"hopefully-nonexistent"}]',
              _uid: 'local-cluster/d85aba85-2428-4351-99f6-f53e57567c66',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              compliant: 'Compliant',
              created: '2025-05-22T02:54:51Z',
              disabled: false,
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label:
                'cluster-name=local-cluster; cluster-namespace=local-cluster; policy.open-cluster-management.io/cluster-name=local-cluster; policy.open-cluster-management.io/cluster-namespace=local-cluster; policy.open-cluster-management.io/policy=open-cluster-management-global-set.jkulikau-sample',
              name: 'sample-objects',
              namespace: 'local-cluster',
              severity: 'low',
              source: {
                type: 'Policy',
                parentNs: 'open-cluster-management-global-set',
                parentName: 'jkulikau-sample',
              },
              responseAction: 'enforce',
            },
          ],
        },
      ],
      relatedResources: [
        {
          _hubClusterResource: 'true',
          _relatedUids: ['local-cluster/d85aba85-2428-4351-99f6-f53e57567c66'],
          _uid: 'local-cluster/0f650430-ec8c-4730-851e-d63f55f71a70',
          apiversion: 'v1',
          cluster: 'local-cluster',
          created: '2025-05-22T02:54:52Z',
          kind: 'ConfigMap',
          kind_plural: 'configmaps',
          name: 'sample',
          namespace: 'default',
          compliant: 'compliant',
          groupversion: 'v1',
          templateInfo: {
            clusterName: 'local-cluster',
            apiVersion: 'v1',
            apiGroup: 'policy.open-cluster-management.io',
            kind: 'ConfigurationPolicy',
            templateName: 'sample-objects',
            templateNamespace: 'local-cluster',
          },
        },
        {
          apigroup: 'rbac.authorization.k8s.io',
          apiversion: 'v1',
          groupversion: 'rbac.authorization.k8s.io/v1',
          kind: 'Role',
          namespace: 'default',
          name: 'hopefully-nonexistent',
          cluster: 'local-cluster',
          compliant: 'compliant',
          templateInfo: {
            clusterName: 'local-cluster',
            apiVersion: 'v1',
            apiGroup: 'policy.open-cluster-management.io',
            kind: 'ConfigurationPolicy',
            templateName: 'sample-objects',
            templateNamespace: 'local-cluster',
          },
        },
      ],
      policyKind: 'ConfigurationPolicy',
      apiGroup: 'policy.open-cluster-management.io',
      err: undefined,
    }

    nockIgnoreApiPaths()
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)
    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(channelsState, [])
          snapshot.set(helmReleaseState, [])
          snapshot.set(subscriptionsState, [])
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredResources, {
              kind: 'ConfigurationPolicy',
              policyName: 'sample-objects',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredResources} element={<DiscoveredResources />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNocks([getResourceNock])

    await waitForText('Related resources')
    await waitForText('Resource found as expected')

    const row1 = container.querySelector('table > tbody:nth-child(2) > tr')
    expect(row1).toHaveTextContent('hopefully-nonexistent')
    expect(row1).toHaveTextContent('local-cluster')
    expect(row1).toHaveTextContent('default')
    expect(row1).toHaveTextContent('Role')
    expect(row1).toHaveTextContent('rbac.authorization.k8s.io/v1')
    expect(row1).toHaveTextContent('No violations')
    expect(row1).toHaveTextContent('Resource not found as expected')
    const row1links = row1?.querySelectorAll('a')
    expect(row1links).toHaveLength(1) // only the link in the Cluster column

    const row2 = container.querySelector('table > tbody:nth-child(3) > tr')
    expect(row2).toHaveTextContent('sample')
    expect(row2).toHaveTextContent('ConfigMap')
    expect(row2).toHaveTextContent('Resource found as expected')
    const row2links = row2?.querySelectorAll('a')
    expect(row2links).toHaveLength(2) // links in the Name column and the Cluster column
  })
  test('Should render DiscoveredResources for CertificatePolicy', async () => {
    const getResourceRequest = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: '5cdfe9d60dab106ac09f3dc417b87a91917dd6ad',
        namespace: 'local-cluster',
        labels: {
          viewName: '5cdfe9d60dab106ac09f3dc417b87a91917dd6ad',
        },
      },
      spec: {
        scope: {
          name: 'cert-check',
          namespace: 'local-cluster',
          resource: 'certificatepolicy.v1.policy.open-cluster-management.io',
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
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'CertificatePolicy',
        metadata: {
          name: 'cert-check',
          namespace: 'local-cluster',
        },
        spec: {
          allowedSANPattern: '[[:digit:]]',
          disallowedSANPattern: '[[:alpha:]]',
          maximumCADuration: '20h',
          maximumDuration: '20h',
          minimumCADuration: '25h',
          minimumDuration: '25h',
          namespaceSelector: {
            exclude: ['kube-*'],
            include: ['default'],
          },
          remediationAction: 'enforce',
          severity: 'low',
        },
        status: {
          compliancyDetails: {
            default: {
              message:
                'Found 1 non compliant certificates in the namespace default.\nList of non compliant certificates:\nrsa-ca-sample-secret expires on 2021-07-06T15:42:01Z\nrsa-ca-sample-secret SAN entry found not matching pattern Allowed: [[:digit:]] Disallowed: [[:alpha:]]\n',
              nonCompliantCertificates: 1,
              nonCompliantCertificatesList: {
                'rsa-ca-sample-secret': {
                  ca: true,
                  duration: 72000000000000,
                  expiration: '2021-07-06T15:42:01Z',
                  expiry: -1222964586968251, // made up number for precision
                  sans: ['something.test.com'],
                  secretName: 'rsa-ca-sample-secret',
                },
              },
            },
          },
          compliant: 'NonCompliant',
        },
      },
    }

    const context: DiscoveredDetailsContext = {
      isFetching: false,
      policyItems: [
        {
          id: 'cert-checkCertificatePolicypolicy.open-cluster-management.io',
          apigroup: 'policy.open-cluster-management.io',
          name: 'cert-check',
          kind: 'CertificatePolicy',
          severity: 'low',
          responseAction: 'enforce',
          policies: [
            {
              _hubClusterResource: true,
              _nonCompliantResources: '[{"v":"v1","k":"Secret","ns":"default","n":"rsa-ca-sample-secret"}]',
              _uid: 'local-cluster/ac77f481-33e9-4e4c-aedb-864cc68bf4d9',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              compliant: 'NonCompliant',
              created: '2025-05-22T02:56:04Z',
              kind: 'CertificatePolicy',
              kind_plural: 'certificatepolicies',
              label:
                'cluster-name=local-cluster; cluster-namespace=local-cluster; policy.open-cluster-management.io/cluster-name=local-cluster; policy.open-cluster-management.io/cluster-namespace=local-cluster; policy.open-cluster-management.io/policy=open-cluster-management-global-set.my-cert-policy',
              name: 'cert-check',
              namespace: 'local-cluster',
              responseAction: 'enforce',
            },
          ],
        },
      ],
      relatedResources: [
        {
          _hubClusterResource: 'true',
          _relatedUids: '["local-cluster/ac77f481-33e9-4e4c-aedb-864cc68bf4d…]',
          _uid: 'local-cluster/18e134cd-f22f-46f9-ba2e-de3cdca11650',
          apiversion: 'v1',
          cluster: 'local-cluster',
          created: '2025-05-22T02:56:04Z',
          kind: 'Secret',
          kind_plural: 'secrets',
          name: 'rsa-ca-sample-secret',
          namespace: 'default',
          compliant: 'noncompliant',
          groupversion: 'v1',
          templateInfo: {
            clusterName: 'local-cluster',
            apiVersion: 'v1',
            apiGroup: 'policy.open-cluster-management.io',
            kind: 'CertificatePolicy',
            templateName: 'cert-check',
            templateNamespace: 'local-cluster',
          },
        },
      ],
      policyKind: 'CertificatePolicy',
      apiGroup: 'policy.open-cluster-management.io',
      err: undefined,
    }

    nockIgnoreApiPaths()
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)
    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(channelsState, [])
          snapshot.set(helmReleaseState, [])
          snapshot.set(subscriptionsState, [])
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredResources, {
              kind: 'CertificatePolicy',
              policyName: 'cert-check',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredResources} element={<DiscoveredResources />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNocks([getResourceNock])
    await waitForText('Related resources')

    const row1 = container.querySelector('table > tbody:nth-child(2) > tr')
    expect(row1).toHaveTextContent('rsa-ca-sample-secret')
    expect(row1).toHaveTextContent('Violations')
    const row1links = row1?.querySelectorAll('a')
    expect(row1links).toHaveLength(2) // links in the Name column and the Cluster column
    await waitFor(() => expect(row1).toHaveTextContent('rsa-ca-sample-secret expires'))
  })
  test('Should render DiscoveredResources for Kyverno', async () => {
    const getResourceRequest1 = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: 'a46a6317a0a91b656d83e99987e46d6c9535d6ce',
        namespace: 'local-cluster',
        labels: {
          viewName: 'a46a6317a0a91b656d83e99987e46d6c9535d6ce',
        },
      },
      spec: {
        scope: {
          name: 'e9b1f4bb-9591-4866-b0d4-462ab9e3f28c',
          resource: 'policyreport.v1beta1.wgpolicyk8s.io',
          namespace: 'kyverno',
        },
      },
    }

    const getResourceResponse1 = JSON.parse(JSON.stringify(getResourceRequest1))
    getResourceResponse1.status = {
      conditions: [
        {
          message: 'Watching resources successfully',
          reason: 'GetResourceProcessing',
          status: 'True',
          type: 'Processing',
        },
      ],
      result: {
        apiVersion: 'wgpolicyk8s.io/v1beta1',
        kind: 'PolicyReport',
        metadata: {
          name: 'e9b1f4bb-9591-4866-b0d4-462ab9e3f28c',
          namespace: 'kyverno',
        },
        results: [
          {
            message:
              'validation error: label  is required. rule autogen-check-for-labels-test failed at path /spec/template/metadata/labels/app.kubernetes.io/name/',
            policy: 'require-labels-test',
            result: 'fail',
            rule: 'autogen-check-for-labels-test',
            scored: true,
            source: 'kyverno',
            timestamp: {
              nanos: 0,
              seconds: 1747892773,
            },
          },
        ],
        scope: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: 'kyverno-cleanup-controller',
          namespace: 'kyverno',
          uid: 'e9b1f4bb-9591-4866-b0d4-462ab9e3f28c',
        },
        summary: {
          error: 0,
          fail: 1,
          pass: 0,
          skip: 0,
          warn: 0,
        },
      },
    }

    const getResourceRequest2 = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: 'fe996a0b1c5d0958fc1dcfb13ef748018c4b6432',
        namespace: 'local-cluster',
        labels: {
          viewName: 'fe996a0b1c5d0958fc1dcfb13ef748018c4b6432',
        },
      },
      spec: {
        scope: {
          name: 'dfe37369-1076-4fdb-9318-ff3eda4df9a7',
          resource: 'policyreport.v1beta1.wgpolicyk8s.io',
          namespace: 'kyverno',
        },
      },
    }

    const getResourceResponse2 = JSON.parse(JSON.stringify(getResourceRequest2))
    getResourceResponse2.status = {
      conditions: [
        {
          message: 'Watching resources successfully',
          reason: 'GetResourceProcessing',
          status: 'True',
          type: 'Processing',
        },
      ],
      result: {
        apiVersion: 'wgpolicyk8s.io/v1beta1',
        kind: 'PolicyReport',
        metadata: {
          name: 'dfe37369-1076-4fdb-9318-ff3eda4df9a7',
          namespace: 'kyverno',
        },
        results: [
          {
            message:
              'validation error: label  is required. rule check-for-labels-test failed at path /metadata/labels/app.kubernetes.io/name/',
            policy: 'require-labels-test',
            result: 'fail',
            rule: 'check-for-labels-test',
            scored: true,
            source: 'kyverno',
            timestamp: {
              nanos: 0,
              seconds: 1747892774,
            },
          },
        ],
        scope: {
          apiVersion: 'v1',
          kind: 'Pod',
          name: 'kyverno-cleanup-controller-7c7d9844f-nf8s2',
          namespace: 'kyverno',
          uid: 'dfe37369-1076-4fdb-9318-ff3eda4df9a7',
        },
        summary: {
          error: 0,
          fail: 1,
          pass: 0,
          skip: 0,
          warn: 0,
        },
      },
    }

    const context: DiscoveredDetailsContext = {
      isFetching: false,
      policyItems: [
        {
          id: 'require-labels-testClusterPolicykyverno.io',
          apigroup: 'kyverno.io',
          name: 'require-labels-test',
          kind: 'ClusterPolicy',
          severity: 'unknown',
          responseAction: 'audit',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/74902617-c1b6-4746-a23b-96e7715364b1',
              apigroup: 'kyverno.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2025-05-22T05:45:16Z',
              kind: 'ClusterPolicy',
              kind_plural: 'clusterpolicies',
              name: 'require-labels-test',
              validationFailureAction: 'audit',
              responseAction: 'audit',
              totalViolations: 12,
            },
          ],
        },
      ],
      relatedResources: [
        {
          _hubClusterResource: 'true',
          apiversion: 'v1',
          cluster: 'local-cluster',
          container: 'controller',
          created: '2025-05-22T02:58:14Z',
          kind: 'Pod',
          kind_plural: 'pods',
          label:
            'app.kubernetes.io/component=cleanup-controller; app.kubernetes.io/instance=kyverno; app.kubernetes.io/part-of=kyverno; app.kubernetes.io/version=v1.13.0; pod-template-hash=7c7d9844f',
          name: 'kyverno-cleanup-controller-7c7d9844f-nf8s2',
          namespace: 'kyverno',
          status: 'Running',
          compliant: 'noncompliant',
          groupversion: 'v1',
          templateInfo: {
            clusterName: 'local-cluster',
            apiVersion: 'v1',
            apiGroup: 'kyverno.io',
            kind: 'ClusterPolicy',
            templateName: 'require-labels-test',
          },
          policyReport: {
            _hubClusterResource: 'true',
            _policyViolationCounts: 'require-labels-test=1',
            apigroup: 'wgpolicyk8s.io',
            apiversion: 'v1beta1',
            cluster: 'local-cluster',
            created: '2025-05-22T05:28:41Z',
            kind: 'PolicyReport',
            kind_plural: 'policyreports',
            label: 'app.kubernetes.io/managed-by=kyverno',
            name: 'dfe37369-1076-4fdb-9318-ff3eda4df9a7',
            namespace: 'kyverno',
            numRuleViolations: '1',
            policies: 'require-labels-test',
            rules: 'check-for-labels-test',
            scope: 'kyverno-cleanup-controller-7c7d9844f-nf8s2',
          },
        },
        {
          _hubClusterResource: 'true',
          apigroup: 'apps',
          apiversion: 'v1',
          available: '1',
          cluster: 'local-cluster',
          created: '2025-05-22T02:58:14Z',
          kind: 'Deployment',
          kind_plural: 'deployments',
          label:
            'app.kubernetes.io/component=cleanup-controller; app.kubernetes.io/instance=kyverno; app.kubernetes.io/part-of=kyverno; app.kubernetes.io/version=v1.13.0',
          name: 'kyverno-cleanup-controller',
          namespace: 'kyverno',
          compliant: 'noncompliant',
          groupversion: 'apps/v1',
          templateInfo: {
            clusterName: 'local-cluster',
            apiVersion: 'v1',
            apiGroup: 'kyverno.io',
            kind: 'ClusterPolicy',
            templateName: 'require-labels-test',
          },
          policyReport: {
            _hubClusterResource: 'true',
            _policyViolationCounts: 'require-labels-test=1',
            apigroup: 'wgpolicyk8s.io',
            apiversion: 'v1beta1',
            cluster: 'local-cluster',
            created: '2025-05-22T05:28:40Z',
            kind: 'PolicyReport',
            kind_plural: 'policyreports',
            label: 'app.kubernetes.io/managed-by=kyverno',
            name: 'e9b1f4bb-9591-4866-b0d4-462ab9e3f28c',
            namespace: 'kyverno',
            numRuleViolations: '1',
            policies: 'require-labels-test',
            rules: 'autogen-check-for-labels-test',
            scope: 'kyverno-cleanup-controller',
          },
        },
      ],
      policyKind: 'ClusterPolicy',
      apiGroup: 'kyverno.io',
      err: undefined,
    }

    nockIgnoreApiPaths()
    const getResourceNock1 = nockGet(getResourceRequest1, getResourceResponse1)
    const getResourceNock2 = nockGet(getResourceRequest2, getResourceResponse2)
    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(channelsState, [])
          snapshot.set(helmReleaseState, [])
          snapshot.set(subscriptionsState, [])
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredResources, {
              kind: 'ClusterPolicy',
              policyName: 'require-labels-test',
              apiGroup: 'kyverno.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredResources} element={<DiscoveredResources />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNocks([getResourceNock1, getResourceNock2])
    await waitForText('Related resources')

    const row1 = container.querySelector('table > tbody:nth-child(2) > tr')
    expect(row1).toHaveTextContent('kyverno-cleanup-controller')
    expect(row1).toHaveTextContent('Deployment')
    expect(row1).toHaveTextContent('Violations')
    expect(row1).toHaveTextContent('View report')
    const row1links = row1?.querySelectorAll('a')
    expect(row1links).toHaveLength(3) // links in the Name column, Cluster column, and Violations column
    await waitFor(() => expect(row1).toHaveTextContent('autogen-check-for-labels-test: validation error'))

    const row2 = container.querySelector('table > tbody:nth-child(3) > tr')
    expect(row2).toHaveTextContent('kyverno-cleanup-controller-7c7d9844f-nf8s2')
    expect(row2).toHaveTextContent('Pod')
    expect(row2).toHaveTextContent('Violations')
    expect(row2).toHaveTextContent('View report')
    const row2links = row2?.querySelectorAll('a')
    expect(row2links).toHaveLength(3) // links in the Name column, Cluster column, and Violations column
    await waitFor(() => expect(row2).toHaveTextContent('check-for-labels-test: validation error'))
  })
})
