/* Copyright Contributors to the Open Cluster Management project */

import { ITransformedResource } from './pagination'
import { ServerSideEvent } from './server-side-events'

export function getGiganticEvents(): ServerSideEvent[] {
  const MOCK_CLUSTERS = Number(process.env.MOCK_CLUSTERS)
  return [
    ...getMockClusters(MOCK_CLUSTERS),
    ...getMockClusterInfo(MOCK_CLUSTERS),
    ...getMockClusterAddsons(MOCK_CLUSTERS),
    ...getMockPolicies(MOCK_CLUSTERS),
  ]
}

export function getGiganticApps(): ITransformedResource[] {
  const MOCK_CLUSTERS = Number(process.env.MOCK_CLUSTERS)
  const apps: ITransformedResource[] = []
  const template = templateMaker(applicationsTemplate)
  Array.from(Array(MOCK_CLUSTERS).keys()).forEach((inx) => {
    apps.push(...(template({ name: `cluster${inx + 1}` }) as ITransformedResource[]))
  })
  return apps
}

const templateMaker = function (obj: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (context: { [x: string]: any }) {
    const replacer = function (_key: string, val: () => string | number) {
      if (typeof val === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return context[val()]
      }
      return val
    }
    return JSON.parse(JSON.stringify(obj, replacer)) as unknown
  }
}

function getMockClusters(n: number): ServerSideEvent[] {
  const template = templateMaker(clusterTemplate)
  return [template({ name: 'local-cluster' })].concat(
    Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    })
  )
}

function getMockClusterInfo(n: number): ServerSideEvent[] {
  const template = templateMaker(managedClusterInfoTemplate)
  return [template({ name: 'local-cluster' })].concat(
    Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    })
  )
}

function getMockClusterAddsons(n: number): ServerSideEvent[] {
  let addons
  let template = templateMaker(appmanager)
  addons = [template({ name: 'local-cluster' })].concat(
    Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    })
  )
  template = templateMaker(certpolicy)
  addons = [
    ...addons,
    template({ name: 'local-cluster' }),
    ...Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    }),
  ]
  template = templateMaker(clusterProxy)
  addons = [
    ...addons,
    template({ name: 'local-cluster' }),
    ...Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    }),
  ]
  template = templateMaker(configPolicy)
  addons = [
    ...addons,
    template({ name: 'local-cluster' }),
    ...Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    }),
  ]
  template = templateMaker(govPolicy)
  addons = [
    ...addons,
    template({ name: 'local-cluster' }),
    ...Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    }),
  ]
  template = templateMaker(hypershiftPolicy)
  addons = [
    ...addons,
    template({ name: 'local-cluster' }),
    ...Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    }),
  ]
  template = templateMaker(workManager)
  addons = [
    ...addons,
    template({ name: 'local-cluster' }),
    ...Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    }),
  ]
  template = templateMaker(managedSrv)
  addons = [
    ...addons,
    template({ name: 'local-cluster' }),
    ...Array.from(Array(n).keys()).map((inx) => {
      return template({ name: `cluster${inx + 1}` })
    }),
  ]
  return addons
}

const NONCOMPLIANT = [
  [3, 18, 23, 55, 60, 80, 93],
  [1, 33, 43, 68],
  [5, 33, 69, 20, 45, 32],
]
type PolicyTemplateType = typeof policyTemplate
function getMockPolicies(n: number): ServerSideEvent[] {
  const template = templateMaker(policyTemplate)
  return Array.from(Array(3).keys()).map((pinx) => {
    const mockPolicy = template({ name: `policy${pinx + 1}` }) as PolicyTemplateType
    Array.from(Array(n).keys()).forEach((inx) => {
      let compliant = NONCOMPLIANT[pinx].indexOf(inx) !== -1 ? 'NonCompliant' : 'Compliant'
      switch (pinx) {
        case 0:
          if (inx == 20 || inx === 71) compliant = 'Pending'
          if (inx == 22 || inx === 98) compliant = 'Unknown'
          break
        case 1:
          if (inx == 44) compliant = 'Pending'
          if (inx == 85 || inx === 86) compliant = 'Unknown'
          break
        case 2:
          if (inx == 23 || inx === 36) compliant = 'Pending'
          // if (inx == 22 || inx === 98) compliant = 'Unknown'
          break
      }
      mockPolicy?.data?.object.status.status.push({
        clustername: `cluster${inx + 1}`,
        clusternamespace: `cluster${inx + 1}`,
        compliant,
      })
    })
    return mockPolicy
  })
}

const policyTemplate = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'Policy',
      metadata: {
        annotations: {
          'policy.open-cluster-management.io/categories': 'CM Configuration Management',
          'policy.open-cluster-management.io/controls': 'CM-4 Baseline Configuration',
          'policy.open-cluster-management.io/standards': 'NIST SP 800-93',
        },
        creationTimestamp: '2024-11-04T17:12:36Z',
        generation: 1,
        name: () => 'name',
        namespace: 'open-cluster-management-global-set',
        resourceVersion: '3860061',
        uid: '437f570c-c73c-4e34-ac3a-deaa3c83dc4b',
      },
      spec: {
        disabled: false,
        'policy-templates': [
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'ConfigurationPolicy',
              metadata: {
                name: 'policy-namespace',
              },
              spec: {
                'object-templates': [
                  {
                    complianceType: 'musthave',
                    objectDefinition: {
                      apiVersion: 'v1',
                      kind: 'Namespace',
                      metadata: {
                        name: 'jako',
                      },
                    },
                  },
                ],
                remediationAction: 'inform',
                severity: 'low',
              },
            },
          },
        ],
      },
      status: {
        compliant: 'NonCompliant',
        placement: [
          {
            placement: 'global',
            placementBinding: 'test-placement',
          },
        ],
        status: [
          {
            clustername: 'local-cluster',
            clusternamespace: 'local-cluster',
            compliant: 'NonCompliant',
          },
        ],
      },
    },
  },
  id: '115',
}

