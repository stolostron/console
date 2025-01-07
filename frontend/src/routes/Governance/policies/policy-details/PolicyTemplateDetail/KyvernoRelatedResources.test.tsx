/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { KyvernoRelatedResources } from './KyvernoRelatedResources'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import * as KyvernoTable from './KyvernoTable'

describe('Kyverno Related Resources table Test', () => {
  beforeEach(() => {
    const mockMessageComponent = jest.spyOn(KyvernoTable, 'KyvernoMessages')
    mockMessageComponent.mockImplementation(() => <>Mocked Messages</>)
  })
  test('Should render verify-image', async () => {
    const template = {
      apiVersion: 'kyverno.io/v1',
      kind: 'ClusterPolicy',
      metadata: {
        name: 'verify-image',
      },
      spec: {
        validationFailureAction: 'Enforce',
        background: false,
        rules: [
          {
            name: 'verify-image',
            match: {
              any: [
                {
                  resources: {
                    kinds: ['Pod'],
                  },
                },
              ],
            },
            verifyImages: [
              {
                imageReferences: ['ghcr.io/kyverno/test-verify-image*'],
                mutateDigest: true,
                attestors: [
                  {
                    entries: [
                      {
                        keys: {
                          publicKeys:
                            '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8nXRh950IZbRj8Ra/N9sbqOPZrfM\n5/KAQN0/KjHcorm/J5yctVd7iEcnessRQjU917hmKO6JWVGHpDguIyakZA==\n-----END PUBLIC KEY-----\n',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    }

    const relatedObjects: any[] = [
      {
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/c3c2f0b2-ed33-4cb4-84e7-2da7b046e01b'],
        _uid: 'local-cluster/8ceb3a72-ed6f-4511-b199-5c109cb77d08',
        apiversion: 'v1',
        cluster: 'local-cluster',
        container: 'httpd',
        created: '2024-12-16T16:40:05Z',
        hostIP: '10.0.56.166',
        image: 'registry.redhat.io/rhel9/httpd-24:latest',
        kind: 'Pod',
        kind_plural: 'pods',
        label: 'test=cat',
        name: 'my-disallowed-route-1',
        namespace: 'test1',
        podIP: '10.130.1.100',
        restarts: '0',
        startedAt: '2024-12-16T16:40:05Z',
        status: 'Running',
        compliant: 'noncompliant',
        policyReport: {
          _hubClusterResource: 'true',
          _policyViolationCounts:
            'require-owner-labels=1; test1/generate-pod=0; test1/require-team-label=2; test1/set-image-pull-policy=0; verify-image=1; zk-kafka-address=2',
          _relatedUids: ['local-cluster/c3c2f0b2-ed33-4cb4-84e7-2da7b046e01b'],
          _uid: 'local-cluster/d9723091-2ff2-408c-be95-aa11180547c6',
          apigroup: 'wgpolicyk8s.io',
          apiversion: 'v1beta1',
          category: ';  eks best practices; software supply chain security',
          cluster: 'local-cluster',
          created: '2024-12-16T16:40:15Z',
          critical: '0',
          important: '0',
          kind: 'PolicyReport',
          kind_plural: 'policyreports',
          label: 'app.kubernetes.io/managed-by=kyverno',
          low: '0',
          moderate: '0',
          name: '8ceb3a72-ed6f-4511-b199-5c109cb77d08',
          namespace: 'test1',
          numRuleViolations: '6',
          policies:
            'require-owner-labels; test1/generate-pod; test1/require-team-label; test1/set-image-pull-policy; verify-image; zk-kafka-address',
          rules:
            'generate-configmap-for-pod; require-friend-label; require-labels; require-team-label; require-tiger; set-image-pull-policy; verify-image',
          scope: 'my-disallowed-route-1',
        },
      },
    ]
    render(
      <MemoryRouter>
        <KyvernoRelatedResources
          {...{
            name: 'verify-image',
            namespace: undefined,
            violationColumn: { header: 'violation', cell: 'violation cell' },
            template,
            relatedObjects,
          }}
        />
      </MemoryRouter>
    )

    await waitFor(
      () => {
        screen.getByRole('button', {
          name: 'Verify images',
        })
      },
      { timeout: 5000, interval: 1000 }
    )

    screen.getByRole('link', {
      name: /my-disallowed-route-1/i,
    })
    screen.getByRole('cell', {
      name: /test1/i,
    })
    screen.getByRole('cell', {
      name: 'Pod',
    })
    screen.getByRole('cell', {
      name: 'Mocked Messages',
    })
  })

  test('Should render mutate', async () => {
    const template = {
      apiVersion: 'kyverno.io/v1',
      kind: 'Policy',
      metadata: {
        name: 'set-image-pull-policy',
        namespace: 'test1',
      },
      spec: {
        admission: true,
        background: true,
        emitWarning: false,
        rules: [
          {
            match: {
              any: [
                {
                  resources: {
                    kinds: ['Pod'],
                  },
                },
              ],
            },
            mutate: {
              patchStrategicMerge: {
                spec: {
                  containers: [
                    {
                      '(image)': '*:latest',
                      imagePullPolicy: 'IfNotPresent',
                    },
                  ],
                },
              },
            },
            name: 'set-image-pull-policy',
            skipBackgroundRequests: true,
          },
        ],
        validationFailureAction: 'Audit',
      },
    }

    const relatedObjects: any[] = [
      {
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/56a09841-c7a3-40c1-a1df-92b342f974be'],
        _uid: 'local-cluster/8ceb3a72-ed6f-4511-b199-5c109cb77d08',
        apiversion: 'v1',
        cluster: 'local-cluster',
        container: 'httpd',
        created: '2024-12-16T16:40:05Z',
        hostIP: '10.0.56.166',
        image: 'registry.redhat.io/rhel9/httpd-24:latest',
        kind: 'Pod',
        kind_plural: 'pods',
        label: 'test=cat',
        name: 'my-disallowed-route-1',
        namespace: 'test1',
        podIP: '10.130.1.100',
        restarts: '0',
        startedAt: '2024-12-16T16:40:05Z',
        status: 'Running',
        compliant: 'compliant',
        policyReport: {
          _hubClusterResource: 'true',
          _policyViolationCounts:
            'require-owner-labels=1; test1/generate-pod=0; test1/require-team-label=2; test1/set-image-pull-policy=0; verify-image=1; zk-kafka-address=2',
          _relatedUids: ['local-cluster/56a09841-c7a3-40c1-a1df-92b342f974be'],
          _uid: 'local-cluster/d9723091-2ff2-408c-be95-aa11180547c6',
          apigroup: 'wgpolicyk8s.io',
          apiversion: 'v1beta1',
          category: ';  eks best practices; software supply chain security',
          cluster: 'local-cluster',
          created: '2024-12-16T16:40:15Z',
          critical: '0',
          important: '0',
          kind: 'PolicyReport',
          kind_plural: 'policyreports',
          label: 'app.kubernetes.io/managed-by=kyverno',
          low: '0',
          moderate: '0',
          name: '8ceb3a72-ed6f-4511-b199-5c109cb77d08',
          namespace: 'test1',
          numRuleViolations: '6',
          policies:
            'require-owner-labels; test1/generate-pod; test1/require-team-label; test1/set-image-pull-policy; verify-image; zk-kafka-address',
          rules:
            'generate-configmap-for-pod; require-friend-label; require-labels; require-team-label; require-tiger; set-image-pull-policy; verify-image',
          scope: 'my-disallowed-route-1',
        },
      },
    ]
    render(
      <MemoryRouter>
        <KyvernoRelatedResources
          {...{
            name: 'set-image-pull-policy',
            namespace: 'test1',
            violationColumn: { header: 'violation', cell: 'violation cell' },
            template,
            relatedObjects,
          }}
        />
      </MemoryRouter>
    )

    await waitFor(
      () => {
        screen.getByRole('button', {
          name: 'Mutate',
        })
      },
      { timeout: 5000, interval: 1000 }
    )
    screen.getByRole('link', {
      name: /my-disallowed-route-1/i,
    })
    screen.getByRole('cell', {
      name: /test1/i,
    })
    screen.getByRole('cell', {
      name: 'Pod',
    })
    screen.getByRole('cell', {
      name: 'Mocked Messages',
    })
  })

  test('Should render generate, validate', async () => {
    const template = {
      apiVersion: 'kyverno.io/v1',
      kind: 'ClusterPolicy',
      metadata: {
        name: 'zk-kafka-address',
      },
      spec: {
        rules: [
          {
            name: 'require-labels',
            match: {
              any: [
                {
                  resources: {
                    kinds: ['Pod'],
                    namespaces: ['test2', 'test1'],
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
          {
            name: 'require-tiger',
            match: {
              any: [
                {
                  resources: {
                    kinds: ['Pod'],
                    namespaces: ['test1', 'test2'],
                  },
                },
              ],
            },
            validate: {
              message: 'The label `tiger` is required',
              pattern: {
                metadata: {
                  labels: {
                    tiger: '?*',
                  },
                },
              },
            },
          },
          {
            name: 'create-configmap-in-ns',
            match: {
              any: [
                {
                  resources: {
                    kinds: ['Namespace'],
                    names: ['test2', 'test3'],
                  },
                },
              ],
            },
            generate: {
              synchronize: true,
              apiVersion: 'v1',
              kind: 'ConfigMap',
              name: 'zk-kafka-address',
              namespace: '{{request.object.metadata.name}}',
              data: {
                kind: 'ConfigMap',
                metadata: {
                  labels: {
                    somekey: 'somevalue',
                  },
                },
                data: {
                  ZK_ADDRESS: '192.168.10.10:2181,192.168.10.11:2181,192.168.10.12:2181',
                  KAFKA_ADDRESS: '192.168.10.13:9092,192.168.10.14:9092,192.168.10.15:9092',
                },
              },
            },
          },
        ],
      },
    }

    const relatedObjects: any[] = [
      {
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/8df7368f-f0b3-4edd-bb34-901ed218987d'],
        _uid: 'local-cluster/4744634c-f418-4c6a-addb-3d9a1caef77c',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2024-12-16T16:39:41Z',
        kind: 'Namespace',
        kind_plural: 'namespaces',
        label:
          'kubernetes.io/metadata.name=test2; pod-security.kubernetes.io/audit=restricted; pod-security.kubernetes.io/audit-version=latest; pod-security.kubernetes.io/warn=restricted; pod-security.kubernetes.io/warn-version=latest',
        name: 'test2',
        status: 'Active',
        compliant: 'compliant',
        policyReport: {
          _hubClusterResource: 'true',
          _policyViolationCounts: 'zk-kafka-address=0',
          _relatedUids: ['local-cluster/8df7368f-f0b3-4edd-bb34-901ed218987d'],
          _uid: 'local-cluster/65e4f5f8-1626-4a2a-85fb-e3b64d5eaa20',
          apigroup: 'wgpolicyk8s.io',
          apiversion: 'v1alpha2',
          category: '',
          cluster: 'local-cluster',
          created: '2024-12-16T16:39:51Z',
          critical: '0',
          important: '0',
          kind: 'ClusterPolicyReport',
          kind_plural: 'clusterpolicyreports',
          label: 'app.kubernetes.io/managed-by=kyverno',
          low: '0',
          moderate: '0',
          name: '4744634c-f418-4c6a-addb-3d9a1caef77c',
          numRuleViolations: '0',
          policies: 'zk-kafka-address',
          rules: 'create-configmap-in-ns',
          scope: 'test2',
        },
      },
      {
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/8df7368f-f0b3-4edd-bb34-901ed218987d'],
        _uid: 'local-cluster/cad2dc47-3030-424d-9a3d-c1078fc29f72',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2024-12-16T16:39:41Z',
        kind: 'ConfigMap',
        kind_plural: 'configmaps',
        label:
          'app.kubernetes.io/managed-by=kyverno; generate.kyverno.io/policy-name=zk-kafka-address; generate.kyverno.io/policy-namespace=; generate.kyverno.io/rule-name=create-configmap-in-ns; generate.kyverno.io/trigger-group=; generate.kyverno.io/trigger-kind=Namespace; generate.kyverno.io/trigger-namespace=; generate.kyverno.io/trigger-uid=4744634c-f418-4c6a-addb-3d9a1caef77c; generate.kyverno.io/trigger-version=v1; somekey=somevalue',
        name: 'zk-kafka-address',
        namespace: 'test2',
        compliant: 'compliant',
        generatedByKyverno: true,
      },
      {
        _hubClusterResource: 'true',
        _relatedUids: ['local-cluster/8df7368f-f0b3-4edd-bb34-901ed218987d'],
        _uid: 'local-cluster/8ceb3a72-ed6f-4511-b199-5c109cb77d08',
        apiversion: 'v1',
        cluster: 'local-cluster',
        container: 'httpd',
        created: '2024-12-16T16:40:05Z',
        hostIP: '10.0.56.166',
        image: 'registry.redhat.io/rhel9/httpd-24:latest',
        kind: 'Pod',
        kind_plural: 'pods',
        label: 'test=cat',
        name: 'my-disallowed-route-1',
        namespace: 'test1',
        podIP: '10.130.1.100',
        restarts: '0',
        startedAt: '2024-12-16T16:40:05Z',
        status: 'Running',
        compliant: 'noncompliant',
        policyReport: {
          _hubClusterResource: 'true',
          _policyViolationCounts:
            'require-owner-labels=1; test1/generate-pod=0; test1/require-team-label=2; test1/set-image-pull-policy=0; verify-image=1; zk-kafka-address=2',
          _relatedUids: ['local-cluster/8df7368f-f0b3-4edd-bb34-901ed218987d'],
          _uid: 'local-cluster/d9723091-2ff2-408c-be95-aa11180547c6',
          apigroup: 'wgpolicyk8s.io',
          apiversion: 'v1beta1',
          category: ';  eks best practices; software supply chain security',
          cluster: 'local-cluster',
          created: '2024-12-16T16:40:15Z',
          critical: '0',
          important: '0',
          kind: 'PolicyReport',
          kind_plural: 'policyreports',
          label: 'app.kubernetes.io/managed-by=kyverno',
          low: '0',
          moderate: '0',
          name: '8ceb3a72-ed6f-4511-b199-5c109cb77d08',
          namespace: 'test1',
          numRuleViolations: '6',
          policies:
            'require-owner-labels; test1/generate-pod; test1/require-team-label; test1/set-image-pull-policy; verify-image; zk-kafka-address',
          rules:
            'generate-configmap-for-pod; require-friend-label; require-labels; require-team-label; require-tiger; set-image-pull-policy; verify-image',
          scope: 'my-disallowed-route-1',
        },
      },
    ]
    render(
      <MemoryRouter>
        <KyvernoRelatedResources
          {...{
            name: 'zk-kafka-address',
            namespace: '',
            violationColumn: { header: 'violation', cell: 'violation cell' },
            template,
            relatedObjects,
          }}
        />
      </MemoryRouter>
    )

    await waitFor(
      () => {
        screen.getByRole('button', {
          name: 'Validate',
        })
        screen.getByRole('button', {
          name: 'Generate',
        })
        screen.getByRole('button', {
          name: 'Generate match resources',
        })
      },
      { timeout: 5000, interval: 1000 }
    )

    // Default Should be validate
    screen.getByRole('link', {
      name: /my-disallowed-route-1/i,
    })
    screen.getByRole('cell', {
      name: /test1/i,
    })
    screen.getByRole('cell', {
      name: 'Pod',
    })
    screen.getByRole('cell', {
      name: 'Mocked Messages',
    })

    // Generate
    screen
      .getByRole('button', {
        name: 'Generate',
      })
      .click()
    screen.getByRole('link', {
      name: 'zk-kafka-address',
    })
    screen.getByRole('cell', {
      name: 'ConfigMap',
    })
    screen.getByRole('cell', {
      name: 'v1',
    })
    screen.getByRole('cell', {
      name: 'test2',
    })
    screen.getByRole('cell', {
      name: 'This resource is generated by create-configmap-in-ns rule',
    })

    // Generate match resources
    screen
      .getByRole('button', {
        name: 'Generate match resources',
      })
      .click()
    screen.getByRole('link', {
      name: 'test2',
    })
    screen.getByRole('cell', {
      name: 'Namespace',
    })
    screen.getByRole('cell', {
      name: 'v1',
    })
    screen.getByRole('cell', {
      name: 'Mocked Messages',
    })
  })
})
