/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'i18next'
import { YAMLContainer } from './YAMLContainer'
import { render } from '@testing-library/react'

const t = (string: any) => {
  return string
}

describe('YAML Container test', () => {
  const renderYAMLContainer = async (node: any, t: TFunction) => {
    const containerRef = {} as unknown as HTMLDivElement
    const retResource = render(<YAMLContainer node={node} t={t} containerRef={containerRef} />)

    return retResource
  }

  it('should render YAMLContainer', async () => {
    const node = {
      name: 'foo',
      namespace: 'feng-secret',
      type: 'secret',
      id: 'member--deployed-resource--member--clusters--feng-kind--local-cluster--feng-secret-subscription-1--feng-secret--foo--secret',
      uid: 'member--deployed-resource--member--clusters--feng-kind--local-cluster--feng-secret-subscription-1--feng-secret--foo--secret',
      specs: {
        isDesign: false,
        parent: {
          parentId: 'member--clusters--feng-kind--local-cluster--feng-secret-subscription-1',
          parentName: '',
          parentType: 'cluster',
          parentSpecs: {
            title: '',
            subscription: {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': '5847e5830f8f36ff4c648c71c2ab98d7ec663513',
                  'apps.open-cluster-management.io/git-path': 'secretapp',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2023-04-20T13:42:44Z',
                generation: 1,
                labels: {
                  app: 'feng-secret',
                  'app.kubernetes.io/part-of': 'feng-secret',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-secret-subscription-1',
                namespace: 'feng-secret',
                resourceVersion: '5516110',
                uid: '8b3c3e57-ea55-4993-86db-e44eac9aedef',
              },
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'Placement',
                    name: 'feng-secret-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2023-04-20T13:42:45Z',
                message: 'Active',
                phase: 'Propagated',
              },
              posthooks: [],
              prehooks: [],
              channels: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'Channel',
                  metadata: {
                    annotations: {
                      'apps.open-cluster-management.io/reconcile-rate': 'medium',
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2023-04-13T15:35:55Z',
                    generation: 1,
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                    resourceVersion: '1977580',
                    uid: '43c0d8dc-b2e7-4392-b99c-0c60f8e600c9',
                  },
                  spec: {
                    pathname: 'https://github.com/fxiang1/app-samples',
                    type: 'Git',
                  },
                },
              ],
              decisions: [
                {
                  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                  kind: 'PlacementDecision',
                  metadata: {
                    creationTimestamp: '2023-04-20T13:42:44Z',
                    generation: 1,
                    labels: {
                      'cluster.open-cluster-management.io/placement': 'feng-secret-placement-1',
                    },
                    name: 'feng-secret-placement-1-decision-1',
                    namespace: 'feng-secret',
                    ownerReferences: [
                      {
                        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                        blockOwnerDeletion: true,
                        controller: true,
                        kind: 'Placement',
                        name: 'feng-secret-placement-1',
                        uid: '603f3c2f-d607-456b-bb3f-d35f7b4bcc4c',
                      },
                    ],
                    resourceVersion: '5892874',
                    uid: '9cd50c8b-9f7f-4cda-98a6-f9ed8fcd6d4b',
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'feng-kind',
                        reason: '',
                      },
                      {
                        clusterName: 'local-cluster',
                        reason: '',
                      },
                    ],
                  },
                },
              ],
              placements: [
                {
                  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                  kind: 'Placement',
                  metadata: {
                    creationTimestamp: '2023-04-20T13:42:44Z',
                    generation: 1,
                    labels: {
                      app: 'feng-secret',
                    },
                    name: 'feng-secret-placement-1',
                    namespace: 'feng-secret',
                    resourceVersion: '5892877',
                    uid: '603f3c2f-d607-456b-bb3f-d35f7b4bcc4c',
                  },
                  spec: {
                    clusterSets: ['default'],
                    predicates: [
                      {
                        requiredClusterSelector: {
                          labelSelector: {},
                        },
                      },
                    ],
                  },
                  status: {
                    conditions: [
                      {
                        lastTransitionTime: '2023-04-20T13:42:44Z',
                        message: 'Placement configurations check pass',
                        reason: 'Succeedconfigured',
                        status: 'False',
                        type: 'PlacementMisconfigured',
                      },
                      {
                        lastTransitionTime: '2023-04-20T13:42:45Z',
                        message: 'All cluster decisions scheduled',
                        reason: 'AllDecisionsScheduled',
                        status: 'True',
                        type: 'PlacementSatisfied',
                      },
                    ],
                    numberOfSelectedClusters: 2,
                  },
                },
              ],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2023-04-20T13:42:45Z',
                  generation: 6,
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'feng-secret.feng-secret-subscription-1',
                  },
                  name: 'feng-secret-subscription-1',
                  namespace: 'feng-secret',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'feng-secret-subscription-1',
                      uid: '8b3c3e57-ea55-4993-86db-e44eac9aedef',
                    },
                  ],
                  resourceVersion: '5894438',
                  uid: '3a11edfd-7668-49c6-b131-99bbf2ecbb8a',
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'v1',
                    kind: 'Secret',
                    name: 'foo',
                    namespace: 'feng-secret',
                  },
                ],
                results: [
                  {
                    result: 'deployed',
                    source: 'feng-kind',
                    timestamp: {
                      nanos: 0,
                      seconds: 0,
                    },
                  },
                  {
                    result: 'deployed',
                    source: 'local-cluster',
                    timestamp: {
                      nanos: 0,
                      seconds: 0,
                    },
                  },
                ],
                summary: {
                  clusters: '2',
                  deployed: '2',
                  failed: '0',
                  inProgress: '0',
                  propagationFailed: '0',
                },
              },
            },
            resourceCount: 2,
            clustersNames: ['feng-kind', 'local-cluster'],
            clusters: [
              {
                name: 'local-cluster',
                displayName: 'local-cluster',
                namespace: 'local-cluster',
                uid: '24a4025f-53be-44d6-8b11-6b1cc0836efc',
                status: 'ready',
                provider: 'aws',
                distribution: {
                  k8sVersion: 'v1.25.7+eab9cc9',
                  ocp: {
                    availableUpdates: ['4.12.11'],
                    channel: 'stable-4.12',
                    desired: {
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:87a270ba5dcbfc17a1f1789878bd82fe30b814a43be7e0982ad2df2967253724',
                      url: 'https://access.redhat.com/errata/RHBA-2023:1508',
                      version: '4.12.10',
                    },
                    desiredVersion: '4.12.10',
                    managedClusterClientConfig: {
                      caBundle:
                        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJUU9halVYNnhDM2t3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpNd05EQTJNVGt4T0RFeFdoY05Nek13TkRBek1Ua3hPREV4V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTDhPS0h0N2dvNUNXcU1yT0xvWlVGV1gwRlVZelRkbApoS2pPdGorcmh5Snh5WjJDSVdGU2xidWxYaWVFcnBpVGRuWmVYc1Aza1pVWHJvbzVodm5sYlZnRzhNZWtrcnNWClBsam5yWXhqOHJNZ29sYTJYcUlIVGRKWGVQNk41TUNoR3JEQzJVVUVqOFExUTFwKzhvSFUzOXRPVmEwalozSmsKU0QwdVZ0ZDl5eGtOTzhSdEVnUDEzaWU0aXdzRlJwNE16YVhPVHJEazB5YW1SaklJY3hDZ1lmK3BnU3NlL3cvWAowdHkwNkx6dDc5U0lFVlFpaHB3bXRySWI4U095d2kwNFpkb1hXeitpUjRyYkZqd3JjbWxCbnZ5T2RzNEUwNHBiCkdWWUN4QUxMWVRTOVlVVVBRMG4wM3p2RE5vZXIvS2xoS3E4V3llOExXVzFTdVJYYzVJTis4MGNDQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRktQNQoxanZ5M3Nha0lFQWZBNUVNa2MzY211T3VNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUFNU2xFeHlwdkdIQkVGCkhSNDhvc2ZBSmZncTVSNHA4bElZR2oxZytrQ1B4UW1LTDloSGUreURucnRCNnZMYkNhUkxjRWhIYjRBY1FMMXQKV2RjMkhkcGIwVHhKdXdFZ0ZEU0s2Y3B4bGVtUmZXNXdMMnl3amlhNVpLR01UcGhTLy92cVJrV1dyditXWmkregpvZlRZejd4U2NMd2tMYmhMVWtNYTJ1WkJpb3JnYk9oMEtPZ3JEQnlVdjFQSEFucGUrMS9mZ2p2RG5hK3FJWU5aCk91Z3QzOHN5WnhqeVpsakNua01GelJQTnlidXpUTTJWMDZESGliNGhueTR2UGNva1Yrb28zL1NEZm5OSGpxOHEKT2E5Z3lwVXBVWkdjcmsyN0g4eTE1SU5mZWxycWprSS93MHhSeWdOZzZCNkF6U2tNbFJlRld0UEFiaXNiWTA4WgpzaE9ITmxZKwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSVBINjd0YTU0dmVzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJek1EUXdOakU1TVRneE1Wb1hEVE16TURRd016RTVNVGd4TVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF2WHp3R1MyWVpqeWQKTTRiODVDYlRLRzJjVFF4N0FzTklSNllBc255Y1EzUmwyZFJXNXdqRzJXNWpOSGQzMW5DaFplV21EWmhOd2FGNQp0bit2eVp0TjJVNm9rYVV2TXBYd1lEYk1rdkwweXBRVDdsR2dhZUZxNnU5VGdpYXA2S1MxMHNTZmxJbWdPaGVIClZVUmNOOGp5OWUycnVzcDkyVnZHS09JZzJRKzhqVUM2UzJpRUF3QTBaL1RHTHZJcXREVDUvTm9hL01lYS9mL1cKU29jQnVlM1NIb0hGRU1GVGlLUHFhdzA4YkZUaVRRSFpTUlZ2MEh5WDF4bEtoc3N4TVJzQ1Zkb0p1dklLNUVibwpQMFZtRStzVUhOL2hCTFlCb1YvVERSeWQ5SXZaVGJXWC9nN2wxQUQxb0VYSU9MbEZiTVJML1RwbFg5RUVScjZUCmJXK0hmNGg3U1FJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVUhmZ2FibXZpZ3A2WG1mWXJGRHlZMGNQVlh6a3dEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUEwaDUxNHQ3ejd1UlZJUjcvMi9xM3ZVaWtkaDB2MFozeTYzL3JxdDBJbXJMdUVLN09KZWNkbHNid2RLCk1Kb3RUMDExMmtNUEFRZlNwZ2lHWGhVTzBpbHFHZnBWeWRlSHY5b2VRNXhjVXU4RHozMlBlVURjVXZ5THJUSEkKTGN6MnVPOFE5dHU4MmE2UzBxQ3pmUU1UdytnTW52NUxTVXNGdVBRRE1MQThnNy92ZDJ3WVF0SVZxT0srZExrNApxWTIrTUh3d1p4L0R4dWZTOEw0ZGd5UTI3NHVpclErajhmbnNXQ3VPR0o1UkdEMEx3NTUxZUtmeGhHTEVoUHVQCnJqQjFheW80aXJXVkYwQ0I2QTNYd3Urc3ZZa3hwYVMrdjlXSFZnNHFZbkdveDRMSkx4ekx6STU5TGhIb0FGbTAKTDBiY2FxN0ZCa3JkaEtlTmF2bi80SEpMcWRBPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSVRESEpTOUNNb3dBd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl6TURRd05qRTVNVGd4TVZvWERUTXpNRFF3TXpFNU1UZ3hNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQTBpNFJPK1k0Zmhpc3gzWDJQQlRpQmVpRFhXRVNNNlg2Y1BCVklDRU9aWEYxOTl3TmpCT1kxaU1TT3ZWbAo2b0V0aUV2N210RW41TUthZkluR0Y2aG9LdW5sWWZ1ZFZKdnp3YnpDckZZSkhsT3BHc0xsR0J5aEQ2NkJ4TUdnCkgvZGc5VkVzWFB5NlFndTFPZFl4TzhXbnlId0I0dWR3TUJXUnk2Vk5GRnRNMGowVEwrNGlxbUp2UXNlOUhpd2UKbWdEV01HL005TTJNaVJ5bzdFNGRhL3pSV1VrcGpSNG5DQlZYQWtGcXVpWStybnZ0dnUvdmx6UDU2UGhUMFk2RAptalpRK1hSdEtXMlZjZFJVVVlpbEZIWDVGeUtQQ0UxUitjem1qZU40SWJ1T3Y2cVl2NVBUNWN1cGJDek9wSUl1ClR0UEFVandKZW5TWldoM0xCS01nMTRtQ21RSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVsTlhERy9CNkhKemhqWkx1WDZaTERPQUtkYlV3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFJc1RmSFhTRUhEV2dBdmhVU0xpZmVWc09DOVlhRThKUWh4VW4veDZVdEFhCnN4RFNYb080Q0pmOGVhUGNCcno2SXVqWnd1V3ZQMHBwdGFlMGsyRisrbmZOYkh6aFBhLytHZmtjU1ppTis1eW8KVkVMT09zVFlmOCtnenl5U3VEdTNQdUdBMFN0b0ZSazJUOWpjYXhMQzdvdDdSRTBxQkgxaFNzR1RndnNLN0p2TwpxK20ydEtxUDZCNFRadW94WklSNU1UT2U4aG85QU00aFJ4MXlqMVFIVXBSaHZPUHZqR3VMZXBSdGNlTTRubmpLClJmNS9Nc2lSMmhaT1M1ZmhjV1RtN2FVeU4yWVAzWTJFOGlybElTenJuWURJOFJxbHJzZlVSTFpOY2dtTUNUd2oKS0lnWWYzbVVENlI3eG4ydzdPRGZkVnFtSFdFaFZWRzdUTVlyaS9SUXZLdz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUlYSFkzTUUzNkptMHdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4Tmpnd09EQTVNemM1TUI0WERUSXpNRFF3TmpFNU1qa3oKT0ZvWERUTXpNRFF3TXpFNU1qa3pPVm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOamd3T0RBNU16YzVNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQTFkemwKWklmRHZNWWtLOGlVOVpSMTZRZFQyUmpzM1hHWW5qc0FlYVNWNEJpaWtOdEJBWjdUVVo3OEZZcU9ISWlhOWxWZgptYk1DZHdwakJMUUNyT2lKSm1xTHNRMEZ1L3RDTGpjRE5oUDR5a0lseHp5YWlNRW1Idjc5WDl3ZEFaRDBqMEZ5CjJjdDNEbXpnS0RvVzlaYXFXdTFRWHMzNkRIa0FrOXRyZTRRSTZWcmVPRnhmaVJQakRHR3kyUFltM1BFVHR3L1MKNUhCTnViNWlQeXMwNGNqWGhCWDV4cEZGWEZkZFZSa3pmQ1lTWUhLVkJvM0lLZVVYRkcwQWFrK0xPc0VKaFdjRgpIbEgzTThyOER3YzNRbTBzdzY0bHZrUzBLbG9CQm9jWUM5VSttLzMrZ1BSMEZQNEZMSU1KTnA2akp6L1VYZzJMClo0VnMxekVUaHoyR3I2SElhUUlEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVN1VTK2JyY2pFd05QaHZuRld3enJOMTdIbFNzd0h3WURWUjBqQkJndwpGb0FVN1VTK2JyY2pFd05QaHZuRld3enJOMTdIbFNzd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFMMkc3OGg4CnZGcGlLZDljWXBxWHdjUHJaYjFQTG5HS21GelkwOHlmUitYWlVFY0JOWGROaUJsUXpibWJHWkw0b3JXZWgyMkEKbVVMWitZVG5XcGg4LzluREtPRkZTbDVhWGVKM2llaEFCcldUREZaMjRLdDVQQlhLdmZTSzJxaG51QjVLK3Y3TApnZDE1Q0ErZ1Exa09wTlEvbkNCVDNVSE5raWNDVVZRbVJDWE9SUlVGU0JnUzgvMmNOQXhxN1R1VVVYb2QrVktvCkRNcjlrZzA1eldwQlhveUpoYkE3dkFHSzQwa0xBZ3BwMjJjR29tOWJZTXVnYklNcGE2cytKcjFxd0pyb25qRHkKcVBrU0NlUVlKVlNaVjl5eitnTEZoUjk0VGpvWW12dTNjRUxOdFRkK0NQY0QxRks3QWFCcjZYL3g5NVRqMHZKVwprWXhvWGk5aUhydHJiZVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUR0ekNDQXArZ0F3SUJBZ0lJTHdyUmdSYjNwaXd3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qZ3dPREE1TkRVME1CNFhEVEl6TURRd05qRTVNekExTkZvWApEVEkxTURRd05URTVNekExTlZvd1N6RkpNRWNHQTFVRUF3eEFLaTVoY0hCekxtRndjQzFoZDNNdFkyVnVkSEpoCmJERXROREV5TFdoMVlpMXVObXQzWkM1a1pYWXhNUzV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXcKRFFZSktvWklodmNOQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQU1xMXV3SEJrWERTSmt0ajNqakdmZHd6Z1IwcApuNFhxNWg4MHkzVTNYeHdFWnVCaHdYYVU4bnd2Ym91SWFPZXM3OWJ0NHNSVHZ4d29KT2pOdXZMRG5XNWUyZU1ZCkh6UFl2L2tnVUJVeDQzcHVkakVvWXNDVHlVMDFrRmF1QXNiUUpJTWltamhsdGxYZVVDUkY2Z0hSL1UwZGx3dkMKckN2MC92UytFUGtJVE5YYzEvNlN4V2h5WUg0NXhiMk1lbVFvWEk4VkpHS25Yc2hSN3dpRDZSUFF1Kzd4RmZjbApPZ2loM2xtRFB1OXBxa0pMOFNzdU5jSUl0RkVvRS9RS1dIVVdrMmhEQXJXT2lwS0J4OW1hSHVNb3VSYkkrMi9BCkF6QUYxNk9BVDFZUTVQS09hSVU4bHpsQzVYbFIrR2R2d044V0VvTU1YeWNQSlo2bFQzSEhjSklQQ29rQ0F3RUEKQWFPQnd6Q0J3REFPQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRApWUjBUQVFIL0JBSXdBREFkQmdOVkhRNEVGZ1FVcVVmRlJ6V2JFYjZkTUxaOHc1cS9uQjBlaVNrd0h3WURWUjBqCkJCZ3dGb0FVQ2IvQ1k5dUo5TE51ZDlXa1RrV0RxaXRnbXN3d1N3WURWUjBSQkVRd1FvSkFLaTVoY0hCekxtRncKY0MxaGQzTXRZMlZ1ZEhKaGJERXROREV5TFdoMVlpMXVObXQzWkM1a1pYWXhNUzV5WldRdFkyaGxjM1JsY21acApaV3hrTG1OdmJUQU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUFrMGlDNit0Y01pZ3ViU2RyTzVCQkNEeFhrRHA2CjQ1a0Zlc21wZG1vbjJJM2FFNWZQTVgzK1hSVkpjTXRSTGt0YTc0YTZ5RVBVb3hqUmY1OVdvUXlnV1J6RndlWVEKeGI3YWttcnoyMTJKdWxRTDRhWC94TlRROXRzcytVa0xmMWhZQjNnYnF1YzVyV0RMT1k5bjdRazFqQWhUd3dZRAptKzVxS0IyekpFSFVyeURmQzVMQnFGaTVhSWtNZ1pjNEZxS1doTmJnKytxcjRjQkJyb1hLZENPWFkrV2RtY1ZzCkdJRWwwMkx2VmM1dSs1bW5mOVRLL291bkx3WGVTSUh2QmNtZE5XVmZtRGJEKzNOQ2hsSlhQcVZFSVpNRGJJMUcKZ1gwditqZXNEUXlEWi8wcVBCaytXV2FKaUdTUTNKaCtqMVR3SUFFWThOV21TcG9MS0NFSWtpa1ROZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJPREE0TURrME5UUXdIaGNOTWpNd05EQTJNVGt6TURVeldoY05NalV3TkRBMQpNVGt6TURVMFdqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyT0RBNE1EazBOVFF3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURNRlNYbzFXUkpRRitPbVVxNXRFYkUKeHM1enVPbEIwSUZPTmE1b1IwcEtvWXBsWGNBbTlsRnV6MFFEeFJQUm04SThnTWh5MWNjcG9zMXJVMUptalM5OApJNGxIQjJ2NzVzOU9EWUROa0VIRVNFU3J1ODdyc3V1M3NCdTdNTTFWblRMTXNXQmVlN0tiOUlqOG4wb2dZRklTCnUwYnZKRjg4QWxqdVVkd1pMWE9WbFBNQWIvbHZPSEw1VUlYNEJyREdxVkc5cnNGdjFXa0xCWW11c0dRVUxRRDYKeTY1aXQ4YXNxNHVoZ2lhbm92OHRmTHNTZWMxQ1EweEFhMkIyMXZhdEdhUWlCdjRzdkYyTmxrUjlpS3FrVnpJVQovNUZGNC9FYjg3dFVYb3lUTFpYMUU2TWU1ak1hSnVjQ2ljOWtCcnhETDZwRWt3SUFqNjJzWTUwN2sxQyszbmR0CkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlFKdjhKajI0bjBzMjUzMWFST1JZT3FLMkNhekRBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQpHSzg3cmR1bE92NDFMaCtYSlNoRUNTbDlXNE5Zbm9yYkk3TFNmbnJ2cmtGOVdHSU5MeUxWWjc0ekdsZkhCTmFoCklsemJSdSszZUcyRmQ1TFFkMUkxTXUzNGY0QkZxUlRUZVk3Nk1EbWV1U3RhdFU5d2pCaWpjQzkvZFZrVnFUVEMKRVJBbk5iYVBMR00wVTZPeGVDMW5WMjFHVUNMSnVkdTFtVVpUaHoyWEN5RkFaaEUwbU1abitqMisybVZKcURncQp4MGNQeG1MNEMyTURWa04wcmk5UWJ3TDl4Z1J5aGNqZzdJeFZkdUgvdDlLeGErbjl6UkV1bEtJY3g1cXpvQXVvCkxwOXU0MHhYNEhaRjVmdFZ4QnQ2UWJ6aHBZM1RqVjJTUkVoY2J6TThuZk5aczluaUYxdUFuS2NXeU4ybWltN0IKZ3VHaDVkUWxtZStMa21CNGtDYmtmdz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                      url: 'https://api.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com:6443',
                    },
                    version: '4.12.10',
                    versionAvailableUpdates: [
                      {
                        channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:3d8d8786a604ec28e10a887f7403c9ac4f7743bc4672a6052040ecada1111143',
                        url: 'https://access.redhat.com/errata/RHBA-2023:1645',
                        version: '4.12.11',
                      },
                    ],
                    versionHistory: [
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:87a270ba5dcbfc17a1f1789878bd82fe30b814a43be7e0982ad2df2967253724',
                        state: 'Completed',
                        verified: false,
                        version: '4.12.10',
                      },
                    ],
                  },
                  displayVersion: 'OpenShift 4.12.10',
                  isManagedOpenShift: false,
                  upgradeInfo: {
                    isUpgrading: false,
                    isReadyUpdates: true,
                    upgradePercentage: '',
                    upgradeFailed: false,
                    hooksInProgress: false,
                    hookFailed: false,
                    latestJob: {
                      conditionMessage: '',
                      step: 'prehook-ansiblejob',
                    },
                    currentVersion: '4.12.10',
                    desiredVersion: '4.12.10',
                    isReadySelectChannels: false,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    currentChannel: 'stable-4.12',
                    desiredChannel: 'stable-4.12',
                    availableUpdates: ['4.12.11'],
                    availableChannels: [],
                    prehooks: {
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                      failed: false,
                    },
                    posthooks: {
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                      failed: false,
                    },
                    posthookDidNotRun: false,
                  },
                },
                acmDistribution: {},
                addons: {
                  addonList: [
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-07T21:42:33Z',
                        generation: 1,
                        name: 'application-manager',
                        namespace: 'local-cluster',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'application-manager',
                            uid: 'b6533750-b9d1-42ef-8979-e140b3e0ef04',
                          },
                        ],
                        resourceVersion: '4779332',
                        uid: '7e4bfc53-bfd9-433b-b810-d2242334604c',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-19T14:28:41Z',
                            message: 'application-manager add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:45:03Z',
                            message: 'the supported config resources are required in ClusterManagementAddon',
                            reason: 'ConfigurationUnsupported',
                            status: 'True',
                            type: 'UnsupportedConfiguration',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:45:04Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:45:04Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:45:04Z',
                            message:
                              'client certificate rotated starting from 2023-04-07 21:40:04 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                        ],
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
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-07T21:42:33Z',
                        generation: 1,
                        name: 'cert-policy-controller',
                        namespace: 'local-cluster',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'cert-policy-controller',
                            uid: '99fc3fe7-7fbd-44d9-b830-7987d3789f9e',
                          },
                        ],
                        resourceVersion: '4779336',
                        uid: 'a8c50cf7-6677-47a9-9984-4674e227869e',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-18T13:58:06Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:37Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:45Z',
                            message:
                              'client certificate rotated starting from 2023-04-07 21:37:42 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-19T14:28:41Z',
                            message: 'cert-policy-controller add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
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
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'cert-policy-controller',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-07T21:42:28Z',
                        generation: 1,
                        name: 'cluster-proxy',
                        namespace: 'local-cluster',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'cluster-proxy',
                            uid: 'c5686ad1-fa57-4d28-97ca-294171aac832',
                          },
                        ],
                        resourceVersion: '4779339',
                        uid: 'a2589a4a-e84f-4084-a1fb-19434c3dc237',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-18T13:58:07Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:29Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:45Z',
                            message:
                              'client certificate rotated starting from 2023-04-07 21:42:42 +0000 UTC to 2023-10-04 21:42:42 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-19T14:28:41Z',
                            message: 'cluster-proxy add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        configReferences: [
                          {
                            group: 'proxy.open-cluster-management.io',
                            lastObservedGeneration: 1,
                            name: 'cluster-proxy',
                            resource: 'managedproxyconfigurations',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
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
                              user: 'open-cluster-management:cluster-proxy:proxy-agent',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'cluster-proxy',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-07T21:42:33Z',
                        finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
                        generation: 1,
                        name: 'config-policy-controller',
                        namespace: 'local-cluster',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'config-policy-controller',
                            uid: '4243d85e-49d2-48c5-ba27-5da79193db19',
                          },
                        ],
                        resourceVersion: '4779342',
                        uid: '396f60af-b1d6-4849-ac2c-0e9156e4626f',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-18T13:58:07Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:36Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:45Z',
                            message:
                              'client certificate rotated starting from 2023-04-07 21:37:42 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-19T14:28:41Z',
                            message: 'config-policy-controller add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
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
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'config-policy-controller',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-07T21:42:33Z',
                        generation: 1,
                        name: 'governance-policy-framework',
                        namespace: 'local-cluster',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'governance-policy-framework',
                            uid: '520c777a-f958-492d-9d41-15adce0265af',
                          },
                        ],
                        resourceVersion: '4779360',
                        uid: '99be6f90-338f-4af7-bc94-749d7e8a9719',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-18T13:58:05Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:37Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:46Z',
                            message:
                              'client certificate rotated starting from 2023-04-07 21:37:43 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-19T14:28:41Z',
                            message: 'governance-policy-framework add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
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
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'governance-policy-framework',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-07T21:42:33Z',
                        generation: 1,
                        name: 'iam-policy-controller',
                        namespace: 'local-cluster',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'iam-policy-controller',
                            uid: 'e39d7cdc-0278-4ccd-be58-ab07c58e95e4',
                          },
                        ],
                        resourceVersion: '4779387',
                        uid: '74728049-6956-446e-bf98-551afbaaf79e',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-18T13:58:06Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:37Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:46Z',
                            message:
                              'client certificate rotated starting from 2023-04-07 21:37:43 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-19T14:28:42Z',
                            message: 'iam-policy-controller add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
                        registrations: [
                          {
                            signerName: 'kubernetes.io/kube-apiserver-client',
                            subject: {
                              groups: [
                                'system:open-cluster-management:cluster:local-cluster:addon:iam-policy-controller',
                                'system:open-cluster-management:addon:iam-policy-controller',
                                'system:authenticated',
                              ],
                              user: 'system:open-cluster-management:cluster:local-cluster:addon:iam-policy-controller:agent:iam-policy-controller',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'iam-policy-controller',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-07T21:42:28Z',
                        generation: 1,
                        name: 'work-manager',
                        namespace: 'local-cluster',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'work-manager',
                            uid: 'd762a91b-93a6-4301-a891-82c76343da6a',
                          },
                        ],
                        resourceVersion: '4779325',
                        uid: '778833e0-3190-4226-9a9b-07e8fb738622',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-12T13:15:14Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:28Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-07T21:42:45Z',
                            message:
                              'client certificate rotated starting from 2023-04-07 21:37:43 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-19T14:28:41Z',
                            message: 'work-manager add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
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
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'work-manager',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-18T19:30:26Z',
                        finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
                        generation: 1,
                        labels: {
                          'backplaneconfig.name': 'multiclusterengine',
                        },
                        name: 'hypershift-addon',
                        namespace: 'local-cluster',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'hypershift-addon',
                            uid: 'd6811769-4855-4626-8eab-610f15a176a8',
                          },
                        ],
                        resourceVersion: '5493621',
                        uid: '5d455896-65bf-4a59-be02-eab1dfaf188b',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-19T14:28:42Z',
                            message: 'hypershift-addon add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                          {
                            lastTransitionTime: '2023-04-19T14:25:35Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-18T19:30:33Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-18T19:30:34Z',
                            message:
                              'client certificate rotated starting from 2023-04-20 13:21:42 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-20T13:25:45Z',
                            message: 'Hypershift is deployed on managed cluster.',
                            reason: 'HypershiftDeployed',
                            status: 'False',
                            type: 'Degraded',
                          },
                        ],
                        configReferences: [
                          {
                            group: 'addon.open-cluster-management.io',
                            lastObservedGeneration: 1,
                            name: 'hypershift-addon-deploy-config',
                            namespace: 'multicluster-engine',
                            resource: 'addondeploymentconfigs',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
                        registrations: [
                          {
                            signerName: 'kubernetes.io/kube-apiserver-client',
                            subject: {
                              groups: [
                                'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon',
                                'system:open-cluster-management:addon:hypershift-addon',
                                'system:authenticated',
                              ],
                              user: 'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon:agent:d2475',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'hypershift-addon',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                  ],
                  available: 8,
                  progressing: 0,
                  degraded: 0,
                  unknown: 0,
                },
                labels: {
                  cloud: 'Amazon',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  clusterID: 'ed841d92-934c-4a8e-8df7-3265bc16da1b',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                  'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  'local-cluster': 'true',
                  name: 'local-cluster',
                  openshiftVersion: '4.12.10',
                  'openshiftVersion-major': '4',
                  'openshiftVersion-major-minor': '4.12',
                  'velero.io/exclude-from-backup': 'true',
                  vendor: 'OpenShift',
                },
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16100736Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 'm5.xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'ca-central-1',
                        'failure-domain.beta.kubernetes.io/zone': 'ca-central-1a',
                        'node-role.kubernetes.io/control-plane': '',
                        'node-role.kubernetes.io/master': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                      },
                      name: 'ip-10-0-139-143.ca-central-1.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16100728Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 'm5.xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'ca-central-1',
                        'failure-domain.beta.kubernetes.io/zone': 'ca-central-1a',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                      },
                      name: 'ip-10-0-155-51.ca-central-1.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16100736Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 'm5.xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'ca-central-1',
                        'failure-domain.beta.kubernetes.io/zone': 'ca-central-1b',
                        'node-role.kubernetes.io/control-plane': '',
                        'node-role.kubernetes.io/master': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                      },
                      name: 'ip-10-0-185-80.ca-central-1.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16100736Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 'm5.xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'ca-central-1',
                        'failure-domain.beta.kubernetes.io/zone': 'ca-central-1b',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                      },
                      name: 'ip-10-0-189-5.ca-central-1.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16100736Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 'm5.xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'ca-central-1',
                        'failure-domain.beta.kubernetes.io/zone': 'ca-central-1d',
                        'node-role.kubernetes.io/control-plane': '',
                        'node-role.kubernetes.io/master': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                      },
                      name: 'ip-10-0-193-249.ca-central-1.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16100736Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 'm5.xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'ca-central-1',
                        'failure-domain.beta.kubernetes.io/zone': 'ca-central-1d',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                      },
                      name: 'ip-10-0-201-67.ca-central-1.compute.internal',
                    },
                  ],
                  ready: 6,
                  unhealthy: 0,
                  unknown: 0,
                },
                kubeApiServer: 'https://api.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com:6443',
                consoleURL:
                  'https://console-openshift-console.apps.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com',
                isHive: false,
                isHypershift: false,
                isManaged: true,
                isCurator: false,
                isHostedCluster: false,
                isSNOCluster: false,
                isRegionalHubCluster: false,
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                clusterSet: 'default',
                owner: {},
                creationTimestamp: '2023-04-07T21:42:28Z',
              },
              {
                name: 'feng-kind',
                displayName: 'feng-kind',
                namespace: 'feng-kind',
                uid: 'c5933bcd-b6b2-4f7a-b59c-046584d128f4',
                status: 'ready',
                provider: 'other',
                distribution: {
                  k8sVersion: 'v1.20.2',
                  ocp: {
                    desired: {
                      image: '',
                      version: '',
                    },
                    managedClusterClientConfig: {
                      url: '',
                    },
                  },
                  displayVersion: 'v1.20.2',
                  isManagedOpenShift: false,
                  upgradeInfo: {
                    isUpgrading: false,
                    isReadyUpdates: false,
                    upgradePercentage: '',
                    upgradeFailed: false,
                    hooksInProgress: false,
                    hookFailed: false,
                    latestJob: {
                      conditionMessage: '',
                      step: 'prehook-ansiblejob',
                    },
                    desiredVersion: '',
                    isReadySelectChannels: false,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    availableUpdates: [],
                    availableChannels: [],
                    prehooks: {
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                      failed: false,
                    },
                    posthooks: {
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                      failed: false,
                    },
                    posthookDidNotRun: false,
                  },
                },
                acmDistribution: {},
                addons: {
                  addonList: [
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-20T18:15:51Z',
                        generation: 1,
                        name: 'work-manager',
                        namespace: 'feng-kind',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'work-manager',
                            uid: 'd762a91b-93a6-4301-a891-82c76343da6a',
                          },
                        ],
                        resourceVersion: '5895277',
                        uid: 'd5bbb033-1e34-4f3d-aea4-edadf1ad1ebe',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-20T18:15:51Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:19:06Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:18:46Z',
                            message:
                              'client certificate rotated starting from 2023-04-20 18:13:42 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:20:20Z',
                            message: 'work-manager add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
                        registrations: [
                          {
                            signerName: 'kubernetes.io/kube-apiserver-client',
                            subject: {
                              groups: [
                                'system:open-cluster-management:cluster:feng-kind:addon:work-manager',
                                'system:open-cluster-management:addon:work-manager',
                                'system:authenticated',
                              ],
                              user: 'system:open-cluster-management:cluster:feng-kind:addon:work-manager:agent:work-manager',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'work-manager',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-20T18:15:51Z',
                        generation: 1,
                        name: 'cluster-proxy',
                        namespace: 'feng-kind',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'cluster-proxy',
                            uid: 'c5686ad1-fa57-4d28-97ca-294171aac832',
                          },
                        ],
                        resourceVersion: '5895284',
                        uid: 'b4cb7782-91ac-4ea9-a58c-8ab96a82b128',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-20T18:19:02Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:15:52Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:18:45Z',
                            message:
                              'client certificate rotated starting from 2023-04-20 18:18:41 +0000 UTC to 2023-10-17 18:18:41 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:20:20Z',
                            message: 'cluster-proxy add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        configReferences: [
                          {
                            group: 'proxy.open-cluster-management.io',
                            lastObservedGeneration: 1,
                            name: 'cluster-proxy',
                            resource: 'managedproxyconfigurations',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
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
                              user: 'open-cluster-management:cluster-proxy:proxy-agent',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'cluster-proxy',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-20T18:15:51Z',
                        generation: 1,
                        name: 'iam-policy-controller',
                        namespace: 'feng-kind',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'iam-policy-controller',
                            uid: 'e39d7cdc-0278-4ccd-be58-ab07c58e95e4',
                          },
                        ],
                        resourceVersion: '5893899',
                        uid: 'eee712f1-632d-4e11-a403-95c0bfd565ee',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-20T18:19:02Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:15:54Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:18:45Z',
                            message:
                              'client certificate rotated starting from 2023-04-20 18:13:41 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:19:20Z',
                            message: 'iam-policy-controller add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
                        registrations: [
                          {
                            signerName: 'kubernetes.io/kube-apiserver-client',
                            subject: {
                              groups: [
                                'system:open-cluster-management:cluster:feng-kind:addon:iam-policy-controller',
                                'system:open-cluster-management:addon:iam-policy-controller',
                                'system:authenticated',
                              ],
                              user: 'system:open-cluster-management:cluster:feng-kind:addon:iam-policy-controller:agent:iam-policy-controller',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'iam-policy-controller',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-20T18:15:51Z',
                        generation: 1,
                        name: 'governance-policy-framework',
                        namespace: 'feng-kind',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'governance-policy-framework',
                            uid: '520c777a-f958-492d-9d41-15adce0265af',
                          },
                        ],
                        resourceVersion: '5893913',
                        uid: 'd6a422b8-88ce-471a-a6eb-192e9be8281a',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-20T18:19:05Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:15:53Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:18:46Z',
                            message:
                              'client certificate rotated starting from 2023-04-20 18:13:43 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:19:21Z',
                            message: 'governance-policy-framework add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
                        registrations: [
                          {
                            signerName: 'kubernetes.io/kube-apiserver-client',
                            subject: {
                              groups: [
                                'system:open-cluster-management:cluster:feng-kind:addon:governance-policy-framework',
                                'system:open-cluster-management:addon:governance-policy-framework',
                                'system:authenticated',
                              ],
                              user: 'system:open-cluster-management:cluster:feng-kind:addon:governance-policy-framework:agent:governance-policy-framework',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'governance-policy-framework',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-20T18:15:51Z',
                        generation: 1,
                        name: 'search-collector',
                        namespace: 'feng-kind',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'search-collector',
                            uid: '1e009358-5276-4587-bd90-1584a1f15e22',
                          },
                        ],
                        resourceVersion: '5894572',
                        uid: 'eadf93e1-e5d0-4766-a85d-3de0b7a63a73',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-20T18:15:51Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:19:07Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:18:45Z',
                            message:
                              'client certificate rotated starting from 2023-04-20 18:13:42 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:19:50Z',
                            message: 'search-collector add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        configReferences: [
                          {
                            group: 'addon.open-cluster-management.io',
                            lastObservedGeneration: 1,
                            name: 'search-collector',
                            namespace: 'open-cluster-management',
                            resource: 'addondeploymentconfigs',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
                        registrations: [
                          {
                            signerName: 'kubernetes.io/kube-apiserver-client',
                            subject: {
                              groups: [
                                'system:open-cluster-management:cluster:feng-kind:addon:search-collector',
                                'system:open-cluster-management:addon:search-collector',
                                'system:authenticated',
                              ],
                              user: 'system:open-cluster-management:cluster:feng-kind:addon:search-collector:agent:search-collector',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'search-collector',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-20T18:15:51Z',
                        finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
                        generation: 1,
                        name: 'application-manager',
                        namespace: 'feng-kind',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'application-manager',
                            uid: 'b6533750-b9d1-42ef-8979-e140b3e0ef04',
                          },
                        ],
                        resourceVersion: '5894576',
                        uid: '09bb6074-1b02-4f91-a4f0-f3ea8d3db9b1',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-20T18:19:04Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:15:51Z',
                            message: 'the supported config resources are required in ClusterManagementAddon',
                            reason: 'ConfigurationUnsupported',
                            status: 'True',
                            type: 'UnsupportedConfiguration',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:15:51Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:18:46Z',
                            message:
                              'client certificate rotated starting from 2023-04-20 18:13:42 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:19:50Z',
                            message: 'application-manager add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        registrations: [
                          {
                            signerName: 'kubernetes.io/kube-apiserver-client',
                            subject: {
                              groups: [
                                'system:open-cluster-management:cluster:feng-kind:addon:application-manager',
                                'system:open-cluster-management:addon:application-manager',
                                'system:authenticated',
                              ],
                              user: 'system:open-cluster-management:cluster:feng-kind:addon:application-manager:agent:application-manager',
                            },
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-20T18:15:51Z',
                        finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
                        generation: 1,
                        name: 'config-policy-controller',
                        namespace: 'feng-kind',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'config-policy-controller',
                            uid: '4243d85e-49d2-48c5-ba27-5da79193db19',
                          },
                        ],
                        resourceVersion: '5894585',
                        uid: 'd572c0cf-1f30-4f01-90ce-301a8750e20f',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-20T18:19:05Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:15:53Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:18:46Z',
                            message:
                              'client certificate rotated starting from 2023-04-20 18:13:42 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:19:50Z',
                            message: 'config-policy-controller add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
                        registrations: [
                          {
                            signerName: 'kubernetes.io/kube-apiserver-client',
                            subject: {
                              groups: [
                                'system:open-cluster-management:cluster:feng-kind:addon:config-policy-controller',
                                'system:open-cluster-management:addon:config-policy-controller',
                                'system:authenticated',
                              ],
                              user: 'system:open-cluster-management:cluster:feng-kind:addon:config-policy-controller:agent:config-policy-controller',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'config-policy-controller',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2023-04-20T18:15:51Z',
                        generation: 1,
                        name: 'cert-policy-controller',
                        namespace: 'feng-kind',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'cert-policy-controller',
                            uid: '99fc3fe7-7fbd-44d9-b830-7987d3789f9e',
                          },
                        ],
                        resourceVersion: '5895288',
                        uid: 'b974c813-48fa-469d-8922-a9c53f0fc0dd',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2023-04-20T18:19:08Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:15:53Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'RegistrationConfigured',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:18:45Z',
                            message:
                              'client certificate rotated starting from 2023-04-20 18:13:42 +0000 UTC to 2023-05-07 20:48:59 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2023-04-20T18:20:20Z',
                            message: 'cert-policy-controller add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                        ],
                        healthCheck: {
                          mode: 'Lease',
                        },
                        registrations: [
                          {
                            signerName: 'kubernetes.io/kube-apiserver-client',
                            subject: {
                              groups: [
                                'system:open-cluster-management:cluster:feng-kind:addon:cert-policy-controller',
                                'system:open-cluster-management:addon:cert-policy-controller',
                                'system:authenticated',
                              ],
                              user: 'system:open-cluster-management:cluster:feng-kind:addon:cert-policy-controller:agent:cert-policy-controller',
                            },
                          },
                        ],
                        relatedObjects: [
                          {
                            group: 'addon.open-cluster-management.io',
                            name: 'cert-policy-controller',
                            resource: 'clustermanagementaddons',
                          },
                        ],
                      },
                    },
                  ],
                  available: 8,
                  progressing: 0,
                  degraded: 0,
                  unknown: 0,
                },
                labels: {
                  cloud: 'Other',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-search-collector': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  name: 'feng-kind',
                  vendor: 'Other',
                },
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '8',
                        memory: '3065628Ki',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'node-role.kubernetes.io/control-plane': '',
                        'node-role.kubernetes.io/master': '',
                      },
                      name: 'kind-control-plane',
                    },
                  ],
                  ready: 1,
                  unhealthy: 0,
                  unknown: 0,
                },
                isHive: false,
                isHypershift: false,
                isManaged: true,
                isCurator: false,
                isHostedCluster: false,
                isSNOCluster: false,
                isRegionalHubCluster: false,
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                clusterSet: 'default',
                owner: {},
                creationTimestamp: '2023-04-20T18:15:51Z',
              },
            ],
            sortedClusterNames: ['feng-kind', 'local-cluster'],
            appClusters: [],
            searchClusters: [
              {
                HubAcceptedManagedCluster: 'True',
                ManagedClusterConditionAvailable: 'True',
                ManagedClusterImportSucceeded: 'True',
                ManagedClusterJoined: 'True',
                _hubClusterResource: 'true',
                _uid: 'cluster__feng-kind',
                addon:
                  'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=true; observability-controller=false; search-collector=true; work-manager=true',
                apigroup: 'internal.open-cluster-management.io',
                cluster: 'feng-kind',
                consoleURL: '',
                cpu: '8',
                created: '2023-04-20T18:15:51Z',
                kind: 'Cluster',
                kind_plural: 'managedclusterinfos',
                kubernetesVersion: 'v1.20.2',
                label:
                  'cloud=Other; cluster.open-cluster-management.io/clusterset=default; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-search-collector=available; feature.open-cluster-management.io/addon-work-manager=available; name=feng-kind; vendor=Other',
                memory: '3065628Ki',
                name: 'feng-kind',
                nodes: '1',
              },
              {
                HubAcceptedManagedCluster: 'True',
                ManagedClusterConditionAvailable: 'True',
                ManagedClusterImportSucceeded: 'True',
                ManagedClusterJoined: 'True',
                _hubClusterResource: 'true',
                _uid: 'cluster__local-cluster',
                addon:
                  'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=true; observability-controller=false; search-collector=false; work-manager=true',
                apigroup: 'internal.open-cluster-management.io',
                cluster: 'local-cluster',
                consoleURL:
                  'https://console-openshift-console.apps.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com',
                cpu: '24',
                created: '2023-04-07T21:42:28Z',
                kind: 'Cluster',
                kind_plural: 'managedclusterinfos',
                kubernetesVersion: 'v1.25.7+eab9cc9',
                label:
                  'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=ed841d92-934c-4a8e-8df7-3265bc16da1b; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.12.10; openshiftVersion-major=4; openshiftVersion-major-minor=4.12; velero.io/exclude-from-backup=true; vendor=OpenShift',
                memory: '96604408Ki',
                name: 'local-cluster',
                nodes: '6',
              },
            ],
            pulse: 'green',
            shapeType: 'cluster',
          },
        },
        clustersNames: ['feng-kind', 'local-cluster'],
        resourceCount: 0,
        searchClusters: [
          {
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _hubClusterResource: 'true',
            _uid: 'cluster__feng-kind',
            addon:
              'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=true; observability-controller=false; search-collector=true; work-manager=true',
            apigroup: 'internal.open-cluster-management.io',
            cluster: 'feng-kind',
            consoleURL: '',
            cpu: '8',
            created: '2023-04-20T18:15:51Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.20.2',
            label:
              'cloud=Other; cluster.open-cluster-management.io/clusterset=default; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-search-collector=available; feature.open-cluster-management.io/addon-work-manager=available; name=feng-kind; vendor=Other',
            memory: '3065628Ki',
            name: 'feng-kind',
            nodes: '1',
          },
          {
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _hubClusterResource: 'true',
            _uid: 'cluster__local-cluster',
            addon:
              'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=true; observability-controller=false; search-collector=false; work-manager=true',
            apigroup: 'internal.open-cluster-management.io',
            cluster: 'local-cluster',
            consoleURL:
              'https://console-openshift-console.apps.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com',
            cpu: '24',
            created: '2023-04-07T21:42:28Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.25.7+eab9cc9',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=ed841d92-934c-4a8e-8df7-3265bc16da1b; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.12.10; openshiftVersion-major=4; openshiftVersion-major-minor=4.12; velero.io/exclude-from-backup=true; vendor=OpenShift',
            memory: '96604408Ki',
            name: 'local-cluster',
            nodes: '6',
          },
        ],
        secretModel: {
          'foo-feng-kind-feng-secret': [
            {
              _clusterNamespace: 'feng-kind',
              _hostingSubscription: 'feng-secret/feng-secret-subscription-1',
              _uid: 'feng-kind/5c4b9729-9818-4892-89e4-bdf5fc84c38a',
              apiversion: 'v1',
              cluster: 'feng-kind',
              created: '2023-04-20T18:19:31Z',
              kind: 'Secret',
              kind_plural: 'secrets',
              label:
                'app=feng-secret; app.kubernetes.io/part-of=feng-secret; apps.open-cluster-management.io/reconcile-rate=medium',
              name: 'foo',
              namespace: 'feng-secret',
              resStatus: 'deployed',
              pulse: 'green',
            },
          ],
        },
        pulse: 'green',
        shapeType: 'secret',
      },
      cluster: 'feng-kind',
    }
    const { getByText } = await renderYAMLContainer(node, t)
    expect(
      getByText(
        /viewing secrets is not allowed for security reasons\. to view this secret, you must access it from the cluster directly\./i
      )
    ).toBeTruthy()
  })
})