const clusterTemplate = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'cluster.open-cluster-management.io/v1',
      kind: 'ManagedCluster',
      metadata: {
        annotations: {
          'installer.multicluster.openshift.io/release-version': '2.8.0',
          'open-cluster-management/created-via': 'other',
        },
        creationTimestamp: '2024-11-04T04:46:31Z',
        labels: {
          cloud: 'Amazon',
          'cluster.open-cluster-management.io/clusterset': 'global',
          clusterID: '002c4aeb-7a62-46b7-aeba-c5c4e2672aa1',
          'feature.open-cluster-management.io/addon-application-manager': 'available',
          'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
          'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
          'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
          'feature.open-cluster-management.io/addon-managed-serviceaccount': 'available',
          'feature.open-cluster-management.io/addon-work-manager': 'available',
          name: () => 'name',
          openshiftVersion: '4.16.17',
          'openshiftVersion-major': '4',
          'openshiftVersion-major-minor': '4.16',
          'velero.io/exclude-from-backup': 'true',
          vendor: 'OpenShift',
        },
        name: () => 'name',
        resourceVersion: '838566',
        uid: '57e220b3-6733-4452-b9a5-cee55882be99',
      },
      spec: {
        hubAcceptsClient: true,
      },
      status: {
        allocatable: {
          cpu: '22500m',
          'ephemeral-storage': '285055434687',
          'hugepages-1Gi': '0',
          'hugepages-2Mi': '0',
          memory: '93026772Ki',
          pods: '750',
        },
        capacity: {
          core_worker: '24',
          cpu: '24',
          'ephemeral-storage': '312800196Ki',
          'hugepages-1Gi': '0',
          'hugepages-2Mi': '0',
          memory: '96479700Ki',
          pods: '750',
          socket_worker: '3',
        },
        conditions: [
          {
            lastTransitionTime: '2024-11-04T18:44:30Z',
            message: 'Import succeeded',
            reason: 'ManagedClusterImported',
            status: 'True',
            type: 'ManagedClusterImportSucceeded',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:36Z',
            message: 'Accepted by hub cluster admin',
            reason: 'HubClusterAdminAccepted',
            status: 'True',
            type: 'HubAcceptedManagedCluster',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:47Z',
            message: 'Managed cluster joined',
            reason: 'ManagedClusterJoined',
            status: 'True',
            type: 'ManagedClusterJoined',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:47Z',
            message: 'Managed cluster is available',
            reason: 'ManagedClusterAvailable',
            status: 'True',
            type: 'ManagedClusterConditionAvailable',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:47Z',
            message: 'The clock of the managed cluster is synced with the hub.',
            reason: 'ManagedClusterClockSynced',
            status: 'True',
            type: 'ManagedClusterConditionClockSynced',
          },
        ],
        version: {
          kubernetes: 'v1.29.8+632b078',
        },
      },
    },
  },
  id: '115',
}

