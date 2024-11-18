// Copyright Contributors to the Open Cluster Management project

import i18n, { TFunction } from 'i18next'
import { LogsContainer } from './LogsContainer'
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../../resources'
import { managedClustersState } from '../../../../../atoms'
import { nockGet } from '../../../../../lib/nock-util'

const t = i18n.t.bind(i18n)

const hubCluster: ManagedCluster = {
  kind: ManagedClusterKind,
  apiVersion: ManagedClusterApiVersion,
  metadata: {
    name: 'local-cluster',
    namespace: 'local-cluster',
    labels: {
      'local-cluster': 'true',
    },
  },
}

const mockClusters = [hubCluster]

const mockPod: any = {
  apiVersion: 'v1',
  kind: 'pods',
  metadata: {
    namespace: 'feng-hello',
    name: 'helloworld-app-deploy-6969476b9f-z7cpr',
  },
}

describe('YAML Container test', () => {
  beforeEach(async () => {
    nockGet(mockPod)
  })
  const renderLogsContainer = async (node: any, t: TFunction, renderResourceURLLink: any) => {
    const retResource = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, mockClusters)
        }}
      >
        <LogsContainer node={node} t={t} renderResourceURLLink={renderResourceURLLink} />
      </RecoilRoot>
    )

    return retResource
  }

  it('should render LogsContainer', async () => {
    const node = {
      name: 'helloworld-app-deploy',
      namespace: 'feng-hello',
      type: 'pod',
      id: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      uid: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      specs: {
        isDesign: false,
        resourceCount: 1,
        clustersNames: ['local-cluster'],
        replicaCount: '1',
        parent: {
          parentId:
            'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
          parentName: 'helloworld-app-deploy',
          parentType: 'replicaset',
          parentSpecs: {
            title: '',
            subscription: {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/cluster-admin': 'true',
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': '714d7bf955b0b47eaf52fc942cb1b2dfec2a2322',
                  'apps.open-cluster-management.io/git-path': 'helloworld',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2024-11-17T21:52:18Z',
                generation: 1,
                labels: {
                  app: 'feng-hello',
                  'app.kubernetes.io/part-of': 'feng-hello',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-hello-subscription-1',
                namespace: 'feng-hello',
                resourceVersion: '20332260',
                uid: '0784b94b-ddb6-4234-bc1b-d07d641d7a0c',
              },
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'Placement',
                    name: 'feng-hello-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2024-11-18T14:25:27Z',
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
                    creationTimestamp: '2024-11-17T21:52:18Z',
                    generation: 1,
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                    resourceVersion: '20248119',
                    uid: 'c2252315-eb7f-4860-b7a5-0f96996cca18',
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
                    creationTimestamp: '2024-11-17T21:52:18Z',
                    generation: 1,
                    labels: {
                      'cluster.open-cluster-management.io/decision-group-index': '0',
                      'cluster.open-cluster-management.io/decision-group-name': '',
                      'cluster.open-cluster-management.io/placement': 'feng-hello-placement-1',
                    },
                    name: 'feng-hello-placement-1-decision-1',
                    namespace: 'feng-hello',
                    ownerReferences: [
                      {
                        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                        blockOwnerDeletion: true,
                        controller: true,
                        kind: 'Placement',
                        name: 'feng-hello-placement-1',
                        uid: '4706f964-ed70-4e26-a589-1fa600f3f9b3',
                      },
                    ],
                    resourceVersion: '20248139',
                    uid: '9a9492e2-3b56-43df-8b6a-ea3bf180e613',
                  },
                  status: {
                    decisions: [
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
                    creationTimestamp: '2024-11-17T21:52:18Z',
                    generation: 1,
                    labels: {
                      app: 'feng-hello',
                    },
                    name: 'feng-hello-placement-1',
                    namespace: 'feng-hello',
                    resourceVersion: '20248140',
                    uid: '4706f964-ed70-4e26-a589-1fa600f3f9b3',
                  },
                  spec: {
                    clusterSets: ['default'],
                    predicates: [
                      {
                        requiredClusterSelector: {
                          labelSelector: {
                            matchExpressions: [
                              {
                                key: 'local-cluster',
                                operator: 'In',
                                values: ['true'],
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                  status: {
                    conditions: [
                      {
                        lastTransitionTime: '2024-11-17T21:52:18Z',
                        message: 'Placement configurations check pass',
                        reason: 'Succeedconfigured',
                        status: 'False',
                        type: 'PlacementMisconfigured',
                      },
                      {
                        lastTransitionTime: '2024-11-17T21:52:19Z',
                        message: 'All cluster decisions scheduled',
                        reason: 'AllDecisionsScheduled',
                        status: 'True',
                        type: 'PlacementSatisfied',
                      },
                    ],
                    decisionGroups: [
                      {
                        clusterCount: 1,
                        decisionGroupIndex: 0,
                        decisionGroupName: '',
                        decisions: ['feng-hello-placement-1-decision-1'],
                      },
                    ],
                    numberOfSelectedClusters: 1,
                  },
                },
              ],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2024-11-17T21:52:19Z',
                  generation: 7,
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'feng-hello.feng-hello-subscription-1',
                  },
                  name: 'feng-hello-subscription-1',
                  namespace: 'feng-hello',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'feng-hello-subscription-1',
                      uid: '0784b94b-ddb6-4234-bc1b-d07d641d7a0c',
                    },
                  ],
                  resourceVersion: '20332491',
                  uid: 'e72fc8f5-124a-4989-a338-23cfc5c36cab',
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'apps/v1',
                    kind: 'Deployment',
                    name: 'helloworld-app-deploy',
                    namespace: 'feng-hello',
                  },
                  {
                    apiVersion: 'route.openshift.io/v1',
                    kind: 'Route',
                    name: 'helloworld-app-route',
                    namespace: 'feng-hello',
                  },
                  {
                    apiVersion: 'v1',
                    kind: 'Service',
                    name: 'helloworld-app-svc',
                    namespace: 'feng-hello',
                  },
                ],
                results: [
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
                  clusters: '1',
                  deployed: '1',
                  failed: '0',
                  inProgress: '0',
                  propagationFailed: '0',
                },
              },
            },
            resourceCount: 1,
            clustersNames: ['local-cluster'],
            clusters: [
              {
                name: 'local-cluster',
                displayName: 'local-cluster',
                namespace: 'local-cluster',
                uid: '773bc5f7-0ef8-4cd1-97e4-aaa2e5fa99e7',
                status: 'ready',
                provider: 'aws',
                distribution: {
                  k8sVersion: 'v1.29.9+5865c5b',
                  ocp: {
                    availableUpdates: ['4.16.21', '4.16.23', '4.17.4', '4.17.5'],
                    channel: 'candidate-4.17',
                    desired: {
                      channels: [
                        'candidate-4.16',
                        'candidate-4.17',
                        'eus-4.16',
                        'fast-4.16',
                        'fast-4.17',
                        'stable-4.16',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:cce4ab8f53523c13c3b4f3549b85e512398aa40d202a55908de31a9b8bf6a2cb',
                      url: 'https://access.redhat.com/errata/RHSA-2024:8683',
                      version: '4.16.20',
                    },
                    desiredVersion: '4.16.20',
                    lastAppliedAPIServerURL: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
                    managedClusterClientConfig: {
                      caBundle:
                        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJRDBLWk0vMzFTY013RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpRd09USXpNVGt3TWpFMFdoY05NelF3T1RJeE1Ua3dNakUwV2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTXJDZkZtS2p2Ri9tcUY4TTNpSTc5N1lXLzNqa0t5KwpvSkRYTkV4ZHRtbjZ3Q2xNbUxYcDd6amVCZ2VmWE5ZUXN4LzNCcG5FcnNiVG90RW1FMWJLaHJZQjRnc3dsUG8xCk5Ha015QlVZTFNoTGszSkdqemMxczBqUm1qU1pVMTlyd3dqN1RpZU5qb1BhZlcrNXk4QzM1aFR3dEJZeVB4dzYKQ1cxVmRvUUljVFNVOWRPUUxRS1VIb2RhN2JSSUZNeFRCOG1NUDZQWDhLeG5GYXpaWHIrR3hBQzdvZFlIdmcxRgpLM1RnbitHWTVsSnNCNGd4ME5RN0VnSnJ5YWRBWWgzSUpHMC9heks4VUNkSlJ5NjNNOXJndTdocDMxQ3JDNWYyCms5b1V6U09yY1ZnY1FaeFMrUFVjK3B3c0hQS3FIOVJ2VVFmd3lIZmZBT2ozQ0xsSEZpVWFZazhDQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRklRdwpSV25xcnBYYUU0dzByVDR2SlowbGxVRWFNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUF0VC93S1Zpek0yTTZQCkY1OGI5Vk0rN0FQeHhHU1dVb1gxWjVqTDdmVWIxREtIS0xxczNJQlpwRlVYYTRUM0ErUy9yNDZDY3QrWjJmNUUKRU84ODBEZDhTUlpieFE0emlZN0JaN2dmQXYyeENaS2sxWm04ZFhSWlpoelBtWGhocWxFeFhTMDhTMk9maWI5YQpkZGd4S3BKclpZS3QveC90Yk9hUHhveGxwYmxyV21kbEpiLzdKdHJtZHhWN3Q0WE1GNlpvUGNwYkE2SlEwcWhnCjlUcGpvdGJRazRYa2dpczFLK2pPRXFaT0I3emc2Y2gxbGF0L1FYMU5GY1V4YXZodmJhZEdkVVgxSWRVTU9KSzUKZUs5TzByTnRyK09VUUJ6dWxob1RXU1FzN1lTNGxobFBYenVqRUZIeU02M3JtZ1hBMVlEM1JPQ1E0ajJYMnlqQgpTYk13MUJpUQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSWVPeDdwZUxLZGRFd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJME1Ea3lNekU1TURJeE5Gb1hEVE0wTURreU1URTVNREl4TkZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0aGtaY3lZdEN0Zk8KMTl2LzBxdEVLTW1oeG13cXZEVHRrbFUrT1JkNThEU2N5N3lMd2F4K1hkTmN1RXBBcUNQSzVEbEc5dlQzSWw0ZApMcTQwYzBpdmVYRmZsMzlvbXJKYXJFQ3BSMFJZQTRHL1lVOENlTWpPM0NIWUQrcHROa2M3RlhhWnZtUzg3YWl5CjRyeklIOVdKNWF5SHE5UEo1T0Z3VDJDajNUdDhjLzN5Wmc0RTVOU0hiYXdtNVE4MUp3eTFHNHNuY1pXREtEVFcKTGxRVEtCOHErOHdBSGxucGJkNis5b1l5aytmLzlubDI5WlNrZnVsMjdGMzVHeWYxN0F3UTFIS2NaeXI0SEo3aApSOGdoN3YzcjNicjlFREo4WW91L1BFTWwzUmFjN3VhVEpiUE9ERHFFaWcxdnlld2pYS3dkZzZmNy96UXZPbDc5CjF0MkM5akNXZlFJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVTh4T0dXSVZ1eThJSTJEOFI1OEJ6L2pncm9pY3dEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUtNaVk3OGFZd2hZN1B5R1diQkI5Wm1vclFyZ04xc3E1S0N0U2JiRWQ4UkVoZ2djYUplV2paSHg5ZnkrCkRrb2Y3OTM4SVpjWFloZjkyRm02UVBaL0dWbVU3VUQ5NFJTdzBPVDlITVRMczRQQldRb1dtVWozcUZmdkVxWUwKUVMvQmNFZzRQZVJpWkk5T1NNbmJMUXVyd3BqcHZyYUVrMnJCMkZtdUVtTFpYQUhELzVOTG8yVUZFRUdMVk56NQpuQ2pjazMra2ZBY00wN01TUUdvS0VqUDNWS29Nd1hSV3NacHJNOElKVm84TnNSdDluRmdCdTEyQjJneWpuUkFGCjQrTmtxdWpkdGZyVHlyc2hzQWJ4M0JiKzdZVks0NTFSTjREZlROTGFZYmlEcnJWQzcrb3lIWVdWUEwzWStjbHAKcFNRRHFZc2FraXJNUjNpeEJnTUNGbTlGRDFvPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSVJBVjVkTDZKNHlVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEkwTURreU16RTVNREl4TkZvWERUTTBNRGt5TVRFNU1ESXhORm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQW5mcDBzOGVMczUwbVlTcm85QXl0cFpUek5NM1EvOXMzbGZSWVZCN2d3K3BvWGQ2UFVrdzE3ak9ZUlRLdgovWnRwL1JBWmVhWkhLQ2FHRG1UKzhtRVl2czlNQW5RVENqSE1tZnpUdk1rdE9HbHNGMjdRRnJGN3FST2hRR0hPCnNKTmN4M0I3R2NnbE90Y0VoM1lBK0V4QitVTXBQVTA0bG9RT1RDZ1EyWk1tTDFndWZsUmxLNDNMZVBtZk5SRG4KZktCYUlCMkNCN2FWdnhRUEJlbko3d1c2T0pHQnBEWDg1WEg3cTBqdktqZkUvZlRiNER0TnR5dklhdEU1cFZVaAppTFhZRmVXa3psSG9QTGlGbWxJT3NGRm1FMjF3Rlo5MG93eWFmY1ArSVJaSXVPRFNzTzJRUURNV2Nyekl5V1MrCjQwRHVHSXd2MUJhRnhFeDJHcmx2ODVmUWJ3SURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVU4Y0VmYlB1TE45UGhaV1hEbll4V1ZWNEMrL0F3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFJZVp1ZzNhRjNTckptUFZtWGpwclhVY2VMSDFmT0pFQ3lkc29pOHFESkhvCk13YURFOWs3aSs1UlBQZTRtV2RZVVdvcjdOZE9ZNGMvejZtdXJIQ2thbzJ1YXJ0MFNFMDhSZkphQzlBemlZNzgKR3ZCSDJET3h3d0oxMnQrcitpVEVJMWRlNUw0WTI2MytlY2wrWWZlTklJYWNsbDZZeWc4SmxXdS9oNzhXeWNQOApadk5sNmlrOGhOSjFhU0pqMW9XNHR4RG5TNm42a2RFem11UFY2ZVp6empaakc2dVV3dDV2RFhzOWl0b2tHdFJWCnArS3c3eDFqWXkrbFVlMlFta3ZPMTN1SnJlbmszbUh1dXVlSHEySjdtWlBrazBEekl3dWswQS9wcm0yVTZXUVIKU25nenNDNWIxOEp4cWJrOHFDak1kVzdvTlhUK01GNXJaTlg5SUlia1ZmTT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUlXT25MZlBFT3pKd3dEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TnpJM01URTRPRGMxTUI0WERUSTBNRGt5TXpFNU1UUXoKTkZvWERUTTBNRGt5TVRFNU1UUXpOVm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOekkzTVRFNE9EYzFNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXRyZ0MKM2lPVFE1OGZNN0pTZ0crTGxEbi83TTZkSVVYRXJQclg4TERlV3QyQUdyQUpXYytZOHdoekF2NVFVWlZ1RGxFZApjejB3SnRraW1CdDJOeC81OEVEN2JLbGZRdDZUUC83WVRmMmdyQ1hWbXhOd0JmZTR1WkpVS2NxZnp4bVN4Q1VGCkVXdnpONUpEd1hBbFdiZUpYM1ZDRG9SM3JmUkNpMVMwTUduWXRUcEg0YWNPYWFGQm9GY2dEM3dzbzhXUEc4czUKT1pzVmpnUUZvbUpNUk5tWXRpQ3VlUk0vaURKcDZxMUNuR0hBN1pScVpLMXVGY2lPU3BoOE4xR1FQczBnZUJ0bwpxUzY5YWVrVmgxVEF5dWNzcnRIelRkeWNFeGVLOHAxR2JRWUtvVVlVQ1FMeGptaXN6NmJSK2d0WS9OUzZoZXdICnZ0MG8xQklROXd1eldDb3RoUUlEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVY29jVTl5WXF3d0M5N3VnbkhpREVLMkVPUE1Rd0h3WURWUjBqQkJndwpGb0FVY29jVTl5WXF3d0M5N3VnbkhpREVLMkVPUE1Rd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCNExiK2lpCllRWnNjT2lKd2ZONjRnbGtpdEhCUGZKY1YzSDY4UUpvT2NSSjM5UjljWjlqUVhET3hDNDJTWWdtRWQ5a3NSWlMKektVSDNHY2l1V2NZZSt3ZmFOQytEOUpRSTF1VGpxUWtJVE9mQ2V2cmUxRWxHVVY2WUx0aXhqVUdrMnBQdTJUUgpzRG5ZdlgrUm9hOENSQkZOcGR0TmwwL0gyYXJ1VEl2Y2FGYW9VVk9FTDVycDRQQ3ZQRkR2ZmNteGphQkl5Z0NJCnRzbDI0S0NVL0RvMytFUy9odW5qWWUvV2ZUdGtydVhwbW1MQTFHOEpzQXVOS0R1OElPcGtUMEwzcFdhaDcyU1QKbVpoRjZTb3pEMnVWTTB6T1dQM3NPci9nVVpBek13eGJoaEJzTzVjTWppdlY1OUZHZVB1OGhBUnhWSVIzcjNGNgpvQVZuTkVpazVSbFllbmM9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURzVENDQXBtZ0F3SUJBZ0lJZHFqM3d6a0Z0Um93RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE56STNNVEl3TURJd01CNFhEVEkwTURreU16RTVNek0wTVZvWApEVEkyTURreU16RTVNek0wTWxvd1NERkdNRVFHQTFVRUF3dzlLaTVoY0hCekxtRndjQzFoZDNNdFpXRnpkREl0Ck5ERTFMV2gxWWkxeU5YWmlkeTVrWlhZeE1TNXlaV1F0WTJobGMzUmxjbVpwWld4a0xtTnZiVENDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBS09FYXdNZHpvS1NsOHIzc3k2amFJaFp3c1lRSWRaWgpiSVNaYXRhVnJHdVhDMit1Yml3MlpyempHN1VzeGdGZ2hmdEJJK0M5bGJwWm9jRm1PMEE5cm8vYjZRVmdGM3h5Clo4YTR6RlFTSUlpb3RWNS9QWVpIbEFkT0lnQXpHWmVTL3JQVTRicWRMUlRuS2hVR3c4emlScE51MU5kbjZJVWkKL25NUDNkWFRKaDZuOEF6dDZ6ekg3TFlUb3VkaEZxUnJXR2xWLy8rY20yN29CUkNVWktGeGdqSy9MZndhQTZLVwp5WUJvdUc5ZTBkNFhGaE5FQ00zakFpT2JCY1dUMGJ1YW5HdW91REU1dXZkamhtNmZlUFRrTXZzUXFCdmpKN3lBCjc0NXBFdHhzQ3NNWEc5TjE5N2dzWjN5ejFtMmI1Qks1RkZjczlUZnpsU2FVT1Z4bDlEY3k1NzBDQXdFQUFhT0IKd0RDQnZUQU9CZ05WSFE4QkFmOEVCQU1DQmFBd0V3WURWUjBsQkF3d0NnWUlLd1lCQlFVSEF3RXdEQVlEVlIwVApBUUgvQkFJd0FEQWRCZ05WSFE0RUZnUVVlRFd5bTNhVFh4bGZ3SHI2dFAxeFFtT1VTZFl3SHdZRFZSMGpCQmd3CkZvQVU1M2ErbkV3WTNveE1LdFA1dXAzTTU2eVFSZW93U0FZRFZSMFJCRUV3UDRJOUtpNWhjSEJ6TG1Gd2NDMWgKZDNNdFpXRnpkREl0TkRFMUxXaDFZaTF5TlhaaWR5NWtaWFl4TVM1eVpXUXRZMmhsYzNSbGNtWnBaV3hrTG1OdgpiVEFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBdnhUS1pWWFlTNCsra0dZdHhWKzRmODZKQkNhUktndFViY0UwCkI2bTB3d2lRWitPRDdSbkFtekFFaUtQamhpSHNhd1lDWGpYTmp4MTZ1TDV6bTdPSFZ2eGlvcXQram5Oc0I4MnMKWTBiQzZGRGlUMFNyd2hkd01wQmZNemVwV1g3elVWNGVrWmE0dHlBM04xRWpGVmxkbWEzWFhwaTFJOWtyRkl6RwpiOVVCRWNxV2hVZEFCSW5iUUkvNkl0alJtNHlhTS9IaWNlLzhTbVZTOCtlajQ0c3pGV3lZdy81MWFwVkVtUU9sCjhFZ0lDUjliQlN5a3JIZ1ZlSWpvakljK2w2UmFvOWRsMFY2SEhSZi9nUWVHb1pFZFhiV3lFTHRuTzhpOVRWYUgKVWJNUHllS0xBUHBzK3VHNTNWSFdtV01rTGVUVjF6Ly83ZW5BVDJUbGptaWtkdVlYOXc9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlERERDQ0FmU2dBd0lCQWdJQkFUQU5CZ2txaGtpRzl3MEJBUXNGQURBbU1TUXdJZ1lEVlFRRERCdHBibWR5ClpYTnpMVzl3WlhKaGRHOXlRREUzTWpjeE1qQXdNakF3SGhjTk1qUXdPVEl6TVRrek16UXdXaGNOTWpZd09USXoKTVRrek16UXhXakFtTVNRd0lnWURWUVFEREJ0cGJtZHlaWE56TFc5d1pYSmhkRzl5UURFM01qY3hNakF3TWpBdwpnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFEanlkNjhrZTY0bzVubzF6RFJ2b3FQCkdjNGtUTkNzSTVIaTBLVzA2ajlmSTlHQVNiV0h5cmcvcW1Vb3BVU1hJNEd2TzN1ZEppUitpa2QydDR6dDRmeGQKZCs3bUJzOG9meUo4ZEFOL05IckJwNm5ucG1VQlZNb2lMbnlMN01oeFlJY3NSb3U0bW1ZUTgxOWNPZVVlQU1LVgp5Q1dBUmh4S050SktiR2prMnVjSmdZeTAxcjkzbnlqemhzeXRvaTcwbkNtMjhTUWhCalFqQlNZKzZ4ZUl3dGdzCk13YTBoY0tQNHdXUHJ2ZGFlQUcvTzJ1dHZBVlYyV1BvcFNDdGdLNzRWWEZXWkZEeEcwWDI2NkdCNnhCNDVob1MKOUpYYlRIMWh6L2l3cU0rQ2t6SnpDYm5zVlo5YldjcEh3V3VxbEM4YlhoaGNkd1BWUE54K05yUGNIb2Q5MWU4OQpBZ01CQUFHalJUQkRNQTRHQTFVZER3RUIvd1FFQXdJQ3BEQVNCZ05WSFJNQkFmOEVDREFHQVFIL0FnRUFNQjBHCkExVWREZ1FXQkJUbmRyNmNUQmplakV3cTAvbTZuY3puckpCRjZqQU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUEKMWZxQXNIZXlZSTNzbDNIMWg3NEJ1RXA2NXRjd0xyUFk0TDdjNzUxOXZYNTMrYjJ4YklrL09EWE9UUldFdHFUdgo3dGxObGZuL2NZejlBRW9OMDZVTStyMmxlY1AzVUxmUEdxRzBrc3BLREh1bGozUkVzYnZQQWNhbWJ4b0dPV1FSCnUzRGJhRlE1K2JSdFJLZUhNN0Izb296YmpvVVRTc2drem9Pd3V0bkVsMVlEeHc5RDRXbSs5ZWp5UnZjNHUzQUgKOVNQTjNmQkI1OTUweVViVXFLaWtSM0dFRk1SRGpuSldKeFVZdHhaZEs5N0Zmb1MwUEdncWhiNFZhbXlGMUJhVgp0dGpWdWY4YmhIOXJ5Ym5HeUhkc2wzejI3NWNTL0p4L3JVTDBwL2JhODJhMWRNTXpVYm5WYWJqTHJVckdIeXBECkd5Qk5QN3JZSzFheEd0OEFuOXVBcUE9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
                      url: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
                    },
                    version: '4.16.20',
                    versionAvailableUpdates: [
                      {
                        channels: ['candidate-4.16', 'candidate-4.17', 'fast-4.16', 'fast-4.17'],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:8d31e15cf82eac30e629190d5d8f542a7861451b032f2688d5f0c0e394ce29e9',
                        url: 'https://access.redhat.com/errata/RHBA-2024:8986',
                        version: '4.16.21',
                      },
                      {
                        channels: ['candidate-4.16', 'candidate-4.17'],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:a4a014415420ee4146717842fb104c248bbc4e56456774087b8723ed244c4b46',
                        url: 'https://access.redhat.com/errata/RHSA-2024:9615',
                        version: '4.16.23',
                      },
                      {
                        channels: ['candidate-4.17', 'candidate-4.18', 'fast-4.17'],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e6487ca1e630152977392bbcf0ad1318217d539d2b641ad4ece92d6ba25444a3',
                        url: 'https://access.redhat.com/errata/RHSA-2024:8981',
                        version: '4.17.4',
                      },
                      {
                        channels: ['candidate-4.17', 'candidate-4.18'],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:529fbe37da40215883391ff99e13afcbfee31649f838292076c670b7bc127898',
                        url: 'https://access.redhat.com/errata/RHSA-2024:9610',
                        version: '4.17.5',
                      },
                    ],
                    versionHistory: [
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:412cb889a50812978da822fb33801f6ce974df546a527739e3ec8c7dc5594a8b',
                        state: 'Completed',
                        verified: false,
                        version: '4.15.33',
                      },
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:1cd793ffcbdf5681324b6d425ea77887d449663430c572d75efb8ab9e9772136',
                        state: 'Completed',
                        verified: true,
                        version: '4.15.34',
                      },
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:0c786b9f68a48dc2759456430182ba8682aab5e9109a44f2fa85a995c7ea3eb7',
                        state: 'Completed',
                        verified: true,
                        version: '4.15.35',
                      },
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:16bb239b5d4f0d74132104efb32f021fb7e14157ee4ac90d66440702b4ea39a4',
                        state: 'Completed',
                        verified: true,
                        version: '4.15.36',
                      },
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:01089232c32886407806f3693bdb69e7f028bb70d5fe6fed0b3488664b7c9518',
                        state: 'Completed',
                        verified: true,
                        version: '4.16.16',
                      },
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:044310bcca3ad8c8f6c2c9e8130f7a25e1e8cb2bd77567d213d89b9ae7696709',
                        state: 'Completed',
                        verified: true,
                        version: '4.16.17',
                      },
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:c41b4d4e8d7c6cb28e39479c0965f61baeb3e80b02ac278e0115992877d5edc1',
                        state: 'Completed',
                        verified: true,
                        version: '4.16.18',
                      },
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:0f3964684f2852ee145081d65b89fd34c4aa79b1d279fda391ea96a20806c240',
                        state: 'Completed',
                        verified: true,
                        version: '4.16.19',
                      },
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:cce4ab8f53523c13c3b4f3549b85e512398aa40d202a55908de31a9b8bf6a2cb',
                        state: 'Completed',
                        verified: true,
                        version: '4.16.20',
                      },
                    ],
                  },
                  displayVersion: 'OpenShift 4.16.20',
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
                    currentVersion: '4.16.20',
                    desiredVersion: '4.16.20',
                    isReadySelectChannels: true,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    currentChannel: 'candidate-4.17',
                    desiredChannel: 'candidate-4.17',
                    availableUpdates: ['4.16.21', '4.16.23', '4.17.4', '4.17.5'],
                    availableChannels: [
                      'candidate-4.16',
                      'candidate-4.17',
                      'eus-4.16',
                      'fast-4.16',
                      'fast-4.17',
                      'stable-4.16',
                    ],
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
                microshiftDistribution: {},
                addons: {
                  addonList: [
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2024-11-14T18:39:17Z',
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
                            uid: 'fe5f16fd-2cc3-4ea0-8fc5-4987436d1511',
                          },
                        ],
                        resourceVersion: '19701591',
                        uid: '0f7f0d1b-cf75-4e5d-b9f7-d2344efb8bc4',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        conditions: [
                          {
                            lastTransitionTime: '2024-11-14T18:40:08Z',
                            message: 'completed with no errors.',
                            reason: 'Completed',
                            status: 'False',
                            type: 'Progressing',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:17Z',
                            message: 'Configurations configured',
                            reason: 'ConfigurationsConfigured',
                            status: 'True',
                            type: 'Configured',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:41:00Z',
                            message: 'application-manager add-on is available.',
                            reason: 'ManagedClusterAddOnLeaseUpdated',
                            status: 'True',
                            type: 'Available',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:40:08Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'SetPermissionApplied',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:40:08Z',
                            message:
                              'client certificate rotated starting from 2024-11-14 18:35:08 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:40:08Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
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
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2024-11-14T18:39:17Z',
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
                            uid: 'b7e3733b-804c-4b15-9913-e64f1e98a1d3',
                          },
                        ],
                        resourceVersion: '19700264',
                        uid: 'bfc8f32c-b47d-485f-b9d7-b689f6c831c9',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        conditions: [
                          {
                            lastTransitionTime: '2024-11-14T18:39:18Z',
                            message: 'Configurations configured',
                            reason: 'ConfigurationsConfigured',
                            status: 'True',
                            type: 'Configured',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:29Z',
                            message: 'completed with no errors.',
                            reason: 'Completed',
                            status: 'False',
                            type: 'Progressing',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:28Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'SetPermissionApplied',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:28Z',
                            message:
                              'client certificate rotated starting from 2024-11-14 18:34:28 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:29Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:40:00Z',
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
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2024-11-14T18:39:17Z',
                        finalizers: ['addon.open-cluster-management.io/addon-pre-delete'],
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
                            uid: 'faf30964-83cb-4129-8f03-4a78c9e8bd8d',
                          },
                        ],
                        resourceVersion: '19700273',
                        uid: 'a751b14d-1d1d-4be2-b04c-81a1e0723f19',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        conditions: [
                          {
                            lastTransitionTime: '2024-11-14T18:39:17Z',
                            message: 'Configurations configured',
                            reason: 'ConfigurationsConfigured',
                            status: 'True',
                            type: 'Configured',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:30Z',
                            message: 'completed with no errors.',
                            reason: 'Completed',
                            status: 'False',
                            type: 'Progressing',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:28Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'SetPermissionApplied',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:29Z',
                            message:
                              'client certificate rotated starting from 2024-11-14 18:34:28 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:30Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:40:01Z',
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
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2024-11-14T18:39:17Z',
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
                            uid: '714f85c8-3779-4b3a-a04f-5b4211f802d2',
                          },
                        ],
                        resourceVersion: '19700266',
                        uid: '5f26848c-4d31-41f0-81f1-41d73c75a1d9',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        conditions: [
                          {
                            lastTransitionTime: '2024-11-14T18:39:18Z',
                            message: 'Configurations configured',
                            reason: 'ConfigurationsConfigured',
                            status: 'True',
                            type: 'Configured',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:31Z',
                            message: 'completed with no errors.',
                            reason: 'Completed',
                            status: 'False',
                            type: 'Progressing',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:29Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'SetPermissionApplied',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:29Z',
                            message:
                              'client certificate rotated starting from 2024-11-14 18:34:29 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:30Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:40:00Z',
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
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2024-11-14T18:42:39Z',
                        generation: 1,
                        name: 'managed-serviceaccount',
                        namespace: 'local-cluster',
                        ownerReferences: [
                          {
                            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                            blockOwnerDeletion: true,
                            controller: true,
                            kind: 'ClusterManagementAddOn',
                            name: 'managed-serviceaccount',
                            uid: '98a8a151-d72d-41d6-9f74-66d2c9898440',
                          },
                        ],
                        resourceVersion: '20295483',
                        uid: 'b828352f-6636-4053-9b2d-1349c3c0e2c5',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        conditions: [
                          {
                            lastTransitionTime: '2024-11-14T18:42:39Z',
                            message: 'Configurations configured',
                            reason: 'ConfigurationsConfigured',
                            status: 'True',
                            type: 'Configured',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:42Z',
                            message: 'completed with no errors.',
                            reason: 'Completed',
                            status: 'False',
                            type: 'Progressing',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:40Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'SetPermissionApplied',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:40Z',
                            message:
                              'client certificate rotated starting from 2024-11-14 18:37:40 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:41Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:43:02Z',
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
                            resource: 'addontemplates',
                          },
                          {
                            group: 'addon.open-cluster-management.io',
                            resource: 'addondeploymentconfigs',
                          },
                        ],
                      },
                    },
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2024-11-14T18:42:39Z',
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
                            uid: '22f73361-bad2-417c-abe9-953da3fccaaa',
                          },
                        ],
                        resourceVersion: '19704173',
                        uid: '2a5f0036-8fb7-4244-8eb2-54cf191451a3',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        conditions: [
                          {
                            lastTransitionTime: '2024-11-14T18:42:39Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'SetPermissionApplied',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:40Z',
                            message: 'completed with no errors.',
                            reason: 'Completed',
                            status: 'False',
                            type: 'Progressing',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:39Z',
                            message: 'Configurations configured',
                            reason: 'ConfigurationsConfigured',
                            status: 'True',
                            type: 'Configured',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:39Z',
                            message:
                              'client certificate rotated starting from 2024-11-14 18:37:39 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:40Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:43:00Z',
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
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        annotations: {
                          'installer.multicluster.openshift.io/release-version': '2.8.0',
                        },
                        creationTimestamp: '2024-11-14T18:38:16Z',
                        finalizers: ['addon.open-cluster-management.io/addon-pre-delete'],
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
                            uid: '637e9059-7f02-4265-a9a8-f68f3005978c',
                          },
                        ],
                        resourceVersion: '20332298',
                        uid: '653398d7-3d49-433d-996d-e46f467e79dc',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        addOnConfiguration: {},
                        addOnMeta: {},
                        conditions: [
                          {
                            lastTransitionTime: '2024-11-14T18:38:16Z',
                            message: 'Configurations configured',
                            reason: 'ConfigurationsConfigured',
                            status: 'True',
                            type: 'Configured',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:38:16Z',
                            message: 'completed with no errors.',
                            reason: 'Completed',
                            status: 'False',
                            type: 'Progressing',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:38:16Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'SetPermissionApplied',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:38:22Z',
                            message:
                              'client certificate rotated starting from 2024-11-18 14:20:27 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:38:23Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:38:30Z',
                            message: 'OperatorNotFound',
                            reason: 'HypershiftDeployed',
                            status: 'True',
                            type: 'Degraded',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:39:00Z',
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
                              user: 'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon:agent:x99np',
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
                    {
                      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                      kind: 'ManagedClusterAddOn',
                      metadata: {
                        creationTimestamp: '2024-11-14T18:42:39Z',
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
                            uid: '17e25283-e396-446c-80f5-7aef1a73a9ca',
                          },
                        ],
                        resourceVersion: '20340923',
                        uid: 'e0b63a56-e66c-4ce8-8a7d-bec185c43bc1',
                      },
                      spec: {
                        installNamespace: 'open-cluster-management-agent-addon',
                      },
                      status: {
                        conditions: [
                          {
                            lastTransitionTime: '2024-11-18T14:33:08Z',
                            message: 'completed with no errors.',
                            reason: 'Completed',
                            status: 'False',
                            type: 'Progressing',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:39Z',
                            message: 'Configurations configured',
                            reason: 'ConfigurationsConfigured',
                            status: 'True',
                            type: 'Configured',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:39Z',
                            message: 'Registration of the addon agent is configured',
                            reason: 'SetPermissionApplied',
                            status: 'True',
                            type: 'RegistrationApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:40Z',
                            message:
                              'client certificate rotated starting from 2024-11-14 18:37:40 +0000 UTC to 2024-12-12 14:45:55 +0000 UTC',
                            reason: 'ClientCertificateUpdated',
                            status: 'True',
                            type: 'ClusterCertificateRotated',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:42:41Z',
                            message: 'manifests of addon are applied successfully',
                            reason: 'AddonManifestApplied',
                            status: 'True',
                            type: 'ManifestApplied',
                          },
                          {
                            lastTransitionTime: '2024-11-14T18:43:00Z',
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
                              specHash: 'bcc047be526305750d31e156f2830b534330996ea99cd2835ccfc9980395838f',
                            },
                            group: 'proxy.open-cluster-management.io',
                            lastAppliedConfig: {
                              name: 'cluster-proxy',
                              specHash: 'bcc047be526305750d31e156f2830b534330996ea99cd2835ccfc9980395838f',
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
                                'signer-6b4d57397755587256586330767a584d6633684d724f316263786237374a6959344b6255542b4e4a5637673d',
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
                  ],
                  available: 7,
                  progressing: 0,
                  degraded: 1,
                  unknown: 0,
                },
                labels: {
                  cloud: 'Amazon',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  clusterID: '352d46c7-8d43-418a-8e9b-505437a1a330',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                  'feature.open-cluster-management.io/addon-managed-serviceaccount': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  'local-cluster': 'true',
                  name: 'local-cluster',
                  openshiftVersion: '4.16.20',
                  'openshiftVersion-major': '4',
                  'openshiftVersion-major-minor': '4.16',
                  'velero.io/exclude-from-backup': 'true',
                  vendor: 'OpenShift',
                },
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '4',
                        memory: '15901876Ki',
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
                        'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-2b',
                        'node-role.kubernetes.io/control-plane': '',
                        'node-role.kubernetes.io/master': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                        'topology.kubernetes.io/region': 'us-east-2',
                        'topology.kubernetes.io/zone': 'us-east-2b',
                      },
                      name: 'ip-10-0-34-43.us-east-2.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16073900Ki',
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
                        'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-2a',
                        'node-role.kubernetes.io/control-plane': '',
                        'node-role.kubernetes.io/master': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                        'topology.kubernetes.io/region': 'us-east-2',
                        'topology.kubernetes.io/zone': 'us-east-2a',
                      },
                      name: 'ip-10-0-4-156.us-east-2.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '15901876Ki',
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
                        'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-2b',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                        'topology.kubernetes.io/region': 'us-east-2',
                        'topology.kubernetes.io/zone': 'us-east-2b',
                      },
                      name: 'ip-10-0-60-179.us-east-2.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16073908Ki',
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
                        'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-2a',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                        'topology.kubernetes.io/region': 'us-east-2',
                        'topology.kubernetes.io/zone': 'us-east-2a',
                      },
                      name: 'ip-10-0-9-190.us-east-2.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16073900Ki',
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
                        'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-2c',
                        'node-role.kubernetes.io/control-plane': '',
                        'node-role.kubernetes.io/master': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                        'topology.kubernetes.io/region': 'us-east-2',
                        'topology.kubernetes.io/zone': 'us-east-2c',
                      },
                      name: 'ip-10-0-94-201.us-east-2.compute.internal',
                    },
                    {
                      capacity: {
                        cpu: '4',
                        memory: '16073908Ki',
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
                        'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-2c',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 'm5.xlarge',
                        'topology.kubernetes.io/region': 'us-east-2',
                        'topology.kubernetes.io/zone': 'us-east-2c',
                      },
                      name: 'ip-10-0-94-60.us-east-2.compute.internal',
                    },
                  ],
                  ready: 6,
                  unhealthy: 0,
                  unknown: 0,
                },
                kubeApiServer: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
                consoleURL:
                  'https://console-openshift-console.apps.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com',
                isHive: false,
                isHypershift: false,
                isManaged: true,
                isCurator: false,
                hasAutomationTemplate: false,
                isHostedCluster: false,
                isSNOCluster: false,
                isRegionalHubCluster: false,
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                clusterSet: 'default',
                owner: {},
                creationTimestamp: '2024-11-14T18:38:14Z',
              },
            ],
            sortedClusterNames: ['local-cluster'],
            appClusters: [],
            searchClusters: [
              {
                HubAcceptedManagedCluster: 'True',
                ManagedClusterConditionAvailable: 'True',
                ManagedClusterConditionClockSynced: 'True',
                ManagedClusterImportSucceeded: 'True',
                ManagedClusterJoined: 'True',
                _hubClusterResource: 'true',
                _relatedUids: ['local-cluster/0784b94b-ddb6-4234-bc1b-d07d641d7a0c'],
                _uid: 'cluster__local-cluster',
                addon:
                  'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=false; work-manager=true',
                apiEndpoint: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
                apigroup: 'internal.open-cluster-management.io',
                cluster: 'local-cluster',
                consoleURL:
                  'https://console-openshift-console.apps.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com',
                cpu: '24',
                created: '2024-11-14T18:38:14Z',
                kind: 'Cluster',
                kind_plural: 'managedclusterinfos',
                kubernetesVersion: 'v1.29.9+5865c5b',
                label:
                  'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=352d46c7-8d43-418a-8e9b-505437a1a330; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-managed-serviceaccount=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.16.20; openshiftVersion-major=4; openshiftVersion-major-minor=4.16; velero.io/exclude-from-backup=true; vendor=OpenShift',
                memory: '96099368Ki',
                name: 'local-cluster',
                nodes: '6',
              },
            ],
            pulse: 'green',
            shapeType: 'cluster',
          },
        },
        searchClusters: [
          {
            HubAcceptedManagedCluster: 'True',
            ManagedClusterConditionAvailable: 'True',
            ManagedClusterConditionClockSynced: 'True',
            ManagedClusterImportSucceeded: 'True',
            ManagedClusterJoined: 'True',
            _hubClusterResource: 'true',
            _relatedUids: ['local-cluster/0784b94b-ddb6-4234-bc1b-d07d641d7a0c'],
            _uid: 'cluster__local-cluster',
            addon:
              'application-manager=true; cert-policy-controller=true; cluster-proxy=true; config-policy-controller=true; governance-policy-framework=true; iam-policy-controller=false; observability-controller=false; search-collector=false; work-manager=true',
            apiEndpoint: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
            apigroup: 'internal.open-cluster-management.io',
            cluster: 'local-cluster',
            consoleURL: 'https://console-openshift-console.apps.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com',
            cpu: '24',
            created: '2024-11-14T18:38:14Z',
            kind: 'Cluster',
            kind_plural: 'managedclusterinfos',
            kubernetesVersion: 'v1.29.9+5865c5b',
            label:
              'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=352d46c7-8d43-418a-8e9b-505437a1a330; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-managed-serviceaccount=available; feature.open-cluster-management.io/addon-work-manager=available; local-cluster=true; name=local-cluster; openshiftVersion=4.16.20; openshiftVersion-major=4; openshiftVersion-major-minor=4.16; velero.io/exclude-from-backup=true; vendor=OpenShift',
            memory: '96099368Ki',
            name: 'local-cluster',
            nodes: '6',
          },
        ],
        podModel: {
          'helloworld-app-deploy-local-cluster-feng-hello': [
            {
              _hubClusterResource: 'true',
              _ownerUID: 'local-cluster/46700217-809f-4dc6-a6ea-ef5a62b51620',
              _relatedUids: ['local-cluster/0784b94b-ddb6-4234-bc1b-d07d641d7a0c'],
              _uid: 'local-cluster/019b1ddd-366c-4dcd-bb29-62cd2f7f9b75',
              apiversion: 'v1',
              cluster: 'local-cluster',
              container: 'helloworld-app-container',
              created: '2024-11-17T21:52:20Z',
              hostIP: '10.0.94.60',
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'app=helloworld-app; pod-template-hash=6969476b9f',
              name: 'helloworld-app-deploy-6969476b9f-z7cpr',
              namespace: 'feng-hello',
              podIP: '10.131.0.104',
              restarts: '1',
              startedAt: '2024-11-17T21:52:20Z',
              status: 'Running',
              resStatus: 'running',
              pulse: 'green',
            },
          ],
        },
        pulse: 'green',
        shapeType: 'pod',
      },
    }

    const { getByText } = await renderLogsContainer(node, t, () => {})
    expect(getByText('Loading')).toBeTruthy()
  })
})