const managedClusterInfoTemplate = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'internal.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterInfo',
      metadata: {
        creationTimestamp: '2024-11-04T04:46:31Z',
        generation: 2,
        labels: {
          cloud: 'Amazon',
          'cluster.open-cluster-management.io/clusterset': 'john-set',
          clusterID: '002c4aeb-7a62-46b7-aeba-c5c4e2672aa1',
          'feature.open-cluster-management.io/addon-application-manager': 'available',
          'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
          'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
          'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
          'feature.open-cluster-management.io/addon-managed-serviceaccount': 'available',
          'feature.open-cluster-management.io/addon-work-manager': 'available',
          name: () => 'name',
          openshiftVersion: '4.16.17',
          'openshiftVersion-major': '4',
          'openshiftVersion-major-minor': '4.16',
          'velero.io/exclude-from-backup': 'true',
          vendor: 'OpenShift',
        },
        name: () => 'name',
        namespace: () => 'name',
        resourceVersion: '1333073',
        uid: '16c2f789-153b-4976-94cd-ca9b14695499',
      },
      spec: {
        masterEndpoint: 'https://api.cs-aws-416.com:6443',
      },
      status: {
        cloudVendor: 'Amazon',
        clusterID: '002c4aeb-7a62-46b7-aeba-c5c4e2672aa1',
        conditions: [
          {
            lastTransitionTime: '2024-11-04T18:44:30Z',
            message: 'Import succeeded',
            reason: 'ManagedClusterImported',
            status: 'True',
            type: 'ManagedClusterImportSucceeded',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:36Z',
            message: 'Accepted by hub cluster admin',
            reason: 'HubClusterAdminAccepted',
            status: 'True',
            type: 'HubAcceptedManagedCluster',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:47Z',
            message: 'Managed cluster joined',
            reason: 'ManagedClusterJoined',
            status: 'True',
            type: 'ManagedClusterJoined',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:47Z',
            message: 'Managed cluster is available',
            reason: 'ManagedClusterAvailable',
            status: 'True',
            type: 'ManagedClusterConditionAvailable',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:47Z',
            message: 'The clock of the managed cluster is synced with the hub.',
            reason: 'ManagedClusterClockSynced',
            status: 'True',
            type: 'ManagedClusterConditionClockSynced',
          },
          {
            lastTransitionTime: '2024-11-04T22:16:58Z',
            message:
              'client certificate rotated starting from 2024-11-05 02:41:58 +0000 UTC to 2024-12-04 23:16:37 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:56Z',
            message: 'Managed cluster info is synced',
            reason: 'ManagedClusterInfoSynced',
            status: 'True',
            type: 'ManagedClusterInfoSynced',
          },
        ],
        consoleURL: 'https://console-openshift-console.apps.com',
        distributionInfo: {
          ocp: {
            availableUpdates: ['4.16.18'],
            channel: 'stable-4.16',
            desired: {
              channels: ['candidate-4.16', 'candidate-4.17', 'eus-4.16', 'fast-4.16', 'fast-4.17', 'stable-4.16'],
              image: 'quay.io/openshift-release-dev/ocp-release',
              url: 'https://access.redhat.com/errata/RHSA-2024:7944',
              version: '4.16.17',
            },
            desiredVersion: '4.16.17',
            lastAppliedAPIServerURL: 'https://api.cs-aws-416.com:6443',
            managedClusterClientConfig: {
              caBundle: 'LS0tLS1CRUdJTiBDQo=',
              url: 'https://api.cs-aws-416.com:6443',
            },
            version: '4.16.17',
            versionAvailableUpdates: [
              {
                channels: ['candidate-4.16', 'candidate-4.17', 'eus-4.16', 'fast-4.16', 'fast-4.17', 'stable-4.16'],
                image: 'quay.io/openshift-release-dev/ocp-release',
                url: 'https://access.redhat.com/errata/RHSA-2024:8260',
                version: '4.16.18',
              },
            ],
            versionHistory: [
              {
                image: 'quay.io/openshift-release-dev/ocp-release',
                state: 'Completed',
                verified: false,
                version: '4.16.17',
              },
            ],
          },
          type: 'OCP',
        },
        kubeVendor: 'OpenShift',
        loggingEndpoint: {
          ip: '',
        },
        loggingPort: {
          port: 0,
          protocol: 'TCP',
        },
        nodeList: [
          {
            capacity: {
              cpu: '8',
              memory: '32159900Ki',
              socket: '1',
            },
            conditions: [
              {
                status: 'True',
                type: 'Ready',
              },
            ],
            labels: {
              'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
              'failure-domain.beta.kubernetes.io/region': 'us-east-1',
              'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
              'node-role.kubernetes.io/control-plane': '',
              'node-role.kubernetes.io/master': '',
              'node-role.kubernetes.io/worker': '',
              'node.kubernetes.io/instance-type': 'm6a.2xlarge',
              'topology.kubernetes.io/region': 'us-east-1',
              'topology.kubernetes.io/zone': 'us-east-1a',
            },
            name: 'ip-10-0-14-175.ec2.internal',
          },
          {
            capacity: {
              cpu: '8',
              memory: '32159900Ki',
              socket: '1',
            },
            conditions: [
              {
                status: 'True',
                type: 'Ready',
              },
            ],
            labels: {
              'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
              'failure-domain.beta.kubernetes.io/region': 'us-east-1',
              'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
              'node-role.kubernetes.io/control-plane': '',
              'node-role.kubernetes.io/master': '',
              'node-role.kubernetes.io/worker': '',
              'node.kubernetes.io/instance-type': 'm6a.2xlarge',
              'topology.kubernetes.io/region': 'us-east-1',
              'topology.kubernetes.io/zone': 'us-east-1b',
            },
            name: 'ip-10-0-51-94.ec2.internal',
          },
          {
            capacity: {
              cpu: '8',
              memory: '32159900Ki',
              socket: '1',
            },
            conditions: [
              {
                status: 'True',
                type: 'Ready',
              },
            ],
            labels: {
              'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
              'failure-domain.beta.kubernetes.io/region': 'us-east-1',
              'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
              'node-role.kubernetes.io/control-plane': '',
              'node-role.kubernetes.io/master': '',
              'node-role.kubernetes.io/worker': '',
              'node.kubernetes.io/instance-type': 'm6a.2xlarge',
              'topology.kubernetes.io/region': 'us-east-1',
              'topology.kubernetes.io/zone': 'us-east-1c',
            },
            name: 'ip-10-0-93-77.ec2.internal',
          },
        ],
        version: 'v1.29.8+632b078',
      },
    },
  },
  id: '153',
}

const appmanager: ServerSideEvent = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2024-11-04T04:47:46Z',
        generation: 1,
        name: 'application-manager',
        namespace: () => 'name',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'application-manager',
            uid: '2b92b46b-2c7e-41b8-bba7-d04fe0402a3d',
          },
        ],
        resourceVersion: '1329359',
        uid: 'c3afc10a-6c15-4f2e-8562-3dca6ea8c30e',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2024-11-04T04:48:58Z',
            message: 'application-manager add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Available',
          },
        ],
        namespace: 'open-cluster-management-agent-addon',
        registrations: [
          {
            signerName: 'kubernetes.io/kube-apiserver-client',
            subject: {
              groups: [
                'system:open-cluster-management:cluster:local-cluster:addon:application-manager',
                'system:open-cluster-management:addon:application-manager',
                'system:authenticated',
              ],
              user: 'system:open-cluster-management:cluster:local-cluster:addon:application-manager:agent:application-manager',
            },
          },
        ],
        supportedConfigs: [
          {
            group: 'addon.open-cluster-management.io',
            resource: 'addondeploymentconfigs',
          },
        ],
      },
    },
  },
  id: '115',
}
const certpolicy: ServerSideEvent = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2024-11-04T04:47:46Z',
        generation: 1,
        name: 'cert-policy-controller',
        namespace: () => 'name',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'cert-policy-controller',
            uid: '41412e04-f36c-49c8-9c05-dae4a9b776da',
          },
        ],
        resourceVersion: '1328509',
        uid: 'fa2055f6-c57a-4409-bbcd-2d845f88777f',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2024-11-04T04:47:46Z',
            message: 'Configurations configured',
            reason: 'ConfigurationsConfigured',
            status: 'True',
            type: 'Configured',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:50Z',
            message: 'completed with no errors.',
            reason: 'Completed',
            status: 'False',
            type: 'Progressing',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:47Z',
            message: 'Registration of the addon agent is configured',
            reason: 'SetPermissionApplied',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:48Z',
            message:
              'client certificate rotated starting from 2024-11-05 02:37:48 +0000 UTC to 2024-12-04 23:16:37 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:49Z',
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:58Z',
            message: 'cert-policy-controller add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Available',
          },
        ],
        namespace: 'open-cluster-management-agent-addon',
        registrations: [
          {
            signerName: 'kubernetes.io/kube-apiserver-client',
            subject: {
              groups: [
                'system:open-cluster-management:cluster:local-cluster:addon:cert-policy-controller',
                'system:open-cluster-management:addon:cert-policy-controller',
                'system:authenticated',
              ],
              user: 'system:open-cluster-management:cluster:local-cluster:addon:cert-policy-controller:agent:cert-policy-controller',
            },
          },
        ],
        supportedConfigs: [
          {
            group: 'addon.open-cluster-management.io',
            resource: 'addondeploymentconfigs',
          },
        ],
      },
    },
  },
  id: '115',
}
const clusterProxy = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2024-11-04T04:46:31Z',
        generation: 1,
        name: 'cluster-proxy',
        namespace: () => 'name',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'cluster-proxy',
            uid: '116bf016-b633-458a-ac5a-8ef4541b83c9',
          },
        ],
        resourceVersion: '1333082',
        uid: 'f5dca4ba-5ce1-4581-af83-5d9e6bcb50e6',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2024-11-04T04:46:51Z',
            message: 'completed with no errors.',
            reason: 'Completed',
            status: 'False',
            type: 'Progressing',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:31Z',
            message: 'Configurations configured',
            reason: 'ConfigurationsConfigured',
            status: 'True',
            type: 'Configured',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:35Z',
            message: 'Registration of the addon agent is configured',
            reason: 'SetPermissionApplied',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:48Z',
            message:
              'client certificate rotated starting from 2024-11-05 02:41:58 +0000 UTC to 2024-12-04 23:16:37 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:50Z',
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:28Z',
            message: 'cluster-proxy add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Available',
          },
        ],
        configReferences: [
          {
            desiredConfig: {
              name: 'cluster-proxy',
              specHash: '832265e7e2ef945b299e2880fc9683de514a4869dc5a6ad1b1f3687e0ee4fd3b',
            },
            group: 'proxy.open-cluster-management.io',
            lastAppliedConfig: {
              name: 'cluster-proxy',
              specHash: '832265e7e2ef945b299e2880fc9683de514a4869dc5a6ad1b1f3687e0ee4fd3b',
            },
            lastObservedGeneration: 1,
            name: 'cluster-proxy',
            resource: 'managedproxyconfigurations',
          },
        ],
        namespace: 'open-cluster-management-agent-addon',
        registrations: [
          {
            signerName: 'kubernetes.io/kube-apiserver-client',
            subject: {
              groups: ['open-cluster-management:cluster-proxy'],
              user: 'open-cluster-management:cluster-proxy:addon-agent',
            },
          },
          {
            signerName: 'open-cluster-management.io/proxy-agent-signer',
            subject: {
              groups: ['open-cluster-management:cluster-proxy'],
              organizationUnit: [
                'signer-316939704966655836456a38794f5a507a4e6b6373627735422f31654335773852616362333664586c31413d',
              ],
              user: 'open-cluster-management:cluster-proxy:proxy-agent',
            },
          },
        ],
        supportedConfigs: [
          {
            group: 'proxy.open-cluster-management.io',
            resource: 'managedproxyconfigurations',
          },
          {
            group: 'addon.open-cluster-management.io',
            resource: 'addondeploymentconfigs',
          },
        ],
      },
    },
  },
  id: '115',
}
const configPolicy = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2024-11-04T04:47:46Z',
        finalizers: ['addon.open-cluster-management.io/addon-pre-delete'],
        generation: 1,
        name: 'config-policy-controller',
        namespace: () => 'name',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'config-policy-controller',
            uid: '3aceaa5f-4134-4938-bdd1-1a4c3a359cd5',
          },
        ],
        resourceVersion: '1333963',
        uid: '0416ece7-4fa0-4059-a5d2-d7f387196a2a',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2024-11-04T04:47:46Z',
            message: 'Configurations configured',
            reason: 'ConfigurationsConfigured',
            status: 'True',
            type: 'Configured',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:54Z',
            message: 'completed with no errors.',
            reason: 'Completed',
            status: 'False',
            type: 'Progressing',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:51Z',
            message: 'Registration of the addon agent is configured',
            reason: 'SetPermissionApplied',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:52Z',
            message:
              'client certificate rotated starting from 2024-11-05 02:42:51 +0000 UTC to 2024-12-04 23:16:37 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:54Z',
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:48:28Z',
            message: 'config-policy-controller add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Available',
          },
        ],
        namespace: 'open-cluster-management-agent-addon',
        registrations: [
          {
            signerName: 'kubernetes.io/kube-apiserver-client',
            subject: {
              groups: [
                'system:open-cluster-management:cluster:local-cluster:addon:config-policy-controller',
                'system:open-cluster-management:addon:config-policy-controller',
                'system:authenticated',
              ],
              user: 'system:open-cluster-management:cluster:local-cluster:addon:config-policy-controller:agent:config-policy-controller',
            },
          },
        ],
        supportedConfigs: [
          {
            group: 'addon.open-cluster-management.io',
            resource: 'addondeploymentconfigs',
          },
        ],
      },
    },
  },
  id: '115',
}
const govPolicy = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2024-11-04T04:47:46Z',
        generation: 1,
        name: 'governance-policy-framework',
        namespace: () => 'name',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'governance-policy-framework',
            uid: 'dd5f38a9-4048-4e21-a585-78c110d70a4f',
          },
        ],
        resourceVersion: '1344666',
        uid: 'c1dd56f8-010c-4182-bf3b-42001e5041bc',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2024-11-04T04:47:55Z',
            message: 'completed with no errors.',
            reason: 'Completed',
            status: 'False',
            type: 'Progressing',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:46Z',
            message: 'Configurations configured',
            reason: 'ConfigurationsConfigured',
            status: 'True',
            type: 'Configured',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:54Z',
            message: 'Registration of the addon agent is configured',
            reason: 'SetPermissionApplied',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:55Z',
            message:
              'client certificate rotated starting from 2024-11-05 02:52:55 +0000 UTC to 2024-12-04 23:16:37 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:55Z',
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:48:28Z',
            message: 'governance-policy-framework add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Available',
          },
        ],
        namespace: 'open-cluster-management-agent-addon',
        registrations: [
          {
            signerName: 'kubernetes.io/kube-apiserver-client',
            subject: {
              groups: [
                'system:open-cluster-management:cluster:local-cluster:addon:governance-policy-framework',
                'system:open-cluster-management:addon:governance-policy-framework',
                'system:authenticated',
              ],
              user: 'system:open-cluster-management:cluster:local-cluster:addon:governance-policy-framework:agent:governance-policy-framework',
            },
          },
        ],
        supportedConfigs: [
          {
            group: 'addon.open-cluster-management.io',
            resource: 'addondeploymentconfigs',
          },
        ],
      },
    },
  },
  id: '115',
}
const hypershiftPolicy = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        annotations: {
          'installer.multicluster.openshift.io/release-version': '2.8.0',
        },
        creationTimestamp: '2024-11-04T04:46:35Z',
        finalizers: ['addon.open-cluster-management.io/addon-pre-delete'],
        generation: 1,
        labels: {
          'backplaneconfig.name': 'multiclusterengine',
        },
        name: 'hypershift-addon',
        namespace: () => 'name',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'hypershift-addon',
            uid: 'abc241d5-2a88-426a-9337-59aa4920fbce',
          },
        ],
        resourceVersion: '1333081',
        uid: '223be491-f09b-474d-a2c9-8bb587bbb567',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        addOnConfiguration: {},
        addOnMeta: {},
        conditions: [
          {
            lastTransitionTime: '2024-11-04T04:46:35Z',
            message: 'completed with no errors.',
            reason: 'Completed',
            status: 'False',
            type: 'Progressing',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:35Z',
            message: 'Configurations configured',
            reason: 'ConfigurationsConfigured',
            status: 'True',
            type: 'Configured',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:36Z',
            message: 'Registration of the addon agent is configured',
            reason: 'SetPermissionApplied',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:48Z',
            message:
              'client certificate rotated starting from 2024-11-05 02:41:58 +0000 UTC to 2024-12-04 23:16:37 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:53Z',
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            lastTransitionTime: '2024-11-04T18:46:33Z',
            message: 'Hypershift is deployed on managed cluster.',
            reason: 'HypershiftDeployed',
            status: 'False',
            type: 'Degraded',
          },
          {
            lastTransitionTime: '2024-11-04T18:44:29Z',
            message: 'hypershift-addon add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Available',
          },
        ],
        configReferences: [
          {
            desiredConfig: {
              name: 'hypershift-addon-deploy-config',
              namespace: 'multicluster-engine',
              specHash: '673989f990db2503cf3115ec915ac4d02b1182f6bfaf6350d861ae30d10d0489',
            },
            group: 'addon.open-cluster-management.io',
            lastAppliedConfig: {
              name: 'hypershift-addon-deploy-config',
              namespace: 'multicluster-engine',
              specHash: '673989f990db2503cf3115ec915ac4d02b1182f6bfaf6350d861ae30d10d0489',
            },
            lastObservedGeneration: 1,
            name: 'hypershift-addon-deploy-config',
            namespace: 'multicluster-engine',
            resource: 'addondeploymentconfigs',
          },
        ],
        healthCheck: {
          mode: 'Lease',
        },
        namespace: 'open-cluster-management-agent-addon',
        registrations: [
          {
            signerName: 'kubernetes.io/kube-apiserver-client',
            subject: {
              groups: [
                'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon',
                'system:open-cluster-management:addon:hypershift-addon',
                'system:authenticated',
              ],
              user: 'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon:agent:6q4l5',
            },
          },
        ],
        supportedConfigs: [
          {
            group: 'addon.open-cluster-management.io',
            resource: 'addondeploymentconfigs',
          },
        ],
      },
    },
  },
  id: '115',
}
const managedSrv = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2024-11-04T04:46:31Z',
        generation: 1,
        name: 'managed-serviceaccount',
        namespace: () => 'name',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'managed-serviceaccount',
            uid: 'bd94e351-8a31-4403-a92e-7df148cca0f3',
          },
        ],
        resourceVersion: '2218386',
        uid: 'bc360ed0-0c9d-41ff-bafa-af7e5393a06e',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2024-11-04T04:46:31Z',
            message: 'Configurations configured',
            reason: 'ConfigurationsConfigured',
            status: 'True',
            type: 'Configured',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:54Z',
            message: 'completed with no errors.',
            reason: 'Completed',
            status: 'False',
            type: 'Progressing',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:33Z',
            message: 'Registration of the addon agent is configured',
            reason: 'SetPermissionApplied',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:48Z',
            message:
              'client certificate rotated starting from 2024-11-05 02:41:58 +0000 UTC to 2024-12-04 23:16:37 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:54Z',
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:09Z',
            message: 'managed-serviceaccount add-on is available.',
            reason: 'ProbeAvailable',
            status: 'True',
            type: 'Available',
          },
        ],
        configReferences: [
          {
            desiredConfig: {
              name: 'managed-serviceaccount-2.8',
              specHash: 'a3eb3dcdd45b539fc4fbd21b5cf6ab7383ec74327ed4e6046005183bf72a35e7',
            },
            group: 'addon.open-cluster-management.io',
            lastAppliedConfig: {
              name: 'managed-serviceaccount-2.8',
              specHash: 'a3eb3dcdd45b539fc4fbd21b5cf6ab7383ec74327ed4e6046005183bf72a35e7',
            },
            lastObservedGeneration: 1,
            name: 'managed-serviceaccount-2.8',
            resource: 'addontemplates',
          },
        ],
        healthCheck: {
          mode: 'Customized',
        },
        namespace: 'open-cluster-management-agent-addon',
        registrations: [
          {
            signerName: 'kubernetes.io/kube-apiserver-client',
            subject: {
              groups: [
                'system:open-cluster-management:cluster:local-cluster:addon:managed-serviceaccount',
                'system:open-cluster-management:addon:managed-serviceaccount',
                'system:authenticated',
              ],
              user: 'system:open-cluster-management:cluster:local-cluster:addon:managed-serviceaccount:agent:managed-serviceaccount-agent',
            },
          },
        ],
        supportedConfigs: [
          {
            group: 'addon.open-cluster-management.io',
            resource: 'addondeploymentconfigs',
          },
          {
            group: 'addon.open-cluster-management.io',
            resource: 'addontemplates',
          },
        ],
      },
    },
  },
  id: '115',
}
const workManager = {
  data: {
    type: 'MODIFIED',
    object: {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        creationTimestamp: '2024-11-04T04:46:31Z',
        generation: 1,
        name: 'work-manager',
        namespace: () => 'name',
        ownerReferences: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'ClusterManagementAddOn',
            name: 'work-manager',
            uid: '97ba945d-5496-44e1-ae67-4243f14a6c94',
          },
        ],
        resourceVersion: '1333061',
        uid: 'c43e2733-6f9e-44f2-84b8-17231e6752e0',
      },
      spec: {
        installNamespace: 'open-cluster-management-agent-addon',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2024-11-04T04:46:55Z',
            message: 'completed with no errors.',
            reason: 'Completed',
            status: 'False',
            type: 'Progressing',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:31Z',
            message: 'Configurations configured',
            reason: 'ConfigurationsConfigured',
            status: 'True',
            type: 'Configured',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:32Z',
            message: 'Registration of the addon agent is configured',
            reason: 'SetPermissionApplied',
            status: 'True',
            type: 'RegistrationApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:48Z',
            message:
              'client certificate rotated starting from 2024-11-05 02:41:58 +0000 UTC to 2024-12-04 23:16:37 +0000 UTC',
            reason: 'ClientCertificateUpdated',
            status: 'True',
            type: 'ClusterCertificateRotated',
          },
          {
            lastTransitionTime: '2024-11-04T04:46:55Z',
            message: 'manifests of addon are applied successfully',
            reason: 'AddonManifestApplied',
            status: 'True',
            type: 'ManifestApplied',
          },
          {
            lastTransitionTime: '2024-11-04T04:47:28Z',
            message: 'work-manager add-on is available.',
            reason: 'ManagedClusterAddOnLeaseUpdated',
            status: 'True',
            type: 'Available',
          },
        ],
        namespace: 'open-cluster-management-agent-addon',
        registrations: [
          {
            signerName: 'kubernetes.io/kube-apiserver-client',
            subject: {
              groups: [
                'system:open-cluster-management:cluster:local-cluster:addon:work-manager',
                'system:open-cluster-management:addon:work-manager',
                'system:authenticated',
              ],
              user: 'system:open-cluster-management:cluster:local-cluster:addon:work-manager:agent:work-manager',
            },
          },
        ],
        supportedConfigs: [
          {
            group: 'addon.open-cluster-management.io',
            resource: 'addondeploymentconfigs',
          },
        ],
      },
    },
  },
  id: '115',
}

const applicationsTemplate = [
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'app.kubernetes.io/component=controller; app.kubernetes.io/managed-by=cluster-monitoring-operator; app.kubernetes.io/name=prometheus-operator; app.kubernetes.io/part-of=openshift-monitoring; app.kubernetes.io/version=0.73.2',
    metadata: {
      name: 'openshift-monitoring',
      namespace: 'openshift-monitoring',
      creationTimestamp: '2024-11-04T04:14:29Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'prometheus-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=etcd-operator',
    metadata: {
      name: 'etcd-operator',
      namespace: 'openshift-etcd-operator',
      creationTimestamp: '2024-11-04T04:11:21Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'etcd-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'app=grc; app.kubernetes.io/instance=grc; app.kubernetes.io/name=grc; chart=grc-chart-2.13.0; component=ocm-policy-addon-ctrl; installer.name=multiclusterhub; installer.namespace=open-cluster-management; release=grc',
    metadata: {
      name: 'grc',
      namespace: 'open-cluster-management',
      creationTimestamp: '2024-11-04T04:47:37Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'grc-policy-addon-controller',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=service-ca; service-ca=true',
    metadata: {
      name: 'service-ca',
      namespace: 'openshift-service-ca',
      creationTimestamp: '2024-11-04T04:13:43Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'service-ca',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'app=volsync-addon-controller; app.kubernetes.io/instance=volsync; app.kubernetes.io/name=volsync-addon-controller; chart=volsync-addon-controller-2.13.0; component=volsync-addon-controller; installer.name=multiclusterhub; installer.namespace=open-cluster-management; release=volsync',
    metadata: {
      name: 'volsync-addon-controller',
      namespace: 'open-cluster-management',
      creationTimestamp: '2024-11-04T04:47:39Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'volsync-addon-controller',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=migrator',
    metadata: {
      name: 'migrator',
      namespace: 'openshift-kube-storage-version-migrator',
      creationTimestamp: '2024-11-04T04:13:41Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'migrator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'app=console-chart-v2; app.kubernetes.io/instance=console; app.kubernetes.io/name=console-chart; chart=console-chart-2.13.0; component=console; installer.name=multiclusterhub; installer.namespace=open-cluster-management; release=console; subcomponent=acm-cli-downloads',
    metadata: {
      name: 'console-chart-v2',
      namespace: 'open-cluster-management',
      creationTimestamp: '2024-11-04T04:47:37Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'acm-cli-downloads',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=openshift-apiserver-operator',
    metadata: {
      name: 'openshift-apiserver-operator',
      namespace: 'openshift-apiserver-operator',
      creationTimestamp: '2024-11-04T04:11:18Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'openshift-apiserver-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=cluster-manager-registration-webhook',
    metadata: {
      name: 'cluster-manager-registration-webhook',
      namespace: 'open-cluster-management-hub',
      creationTimestamp: '2024-11-04T04:45:52Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'cluster-manager-registration-webhook',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'app.kubernetes.io/component=multi-tenant; app.kubernetes.io/managed-by=olm; app.kubernetes.io/part-of=hyperconverged-cluster; app.kubernetes.io/version=4.16.3; olm.deployment-spec-hash=6EhizNTGkquU961LUQGeXOvJ6kzjzdfVJxD0Z3; olm.managed=true; olm.owner=kubevirt-hyperconverged-operator.v4.16.3; olm.owner.kind=ClusterServiceVersion; olm.owner.namespace=openshift-cnv; operators.coreos.com/kubevirt-hyperconverged.openshift-cnv=',
    metadata: {
      name: 'hyperconverged-cluster',
      namespace: 'openshift-cnv',
      creationTimestamp: '2024-11-04T09:37:04Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'mtq-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=csi-snapshot-controller-operator',
    metadata: {
      name: 'csi-snapshot-controller-operator',
      namespace: 'openshift-cluster-storage-operator',
      creationTimestamp: '2024-11-04T04:11:28Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'csi-snapshot-controller-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=openshift-controller-manager-operator',
    metadata: {
      name: 'openshift-controller-manager-operator',
      namespace: 'openshift-controller-manager-operator',
      creationTimestamp: '2024-11-04T04:11:18Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'openshift-controller-manager-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'app=policyreport; chart=policyreport-2.12.0; component=insights-metrics; heritage=release-service; installer.name=multiclusterhub; installer.namespace=open-cluster-management; release=policyreport',
    metadata: {
      name: 'policyreport',
      namespace: 'open-cluster-management',
      creationTimestamp: '2024-11-04T04:47:38Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'insights-metrics',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=multus-admission-controller; networkoperator.openshift.io/generates-operator-status=stand-alone',
    metadata: {
      name: 'multus-admission-controller',
      namespace: 'openshift-multus',
      creationTimestamp: '2024-11-04T04:12:42Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'multus-admission-controller',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=kube-storage-version-migrator-operator',
    metadata: {
      name: 'kube-storage-version-migrator-operator',
      namespace: 'openshift-kube-storage-version-migrator-operator',
      creationTimestamp: '2024-11-04T04:11:18Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'kube-storage-version-migrator-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=package-server-manager',
    metadata: {
      name: 'package-server-manager',
      namespace: 'openshift-operator-lifecycle-manager',
      creationTimestamp: '2024-11-04T04:11:31Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'package-server-manager',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'addon.open-cluster-management.io/hosted-manifest-location=hosting; app=config-policy-controller; chart=config-policy-controller-2.2.0; heritage=Helm; release=config-policy-controller',
    metadata: {
      name: 'config-policy-controller',
      namespace: 'open-cluster-management-agent-addon',
      creationTimestamp: '2024-11-04T04:47:52Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'config-policy-controller',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=cluster-monitoring-operator; app.kubernetes.io/name=cluster-monitoring-operator',
    metadata: {
      name: 'cluster-monitoring-operator',
      namespace: 'openshift-monitoring',
      creationTimestamp: '2024-11-04T04:11:30Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'cluster-monitoring-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=clustermanager-controller',
    metadata: {
      name: 'clustermanager-controller',
      namespace: 'open-cluster-management-hub',
      creationTimestamp: '2024-11-04T04:45:52Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'cluster-manager-addon-manager-controller',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'addon.open-cluster-management.io/hosted-manifest-location=hosting; app=cert-policy-controller; chart=cert-policy-controller-2.2.0; heritage=Helm; release=cert-policy-controller',
    metadata: {
      name: 'cert-policy-controller',
      namespace: 'open-cluster-management-agent-addon',
      creationTimestamp: '2024-11-04T04:47:48Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'cert-policy-controller',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=klusterlet-agent',
    metadata: {
      name: 'klusterlet-agent',
      namespace: 'open-cluster-management-agent',
      creationTimestamp: '2024-11-04T04:46:45Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'klusterlet-agent',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=kube-apiserver-operator',
    metadata: {
      name: 'kube-apiserver-operator',
      namespace: 'openshift-kube-apiserver-operator',
      creationTimestamp: '2024-11-04T04:11:34Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'kube-apiserver-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=console; component=ui',
    metadata: {
      name: 'console',
      namespace: 'openshift-console',
      creationTimestamp: '2024-11-04T04:28:20Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'console',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=hypershift-addon-agent',
    metadata: {
      name: 'hypershift-addon-agent',
      namespace: 'open-cluster-management-agent-addon',
      creationTimestamp: '2024-11-04T04:46:51Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'hypershift-addon-agent',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=service-ca-operator',
    metadata: {
      name: 'service-ca-operator',
      namespace: 'openshift-service-ca-operator',
      creationTimestamp: '2024-11-04T04:11:17Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'service-ca-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=kube-controller-manager-operator',
    metadata: {
      name: 'kube-controller-manager-operator',
      namespace: 'openshift-kube-controller-manager-operator',
      creationTimestamp: '2024-11-04T04:11:17Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'kube-controller-manager-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'addon.open-cluster-management.io/hosted-manifest-location=hosting; app=governance-policy-framework; chart=governance-policy-framework-2.2.0; heritage=Helm; release=governance-policy-framework',
    metadata: {
      name: 'governance-policy-framework',
      namespace: 'open-cluster-management-agent-addon',
      creationTimestamp: '2024-11-04T04:47:55Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'governance-policy-framework',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'app.kubernetes.io/component=controller; app.kubernetes.io/managed-by=cluster-monitoring-operator; app.kubernetes.io/name=prometheus-operator; app.kubernetes.io/part-of=openshift-monitoring; app.kubernetes.io/version=0.73.2',
    metadata: {
      name: 'openshift-monitoring',
      namespace: 'openshift-user-workload-monitoring',
      creationTimestamp: '2024-11-04T18:44:58Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'prometheus-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=oauth-openshift',
    metadata: {
      name: 'oauth-openshift',
      namespace: 'openshift-authentication',
      creationTimestamp: '2024-11-04T04:28:21Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'oauth-openshift',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=machine-approver; machine-approver=true',
    metadata: {
      name: 'machine-approver',
      namespace: 'openshift-cluster-machine-approver',
      creationTimestamp: '2024-11-04T04:11:59Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'machine-approver',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=openshift-kube-scheduler-operator',
    metadata: {
      name: 'openshift-kube-scheduler-operator',
      namespace: 'openshift-kube-scheduler-operator',
      creationTimestamp: '2024-11-04T04:11:17Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'openshift-kube-scheduler-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=cluster-manager-work-webhook',
    metadata: {
      name: 'cluster-manager-work-webhook',
      namespace: 'open-cluster-management-hub',
      creationTimestamp: '2024-11-04T04:45:52Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'cluster-manager-work-webhook',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=olm-operator',
    metadata: {
      name: 'olm-operator',
      namespace: 'openshift-operator-lifecycle-manager',
      creationTimestamp: '2024-11-04T04:11:33Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'olm-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=catalog-operator',
    metadata: {
      name: 'catalog-operator',
      namespace: 'openshift-operator-lifecycle-manager',
      creationTimestamp: '2024-11-04T04:11:33Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'catalog-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label:
      'app=klusterlet-addon-controller-v2; app.kubernetes.io/name=klusterlet-addon-controller; component=klusterlet-addon-controller; installer.name=multiclusterhub; installer.namespace=open-cluster-management',
    metadata: {
      name: 'klusterlet-addon-controller-v2',
      namespace: 'open-cluster-management',
      creationTimestamp: '2024-11-04T04:47:37Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'klusterlet-addon-controller-v2',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=route-controller-manager; route-controller-manager=true',
    metadata: {
      name: 'route-controller-manager',
      namespace: 'openshift-route-controller-manager',
      creationTimestamp: '2024-11-04T04:13:43Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'route-controller-manager',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=openshift-config-operator',
    metadata: {
      name: 'openshift-config-operator',
      namespace: 'openshift-config-operator',
      creationTimestamp: '2024-11-04T04:11:34Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'openshift-config-operator',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'apiserver=true; app=openshift-apiserver; revision=1',
    metadata: {
      name: 'openshift-apiserver',
      namespace: 'openshift-apiserver',
      creationTimestamp: '2024-11-04T04:15:53Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'apiserver',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=openshift-controller-manager; controller-manager=true',
    metadata: {
      name: 'openshift-controller-manager',
      namespace: 'openshift-controller-manager',
      creationTimestamp: '2024-11-04T04:13:42Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'controller-manager',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'apiserver=true; app=openshift-oauth-apiserver; revision=1',
    metadata: {
      name: 'openshift-oauth-apiserver',
      namespace: 'openshift-oauth-apiserver',
      creationTimestamp: '2024-11-04T04:15:38Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'apiserver',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=klusterlet',
    metadata: {
      name: 'klusterlet',
      namespace: 'open-cluster-management-agent',
      creationTimestamp: '2024-11-04T04:46:35Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'klusterlet',
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    label: 'app=authentication-operator',
    metadata: {
      name: 'authentication-operator',
      namespace: 'openshift-authentication-operator',
      creationTimestamp: '2024-11-04T04:11:19Z',
    },
    status: {
      cluster: () => 'name',
      resourceName: 'authentication-operator',
    },
  },
]
