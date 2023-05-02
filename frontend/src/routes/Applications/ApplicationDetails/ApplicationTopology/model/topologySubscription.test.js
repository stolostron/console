/* Copyright Contributors to the Open Cluster Management project */

import { createReplicaChild, getSubscriptionTopology } from './topologySubscription'

const clustersNames = ['local-cluster']
const parentObject = {
  name: 'helloworld-app-deploy',
  namespace: 'feng-hello',
  type: 'deployment',
  id: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment',
  uid: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment',
  specs: {
    isDesign: false,
    parent: {
      parentId: 'member--clusters--local-cluster--feng-hello-subscription-1',
      parentName: 'local-cluster',
      parentType: 'cluster',
      parentSpecs: {
        title: '',
        subscription: {
          apiVersion: 'apps.open-cluster-management.io/v1',
          kind: 'Subscription',
          metadata: {
            annotations: {
              'apps.open-cluster-management.io/git-branch': 'main',
              'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44-new',
              'apps.open-cluster-management.io/git-path': 'helloworld',
              'apps.open-cluster-management.io/reconcile-option': 'merge',
              'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
              'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
            },
            creationTimestamp: '2022-09-23T15:03:42Z',
            generation: 1,
            labels: {
              app: 'feng-hello',
              'app.kubernetes.io/part-of': 'feng-hello',
              'apps.open-cluster-management.io/reconcile-rate': 'medium',
            },
            name: 'feng-hello-subscription-1',
            namespace: 'feng-hello',
            resourceVersion: '60964376',
            uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
          },
          spec: {
            channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            placement: {
              placementRef: {
                kind: 'PlacementRule',
                name: 'feng-hello-placement-1',
              },
            },
          },
          status: {
            lastUpdateTime: '2022-10-27T14:31:54Z',
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
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-08-30T18:32:19Z',
                generation: 1,
                name: 'ggithubcom-fxiang1-app-samples',
                namespace: 'ggithubcom-fxiang1-app-samples-ns',
                resourceVersion: '13499379',
                uid: '05c760b0-ec56-45b9-997a-9e5d46c4ee64',
              },
              spec: {
                pathname: 'https://github.com/fxiang1/app-samples',
                type: 'Git',
              },
            },
          ],
          rules: [
            {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'PlacementRule',
              metadata: {
                annotations: {
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-23T15:03:42Z',
                generation: 1,
                labels: {
                  app: 'feng-hello',
                },
                name: 'feng-hello-placement-1',
                namespace: 'feng-hello',
                resourceVersion: '31574743',
                uid: '917fc049-ac07-46bb-97d4-e10ed15ec0ec',
              },
              spec: {
                clusterSelector: {
                  matchLabels: {
                    'local-cluster': 'true',
                  },
                },
              },
              status: {
                decisions: [
                  {
                    clusterName: 'local-cluster',
                    clusterNamespace: 'local-cluster',
                  },
                ],
              },
            },
          ],
          report: {
            apiVersion: 'apps.open-cluster-management.io/v1alpha1',
            kind: 'SubscriptionReport',
            metadata: {
              creationTimestamp: '2022-09-23T15:03:43Z',
              generation: 29,
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
                  uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
                },
              ],
              resourceVersion: '60964425',
              uid: '5d1cb61c-c31e-46af-bbd2-d428255c5514',
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
            uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
            status: 'ready',
            provider: 'aws',
            distribution: {
              k8sVersion: 'v1.23.5+3afdacb',
              ocp: {
                availableUpdates: [
                  '4.10.21',
                  '4.10.22',
                  '4.10.23',
                  '4.10.24',
                  '4.10.25',
                  '4.10.26',
                  '4.10.28',
                  '4.10.30',
                  '4.10.31',
                  '4.10.32',
                  '4.10.33',
                  '4.10.34',
                  '4.10.35',
                  '4.10.36',
                  '4.10.37',
                ],
                channel: 'stable-4.10',
                desired: {
                  channels: [
                    'candidate-4.10',
                    'candidate-4.11',
                    'eus-4.10',
                    'fast-4.10',
                    'fast-4.11',
                    'stable-4.10',
                    'stable-4.11',
                  ],
                  image:
                    'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                  url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                  version: '4.10.20',
                },
                desiredVersion: '4.10.20',
                managedClusterClientConfig: {
                  caBundle:
                    'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                  url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                },
                version: '4.10.20',
                versionAvailableUpdates: [
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                    url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                    version: '4.10.21',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                    url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                    version: '4.10.22',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                    url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                    version: '4.10.23',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                    url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                    version: '4.10.24',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                    url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                    version: '4.10.25',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                    url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                    version: '4.10.26',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                    version: '4.10.28',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                    url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                    version: '4.10.30',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                    url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                    version: '4.10.31',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                    version: '4.10.32',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:15832b3fc1eae4e3fafc97350e5d8a4d1be3948a6e5f5e9db8709b092d27e3da',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6532',
                    version: '4.10.33',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:8e2e492710a3b36b1de781ac1e926451cbf48b566c8781fb56ce03ff22752c9b',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6663',
                    version: '4.10.34',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:766bc6b381163ecccfea00556dd336dd49067413f69cbc29337fea778295c7bb',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6728',
                    version: '4.10.35',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:afe912343dc35b6c2307e2e2b4d174057fd76095504215fe25277a795df8eae9',
                    url: 'https://access.redhat.com/errata/RHSA-2022:6805',
                    version: '4.10.36',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:bd0603b261c362fb0589ac21444b7b9f4ecadb4cea9ef000164f1d3648116bce',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6901',
                    version: '4.10.37',
                  },
                ],
                versionHistory: [
                  {
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                    state: 'Completed',
                    verified: false,
                    version: '4.10.20',
                  },
                ],
              },
              displayVersion: 'OpenShift 4.10.20',
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
                currentVersion: '4.10.20',
                desiredVersion: '4.10.20',
                isReadySelectChannels: true,
                isSelectingChannel: false,
                isUpgradeCuration: false,
                currentChannel: 'stable-4.10',
                desiredChannel: 'stable-4.10',
                availableUpdates: [
                  '4.10.21',
                  '4.10.22',
                  '4.10.23',
                  '4.10.24',
                  '4.10.25',
                  '4.10.26',
                  '4.10.28',
                  '4.10.30',
                  '4.10.31',
                  '4.10.32',
                  '4.10.33',
                  '4.10.34',
                  '4.10.35',
                  '4.10.36',
                  '4.10.37',
                ],
                availableChannels: [
                  'candidate-4.10',
                  'candidate-4.11',
                  'eus-4.10',
                  'fast-4.10',
                  'fast-4.11',
                  'stable-4.10',
                  'stable-4.11',
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
              },
            },
            labels: {
              cloud: 'Amazon',
              cluster: 'error',
              'cluster.open-cluster-management.io/clusterset': 'default',
              clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
              'feature.open-cluster-management.io/addon-application-manager': 'available',
              'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
              'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
              'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
              'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
              'feature.open-cluster-management.io/addon-work-manager': 'available',
              'installer.name': 'multiclusterhub',
              'installer.namespace': 'open-cluster-management',
              'local-cluster': 'true',
              name: 'local-cluster',
              openshiftVersion: '4.10.20',
              'velero.io/exclude-from-backup': 'true',
              vendor: 'OpenShift',
            },
            nodes: {
              nodeList: [
                {
                  capacity: {
                    cpu: '8',
                    memory: '32561100Ki',
                    socket: '1',
                  },
                  conditions: [
                    {
                      status: 'True',
                      type: 'Ready',
                    },
                  ],
                  labels: {
                    'beta.kubernetes.io/instance-type': 't3.2xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                    'node-role.kubernetes.io/master': '',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 't3.2xlarge',
                  },
                  name: 'ip-10-0-129-97.ec2.internal',
                },
                {
                  capacity: {
                    cpu: '8',
                    memory: '32561100Ki',
                    socket: '1',
                  },
                  conditions: [
                    {
                      status: 'True',
                      type: 'Ready',
                    },
                  ],
                  labels: {
                    'beta.kubernetes.io/instance-type': 't3.2xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                    'node-role.kubernetes.io/master': '',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 't3.2xlarge',
                  },
                  name: 'ip-10-0-156-177.ec2.internal',
                },
                {
                  capacity: {
                    cpu: '8',
                    memory: '32561100Ki',
                    socket: '1',
                  },
                  conditions: [
                    {
                      status: 'True',
                      type: 'Ready',
                    },
                  ],
                  labels: {
                    'beta.kubernetes.io/instance-type': 't3.2xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                    'node-role.kubernetes.io/master': '',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 't3.2xlarge',
                  },
                  name: 'ip-10-0-162-59.ec2.internal',
                },
              ],
              ready: 3,
              unhealthy: 0,
              unknown: 0,
            },
            kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
            consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
            isHive: false,
            isHypershift: false,
            isManaged: true,
            isCurator: false,
            isHostedCluster: false,
            isSNOCluster: false,
            hive: {
              isHibernatable: false,
              secrets: {},
            },
            clusterSet: 'default',
            owner: {},
            creationTimestamp: '2022-08-30T15:07:12Z',
          },
        ],
        sortedClusterNames: ['local-cluster'],
      },
    },
    resourceCount: 1,
  },
}

const parentObjectRC = {
  name: 'helloworld-app-deploy',
  namespace: 'feng-hello',
  type: 'deploymentconfig',
  id: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment',
  uid: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment',
  specs: {
    isDesign: false,
    parent: {
      parentId: 'member--clusters--local-cluster--feng-hello-subscription-1',
      parentName: 'local-cluster',
      parentType: 'cluster',
      parentSpecs: {
        title: '',
        subscription: {
          apiVersion: 'apps.open-cluster-management.io/v1',
          kind: 'Subscription',
          metadata: {
            annotations: {
              'apps.open-cluster-management.io/git-branch': 'main',
              'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44-new',
              'apps.open-cluster-management.io/git-path': 'helloworld',
              'apps.open-cluster-management.io/reconcile-option': 'merge',
              'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
              'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
            },
            creationTimestamp: '2022-09-23T15:03:42Z',
            generation: 1,
            labels: {
              app: 'feng-hello',
              'app.kubernetes.io/part-of': 'feng-hello',
              'apps.open-cluster-management.io/reconcile-rate': 'medium',
            },
            name: 'feng-hello-subscription-1',
            namespace: 'feng-hello',
            resourceVersion: '60964376',
            uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
          },
          spec: {
            channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            placement: {
              placementRef: {
                kind: 'PlacementRule',
                name: 'feng-hello-placement-1',
              },
            },
          },
          status: {
            lastUpdateTime: '2022-10-27T14:31:54Z',
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
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-08-30T18:32:19Z',
                generation: 1,
                name: 'ggithubcom-fxiang1-app-samples',
                namespace: 'ggithubcom-fxiang1-app-samples-ns',
                resourceVersion: '13499379',
                uid: '05c760b0-ec56-45b9-997a-9e5d46c4ee64',
              },
              spec: {
                pathname: 'https://github.com/fxiang1/app-samples',
                type: 'Git',
              },
            },
          ],
          rules: [
            {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'PlacementRule',
              metadata: {
                annotations: {
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-23T15:03:42Z',
                generation: 1,
                labels: {
                  app: 'feng-hello',
                },
                name: 'feng-hello-placement-1',
                namespace: 'feng-hello',
                resourceVersion: '31574743',
                uid: '917fc049-ac07-46bb-97d4-e10ed15ec0ec',
              },
              spec: {
                clusterSelector: {
                  matchLabels: {
                    'local-cluster': 'true',
                  },
                },
              },
              status: {
                decisions: [
                  {
                    clusterName: 'local-cluster',
                    clusterNamespace: 'local-cluster',
                  },
                ],
              },
            },
          ],
          report: {
            apiVersion: 'apps.open-cluster-management.io/v1alpha1',
            kind: 'SubscriptionReport',
            metadata: {
              creationTimestamp: '2022-09-23T15:03:43Z',
              generation: 29,
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
                  uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
                },
              ],
              resourceVersion: '60964425',
              uid: '5d1cb61c-c31e-46af-bbd2-d428255c5514',
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
            uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
            status: 'ready',
            provider: 'aws',
            distribution: {
              k8sVersion: 'v1.23.5+3afdacb',
              ocp: {
                availableUpdates: [
                  '4.10.21',
                  '4.10.22',
                  '4.10.23',
                  '4.10.24',
                  '4.10.25',
                  '4.10.26',
                  '4.10.28',
                  '4.10.30',
                  '4.10.31',
                  '4.10.32',
                  '4.10.33',
                  '4.10.34',
                  '4.10.35',
                  '4.10.36',
                  '4.10.37',
                ],
                channel: 'stable-4.10',
                desired: {
                  channels: [
                    'candidate-4.10',
                    'candidate-4.11',
                    'eus-4.10',
                    'fast-4.10',
                    'fast-4.11',
                    'stable-4.10',
                    'stable-4.11',
                  ],
                  image:
                    'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                  url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                  version: '4.10.20',
                },
                desiredVersion: '4.10.20',
                managedClusterClientConfig: {
                  caBundle:
                    'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                  url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                },
                version: '4.10.20',
                versionAvailableUpdates: [
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                    url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                    version: '4.10.21',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                    url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                    version: '4.10.22',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                    url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                    version: '4.10.23',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                    url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                    version: '4.10.24',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                    url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                    version: '4.10.25',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                    url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                    version: '4.10.26',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                    version: '4.10.28',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                    url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                    version: '4.10.30',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                    url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                    version: '4.10.31',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                    version: '4.10.32',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:15832b3fc1eae4e3fafc97350e5d8a4d1be3948a6e5f5e9db8709b092d27e3da',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6532',
                    version: '4.10.33',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:8e2e492710a3b36b1de781ac1e926451cbf48b566c8781fb56ce03ff22752c9b',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6663',
                    version: '4.10.34',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:766bc6b381163ecccfea00556dd336dd49067413f69cbc29337fea778295c7bb',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6728',
                    version: '4.10.35',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:afe912343dc35b6c2307e2e2b4d174057fd76095504215fe25277a795df8eae9',
                    url: 'https://access.redhat.com/errata/RHSA-2022:6805',
                    version: '4.10.36',
                  },
                  {
                    channels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:bd0603b261c362fb0589ac21444b7b9f4ecadb4cea9ef000164f1d3648116bce',
                    url: 'https://access.redhat.com/errata/RHBA-2022:6901',
                    version: '4.10.37',
                  },
                ],
                versionHistory: [
                  {
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                    state: 'Completed',
                    verified: false,
                    version: '4.10.20',
                  },
                ],
              },
              displayVersion: 'OpenShift 4.10.20',
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
                currentVersion: '4.10.20',
                desiredVersion: '4.10.20',
                isReadySelectChannels: true,
                isSelectingChannel: false,
                isUpgradeCuration: false,
                currentChannel: 'stable-4.10',
                desiredChannel: 'stable-4.10',
                availableUpdates: [
                  '4.10.21',
                  '4.10.22',
                  '4.10.23',
                  '4.10.24',
                  '4.10.25',
                  '4.10.26',
                  '4.10.28',
                  '4.10.30',
                  '4.10.31',
                  '4.10.32',
                  '4.10.33',
                  '4.10.34',
                  '4.10.35',
                  '4.10.36',
                  '4.10.37',
                ],
                availableChannels: [
                  'candidate-4.10',
                  'candidate-4.11',
                  'eus-4.10',
                  'fast-4.10',
                  'fast-4.11',
                  'stable-4.10',
                  'stable-4.11',
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
              },
            },
            labels: {
              cloud: 'Amazon',
              cluster: 'error',
              'cluster.open-cluster-management.io/clusterset': 'default',
              clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
              'feature.open-cluster-management.io/addon-application-manager': 'available',
              'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
              'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
              'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
              'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
              'feature.open-cluster-management.io/addon-work-manager': 'available',
              'installer.name': 'multiclusterhub',
              'installer.namespace': 'open-cluster-management',
              'local-cluster': 'true',
              name: 'local-cluster',
              openshiftVersion: '4.10.20',
              'velero.io/exclude-from-backup': 'true',
              vendor: 'OpenShift',
            },
            nodes: {
              nodeList: [
                {
                  capacity: {
                    cpu: '8',
                    memory: '32561100Ki',
                    socket: '1',
                  },
                  conditions: [
                    {
                      status: 'True',
                      type: 'Ready',
                    },
                  ],
                  labels: {
                    'beta.kubernetes.io/instance-type': 't3.2xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                    'node-role.kubernetes.io/master': '',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 't3.2xlarge',
                  },
                  name: 'ip-10-0-129-97.ec2.internal',
                },
                {
                  capacity: {
                    cpu: '8',
                    memory: '32561100Ki',
                    socket: '1',
                  },
                  conditions: [
                    {
                      status: 'True',
                      type: 'Ready',
                    },
                  ],
                  labels: {
                    'beta.kubernetes.io/instance-type': 't3.2xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                    'node-role.kubernetes.io/master': '',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 't3.2xlarge',
                  },
                  name: 'ip-10-0-156-177.ec2.internal',
                },
                {
                  capacity: {
                    cpu: '8',
                    memory: '32561100Ki',
                    socket: '1',
                  },
                  conditions: [
                    {
                      status: 'True',
                      type: 'Ready',
                    },
                  ],
                  labels: {
                    'beta.kubernetes.io/instance-type': 't3.2xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                    'node-role.kubernetes.io/master': '',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 't3.2xlarge',
                  },
                  name: 'ip-10-0-162-59.ec2.internal',
                },
              ],
              ready: 3,
              unhealthy: 0,
              unknown: 0,
            },
            kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
            consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
            isHive: false,
            isHypershift: false,
            isManaged: true,
            isCurator: false,
            isHostedCluster: false,
            isSNOCluster: false,
            hive: {
              isHibernatable: false,
              secrets: {},
            },
            clusterSet: 'default',
            owner: {},
            creationTimestamp: '2022-08-30T15:07:12Z',
          },
        ],
        sortedClusterNames: ['local-cluster'],
      },
    },
    resourceCount: 1,
  },
}

describe('createReplicaChild', () => {
  it('creates replicatset', () => {
    const template = {
      related: [
        {
          __typename: 'SearchRelatedResult',
          kind: 'pod',
          items: [
            {
              _uid: 'local-cluster/eef85598-8301-4d0d-b5b5-a9f2d43ebbb0',
              _hubClusterResource: 'true',
              name: 'helloworld-app-deploy-7998d94b96-ch2tj',
              startedAt: '2022-09-23T15:03:43Z',
              kind_plural: 'pods',
              podIP: '10.128.0.73',
              created: '2022-09-23T15:03:43Z',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              restarts: 20,
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              namespace: 'feng-hello',
              status: 'Running',
              hostIP: '10.0.156.177',
              container: 'helloworld-app-container',
              kind: 'pod',
              apiversion: 'v1',
              cluster: 'local-cluster',
              _rbac: 'feng-hello_null_pods',
              _ownerUID: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'replicaset',
          items: [
            {
              _uid: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
              cluster: 'local-cluster',
              _hubClusterResource: 'true',
              apigroup: 'apps',
              desired: 1,
              namespace: 'feng-hello',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              _rbac: 'feng-hello_apps_replicasets',
              kind_plural: 'replicasets',
              apiversion: 'v1',
              name: 'helloworld-app-deploy-7998d94b96',
              current: 1,
              _hostingSubscription: 'feng-hello/feng-hello-subscription-1-local',
              created: '2022-09-23T15:03:43Z',
              kind: 'replicaset',
            },
          ],
        },
      ],
    }

    const result = {
      id: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
          parentName: 'helloworld-app-deploy',
          parentSpecs: {
            clusters: [
              {
                clusterSet: 'default',
                consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                creationTimestamp: '2022-08-30T15:07:12Z',
                displayName: 'local-cluster',
                distribution: {
                  displayVersion: 'OpenShift 4.10.20',
                  isManagedOpenShift: false,
                  k8sVersion: 'v1.23.5+3afdacb',
                  ocp: {
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    channel: 'stable-4.10',
                    desired: {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                        'stable-4.11',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                      version: '4.10.20',
                    },
                    desiredVersion: '4.10.20',
                    managedClusterClientConfig: {
                      caBundle:
                        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                      url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                    },
                    version: '4.10.20',
                    versionAvailableUpdates: [
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                        version: '4.10.21',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                        version: '4.10.22',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                        version: '4.10.23',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                        version: '4.10.24',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                        version: '4.10.25',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                        version: '4.10.26',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                        version: '4.10.28',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                        version: '4.10.30',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                        version: '4.10.31',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                        version: '4.10.32',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:15832b3fc1eae4e3fafc97350e5d8a4d1be3948a6e5f5e9db8709b092d27e3da',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6532',
                        version: '4.10.33',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:8e2e492710a3b36b1de781ac1e926451cbf48b566c8781fb56ce03ff22752c9b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6663',
                        version: '4.10.34',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:766bc6b381163ecccfea00556dd336dd49067413f69cbc29337fea778295c7bb',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6728',
                        version: '4.10.35',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:afe912343dc35b6c2307e2e2b4d174057fd76095504215fe25277a795df8eae9',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6805',
                        version: '4.10.36',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:bd0603b261c362fb0589ac21444b7b9f4ecadb4cea9ef000164f1d3648116bce',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6901',
                        version: '4.10.37',
                      },
                    ],
                    versionHistory: [
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                        state: 'Completed',
                        verified: false,
                        version: '4.10.20',
                      },
                    ],
                  },
                  upgradeInfo: {
                    availableChannels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    currentChannel: 'stable-4.10',
                    currentVersion: '4.10.20',
                    desiredChannel: 'stable-4.10',
                    desiredVersion: '4.10.20',
                    hookFailed: false,
                    hooksInProgress: false,
                    isReadySelectChannels: true,
                    isReadyUpdates: true,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    isUpgrading: false,
                    latestJob: {
                      conditionMessage: '',
                      step: 'prehook-ansiblejob',
                    },
                    posthooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    prehooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    upgradeFailed: false,
                    upgradePercentage: '',
                  },
                },
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                isCurator: false,
                isHive: false,
                isHostedCluster: false,
                isHypershift: false,
                isManaged: true,
                isSNOCluster: false,
                kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                labels: {
                  cloud: 'Amazon',
                  cluster: 'error',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                  'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  'installer.name': 'multiclusterhub',
                  'installer.namespace': 'open-cluster-management',
                  'local-cluster': 'true',
                  name: 'local-cluster',
                  openshiftVersion: '4.10.20',
                  'velero.io/exclude-from-backup': 'true',
                  vendor: 'OpenShift',
                },
                name: 'local-cluster',
                namespace: 'local-cluster',
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-129-97.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-156-177.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-162-59.ec2.internal',
                    },
                  ],
                  ready: 3,
                  unhealthy: 0,
                  unknown: 0,
                },
                owner: {},
                provider: 'aws',
                status: 'ready',
                uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
              },
            ],
            clustersNames: ['local-cluster'],
            resourceCount: 1,
            sortedClusterNames: ['local-cluster'],
            subscription: {
              apiVersion: 'apps.open-cluster-management.io/v1',
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
                    creationTimestamp: '2022-08-30T18:32:19Z',
                    generation: 1,
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                    resourceVersion: '13499379',
                    uid: '05c760b0-ec56-45b9-997a-9e5d46c4ee64',
                  },
                  spec: {
                    pathname: 'https://github.com/fxiang1/app-samples',
                    type: 'Git',
                  },
                },
              ],
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44-new',
                  'apps.open-cluster-management.io/git-path': 'helloworld',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-23T15:03:42Z',
                generation: 1,
                labels: {
                  app: 'feng-hello',
                  'app.kubernetes.io/part-of': 'feng-hello',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-hello-subscription-1',
                namespace: 'feng-hello',
                resourceVersion: '60964376',
                uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
              },
              posthooks: [],
              prehooks: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2022-09-23T15:03:43Z',
                  generation: 29,
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
                      uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
                    },
                  ],
                  resourceVersion: '60964425',
                  uid: '5d1cb61c-c31e-46af-bbd2-d428255c5514',
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
              rules: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'PlacementRule',
                  metadata: {
                    annotations: {
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-23T15:03:42Z',
                    generation: 1,
                    labels: {
                      app: 'feng-hello',
                    },
                    name: 'feng-hello-placement-1',
                    namespace: 'feng-hello',
                    resourceVersion: '31574743',
                    uid: '917fc049-ac07-46bb-97d4-e10ed15ec0ec',
                  },
                  spec: {
                    clusterSelector: {
                      matchLabels: {
                        'local-cluster': 'true',
                      },
                    },
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                      },
                    ],
                  },
                },
              ],
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'feng-hello-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-10-27T14:31:54Z',
                phase: 'Propagated',
              },
            },
            title: '',
          },
          parentType: 'replicaset',
          resources: undefined,
        },
        replicaCount: 1,
        resourceCount: 1,
        resources: undefined,
      },
      type: 'pod',
      uid: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
    }
    expect(createReplicaChild(parentObject, clustersNames, template, [], [])).toEqual(result)
  })

  it('creates ReplicaSet', () => {
    const template = {
      related: [
        {
          __typename: 'SearchRelatedResult',
          kind: 'Pod',
          items: [
            {
              _uid: 'local-cluster/eef85598-8301-4d0d-b5b5-a9f2d43ebbb0',
              _hubClusterResource: 'true',
              name: 'helloworld-app-deploy-7998d94b96-ch2tj',
              startedAt: '2022-09-23T15:03:43Z',
              kind_plural: 'pods',
              podIP: '10.128.0.73',
              created: '2022-09-23T15:03:43Z',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              restarts: 20,
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              namespace: 'feng-hello',
              status: 'Running',
              hostIP: '10.0.156.177',
              container: 'helloworld-app-container',
              kind: 'Pod',
              apiversion: 'v1',
              cluster: 'local-cluster',
              _rbac: 'feng-hello_null_pods',
              _ownerUID: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'ReplicaSet',
          items: [
            {
              _uid: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
              cluster: 'local-cluster',
              _hubClusterResource: 'true',
              apigroup: 'apps',
              desired: 1,
              namespace: 'feng-hello',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              _rbac: 'feng-hello_apps_replicasets',
              kind_plural: 'replicasets',
              apiversion: 'v1',
              name: 'helloworld-app-deploy-7998d94b96',
              current: 1,
              _hostingSubscription: 'feng-hello/feng-hello-subscription-1-local',
              created: '2022-09-23T15:03:43Z',
              kind: 'ReplicaSet',
            },
          ],
        },
      ],
    }

    const result = {
      id: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy',
          parentName: 'helloworld-app-deploy',
          parentSpecs: {
            clusters: [
              {
                clusterSet: 'default',
                consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                creationTimestamp: '2022-08-30T15:07:12Z',
                displayName: 'local-cluster',
                distribution: {
                  displayVersion: 'OpenShift 4.10.20',
                  isManagedOpenShift: false,
                  k8sVersion: 'v1.23.5+3afdacb',
                  ocp: {
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    channel: 'stable-4.10',
                    desired: {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                        'stable-4.11',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                      version: '4.10.20',
                    },
                    desiredVersion: '4.10.20',
                    managedClusterClientConfig: {
                      caBundle:
                        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                      url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                    },
                    version: '4.10.20',
                    versionAvailableUpdates: [
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                        version: '4.10.21',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                        version: '4.10.22',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                        version: '4.10.23',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                        version: '4.10.24',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                        version: '4.10.25',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                        version: '4.10.26',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                        version: '4.10.28',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                        version: '4.10.30',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                        version: '4.10.31',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                        version: '4.10.32',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:15832b3fc1eae4e3fafc97350e5d8a4d1be3948a6e5f5e9db8709b092d27e3da',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6532',
                        version: '4.10.33',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:8e2e492710a3b36b1de781ac1e926451cbf48b566c8781fb56ce03ff22752c9b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6663',
                        version: '4.10.34',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:766bc6b381163ecccfea00556dd336dd49067413f69cbc29337fea778295c7bb',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6728',
                        version: '4.10.35',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:afe912343dc35b6c2307e2e2b4d174057fd76095504215fe25277a795df8eae9',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6805',
                        version: '4.10.36',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:bd0603b261c362fb0589ac21444b7b9f4ecadb4cea9ef000164f1d3648116bce',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6901',
                        version: '4.10.37',
                      },
                    ],
                    versionHistory: [
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                        state: 'Completed',
                        verified: false,
                        version: '4.10.20',
                      },
                    ],
                  },
                  upgradeInfo: {
                    availableChannels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    currentChannel: 'stable-4.10',
                    currentVersion: '4.10.20',
                    desiredChannel: 'stable-4.10',
                    desiredVersion: '4.10.20',
                    hookFailed: false,
                    hooksInProgress: false,
                    isReadySelectChannels: true,
                    isReadyUpdates: true,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    isUpgrading: false,
                    latestJob: {
                      conditionMessage: '',
                      step: 'prehook-ansiblejob',
                    },
                    posthooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    prehooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    upgradeFailed: false,
                    upgradePercentage: '',
                  },
                },
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                isCurator: false,
                isHive: false,
                isHostedCluster: false,
                isHypershift: false,
                isManaged: true,
                isSNOCluster: false,
                kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                labels: {
                  cloud: 'Amazon',
                  cluster: 'error',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                  'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  'installer.name': 'multiclusterhub',
                  'installer.namespace': 'open-cluster-management',
                  'local-cluster': 'true',
                  name: 'local-cluster',
                  openshiftVersion: '4.10.20',
                  'velero.io/exclude-from-backup': 'true',
                  vendor: 'OpenShift',
                },
                name: 'local-cluster',
                namespace: 'local-cluster',
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-129-97.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-156-177.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-162-59.ec2.internal',
                    },
                  ],
                  ready: 3,
                  unhealthy: 0,
                  unknown: 0,
                },
                owner: {},
                provider: 'aws',
                status: 'ready',
                uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
              },
            ],
            clustersNames: ['local-cluster'],
            resourceCount: 1,
            sortedClusterNames: ['local-cluster'],
            subscription: {
              apiVersion: 'apps.open-cluster-management.io/v1',
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
                    creationTimestamp: '2022-08-30T18:32:19Z',
                    generation: 1,
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                    resourceVersion: '13499379',
                    uid: '05c760b0-ec56-45b9-997a-9e5d46c4ee64',
                  },
                  spec: {
                    pathname: 'https://github.com/fxiang1/app-samples',
                    type: 'Git',
                  },
                },
              ],
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44-new',
                  'apps.open-cluster-management.io/git-path': 'helloworld',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-23T15:03:42Z',
                generation: 1,
                labels: {
                  app: 'feng-hello',
                  'app.kubernetes.io/part-of': 'feng-hello',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-hello-subscription-1',
                namespace: 'feng-hello',
                resourceVersion: '60964376',
                uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
              },
              posthooks: [],
              prehooks: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2022-09-23T15:03:43Z',
                  generation: 29,
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
                      uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
                    },
                  ],
                  resourceVersion: '60964425',
                  uid: '5d1cb61c-c31e-46af-bbd2-d428255c5514',
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
              rules: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'PlacementRule',
                  metadata: {
                    annotations: {
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-23T15:03:42Z',
                    generation: 1,
                    labels: {
                      app: 'feng-hello',
                    },
                    name: 'feng-hello-placement-1',
                    namespace: 'feng-hello',
                    resourceVersion: '31574743',
                    uid: '917fc049-ac07-46bb-97d4-e10ed15ec0ec',
                  },
                  spec: {
                    clusterSelector: {
                      matchLabels: {
                        'local-cluster': 'true',
                      },
                    },
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                      },
                    ],
                  },
                },
              ],
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'feng-hello-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-10-27T14:31:54Z',
                phase: 'Propagated',
              },
            },
            title: '',
          },
          parentType: 'replicaset',
          resources: undefined,
        },
        replicaCount: 1,
        resourceCount: 1,
        resources: undefined,
      },
      type: 'pod',
      uid: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicaset--helloworld-app-deploy--pod--helloworld-app-deploy',
    }
    expect(createReplicaChild(parentObject, clustersNames, template, [], [])).toEqual(result)
  })

  it('creates replicationcontroller', () => {
    const template = {
      related: [
        {
          __typename: 'SearchRelatedResult',
          kind: 'pod',
          items: [
            {
              _uid: 'local-cluster/eef85598-8301-4d0d-b5b5-a9f2d43ebbb0',
              _hubClusterResource: 'true',
              name: 'helloworld-app-deploy-7998d94b96-ch2tj',
              startedAt: '2022-09-23T15:03:43Z',
              kind_plural: 'pods',
              podIP: '10.128.0.73',
              created: '2022-09-23T15:03:43Z',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              restarts: 20,
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              namespace: 'feng-hello',
              status: 'Running',
              hostIP: '10.0.156.177',
              container: 'helloworld-app-container',
              kind: 'pod',
              apiversion: 'v1',
              cluster: 'local-cluster',
              _rbac: 'feng-hello_null_pods',
              _ownerUID: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'replicationcontroller',
          items: [
            {
              _uid: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
              cluster: 'local-cluster',
              _hubClusterResource: 'true',
              apigroup: 'apps',
              desired: 1,
              namespace: 'feng-hello',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              _rbac: 'feng-hello_apps_replicationcontrollers',
              kind_plural: 'replicationcontrollers',
              apiversion: 'v1',
              name: 'helloworld-app-deploy-7998d94b96',
              current: 1,
              _hostingSubscription: 'feng-hello/feng-hello-subscription-1-local',
              created: '2022-09-23T15:03:43Z',
              kind: 'replicationcontroller',
            },
          ],
        },
      ],
    }

    const result = {
      id: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicationcontroller--helloworld-app-deploy--pod--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicationcontroller--helloworld-app-deploy',
          parentName: 'helloworld-app-deploy',
          parentSpecs: {
            clusters: [
              {
                clusterSet: 'default',
                consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                creationTimestamp: '2022-08-30T15:07:12Z',
                displayName: 'local-cluster',
                distribution: {
                  displayVersion: 'OpenShift 4.10.20',
                  isManagedOpenShift: false,
                  k8sVersion: 'v1.23.5+3afdacb',
                  ocp: {
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    channel: 'stable-4.10',
                    desired: {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                        'stable-4.11',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                      version: '4.10.20',
                    },
                    desiredVersion: '4.10.20',
                    managedClusterClientConfig: {
                      caBundle:
                        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                      url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                    },
                    version: '4.10.20',
                    versionAvailableUpdates: [
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                        version: '4.10.21',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                        version: '4.10.22',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                        version: '4.10.23',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                        version: '4.10.24',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                        version: '4.10.25',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                        version: '4.10.26',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                        version: '4.10.28',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                        version: '4.10.30',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                        version: '4.10.31',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                        version: '4.10.32',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:15832b3fc1eae4e3fafc97350e5d8a4d1be3948a6e5f5e9db8709b092d27e3da',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6532',
                        version: '4.10.33',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:8e2e492710a3b36b1de781ac1e926451cbf48b566c8781fb56ce03ff22752c9b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6663',
                        version: '4.10.34',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:766bc6b381163ecccfea00556dd336dd49067413f69cbc29337fea778295c7bb',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6728',
                        version: '4.10.35',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:afe912343dc35b6c2307e2e2b4d174057fd76095504215fe25277a795df8eae9',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6805',
                        version: '4.10.36',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:bd0603b261c362fb0589ac21444b7b9f4ecadb4cea9ef000164f1d3648116bce',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6901',
                        version: '4.10.37',
                      },
                    ],
                    versionHistory: [
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                        state: 'Completed',
                        verified: false,
                        version: '4.10.20',
                      },
                    ],
                  },
                  upgradeInfo: {
                    availableChannels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    currentChannel: 'stable-4.10',
                    currentVersion: '4.10.20',
                    desiredChannel: 'stable-4.10',
                    desiredVersion: '4.10.20',
                    hookFailed: false,
                    hooksInProgress: false,
                    isReadySelectChannels: true,
                    isReadyUpdates: true,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    isUpgrading: false,
                    latestJob: {
                      conditionMessage: '',
                      step: 'prehook-ansiblejob',
                    },
                    posthooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    prehooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    upgradeFailed: false,
                    upgradePercentage: '',
                  },
                },
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                isCurator: false,
                isHive: false,
                isHostedCluster: false,
                isHypershift: false,
                isManaged: true,
                isSNOCluster: false,
                kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                labels: {
                  cloud: 'Amazon',
                  cluster: 'error',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                  'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  'installer.name': 'multiclusterhub',
                  'installer.namespace': 'open-cluster-management',
                  'local-cluster': 'true',
                  name: 'local-cluster',
                  openshiftVersion: '4.10.20',
                  'velero.io/exclude-from-backup': 'true',
                  vendor: 'OpenShift',
                },
                name: 'local-cluster',
                namespace: 'local-cluster',
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-129-97.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-156-177.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-162-59.ec2.internal',
                    },
                  ],
                  ready: 3,
                  unhealthy: 0,
                  unknown: 0,
                },
                owner: {},
                provider: 'aws',
                status: 'ready',
                uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
              },
            ],
            clustersNames: ['local-cluster'],
            resourceCount: 1,
            sortedClusterNames: ['local-cluster'],
            subscription: {
              apiVersion: 'apps.open-cluster-management.io/v1',
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
                    creationTimestamp: '2022-08-30T18:32:19Z',
                    generation: 1,
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                    resourceVersion: '13499379',
                    uid: '05c760b0-ec56-45b9-997a-9e5d46c4ee64',
                  },
                  spec: {
                    pathname: 'https://github.com/fxiang1/app-samples',
                    type: 'Git',
                  },
                },
              ],
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44-new',
                  'apps.open-cluster-management.io/git-path': 'helloworld',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-23T15:03:42Z',
                generation: 1,
                labels: {
                  app: 'feng-hello',
                  'app.kubernetes.io/part-of': 'feng-hello',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-hello-subscription-1',
                namespace: 'feng-hello',
                resourceVersion: '60964376',
                uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
              },
              posthooks: [],
              prehooks: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2022-09-23T15:03:43Z',
                  generation: 29,
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
                      uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
                    },
                  ],
                  resourceVersion: '60964425',
                  uid: '5d1cb61c-c31e-46af-bbd2-d428255c5514',
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
              rules: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'PlacementRule',
                  metadata: {
                    annotations: {
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-23T15:03:42Z',
                    generation: 1,
                    labels: {
                      app: 'feng-hello',
                    },
                    name: 'feng-hello-placement-1',
                    namespace: 'feng-hello',
                    resourceVersion: '31574743',
                    uid: '917fc049-ac07-46bb-97d4-e10ed15ec0ec',
                  },
                  spec: {
                    clusterSelector: {
                      matchLabels: {
                        'local-cluster': 'true',
                      },
                    },
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                      },
                    ],
                  },
                },
              ],
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'feng-hello-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-10-27T14:31:54Z',
                phase: 'Propagated',
              },
            },
            title: '',
          },
          parentType: 'replicationcontroller',
          resources: undefined,
        },
        replicaCount: 1,
        resourceCount: 1,
        resources: undefined,
      },
      type: 'pod',
      uid: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicationcontroller--helloworld-app-deploy--pod--helloworld-app-deploy',
    }

    expect(createReplicaChild(parentObjectRC, clustersNames, template, [], [])).toEqual(result)
  })

  it('creates replicationcontroller', () => {
    const template = {
      related: [
        {
          __typename: 'SearchRelatedResult',
          kind: 'Pod',
          items: [
            {
              _uid: 'local-cluster/eef85598-8301-4d0d-b5b5-a9f2d43ebbb0',
              _hubClusterResource: 'true',
              name: 'helloworld-app-deploy-7998d94b96-ch2tj',
              startedAt: '2022-09-23T15:03:43Z',
              kind_plural: 'pods',
              podIP: '10.128.0.73',
              created: '2022-09-23T15:03:43Z',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              restarts: 20,
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              namespace: 'feng-hello',
              status: 'Running',
              hostIP: '10.0.156.177',
              container: 'helloworld-app-container',
              kind: 'Pod',
              apiversion: 'v1',
              cluster: 'local-cluster',
              _rbac: 'feng-hello_null_pods',
              _ownerUID: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
            },
          ],
        },
        {
          __typename: 'SearchRelatedResult',
          kind: 'ReplicationController',
          items: [
            {
              _uid: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
              cluster: 'local-cluster',
              _hubClusterResource: 'true',
              apigroup: 'apps',
              desired: 1,
              namespace: 'feng-hello',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              _rbac: 'feng-hello_apps_ReplicationControllers',
              kind_plural: 'ReplicationControllers',
              apiversion: 'v1',
              name: 'helloworld-app-deploy-7998d94b96',
              current: 1,
              _hostingSubscription: 'feng-hello/feng-hello-subscription-1-local',
              created: '2022-09-23T15:03:43Z',
              kind: 'ReplicationController',
            },
          ],
        },
      ],
    }

    const result = {
      id: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicationcontroller--helloworld-app-deploy--pod--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicationcontroller--helloworld-app-deploy',
          parentName: 'helloworld-app-deploy',
          parentSpecs: {
            clusters: [
              {
                clusterSet: 'default',
                consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                creationTimestamp: '2022-08-30T15:07:12Z',
                displayName: 'local-cluster',
                distribution: {
                  displayVersion: 'OpenShift 4.10.20',
                  isManagedOpenShift: false,
                  k8sVersion: 'v1.23.5+3afdacb',
                  ocp: {
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    channel: 'stable-4.10',
                    desired: {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                        'stable-4.11',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                      version: '4.10.20',
                    },
                    desiredVersion: '4.10.20',
                    managedClusterClientConfig: {
                      caBundle:
                        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                      url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                    },
                    version: '4.10.20',
                    versionAvailableUpdates: [
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                        version: '4.10.21',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                        version: '4.10.22',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                        version: '4.10.23',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                        version: '4.10.24',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                        version: '4.10.25',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                        version: '4.10.26',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                        version: '4.10.28',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                        version: '4.10.30',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                        version: '4.10.31',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                        version: '4.10.32',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:15832b3fc1eae4e3fafc97350e5d8a4d1be3948a6e5f5e9db8709b092d27e3da',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6532',
                        version: '4.10.33',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:8e2e492710a3b36b1de781ac1e926451cbf48b566c8781fb56ce03ff22752c9b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6663',
                        version: '4.10.34',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:766bc6b381163ecccfea00556dd336dd49067413f69cbc29337fea778295c7bb',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6728',
                        version: '4.10.35',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:afe912343dc35b6c2307e2e2b4d174057fd76095504215fe25277a795df8eae9',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6805',
                        version: '4.10.36',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:bd0603b261c362fb0589ac21444b7b9f4ecadb4cea9ef000164f1d3648116bce',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6901',
                        version: '4.10.37',
                      },
                    ],
                    versionHistory: [
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                        state: 'Completed',
                        verified: false,
                        version: '4.10.20',
                      },
                    ],
                  },
                  upgradeInfo: {
                    availableChannels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    currentChannel: 'stable-4.10',
                    currentVersion: '4.10.20',
                    desiredChannel: 'stable-4.10',
                    desiredVersion: '4.10.20',
                    hookFailed: false,
                    hooksInProgress: false,
                    isReadySelectChannels: true,
                    isReadyUpdates: true,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    isUpgrading: false,
                    latestJob: {
                      conditionMessage: '',
                      step: 'prehook-ansiblejob',
                    },
                    posthooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    prehooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    upgradeFailed: false,
                    upgradePercentage: '',
                  },
                },
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                isCurator: false,
                isHive: false,
                isHostedCluster: false,
                isHypershift: false,
                isManaged: true,
                isSNOCluster: false,
                kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                labels: {
                  cloud: 'Amazon',
                  cluster: 'error',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                  'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  'installer.name': 'multiclusterhub',
                  'installer.namespace': 'open-cluster-management',
                  'local-cluster': 'true',
                  name: 'local-cluster',
                  openshiftVersion: '4.10.20',
                  'velero.io/exclude-from-backup': 'true',
                  vendor: 'OpenShift',
                },
                name: 'local-cluster',
                namespace: 'local-cluster',
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-129-97.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-156-177.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-162-59.ec2.internal',
                    },
                  ],
                  ready: 3,
                  unhealthy: 0,
                  unknown: 0,
                },
                owner: {},
                provider: 'aws',
                status: 'ready',
                uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
              },
            ],
            clustersNames: ['local-cluster'],
            resourceCount: 1,
            sortedClusterNames: ['local-cluster'],
            subscription: {
              apiVersion: 'apps.open-cluster-management.io/v1',
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
                    creationTimestamp: '2022-08-30T18:32:19Z',
                    generation: 1,
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                    resourceVersion: '13499379',
                    uid: '05c760b0-ec56-45b9-997a-9e5d46c4ee64',
                  },
                  spec: {
                    pathname: 'https://github.com/fxiang1/app-samples',
                    type: 'Git',
                  },
                },
              ],
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44-new',
                  'apps.open-cluster-management.io/git-path': 'helloworld',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-23T15:03:42Z',
                generation: 1,
                labels: {
                  app: 'feng-hello',
                  'app.kubernetes.io/part-of': 'feng-hello',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-hello-subscription-1',
                namespace: 'feng-hello',
                resourceVersion: '60964376',
                uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
              },
              posthooks: [],
              prehooks: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2022-09-23T15:03:43Z',
                  generation: 29,
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
                      uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
                    },
                  ],
                  resourceVersion: '60964425',
                  uid: '5d1cb61c-c31e-46af-bbd2-d428255c5514',
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
              rules: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'PlacementRule',
                  metadata: {
                    annotations: {
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-23T15:03:42Z',
                    generation: 1,
                    labels: {
                      app: 'feng-hello',
                    },
                    name: 'feng-hello-placement-1',
                    namespace: 'feng-hello',
                    resourceVersion: '31574743',
                    uid: '917fc049-ac07-46bb-97d4-e10ed15ec0ec',
                  },
                  spec: {
                    clusterSelector: {
                      matchLabels: {
                        'local-cluster': 'true',
                      },
                    },
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                      },
                    ],
                  },
                },
              ],
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'feng-hello-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-10-27T14:31:54Z',
                phase: 'Propagated',
              },
            },
            title: '',
          },
          parentType: 'replicationcontroller',
          resources: undefined,
        },
        replicaCount: 1,
        resourceCount: 1,
        resources: undefined,
      },
      type: 'pod',
      uid: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--replicationcontroller--helloworld-app-deploy--pod--helloworld-app-deploy',
    }

    expect(createReplicaChild(parentObjectRC, clustersNames, template, [], [])).toEqual(result)
  })

  it('creates replicationcontroller with Pod', () => {
    const template = {
      related: [
        {
          __typename: 'SearchRelatedResult',
          kind: 'Pod',
          items: [
            {
              _uid: 'local-cluster/eef85598-8301-4d0d-b5b5-a9f2d43ebbb0',
              _hubClusterResource: 'true',
              name: 'helloworld-app-deploy-7998d94b96-ch2tj',
              startedAt: '2022-09-23T15:03:43Z',
              kind_plural: 'pods',
              podIP: '10.128.0.73',
              created: '2022-09-23T15:03:43Z',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              restarts: 20,
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              namespace: 'feng-hello',
              status: 'Running',
              hostIP: '10.0.156.177',
              container: 'helloworld-app-container',
              kind: 'Pod',
              apiversion: 'v1',
              cluster: 'local-cluster',
              _rbac: 'feng-hello_null_pods',
              _ownerUID: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
            },
          ],
        },
      ],
    }

    const result = {
      id: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--pod--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment',
          parentName: 'helloworld-app-deploy',
          parentSpecs: {
            clusters: [
              {
                clusterSet: 'default',
                consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                creationTimestamp: '2022-08-30T15:07:12Z',
                displayName: 'local-cluster',
                distribution: {
                  displayVersion: 'OpenShift 4.10.20',
                  isManagedOpenShift: false,
                  k8sVersion: 'v1.23.5+3afdacb',
                  ocp: {
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    channel: 'stable-4.10',
                    desired: {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                        'stable-4.11',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                      version: '4.10.20',
                    },
                    desiredVersion: '4.10.20',
                    managedClusterClientConfig: {
                      caBundle:
                        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                      url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                    },
                    version: '4.10.20',
                    versionAvailableUpdates: [
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                        version: '4.10.21',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                        version: '4.10.22',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                        version: '4.10.23',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                        version: '4.10.24',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                        version: '4.10.25',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                        version: '4.10.26',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                        version: '4.10.28',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                        version: '4.10.30',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                        version: '4.10.31',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                        version: '4.10.32',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:15832b3fc1eae4e3fafc97350e5d8a4d1be3948a6e5f5e9db8709b092d27e3da',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6532',
                        version: '4.10.33',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:8e2e492710a3b36b1de781ac1e926451cbf48b566c8781fb56ce03ff22752c9b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6663',
                        version: '4.10.34',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:766bc6b381163ecccfea00556dd336dd49067413f69cbc29337fea778295c7bb',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6728',
                        version: '4.10.35',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:afe912343dc35b6c2307e2e2b4d174057fd76095504215fe25277a795df8eae9',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6805',
                        version: '4.10.36',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:bd0603b261c362fb0589ac21444b7b9f4ecadb4cea9ef000164f1d3648116bce',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6901',
                        version: '4.10.37',
                      },
                    ],
                    versionHistory: [
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                        state: 'Completed',
                        verified: false,
                        version: '4.10.20',
                      },
                    ],
                  },
                  upgradeInfo: {
                    availableChannels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    currentChannel: 'stable-4.10',
                    currentVersion: '4.10.20',
                    desiredChannel: 'stable-4.10',
                    desiredVersion: '4.10.20',
                    hookFailed: false,
                    hooksInProgress: false,
                    isReadySelectChannels: true,
                    isReadyUpdates: true,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    isUpgrading: false,
                    latestJob: {
                      conditionMessage: '',
                      step: 'prehook-ansiblejob',
                    },
                    posthooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    prehooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    upgradeFailed: false,
                    upgradePercentage: '',
                  },
                },
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                isCurator: false,
                isHive: false,
                isHostedCluster: false,
                isHypershift: false,
                isManaged: true,
                isSNOCluster: false,
                kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                labels: {
                  cloud: 'Amazon',
                  cluster: 'error',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                  'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  'installer.name': 'multiclusterhub',
                  'installer.namespace': 'open-cluster-management',
                  'local-cluster': 'true',
                  name: 'local-cluster',
                  openshiftVersion: '4.10.20',
                  'velero.io/exclude-from-backup': 'true',
                  vendor: 'OpenShift',
                },
                name: 'local-cluster',
                namespace: 'local-cluster',
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-129-97.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-156-177.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-162-59.ec2.internal',
                    },
                  ],
                  ready: 3,
                  unhealthy: 0,
                  unknown: 0,
                },
                owner: {},
                provider: 'aws',
                status: 'ready',
                uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
              },
            ],
            clustersNames: ['local-cluster'],
            resourceCount: 1,
            sortedClusterNames: ['local-cluster'],
            subscription: {
              apiVersion: 'apps.open-cluster-management.io/v1',
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
                    creationTimestamp: '2022-08-30T18:32:19Z',
                    generation: 1,
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                    resourceVersion: '13499379',
                    uid: '05c760b0-ec56-45b9-997a-9e5d46c4ee64',
                  },
                  spec: {
                    pathname: 'https://github.com/fxiang1/app-samples',
                    type: 'Git',
                  },
                },
              ],
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44-new',
                  'apps.open-cluster-management.io/git-path': 'helloworld',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-23T15:03:42Z',
                generation: 1,
                labels: {
                  app: 'feng-hello',
                  'app.kubernetes.io/part-of': 'feng-hello',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-hello-subscription-1',
                namespace: 'feng-hello',
                resourceVersion: '60964376',
                uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
              },
              posthooks: [],
              prehooks: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2022-09-23T15:03:43Z',
                  generation: 29,
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
                      uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
                    },
                  ],
                  resourceVersion: '60964425',
                  uid: '5d1cb61c-c31e-46af-bbd2-d428255c5514',
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
              rules: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'PlacementRule',
                  metadata: {
                    annotations: {
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-23T15:03:42Z',
                    generation: 1,
                    labels: {
                      app: 'feng-hello',
                    },
                    name: 'feng-hello-placement-1',
                    namespace: 'feng-hello',
                    resourceVersion: '31574743',
                    uid: '917fc049-ac07-46bb-97d4-e10ed15ec0ec',
                  },
                  spec: {
                    clusterSelector: {
                      matchLabels: {
                        'local-cluster': 'true',
                      },
                    },
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                      },
                    ],
                  },
                },
              ],
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'feng-hello-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-10-27T14:31:54Z',
                phase: 'Propagated',
              },
            },
            title: '',
          },
          parentType: 'deploymentconfig',
          resources: undefined,
        },
        replicaCount: 1,
        resourceCount: 1,
        resources: undefined,
      },
      type: 'pod',
      uid: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--pod--helloworld-app-deploy',
    }
    expect(createReplicaChild(parentObjectRC, clustersNames, template, [], [])).toEqual(result)
  })

  it('creates replicationcontroller with pod', () => {
    const template = {
      related: [
        {
          __typename: 'SearchRelatedResult',
          kind: 'pod',
          items: [
            {
              _uid: 'local-cluster/eef85598-8301-4d0d-b5b5-a9f2d43ebbb0',
              _hubClusterResource: 'true',
              name: 'helloworld-app-deploy-7998d94b96-ch2tj',
              startedAt: '2022-09-23T15:03:43Z',
              kind_plural: 'pods',
              podIP: '10.128.0.73',
              created: '2022-09-23T15:03:43Z',
              label: 'app=helloworld-app; pod-template-hash=7998d94b96',
              restarts: 20,
              image: 'quay.io/fxiang1/helloworld:0.0.1',
              namespace: 'feng-hello',
              status: 'Running',
              hostIP: '10.0.156.177',
              container: 'helloworld-app-container',
              kind: 'pod',
              apiversion: 'v1',
              cluster: 'local-cluster',
              _rbac: 'feng-hello_null_pods',
              _ownerUID: 'local-cluster/f7820766-b181-436a-b481-0377390632e0',
            },
          ],
        },
      ],
    }

    const result = {
      id: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--pod--helloworld-app-deploy',
      name: 'helloworld-app-deploy',
      namespace: 'feng-hello',
      specs: {
        clustersNames: ['local-cluster'],
        isDesign: false,
        parent: {
          parentId:
            'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment',
          parentName: 'helloworld-app-deploy',
          parentSpecs: {
            clusters: [
              {
                clusterSet: 'default',
                consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                creationTimestamp: '2022-08-30T15:07:12Z',
                displayName: 'local-cluster',
                distribution: {
                  displayVersion: 'OpenShift 4.10.20',
                  isManagedOpenShift: false,
                  k8sVersion: 'v1.23.5+3afdacb',
                  ocp: {
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    channel: 'stable-4.10',
                    desired: {
                      channels: [
                        'candidate-4.10',
                        'candidate-4.11',
                        'eus-4.10',
                        'fast-4.10',
                        'fast-4.11',
                        'stable-4.10',
                        'stable-4.11',
                      ],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                      url: 'https://access.redhat.com/errata/RHBA-2022:5172',
                      version: '4.10.20',
                    },
                    desiredVersion: '4.10.20',
                    managedClusterClientConfig: {
                      caBundle:
                        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJV0MvQmpGQ01ORXN3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpJd056STRNVGt5TURVeVdoY05Nekl3TnpJMU1Ua3lNRFV5V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWFTWGQ3OHVQeTlCYXFjREV3NjJZek1kVEtUR1dZeQpjamVwVlpZSmJCNlJ4UFM5K3ROUjZOaitZdm1odkhGaUdkaXpvZ0lDOVhjME1WcDBOanhkSFNPSk9BaTN2MzYwCm91MVRHbjZDZFA0aFJIZjhKQkF5QUZIZHR6ZURDYjVBRTlSMjBYaXBIQmhadVlwT3VRYUFoaGNEbzErTkZrOUMKZndMWUw3MW9naENDVTYyWUV2cTVkQUZObE13Y2Y2TG5RYndvNUtta1l2bk9lU3hjU0dEY3RmZ3JWV1dRMWdhTQoxVWN1eWxJaFI4QlZCWUNEaC9zcXhPZ1BQZ2dzdmYxc0QvS1NBak12TDZlWkxETTA0MW80L3BHVVcxOTBnbG5ZCm5xcktHRVpqd2lHLzhLTnVQRERnTzJ2aHVTV085Y2lUU0dsSnNLMk96QkVLb3ZpU3ZudWZyZU1DQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkNlWgpDTHIzSGI3eG10MXJOZG5ja1R1MWRocnpNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUJUTVVyc0NCNTRRanRNCmNOcjFKQS83MThXcDRSV25IWXF5NUJEaW12bWJHVkhFZWwwdmVISW5ycEdxcjAzWjFjeXNjZDdndGF1MHgyRGoKai9uWFZtQnNvM1F2aUNJYzVGdko1R1UrRjRWamVFcDNrRzJOaWdhVU5zYnFGanQ3SGdFY1BseGdNRHNadkkvaQpUcnhIenh4ZDFrbWd6WVY0UXRpNkJ6VmRjY0hKT0pBc2FRZ2VxSWEvZHVyaXVQQUYyczlyeXBxVWUrVFJSQWFsCjhQY2xjcm1vVlZFY2lzMXdQQTV1L0ltNm9DZmpJQ1dlTjBNRXM1RzI4anYvRkRxQnA1K2tFalI1UnRoOTlqWE4KM3lGR3ZHcHU1VmEwYUZLVWRhRUdQc0M4TW1uK0QzZ1VSK2FnTkhxNG9KUENLSis1SEVtcUZmc2xpZERHQWZBVgplVXRyVjhLMwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSURWaDNXcFUrV3VVd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJeU1EY3lPREU1TWpBMU1Wb1hEVE15TURjeU5URTVNakExTVZvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuSjlud3Z6a3dlNDcKbENaRUE2U2J5alBqZlZWbmcraEl0OG5tT3hTREhlUUszd3IrMkJhbHF5WExSVC80S0lWYU54WHZyOVM0citiYwo4YUk3QlR0d1Y5cTJPMDNIelFwbXVZU2w2R2szOHNtaWhmdWJHeWxyMkJ2bTc2VlFqV0k4dGJ3UGlXZVlyOW91CmROeEM5UVRFUkg0N3FIRnJvTEJsVlAyMVdHZUJxanA0MHExNWtjOGNOdzlGK3FlYVFuaUtodlprR2RNNWc0V2sKWmlpSXBpOGpqaklIVUpaTXRaODE5THdUU2w3WXp0QzZ2RUtyalpEUmxYL1dCSDg0TXdTSktjaDg3UXdQQmJKZgpGSFdsckpBeWwrVXZOakJ5ZE5kNGllQm5WMExTaGt6M3ZYbUZxc2F5YUQraVNWY2I1ZjdaRHAvSXoyQmVnVm9tCmpmemIvTTdUcXdJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVU9ZMnUxQlplL0NCWkhub0pnS0x5QWN4L0FXTXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUNrdGNnN3R2b2ZEeko3RjZJYzM0Y1hMU1JSaWliaWZ1dGFpd3owWmFTZ2JOMVk5OUJ1MzJBL2RiN1JaClh2OEZrNHJlRk1XU0NuWkZOdERkbmVjTWtBanNKS29ReFJwVEZQSFpYRWVxcWVVc3RYNWxSR09NTGRKOE9tS28KWEYxZUcwdXNKTWk5VHhNSlhHaFU3WFNXMnF4bXlJMHpUOWxveTl6bk1PYy9ZNHpFVTd5aG5rd0RtVUhIYWJMbAprMmMzNGJmYThjaWFEVmJqQTF4aFNuNDR5YVNUUHordmJhcVpybnE2WFEvMllFcnJWZks3cHVrcHJOTTFiRTg4CkIyRlcvdWloblAwekREUkM4RXZnckY1bFloTWpXUjFkS1RWRDhmWFJ5bStqWlN3SzhpUmtkWlhuNnJIdFlDd2oKdDJqMkRzN253SC91b1VidTlRRHZlZUEzVlhRPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSWFvb21yNmNib3Zzd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl5TURjeU9ERTVNakExTVZvWERUTXlNRGN5TlRFNU1qQTFNVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXpzT1RZdDhkLzVxVTFPOEo2YW5sU25HMXJ2MlVXWTlVVUdmaXJ3bi9SV1VES2g4QW15MituejQ2NlhUaAo1OE56N2UwdGJoUGJwNVVlVHl5MFppWmd2VndMUk5IbDdYWVJsaVk5U3FQQ1A1VkFxd3lKdEVkQ0hYN0ZmdHczCmcyWmwrb2NySldMNUpDWU9TUk52NWVvR2d3RjVNSU5ybTE5ZDVXdThUM3UvVEgyS09PVjdRcUZ3dVlkdXp2bHgKbm1YQ3hmM1NvdTdMTkM4Y3lybXJ4MnVCdTM1ZHBvZHNKcFRWb3lEUEp4R1RNWjZkN0YzWjZmeW9nUDI2UHpSRQo0eklLVjZpbEQ2dDhFYlYwcCtsUWJKVzRxbDJaQ0NLMHUzWEVITWp3dVM1d3oxYlFYSkJoYmNEaTVZOEZQQmRQCnBsR3ZEOGJKaUFRdGlPaXJjU3NJSjc2eHhRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV0MTU1eUordzl4UE9KS2E0dm1RMGp0WFpuNWt3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHSlk3dEJPTHBHdFZ4RDF6V3BjaVdHejgvOXJ5Mjc1TXY2QlpqZkdoOEozClEraU80ZDZ0ak5LUlRXSjJ1Z3JpV1I1NGZ1K2FsazRDT1d3TFNUNnU3N3pjbUkwYTRVTDh0bDcrTDQvaTdsZ1YKT0w1SlpUN0FQNkkycEZVSVFhMUp0d3NUZGljY3lvWGJUWm9wVEdFbHppTGhnWW5nNkFGSFVsTE9OREJnTlI5WApwdHp0REZ4TTZVNGlkRExNTTJ6aWNlMzcxQkl5c25yUzRPNXRicUpzOFVxS3QrNmd1L3dNMXRIZk1qNy9sb3ROCnpOTFpjYzdaM09XYVlJaCtMTDQvMVkxMTdsQXBJVlFpRHJTcVRqQ0RubW1XeFdlZnBrVGhhZVRqL2w5NDZ4SmQKdTk1SEJER2hjZ2trWWJYTWQyS1I2Q3FJOE92TjJOU1BxTHh6VGs0SEdXaz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUllZklVOThuTFJGRXdEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpVNU1ETTJOamt3TUI0WERUSXlNRGN5T0RFNU16RXkKT1ZvWERUTXlNRGN5TlRFNU16RXpNRm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOalU1TURNMk5qa3dNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXMzMHQKRWt0VVJDVWhzOERhSHcrUzAyanE0QURXUllFd2RRZjlVNFBwT20xTmxUMCtOQzNjSWRVcGJzUFBIWjZMMTdrUgprSUx0aGc4bzcxY1M5RXJxM2hnT0FVZHVHQWtOdVFCcFRrT3hpWmZ4c2NkVUtTdlVMdFJ1YlR4NWE2cDdWaS9uCjNGak5CY040SlJpWEVDKzlFbWVQcURFc2wzdFVYT2FUWExIVkRaakNoVFlNRzM4ZC9OMnNJZ1BPbUFTa3dRVXcKSUJBajZXblhCdndxRmVxdzRoemt5OU5pSWtrNm9pYXFpNFFqQm9NdlRYaEc5MmR2cHhaaHlHNWx0NkFvVHQ2ZgpqOVdzK0NWbmtvT0lOdldxWkREekZxYjRTVjJNbmdic3hhb3RlMnhXRmVmN2FHTmVJQlZNWm5aeHJTclB2cTZXCjZITjI2Mi82THlyYlQ2SGpPd0lEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0h3WURWUjBqQkJndwpGb0FVTzhXTTNhM3NrQkd2dzFyRkxIaDc1dVVqbW0wd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFCKzdMRlVpCkFreUFmODVITVp3eVNsVlZ2VEpEVXFwZ0RvSVlnME9kdm5YVEdDd0JVdStzcjV4MDBGRkZ5ZUo5ZzhGRGVId3cKaTNtNk5iMXFFb0loRVo2UHZGcHVocWJqMkc3TDh6STMrcU9rdHV2VEpmai96dDA4YVlGNUl0ME51M01LL3ZKYQpNOXcxMkt3N3FNV1hLa3ptOTZwOEQwQ0hXQWpiQWtMRXVEUlB6MHd1cW93bDRCakNDdWd2M2V0MHp3VFRJemxLCkl3RlFLb0djZXlkUlRsalRKRXV2RGwrdW1vbnk2UEQrV3FHQW9YMDd4TTBLWEx3am81eVFUMENUa3d2dDZPWTYKU015QVRGZjBkT2M3dUZJRGQ5R01NaS9PV0Q3eVJtY0dCWEJWWHBJUmgwMVFBaE9SdytZWnM1OTI4L1J5dUtoZgozVGJYenUvcExmSUVzdVk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURwVENDQW8yZ0F3SUJBZ0lJRkkzaGVQY0JFL1F3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qVTVNRE0yTnpZMk1CNFhEVEl5TURjeU9ERTVNekkwTmxvWApEVEkwTURjeU56RTVNekkwTjFvd1FqRkFNRDRHQTFVRUF3dzNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXdMV2gxCllpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y04KQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQVAxTXkrY3V4bklmME5PVytDNDkvRU16d2s3eHJQdlo1Q3lpcVJEWQpmK3dpT2pYS3hZbmgrQ2phQ0RiZ0YxMXg3bkFraFBpTnE2bWtPMVluNm5xd0JVZ21WV05DTlc3NHhncFkxVFhHCmMrbkpJU2prelJvM0xscXVSOUIrZ0Z6TnBqVnhTbU51K0RGSHgvazJOa2FKZXM4UHlmNGw5SCtUT2xKbWhWSDkKRFNZN1RDUFFLNVV4Vmp1bU40TE9qTG5CNS8rTnIyNEpZcjZZQWZYKy9jZ3cvT2tVeWFaamk2TnFMKzBIZ3FrVAozemg0T1h1N05ERmxBU204TXpVOE1DalZVOHR2MWh2MTZVWU9aeWxTSTFsclRuMFl1dDNLY0hPNjRLTThFWGRzCm1SREkxaVQ5bC9qcnJERlI5aHNnelFEQVBBa0NXdHY5bzAxcmUxYUg5S1NkRjVzQ0F3RUFBYU9CdWpDQnR6QU8KQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3REFZRFZSMFRBUUgvQkFJdwpBREFkQmdOVkhRNEVGZ1FVa3JPUXFpNVJuRUU5aHpzVm9RWjJEc0ZFT2x3d0h3WURWUjBqQkJnd0ZvQVVZeHZjCmxFWjlVcHlmMWRWQUJmb1RUdFNSOXpvd1FnWURWUjBSQkRzd09ZSTNLaTVoY0hCekxtRndjQzFoZDNNdE5ERXcKTFdoMVlpMW1jR2QzWXk1a1pYWXdOaTV5WldRdFkyaGxjM1JsY21acFpXeGtMbU52YlRBTkJna3Foa2lHOXcwQgpBUXNGQUFPQ0FRRUFEWDk4aUlPaUdSdGUvc1FMUTRKL25yNUdMc0REUlY2Q3J6TnVhMFdseDFBakRuOUlOVWExCmNBWHVrZDNKQ0YxTXlqdHQyVW4yem9wWTBFSG1PcGxGU0pZdk9rVzM3VTNyMTRydGhiN3hRTWhpU1phVjZrRUkKMEpVRm1CWGlDc1YvaE9FT0c3MXVTR01XalVmcnRXOEZLZWs4a1FibFJOS0R4MWNLM1ZxZHpRRWhqVXZHM0JFdApXSmF4T1F6STczTjY2NE4xYVQ2dkhsRjZRa1JweWlYWlVoOVNoa21YREhoY2NybGIrZVpiMGpwTkVYSitHWnZECllsS3kxUy9zME1vYWl5K0piZXFSZm1PU21GWDA4eVM2T3JiRS95SDljMk1FWE5kTkRGeDIra0NjakJxZFBFZU0KbG91TVJPNERkQlBuaStic0FEaW5hOEV2M0JJS1pSdnVMZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURERENDQWZTZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFtTVNRd0lnWURWUVFEREJ0cGJtZHkKWlhOekxXOXdaWEpoZEc5eVFERTJOVGt3TXpZM05qWXdIaGNOTWpJd056STRNVGt6TWpRMVdoY05NalF3TnpJMwpNVGt6TWpRMldqQW1NU1F3SWdZRFZRUUREQnRwYm1keVpYTnpMVzl3WlhKaGRHOXlRREUyTlRrd016WTNOall3CmdnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUURYOFBLUUs0MkwwUjEvdHpKcUEzRmQKU0d1RFlsbjhNbkxhSkFUMFFsUEdySWdTSkhqQndxb2gxaUVWK3FDUXM0K0cybDhDZG9aMjZnZzFCUm5QdExWZQpidUJJb3Q2NDY0R3NVRDBWdU9pYWl5SVFGL2F0UFNsZGpCdXJXZmJGZEN2TlR5VU00N211eTVaZXZtbi9JNUFwCkdKbS9veUEwZnpJRHpTajdpSWVZZjcxUE1nc0x3bVVkcGxaYkNJWGRGV241L2NVTGRLYTMzNzRTbVlEWk84dVYKakNZZm9xcWtiVFNnSEhFdldlSmxiaUhxcm1UV3VsU204bmZnZWQrQTVrWWNGM0ZJOFoyNEJGL0xuRGd5TWlrRApWYWU2ckI1Nm81SkVDNGRnUkE4RXlKOGxFZEtpMVJPSDBscW8zeEJVL3IySVQvV2VJUWxxTFd0NlBTOEJpTGxiCkFnTUJBQUdqUlRCRE1BNEdBMVVkRHdFQi93UUVBd0lDcERBU0JnTlZIUk1CQWY4RUNEQUdBUUgvQWdFQU1CMEcKQTFVZERnUVdCQlJqRzl5VVJuMVNuSi9WMVVBRitoTk8xSkgzT2pBTkJna3Foa2lHOXcwQkFRc0ZBQU9DQVFFQQoxRUZiQ3N1MXJVTlRLRW1jOUs1UmZTcG15bTJ2Tzc1YWRENlI0R0N0VU9GamY4NEVkeVJGOFhLZjBlbmdvbENSClpHMFJpVjdvMmlORmd5WkRhcU51YmF6QlVyRUVWN3BDWGxxaktyZXoxcW4rTTFvak1KcGlNVndlWTkzenBlOSsKcDREdEllVklpN0FKUDdoQUI0d2RkU2dWenczVk00Qm5sYllOK2NHK1BFR2c3SHRXT0psb0x2NENObzFLK0kvVwozNUR3SXM0ZFowRW5aM2RlKzNCazZEc2h1M1p5YWxWN3pvYWE4N25qblJxemtyZ01sWEpmSG5xRlFydlNPanBRCis0WlN5SVdXOTZZWndLTkpKSVo1NlBicnVpU3lMZnFNNk93QUhqM3c3ZzliYjFFaEJNbHZuVXRKczBPMkJYK00KOTBXYk1WUERUM2tmYW55dDJLMXJHZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
                      url: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                    },
                    version: '4.10.20',
                    versionAvailableUpdates: [
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:420ee7160d4970304ae97a1b0a77d9bd52af1fd97c597d7cb5d5a2c0d0b72dda',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5428',
                        version: '4.10.21',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:62c995079672535662ee94ef2358ee6b0e700475c38f6502ca2d3d13d9d7de5b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5513',
                        version: '4.10.22',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e40e49d722cb36a95fa1c03002942b967ccbd7d68de10e003f0baa69abad457b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:5568',
                        version: '4.10.23',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:aab51636460b5a9757b736a29bc92ada6e6e6282e46b06e6fd483063d590d62a',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5664',
                        version: '4.10.24',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:ed84fb3fbe026b3bbb4a2637ddd874452ac49c6ead1e15675f257e28664879cc',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5730',
                        version: '4.10.25',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:e1fa1f513068082d97d78be643c369398b0e6820afab708d26acda2262940954',
                        url: 'https://access.redhat.com/errata/RHSA-2022:5875',
                        version: '4.10.26',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:2127608ebd67a2470860c42368807a0de2308dba144ec4c298bec1c03d79cb52',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6095',
                        version: '4.10.28',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:7f543788330d486627c612c64eebc8e992944991e21cfdb771fd36725b277f07',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6133',
                        version: '4.10.30',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:86f3b85645c613dc4a79d04c28b9bbd3519745f0862e30275acceadcbc409b42',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6258',
                        version: '4.10.31',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:9f53e05393bcc9bc1ab9666b1e4307ea44be896342b3b64ab465e59bac0dbd34',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6372',
                        version: '4.10.32',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:15832b3fc1eae4e3fafc97350e5d8a4d1be3948a6e5f5e9db8709b092d27e3da',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6532',
                        version: '4.10.33',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:8e2e492710a3b36b1de781ac1e926451cbf48b566c8781fb56ce03ff22752c9b',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6663',
                        version: '4.10.34',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:766bc6b381163ecccfea00556dd336dd49067413f69cbc29337fea778295c7bb',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6728',
                        version: '4.10.35',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:afe912343dc35b6c2307e2e2b4d174057fd76095504215fe25277a795df8eae9',
                        url: 'https://access.redhat.com/errata/RHSA-2022:6805',
                        version: '4.10.36',
                      },
                      {
                        channels: [
                          'candidate-4.10',
                          'candidate-4.11',
                          'eus-4.10',
                          'fast-4.10',
                          'fast-4.11',
                          'stable-4.10',
                          'stable-4.11',
                        ],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:bd0603b261c362fb0589ac21444b7b9f4ecadb4cea9ef000164f1d3648116bce',
                        url: 'https://access.redhat.com/errata/RHBA-2022:6901',
                        version: '4.10.37',
                      },
                    ],
                    versionHistory: [
                      {
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:b89ada9261a1b257012469e90d7d4839d0d2f99654f5ce76394fa3f06522b600',
                        state: 'Completed',
                        verified: false,
                        version: '4.10.20',
                      },
                    ],
                  },
                  upgradeInfo: {
                    availableChannels: [
                      'candidate-4.10',
                      'candidate-4.11',
                      'eus-4.10',
                      'fast-4.10',
                      'fast-4.11',
                      'stable-4.10',
                      'stable-4.11',
                    ],
                    availableUpdates: [
                      '4.10.21',
                      '4.10.22',
                      '4.10.23',
                      '4.10.24',
                      '4.10.25',
                      '4.10.26',
                      '4.10.28',
                      '4.10.30',
                      '4.10.31',
                      '4.10.32',
                      '4.10.33',
                      '4.10.34',
                      '4.10.35',
                      '4.10.36',
                      '4.10.37',
                    ],
                    currentChannel: 'stable-4.10',
                    currentVersion: '4.10.20',
                    desiredChannel: 'stable-4.10',
                    desiredVersion: '4.10.20',
                    hookFailed: false,
                    hooksInProgress: false,
                    isReadySelectChannels: true,
                    isReadyUpdates: true,
                    isSelectingChannel: false,
                    isUpgradeCuration: false,
                    isUpgrading: false,
                    latestJob: {
                      conditionMessage: '',
                      step: 'prehook-ansiblejob',
                    },
                    posthooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    prehooks: {
                      failed: false,
                      hasHooks: false,
                      inProgress: false,
                      success: false,
                    },
                    upgradeFailed: false,
                    upgradePercentage: '',
                  },
                },
                hive: {
                  isHibernatable: false,
                  secrets: {},
                },
                isCurator: false,
                isHive: false,
                isHostedCluster: false,
                isHypershift: false,
                isManaged: true,
                isSNOCluster: false,
                kubeApiServer: 'https://api.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com:6443',
                labels: {
                  cloud: 'Amazon',
                  cluster: 'error',
                  'cluster.open-cluster-management.io/clusterset': 'default',
                  clusterID: 'c5f0b499-3a45-4280-bb80-b1547a948fe3',
                  'feature.open-cluster-management.io/addon-application-manager': 'available',
                  'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                  'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                  'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
                  'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                  'feature.open-cluster-management.io/addon-work-manager': 'available',
                  'installer.name': 'multiclusterhub',
                  'installer.namespace': 'open-cluster-management',
                  'local-cluster': 'true',
                  name: 'local-cluster',
                  openshiftVersion: '4.10.20',
                  'velero.io/exclude-from-backup': 'true',
                  vendor: 'OpenShift',
                },
                name: 'local-cluster',
                namespace: 'local-cluster',
                nodes: {
                  nodeList: [
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-129-97.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-156-177.ec2.internal',
                    },
                    {
                      capacity: {
                        cpu: '8',
                        memory: '32561100Ki',
                        socket: '1',
                      },
                      conditions: [
                        {
                          status: 'True',
                          type: 'Ready',
                        },
                      ],
                      labels: {
                        'beta.kubernetes.io/instance-type': 't3.2xlarge',
                        'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                        'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                        'node-role.kubernetes.io/master': '',
                        'node-role.kubernetes.io/worker': '',
                        'node.kubernetes.io/instance-type': 't3.2xlarge',
                      },
                      name: 'ip-10-0-162-59.ec2.internal',
                    },
                  ],
                  ready: 3,
                  unhealthy: 0,
                  unknown: 0,
                },
                owner: {},
                provider: 'aws',
                status: 'ready',
                uid: 'd1210fe4-5348-4596-92e0-f87f13eb5105',
              },
            ],
            clustersNames: ['local-cluster'],
            resourceCount: 1,
            sortedClusterNames: ['local-cluster'],
            subscription: {
              apiVersion: 'apps.open-cluster-management.io/v1',
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
                    creationTimestamp: '2022-08-30T18:32:19Z',
                    generation: 1,
                    name: 'ggithubcom-fxiang1-app-samples',
                    namespace: 'ggithubcom-fxiang1-app-samples-ns',
                    resourceVersion: '13499379',
                    uid: '05c760b0-ec56-45b9-997a-9e5d46c4ee64',
                  },
                  spec: {
                    pathname: 'https://github.com/fxiang1/app-samples',
                    type: 'Git',
                  },
                },
              ],
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': 'c5ce80a1ee92ce5d64ceb19821216ef6915bec44-new',
                  'apps.open-cluster-management.io/git-path': 'helloworld',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2022-09-23T15:03:42Z',
                generation: 1,
                labels: {
                  app: 'feng-hello',
                  'app.kubernetes.io/part-of': 'feng-hello',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-hello-subscription-1',
                namespace: 'feng-hello',
                resourceVersion: '60964376',
                uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
              },
              posthooks: [],
              prehooks: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2022-09-23T15:03:43Z',
                  generation: 29,
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
                      uid: '8a1e0807-0af9-4c5e-9590-4a95929402fe',
                    },
                  ],
                  resourceVersion: '60964425',
                  uid: '5d1cb61c-c31e-46af-bbd2-d428255c5514',
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
              rules: [
                {
                  apiVersion: 'apps.open-cluster-management.io/v1',
                  kind: 'PlacementRule',
                  metadata: {
                    annotations: {
                      'open-cluster-management.io/user-group':
                        'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                      'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                    },
                    creationTimestamp: '2022-09-23T15:03:42Z',
                    generation: 1,
                    labels: {
                      app: 'feng-hello',
                    },
                    name: 'feng-hello-placement-1',
                    namespace: 'feng-hello',
                    resourceVersion: '31574743',
                    uid: '917fc049-ac07-46bb-97d4-e10ed15ec0ec',
                  },
                  spec: {
                    clusterSelector: {
                      matchLabels: {
                        'local-cluster': 'true',
                      },
                    },
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                      },
                    ],
                  },
                },
              ],
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'PlacementRule',
                    name: 'feng-hello-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2022-10-27T14:31:54Z',
                phase: 'Propagated',
              },
            },
            title: '',
          },
          parentType: 'deploymentconfig',
          resources: undefined,
        },
        replicaCount: 1,
        resourceCount: 1,
        resources: undefined,
      },
      type: 'pod',
      uid: 'member--deployed-resource--member--clusters--local-cluster--feng-hello-subscription-1--feng-hello--helloworld-app-deploy--deployment--pod--helloworld-app-deploy',
    }
    expect(createReplicaChild(parentObjectRC, clustersNames, template, [], [])).toEqual(result)
  })
})

describe('getSubscriptionTopology', () => {
  const application = {
    name: 'feng-cronjob',
    namespace: 'feng-cronjob',
    app: {
      apiVersion: 'app.k8s.io/v1beta1',
      kind: 'Application',
      metadata: {
        annotations: {
          'apps.open-cluster-management.io/deployables': '',
          'apps.open-cluster-management.io/subscriptions':
            'feng-cronjob/feng-cronjob-subscription-1,feng-cronjob/feng-cronjob-subscription-1-local',
          'open-cluster-management.io/user-group':
            'c3lzdGVtOnNlcnZpY2VhY2NvdW50cyxzeXN0ZW06c2VydmljZWFjY291bnRzOm9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50LHN5c3RlbTphdXRoZW50aWNhdGVk',
          'open-cluster-management.io/user-identity':
            'c3lzdGVtOnNlcnZpY2VhY2NvdW50Om9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50Om11bHRpY2x1c3Rlci1hcHBsaWNhdGlvbnM=',
        },
        creationTimestamp: '2023-04-27T14:32:09Z',
        generation: 1,
        name: 'feng-cronjob',
        namespace: 'feng-cronjob',
        resourceVersion: '13641704',
        uid: 'eafafbed-763e-44c9-bf05-6505ba304c78',
      },
      spec: {
        componentKinds: [
          {
            group: 'apps.open-cluster-management.io',
            kind: 'Subscription',
          },
        ],
        descriptor: {},
        selector: {
          matchExpressions: [
            {
              key: 'app',
              operator: 'In',
              values: ['feng-cronjob'],
            },
          ],
        },
      },
    },
    metadata: {
      annotations: {
        'apps.open-cluster-management.io/deployables': '',
        'apps.open-cluster-management.io/subscriptions':
          'feng-cronjob/feng-cronjob-subscription-1,feng-cronjob/feng-cronjob-subscription-1-local',
        'open-cluster-management.io/user-group':
          'c3lzdGVtOnNlcnZpY2VhY2NvdW50cyxzeXN0ZW06c2VydmljZWFjY291bnRzOm9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50LHN5c3RlbTphdXRoZW50aWNhdGVk',
        'open-cluster-management.io/user-identity':
          'c3lzdGVtOnNlcnZpY2VhY2NvdW50Om9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50Om11bHRpY2x1c3Rlci1hcHBsaWNhdGlvbnM=',
      },
      creationTimestamp: '2023-04-27T14:32:09Z',
      generation: 1,
      name: 'feng-cronjob',
      namespace: 'feng-cronjob',
      resourceVersion: '13641704',
      uid: 'eafafbed-763e-44c9-bf05-6505ba304c78',
    },
    isArgoApp: false,
    isAppSet: false,
    isOCPApp: false,
    isFluxApp: false,
    channels: [
      'feng-cronjob/feng-cronjob-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
    ],
    subscriptions: [
      {
        apiVersion: 'apps.open-cluster-management.io/v1',
        kind: 'Subscription',
        metadata: {
          annotations: {
            'apps.open-cluster-management.io/git-branch': 'main',
            'apps.open-cluster-management.io/git-current-commit': '7b1ca44656bfaffbdac5aaaabf78c367c52b91b0-new',
            'apps.open-cluster-management.io/git-path': 'cronjob',
            'apps.open-cluster-management.io/manual-refresh-time': '2023-04-27T18:08:02.500Z',
            'apps.open-cluster-management.io/reconcile-option': 'merge',
            'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
            'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
          },
          creationTimestamp: '2023-04-27T14:32:09Z',
          generation: 1,
          labels: {
            app: 'feng-cronjob',
            'app.kubernetes.io/part-of': 'feng-cronjob',
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
          },
          name: 'feng-cronjob-subscription-1',
          namespace: 'feng-cronjob',
          resourceVersion: '15066022',
          uid: '30218235-d4c2-490d-8202-cd909d9c2824',
        },
        spec: {
          channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
          placement: {
            placementRef: {
              kind: 'Placement',
              name: 'feng-cronjob-placement-1',
            },
          },
        },
        status: {
          lastUpdateTime: '2023-05-01T13:36:20Z',
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
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
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
              creationTimestamp: '2023-04-27T14:32:09Z',
              generation: 1,
              labels: {
                'cluster.open-cluster-management.io/placement': 'feng-cronjob-placement-1',
              },
              name: 'feng-cronjob-placement-1-decision-1',
              namespace: 'feng-cronjob',
              ownerReferences: [
                {
                  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Placement',
                  name: 'feng-cronjob-placement-1',
                  uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
                },
              ],
              resourceVersion: '15067334',
              uid: '31368536-3ffa-4838-a849-4dfe00c89983',
            },
            status: {
              decisions: [
                {
                  clusterName: 'feng-managed',
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
              creationTimestamp: '2023-04-27T14:32:09Z',
              generation: 1,
              labels: {
                app: 'feng-cronjob',
              },
              name: 'feng-cronjob-placement-1',
              namespace: 'feng-cronjob',
              resourceVersion: '15067336',
              uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
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
                  lastTransitionTime: '2023-04-27T14:32:09Z',
                  message: 'Placement configurations check pass',
                  reason: 'Succeedconfigured',
                  status: 'False',
                  type: 'PlacementMisconfigured',
                },
                {
                  lastTransitionTime: '2023-04-27T14:32:09Z',
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
            creationTimestamp: '2023-04-27T14:32:10Z',
            generation: 271,
            labels: {
              'apps.open-cluster-management.io/hosting-subscription': 'feng-cronjob.feng-cronjob-subscription-1',
            },
            name: 'feng-cronjob-subscription-1',
            namespace: 'feng-cronjob',
            ownerReferences: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Subscription',
                name: 'feng-cronjob-subscription-1',
                uid: '30218235-d4c2-490d-8202-cd909d9c2824',
              },
            ],
            resourceVersion: '15067378',
            uid: '0565dd80-4e28-49ce-add5-a2ba77ac31c5',
          },
          reportType: 'Application',
          resources: [
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello2',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello3',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello5',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello7',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello8',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello1',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello4',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello6',
              namespace: 'feng-cronjob',
            },
          ],
          results: [
            {
              result: 'deployed',
              source: 'feng-managed',
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
    ],
    allSubscriptions: [
      {
        apiVersion: 'apps.open-cluster-management.io/v1',
        kind: 'Subscription',
        metadata: {
          annotations: {
            'apps.open-cluster-management.io/git-branch': 'main',
            'apps.open-cluster-management.io/git-current-commit': '7b1ca44656bfaffbdac5aaaabf78c367c52b91b0-new',
            'apps.open-cluster-management.io/git-path': 'cronjob',
            'apps.open-cluster-management.io/manual-refresh-time': '2023-04-27T18:08:02.500Z',
            'apps.open-cluster-management.io/reconcile-option': 'merge',
            'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
            'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
          },
          creationTimestamp: '2023-04-27T14:32:09Z',
          generation: 1,
          labels: {
            app: 'feng-cronjob',
            'app.kubernetes.io/part-of': 'feng-cronjob',
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
          },
          name: 'feng-cronjob-subscription-1',
          namespace: 'feng-cronjob',
          resourceVersion: '15066022',
          uid: '30218235-d4c2-490d-8202-cd909d9c2824',
        },
        spec: {
          channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
          placement: {
            placementRef: {
              kind: 'Placement',
              name: 'feng-cronjob-placement-1',
            },
          },
        },
        status: {
          lastUpdateTime: '2023-05-01T13:36:20Z',
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
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
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
              creationTimestamp: '2023-04-27T14:32:09Z',
              generation: 1,
              labels: {
                'cluster.open-cluster-management.io/placement': 'feng-cronjob-placement-1',
              },
              name: 'feng-cronjob-placement-1-decision-1',
              namespace: 'feng-cronjob',
              ownerReferences: [
                {
                  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Placement',
                  name: 'feng-cronjob-placement-1',
                  uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
                },
              ],
              resourceVersion: '15067334',
              uid: '31368536-3ffa-4838-a849-4dfe00c89983',
            },
            status: {
              decisions: [
                {
                  clusterName: 'feng-managed',
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
              creationTimestamp: '2023-04-27T14:32:09Z',
              generation: 1,
              labels: {
                app: 'feng-cronjob',
              },
              name: 'feng-cronjob-placement-1',
              namespace: 'feng-cronjob',
              resourceVersion: '15067336',
              uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
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
                  lastTransitionTime: '2023-04-27T14:32:09Z',
                  message: 'Placement configurations check pass',
                  reason: 'Succeedconfigured',
                  status: 'False',
                  type: 'PlacementMisconfigured',
                },
                {
                  lastTransitionTime: '2023-04-27T14:32:09Z',
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
            creationTimestamp: '2023-04-27T14:32:10Z',
            generation: 271,
            labels: {
              'apps.open-cluster-management.io/hosting-subscription': 'feng-cronjob.feng-cronjob-subscription-1',
            },
            name: 'feng-cronjob-subscription-1',
            namespace: 'feng-cronjob',
            ownerReferences: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Subscription',
                name: 'feng-cronjob-subscription-1',
                uid: '30218235-d4c2-490d-8202-cd909d9c2824',
              },
            ],
            resourceVersion: '15067378',
            uid: '0565dd80-4e28-49ce-add5-a2ba77ac31c5',
          },
          reportType: 'Application',
          resources: [
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello2',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello3',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello5',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello7',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello8',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello1',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello4',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello6',
              namespace: 'feng-cronjob',
            },
          ],
          results: [
            {
              result: 'deployed',
              source: 'feng-managed',
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
    ],
    allChannels: [
      {
        apiVersion: 'apps.open-cluster-management.io/v1',
        kind: 'Channel',
        metadata: {
          annotations: {
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
            'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
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
    allClusters: ['feng-managed', 'local-cluster'],
    reports: [
      {
        apiVersion: 'apps.open-cluster-management.io/v1alpha1',
        kind: 'SubscriptionReport',
        metadata: {
          creationTimestamp: '2023-04-27T14:32:10Z',
          generation: 271,
          labels: {
            'apps.open-cluster-management.io/hosting-subscription': 'feng-cronjob.feng-cronjob-subscription-1',
          },
          name: 'feng-cronjob-subscription-1',
          namespace: 'feng-cronjob',
          ownerReferences: [
            {
              apiVersion: 'apps.open-cluster-management.io/v1',
              blockOwnerDeletion: true,
              controller: true,
              kind: 'Subscription',
              name: 'feng-cronjob-subscription-1',
              uid: '30218235-d4c2-490d-8202-cd909d9c2824',
            },
          ],
          resourceVersion: '15067378',
          uid: '0565dd80-4e28-49ce-add5-a2ba77ac31c5',
        },
        reportType: 'Application',
        resources: [
          {
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            name: 'hello',
            namespace: 'feng-cronjob',
          },
          {
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            name: 'hello2',
            namespace: 'feng-cronjob',
          },
          {
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            name: 'hello3',
            namespace: 'feng-cronjob',
          },
          {
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            name: 'hello5',
            namespace: 'feng-cronjob',
          },
          {
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            name: 'hello7',
            namespace: 'feng-cronjob',
          },
          {
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            name: 'hello8',
            namespace: 'feng-cronjob',
          },
          {
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            name: 'hello1',
            namespace: 'feng-cronjob',
          },
          {
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            name: 'hello4',
            namespace: 'feng-cronjob',
          },
          {
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            name: 'hello6',
            namespace: 'feng-cronjob',
          },
        ],
        results: [
          {
            result: 'deployed',
            source: 'feng-managed',
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
    ],
    activeChannel:
      'feng-cronjob/feng-cronjob-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
  }

  const managedClusters = [
    {
      name: 'feng-managed',
      displayName: 'feng-managed',
      namespace: 'feng-managed',
      uid: 'e0364872-d194-4010-866e-b2bfc2f31ce8',
      status: 'ready',
      provider: 'aws',
      distribution: {
        k8sVersion: 'v1.25.7+eab9cc9',
        ocp: {
          availableUpdates: ['4.12.13', '4.12.14'],
          channel: 'stable-4.12',
          desired: {
            channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:31510c9b02d7dbfc31b5cc3d914415d7515961eb1a23066af3ae9639b344ed13',
            url: 'https://access.redhat.com/errata/RHBA-2023:1734',
            version: '4.12.12',
          },
          desiredVersion: '4.12.12',
          managedClusterClientConfig: {
            caBundle:
              'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJUlZwcnZzZVZkZzB3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpNd05ESTBNVGsxTnpFNVdoY05Nek13TkRJeE1UazFOekU1V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTDJnUEFWeFZPS1RMTFBmRkVNYzZ0cTFJZjVCZmJ5Vgo3NCtCZU9Beklud1N3WVIvelJJNzNrdldYclAxejV5ZDV4YXV5aStPdmNQSXNuLy9qL0NWZEJsSi9TTklaY1hJCmR0SlBIUHE3Sk8zTHFzQmxxZCtLNHdHL2dPdTV5TDd1WVRGLy81SjN5N3ViWVNrN2FkZjF0dnFUQVRKaTIxVlkKZFRHMTcwZG5way9kVXluZVQ2NGd1SjV1VmhKcWw5ZGFBR2J2QlM5UllRZzhtOXd0aDcxa1pkZ2lnRStJZHZJZQpha3g2enE3NEQrQ2xORy9MRFlPYnZ0dTNGaFQvNytBSjExUDVJZUV5VE1tSi94dVgxempEOXpacUpva2crWFV2CllkSW5CWEdycFBTeHFvYnZDNGorejNaK3pDNFlIcWN1elZGZHZxUjR0VWtMb3Z6NmtnUXV3TlVDQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkcxbQoxRDlmb2Z6RnROUVhaWHpYK2pRSnNlRXZNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUNGa1UwYjU2anlOSGpXCmtkU1BzL3F5RmxMMXkxZTdoOWNiWWR2bXl1N0w2SFl5WWxRQ05OcjdJOGVMbTVwOEV5THNaYXh2Rzg1aFNwYlgKTEZHVXFwSVVwMy9EdlBvRHRoTlFCYURVNHNtLzJYT3BKN2svdStSNkZxL2lvMTJHcXBvZHc1QWlzVkplb0FIVQpUV0RyYllNRnBQdzhZLzJzellYR2JnRjRjNHFSemdkWFpBZ0tVN21nZmc1OFI5OFMrVGxpNXdJY2I3ZWlEYSs1CmNCWXBhaXpVS1hFTTdkbEEzMHRYYzg5NTVRRmt6MW5oU1VDM3FUSE84aWluMXNFbHI2QTFiRkJhc2lFbVhhQkYKRldnT01oRFhSVmJ5YTl3K05ZVjFoY09vMDJvLy9oc2wvekUxZUorTHh5OVFRTVo4b2ZIQzQydXVpMmFIWG5RQwp3NU0zUXFkZgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSVFmZURtZmNGZC8wd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJek1EUXlOREU1TlRjeE9Wb1hEVE16TURReU1URTVOVGN4T1Zvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFzVTVvSmZsTkVFSlkKaGNyZDJZSjYvNnk2RXNzWi9aR3lEYmIwblVZSUFNVWFNWHJNVFNRUkFPMHBQa1JBTHZEMlJMdGVvWUh4ZSt6TAp4WXBpcTVSU2hzdDhHYTh3M1ZvQmFmT1ZpOHgxYTk4MlJKNzVrLzRLN0l6WnBUT1NyQlJMNUR2V213UCs2ZGtvCjVKSlNzVXMzVUQrbVhvck40VzFsRHZIU1h0ZFcxbU5HbDJ2L2RxTWZlZFBNTzZYdGQvZFh5T3FHdFBJcWtOQU0KRjFnUmZaMlBoQjNtY3lWZmEyREJwVittQWtGejN0UEFNWHhZVm9RdWVGb0tFWGlhRVBROElLSUFpM0ZNQms4OQpPZHNCVjlrZStoNGVZR1ZtNDdCV1JOUzQxdlNRSHVqQlY4WVB0WXlCZ1RNRmZkcC91ZHBkTFNoMWJmKytldVFpCjU0S2tydlpEelFJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVUJnRUtlRkdDS3JaV1I5T1FxUzI4MjUvN1Q1UXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUh2eDZmWXphZVJUQlJYbG0rSGJSR2NWSHliang1RnkrMXpLeHZTWGR3bEoxZlZPeG9ZenZETng2TmlaCmk0Qlh4ZlRXZkJ6WjRKcWpDUW5zb2VPNzlBb0dJdGFtVlFkVlQxSjgxM2lkK1RiUElnYlBINGdtNkpoNHQyN3IKTVVmcklpR2dpdlNuTkFVeHFRZVpFSk5uSDRjYm1vWEd2Q1FyUlZobFJUY0U2TmdwMXlPT29rc1FoMzFQM2VmSwpNazVmNkh3Vm1YM3NRTWZzb2VzUXgrQ0NSNldiQnhtNCtBQk1tL3hMQVFGME1xTTlNRE1ldnpXQmM0QUVYUjNnCmNsYWZWWk1yNWhzTWlUdFBwa0RnUEV4L3loaFBucDZ2V2E3eEw3QXFrdUhBeXpMcGVMZC80Y3crZzZNMDFMbkcKc0xUdlBzbG5rYUUwNGhhbjFZMDJtRnFQa1kwPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSUlRdGl4V2h2T2Jvd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl6TURReU5ERTVOVGN4T1ZvWERUTXpNRFF5TVRFNU5UY3hPVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXQ2SWdlTWtaQkV4cHM4Qlk0VithcElhR3l1YTczMnYzZFpjT1FWY0NiUFJuL21mTVpMc211dERzMC8yKwp6eDA4MnVjZnRpYkNaSTB6NE1hM1ZueWhPSnU0S1dpamZ1azNyK04vd0xXc3M4cjdtQ1ltMjE2RDhoVFZRTEhaCnM2Um5wWWFJYTZtN25CeVB3UzFRMU8yL0Z4c1AvdnY2cDAwbU5lNEZobmx3RVJBdDMrNU5mSlByNlV5VWI1aXIKeGFlckRXV3pVRGgyNUtpZFhlek1RZ2lBRXUyamdueEhDdTNiZ2o3N0dLeEJCbE9RREhKNy9UUU10V1pUUnNlZwpCRmJZR2IycVdFaGtVbXRid3UwY1M0VzU2bEdEeEdrekdSSGpCZU1WK0NiYlNWTVVmdEdHYkdncDR3eExaL2ZsCm1EK2RHbGRId0VkK3paL0k0Y2ZZWTZIc253SURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV2QzMzMk04UWVUMUlFM0UwUlRGUmxVcG4vSTB3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFBS1Vjc21EODdORFU3RmRmR2VoRTZnU3c3eDJVTXFWQmQ1UHdETlR6MUQ2ClN4TGxLMmtmeTJuNnJGZkNlVFE3WTR6Z1YyL0I1bXdqRk50MC9oeXZLZDVSbnhlUzdFRzhtNzdkK2Y4WkpVSzQKQzdoS1duWVp6R2RxSUZtcDVrOVpsOUs4RkY0Y2ZCc0h3U0xMc2lHZDgra2piMk5sTmJJOVE0OTFmd0xxOVFOQgp0Q0JZanB1MWxNZCtjOEVEVlBtT0s3UzQwcHNjaGFRbHZhWGJzbzFsSE00SUtTZHVyTExPTzUvcXRqcU9IeFN0CmIzbW9udzY3YldmaFZicHEwb21vb0NGUzAvaTZKcTdyd0UwU1JWSFoxK1ZCMkc1NGxLbjJMZllPT1k0Z0N6bkUKVGdkQnA5NTBNVWZCSkJ5RSt1VWFFS2R0QWtOVU5XVTZoMUVQK2JHTlZFQT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUlQdTNjQkh1UU04Y3dEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpneU16WTNNREkzTUI0WERUSXpNRFF5TkRJd01UQXkKT0ZvWERUTXpNRFF5TVRJd01UQXlPVm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOamd5TXpZM01ESTNNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQTFrOFUKMlZpaEtEZnJIZ2diaFFhbkhaNUx5QTd5Z1BRSkU4OHl4aERXcms1MVZtWG9HQWhhV1h0SERnNTZ2S1BpQWI0agpYb1ZGT0pLeTN5clc0eHhOUWR3a3g2Z3VqaXpsMnpaOC81Sk8rQXpaaFhNbmlXSzVrSGlkSTMrSTJURk5zL3pPCmNjbXJ3YWlyZWtVK05LVW5qdHNVTjBlRGxYQ2xxSFcrZ1U1cXYxcWY3d0ZydDgzMDFoa2NBYk9BcnhQdmF6dGYKSUFXeGtnRko2ZWdWNHdwSGIxQ3R1YXU1VjRLZkYxY2ZOamx3ZTAvaHozQ1RRUU1xeCt6bWxhWTJlYzVYajVkbQpLWEFSSElyQ25wT0dQbXZQYnRrZ2FnTzREQytaamNjR3cyL1VLZkhjU3dSZjVLU1VmUjJINUxGa3oyT2RucW4yClhxZXQxZnczWGl6Q3VmcS9vUUlEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVOUdyaHZuS08wQzRnOWl0RG5pdlVVdlVtc21Zd0h3WURWUjBqQkJndwpGb0FVOUdyaHZuS08wQzRnOWl0RG5pdlVVdlVtc21Zd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFDVkhiL29YCllscE1LSTBRbmlBcFdvQUJpTDJyRk1MdWJoeTFWLzB2ZDhtTi83NnVUWGtwT0RaMVpmcjA0UEZaSjN5SlFIemgKTHZFcGU5bGh6azhpMGVhb2VKbHZCTGFFZnRiZGd1R0dhMngzcGpHODJKQ2VuT0hlZ25td3NYUHZMSFBjd21DVQp6RVpoaHdoMEluWjdHYnFCTHBrZjFNcTZBV21tZWUza3Jnc1haaWNrZGdqaWFCY0o0WnF5V3ZRTmNpaUNjRlRTCkRDbUpWbm5ZeDdPOUxTMzEzU3FwVUJnU0sweTFqRzQ4L2pGVURFNVI4UE53WEpiRzVnSTJzQWZhelF6NmV1WVEKMHk2ajc1a0IwRE92ODdQWGNJLzlpN3pPdUIxQ3kzVnJxeVZlOGFGc3FLbVM5SmFNdnQvTDUxU2FWc0Npb0tTUAptNitFUzZXbjhNa0xKOGs9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURzVENDQXBtZ0F3SUJBZ0lJYjhSeFQ2aWZpRjR3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qZ3lNelkzTVRBM01CNFhEVEl6TURReU5ESXdNVEUwTjFvWApEVEkxTURReU16SXdNVEUwT0Zvd1NERkdNRVFHQTFVRUF3dzlLaTVoY0hCekxtRndjQzFoZDNNdFpXRnpkREl0Ck5ERXlMWE51YnkxMFoyMW5hQzVrWlhZeE1TNXlaV1F0WTJobGMzUmxjbVpwWld4a0xtTnZiVENDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTTdUeVp1M0JpVjRqenpDeGVPY3BvZngzQnBDM0tBdgp1N1IxRllhTXlvQUhURGxJZ0JxeDZaLzYxdENPZTdQNVlqRUxpNHdZT3ZabEk3YzhGNHBQVGxQVTIwOU5HQVNVCnFaWGxKSmJ1REdrbWlNb0NmOXo5b01OL0dGdXJncE51UDBZQm5UTWMvUnIrZ2d5TTlPR2VtR0E1Sm9rYmE5RlEKS3A1OEJnOVpuelFZcWRLR041UjBEZWhkOVZoc0hBMTN6N21QY2lOUmZxc2tWRU1idy9GTFB3Zm9yMldydnlZMwpBQnNGbElOMlcyM3doK08yNENCbjJPUkxGUC9adVNzWmxVQU5iYjZjclcwdFVPMGpjV3ZUd2NoZGlBL21aQzAvClN3RmNzRnJ3ZHV2YlZwWUZiVmwwSDBXOVU1VS9tM3J1Y0swb2krNEpGVnhDZ2t4MHJYTTVDcmNDQXdFQUFhT0IKd0RDQnZUQU9CZ05WSFE4QkFmOEVCQU1DQmFBd0V3WURWUjBsQkF3d0NnWUlLd1lCQlFVSEF3RXdEQVlEVlIwVApBUUgvQkFJd0FEQWRCZ05WSFE0RUZnUVVZSnMzR2lFbVp1dHhMOU14THdFRmxGc3hzWTB3SHdZRFZSMGpCQmd3CkZvQVVjSWxNL2tzUnZ2R0lia3hKb0JpTUthZEhnK0F3U0FZRFZSMFJCRUV3UDRJOUtpNWhjSEJ6TG1Gd2NDMWgKZDNNdFpXRnpkREl0TkRFeUxYTnVieTEwWjIxbmFDNWtaWFl4TVM1eVpXUXRZMmhsYzNSbGNtWnBaV3hrTG1OdgpiVEFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBVy8xNmMyKzlPTVZYMzdvWExKd0tQRTFDekFydXhneEp5R3RYCklaSXhIaWlvWjFONXU5WU9qUkZVR1hTOUlBc29ZVE9DWXU0R0lZd0lIUFpBRStzUnVxcVBxeGVQZzZ6RzhrczcKejZkZnROWHUwQTdPUWtuSHBUTERWWWpnSXlLUDhUME9FT2E5VEJhNnN0Wi9sbG4vQVVBbDQzczFIVnh6cHV6RgpPMjZkSGJMaXRBemN5aDBkSTZuZVpQalBYaWJuSy9wUzdwSnZ4NTBoK1ZLZjJ6MktDaUw4a3REQ3VMNFI0Qnc5ClB4V0ZDbWpTelNidGdaeEJJd3JMa29CWk1TWWlSc1FmNDJoeFYyNXhBOUdWL2VoRWVYN3U4QkFHcXhWeXc5blQKWXhjUFVsM1RIem1kYmZudGdROXd1Zk5qZmFKeHlrMSszT0Y3YlNhUjhEKzVCNzU5Z0E9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlERERDQ0FmU2dBd0lCQWdJQkFUQU5CZ2txaGtpRzl3MEJBUXNGQURBbU1TUXdJZ1lEVlFRRERCdHBibWR5ClpYTnpMVzl3WlhKaGRHOXlRREUyT0RJek5qY3hNRGN3SGhjTk1qTXdOREkwTWpBeE1UUTNXaGNOTWpVd05ESXoKTWpBeE1UUTRXakFtTVNRd0lnWURWUVFEREJ0cGJtZHlaWE56TFc5d1pYSmhkRzl5UURFMk9ESXpOamN4TURjdwpnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFETXppbS9yaWQ1bm9JSFFJbnJ0SzVpClFqWjFRQTE0cS85VEFmS0VGQkFzT2FzTEJUbEhwVDVHSUNxeWdXZk5zQ2doaDJ4SE8vQzFUbjJNeUR3L3hKZCsKazBicG41dEpQODBuZ3VVVE5Rc3RweUFJRThub1lSNXptWkN3QlJYdGhJZVgvWFpRc2doc1Z4aWg3cjVuMnBBbApVYVQ0SS9jdHRjR2tYZ3ptcUdYQVVJSWQyeldrZlBzS0lkZ3U2RTZCT0xESk1iRFRrbDV0QndHWEtUTmdhQkwyCmNGb0xaL3BTbHNPRkhjdDgxR2FWZUxmVGNXSSswd0pKQUp6a1hmM1hsb2tCbXhwbzdwRmlKbkpJVXIvQ080TVkKR200VjgvUURINGlheGxGVDh0dGpkTjRYSlhDbUo4VEpvaGdJTngzaU80R1I4STVLU0p1dVFJdzFQY3hIQ3BlQgpBZ01CQUFHalJUQkRNQTRHQTFVZER3RUIvd1FFQXdJQ3BEQVNCZ05WSFJNQkFmOEVDREFHQVFIL0FnRUFNQjBHCkExVWREZ1FXQkJSd2lVeitTeEcrOFlodVRFbWdHSXdwcDBlRDREQU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUEKVGFOVnB3aXFnODR0VjYvWG44NDNycDRVc1ltYUx1UEtjK2pOVzFacVlRWjFxczV1MXRJeHNPekFzU2ErN1l6bwpTOVFCdzI2TERSajh2eCswcE1vNzc1QWEzVkd5QTg5K1NUU2wxWnEzMThyVTBsR2V6Y0dpNXBITXBIaTVwYjR3CmZhRU8wSEd5aTFqLy9BcFlGZmJlanhsNzVWaGlsY1NWblErNFBZcXVFOTRMRmxTMmZ1OWdDbzZvN3JDYldKVC8KZTBvRExLWkx3K3NrU2FLOERCTUprZnI1N1hkMC91Z3Q0ZzZPdzJ0Z20yZmIvQytMekJXYTIwV3ZXSVRFS0pEZwpVVkJPOUtRY0VpUldDMWZxMlkvb2NReUZMN0RiTitqRFJTTzVkdUNkMTkweUpFclYzTlB4S1RzWC9XVTY0cmNRClg4d3N1SWhhZm5rcmplc041QXlzU2c9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
            url: 'https://api.app-aws-east2-412-sno-tgmgh.dev11.red-chesterfield.com:6443',
          },
          version: '4.12.12',
          versionAvailableUpdates: [
            {
              channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:5c8ef9fba0a75318e0dfeab9ac472ab34aab7334d0d3c56fb4e78e34913b3012',
              url: 'https://access.redhat.com/errata/RHBA-2023:1750',
              version: '4.12.13',
            },
            {
              channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:3cbffaf162ab3328c6eb0c2479705eba6cb1b9df4d60bbe370019038b26dd66a',
              url: 'https://access.redhat.com/errata/RHBA-2023:1858',
              version: '4.12.14',
            },
          ],
          versionHistory: [
            {
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:31510c9b02d7dbfc31b5cc3d914415d7515961eb1a23066af3ae9639b344ed13',
              state: 'Completed',
              verified: false,
              version: '4.12.12',
            },
          ],
        },
        displayVersion: 'OpenShift 4.12.12',
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
          currentVersion: '4.12.12',
          desiredVersion: '4.12.12',
          isReadySelectChannels: true,
          isSelectingChannel: false,
          isUpgradeCuration: false,
          currentChannel: 'stable-4.12',
          desiredChannel: 'stable-4.12',
          availableUpdates: ['4.12.13', '4.12.14'],
          availableChannels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
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
              creationTimestamp: '2023-04-24T21:16:35Z',
              finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
              generation: 1,
              name: 'application-manager',
              namespace: 'feng-managed',
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
              resourceVersion: '15068160',
              uid: '010c9b30-10ad-4663-9cfa-e2b095e3f558',
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
            status: {
              conditions: [
                {
                  lastTransitionTime: '2023-04-24T21:16:35Z',
                  message: 'the supported config resources are required in ClusterManagementAddon',
                  reason: 'ConfigurationUnsupported',
                  status: 'True',
                  type: 'UnsupportedConfiguration',
                },
                {
                  lastTransitionTime: '2023-04-28T22:45:34Z',
                  message: 'manifests of addon are applied successfully',
                  reason: 'AddonManifestApplied',
                  status: 'True',
                  type: 'ManifestApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:16:35Z',
                  message: 'Registration of the addon agent is configured',
                  reason: 'RegistrationConfigured',
                  status: 'True',
                  type: 'RegistrationApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:18:40Z',
                  message:
                    'client certificate rotated starting from 2023-04-24 21:13:37 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:37:42Z',
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
                      'system:open-cluster-management:cluster:feng-managed:addon:application-manager',
                      'system:open-cluster-management:addon:application-manager',
                      'system:authenticated',
                    ],
                    user: 'system:open-cluster-management:cluster:feng-managed:addon:application-manager:agent:application-manager',
                  },
                },
              ],
            },
          },
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ManagedClusterAddOn',
            metadata: {
              creationTimestamp: '2023-04-24T21:16:34Z',
              generation: 1,
              name: 'cert-policy-controller',
              namespace: 'feng-managed',
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
              resourceVersion: '15068149',
              uid: '2a5476bd-5aa7-44b7-977a-b6a138fc80b1',
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
            status: {
              addOnConfiguration: {},
              addOnMeta: {},
              conditions: [
                {
                  lastTransitionTime: '2023-04-28T22:45:33Z',
                  message: 'manifests of addon are applied successfully',
                  reason: 'AddonManifestApplied',
                  status: 'True',
                  type: 'ManifestApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:16:36Z',
                  message: 'Registration of the addon agent is configured',
                  reason: 'RegistrationConfigured',
                  status: 'True',
                  type: 'RegistrationApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:18:41Z',
                  message:
                    'client certificate rotated starting from 2023-04-24 21:13:37 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:37:42Z',
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
                      'system:open-cluster-management:cluster:feng-managed:addon:cert-policy-controller',
                      'system:open-cluster-management:addon:cert-policy-controller',
                      'system:authenticated',
                    ],
                    user: 'system:open-cluster-management:cluster:feng-managed:addon:cert-policy-controller:agent:cert-policy-controller',
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
              creationTimestamp: '2023-04-24T21:16:34Z',
              generation: 1,
              name: 'cluster-proxy',
              namespace: 'feng-managed',
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
              resourceVersion: '15068111',
              uid: '52313f90-f428-4702-b4ea-574acc17ead0',
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
            status: {
              addOnConfiguration: {},
              addOnMeta: {},
              conditions: [
                {
                  lastTransitionTime: '2023-04-28T22:45:32Z',
                  message: 'manifests of addon are applied successfully',
                  reason: 'AddonManifestApplied',
                  status: 'True',
                  type: 'ManifestApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:16:35Z',
                  message: 'Registration of the addon agent is configured',
                  reason: 'RegistrationConfigured',
                  status: 'True',
                  type: 'RegistrationApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:18:39Z',
                  message:
                    'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:37:41Z',
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
              creationTimestamp: '2023-04-24T21:16:34Z',
              finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
              generation: 1,
              name: 'config-policy-controller',
              namespace: 'feng-managed',
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
              resourceVersion: '15068115',
              uid: 'd37a04c7-5dcb-4188-983d-7357453a9743',
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
            status: {
              addOnConfiguration: {},
              addOnMeta: {},
              conditions: [
                {
                  lastTransitionTime: '2023-04-28T05:04:56Z',
                  message: 'manifests of addon are applied successfully',
                  reason: 'AddonManifestApplied',
                  status: 'True',
                  type: 'ManifestApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:16:37Z',
                  message: 'Registration of the addon agent is configured',
                  reason: 'RegistrationConfigured',
                  status: 'True',
                  type: 'RegistrationApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:18:40Z',
                  message:
                    'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:37:41Z',
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
                      'system:open-cluster-management:cluster:feng-managed:addon:config-policy-controller',
                      'system:open-cluster-management:addon:config-policy-controller',
                      'system:authenticated',
                    ],
                    user: 'system:open-cluster-management:cluster:feng-managed:addon:config-policy-controller:agent:config-policy-controller',
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
              creationTimestamp: '2023-04-24T21:16:35Z',
              generation: 1,
              name: 'governance-policy-framework',
              namespace: 'feng-managed',
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
              resourceVersion: '15068120',
              uid: 'e365f86d-66ad-430a-9f0d-335e7c1bf57d',
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
            status: {
              addOnConfiguration: {},
              addOnMeta: {},
              conditions: [
                {
                  lastTransitionTime: '2023-04-26T22:05:02Z',
                  message: 'manifests of addon are applied successfully',
                  reason: 'AddonManifestApplied',
                  status: 'True',
                  type: 'ManifestApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:16:37Z',
                  message: 'Registration of the addon agent is configured',
                  reason: 'RegistrationConfigured',
                  status: 'True',
                  type: 'RegistrationApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:18:40Z',
                  message:
                    'client certificate rotated starting from 2023-04-24 21:13:37 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:37:41Z',
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
                      'system:open-cluster-management:cluster:feng-managed:addon:governance-policy-framework',
                      'system:open-cluster-management:addon:governance-policy-framework',
                      'system:authenticated',
                    ],
                    user: 'system:open-cluster-management:cluster:feng-managed:addon:governance-policy-framework:agent:governance-policy-framework',
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
              creationTimestamp: '2023-04-24T21:16:35Z',
              generation: 1,
              name: 'iam-policy-controller',
              namespace: 'feng-managed',
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
              resourceVersion: '15068131',
              uid: '6367ebb9-6586-4774-861e-b77e58e230d8',
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
            status: {
              addOnConfiguration: {},
              addOnMeta: {},
              conditions: [
                {
                  lastTransitionTime: '2023-04-28T05:04:58Z',
                  message: 'manifests of addon are applied successfully',
                  reason: 'AddonManifestApplied',
                  status: 'True',
                  type: 'ManifestApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:16:36Z',
                  message: 'Registration of the addon agent is configured',
                  reason: 'RegistrationConfigured',
                  status: 'True',
                  type: 'RegistrationApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:18:39Z',
                  message:
                    'client certificate rotated starting from 2023-04-24 21:13:35 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:37:41Z',
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
                      'system:open-cluster-management:cluster:feng-managed:addon:iam-policy-controller',
                      'system:open-cluster-management:addon:iam-policy-controller',
                      'system:authenticated',
                    ],
                    user: 'system:open-cluster-management:cluster:feng-managed:addon:iam-policy-controller:agent:iam-policy-controller',
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
              creationTimestamp: '2023-04-24T21:16:35Z',
              generation: 1,
              name: 'search-collector',
              namespace: 'feng-managed',
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
              resourceVersion: '15068140',
              uid: 'acbd1542-2c18-423c-8974-935a749f22b3',
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
            status: {
              addOnConfiguration: {},
              addOnMeta: {},
              conditions: [
                {
                  lastTransitionTime: '2023-04-24T21:16:35Z',
                  message: 'Registration of the addon agent is configured',
                  reason: 'RegistrationConfigured',
                  status: 'True',
                  type: 'RegistrationApplied',
                },
                {
                  lastTransitionTime: '2023-04-28T22:45:33Z',
                  message: 'manifests of addon are applied successfully',
                  reason: 'AddonManifestApplied',
                  status: 'True',
                  type: 'ManifestApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:18:40Z',
                  message:
                    'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:37:41Z',
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
                      'system:open-cluster-management:cluster:feng-managed:addon:search-collector',
                      'system:open-cluster-management:addon:search-collector',
                      'system:authenticated',
                    ],
                    user: 'system:open-cluster-management:cluster:feng-managed:addon:search-collector:agent:search-collector',
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
              creationTimestamp: '2023-04-24T21:16:34Z',
              generation: 1,
              name: 'work-manager',
              namespace: 'feng-managed',
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
              resourceVersion: '15068126',
              uid: '0ecefe51-ecd4-4203-9d2c-ff6e43fc6f46',
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
            status: {
              addOnConfiguration: {},
              addOnMeta: {},
              conditions: [
                {
                  lastTransitionTime: '2023-04-24T21:16:35Z',
                  message: 'Registration of the addon agent is configured',
                  reason: 'RegistrationConfigured',
                  status: 'True',
                  type: 'RegistrationApplied',
                },
                {
                  lastTransitionTime: '2023-04-28T22:45:32Z',
                  message: 'manifests of addon are applied successfully',
                  reason: 'AddonManifestApplied',
                  status: 'True',
                  type: 'ManifestApplied',
                },
                {
                  lastTransitionTime: '2023-04-24T21:18:40Z',
                  message:
                    'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:37:41Z',
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
                      'system:open-cluster-management:cluster:feng-managed:addon:work-manager',
                      'system:open-cluster-management:addon:work-manager',
                      'system:authenticated',
                    ],
                    user: 'system:open-cluster-management:cluster:feng-managed:addon:work-manager:agent:work-manager',
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
        ],
        available: 8,
        progressing: 0,
        degraded: 0,
        unknown: 0,
      },
      labels: {
        cloud: 'Amazon',
        'cluster.open-cluster-management.io/clusterset': 'default',
        clusterID: 'eee92b88-cca4-415e-a1b5-15d34f6e136f',
        'feature.open-cluster-management.io/addon-application-manager': 'available',
        'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
        'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
        'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
        'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
        'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
        'feature.open-cluster-management.io/addon-search-collector': 'available',
        'feature.open-cluster-management.io/addon-work-manager': 'available',
        name: 'feng-managed',
        openshiftVersion: '4.12.12',
        'openshiftVersion-major': '4',
        'openshiftVersion-major-minor': '4.12',
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
              'failure-domain.beta.kubernetes.io/region': 'us-east-2',
              'failure-domain.beta.kubernetes.io/zone': 'us-east-2a',
              'node-role.kubernetes.io/control-plane': '',
              'node-role.kubernetes.io/master': '',
              'node-role.kubernetes.io/worker': '',
              'node.kubernetes.io/instance-type': 'm5.xlarge',
            },
            name: 'ip-10-0-133-122.us-east-2.compute.internal',
          },
        ],
        ready: 1,
        unhealthy: 0,
        unknown: 0,
      },
      kubeApiServer: 'https://api.app-aws-east2-412-sno-tgmgh.dev11.red-chesterfield.com:6443',
      consoleURL: 'https://console-openshift-console.apps.app-aws-east2-412-sno-tgmgh.dev11.red-chesterfield.com',
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
      creationTimestamp: '2023-04-24T21:16:34Z',
    },
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
          availableUpdates: ['4.12.11', '4.12.13', '4.12.14'],
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
            {
              channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:5c8ef9fba0a75318e0dfeab9ac472ab34aab7334d0d3c56fb4e78e34913b3012',
              url: 'https://access.redhat.com/errata/RHBA-2023:1750',
              version: '4.12.13',
            },
            {
              channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:3cbffaf162ab3328c6eb0c2479705eba6cb1b9df4d60bbe370019038b26dd66a',
              url: 'https://access.redhat.com/errata/RHBA-2023:1858',
              version: '4.12.14',
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
          availableUpdates: ['4.12.11', '4.12.13', '4.12.14'],
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
              resourceVersion: '15065979',
              uid: '7e4bfc53-bfd9-433b-b810-d2242334604c',
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
            status: {
              conditions: [
                {
                  lastTransitionTime: '2023-05-01T13:34:16Z',
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
                    'client certificate rotated starting from 2023-05-01 13:31:18 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
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
              resourceVersion: '15064620',
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
                    'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:34:16Z',
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
              resourceVersion: '15069086',
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
                    'client certificate rotated starting from 2023-05-01 13:33:20 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:34:15Z',
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
              resourceVersion: '15064588',
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
                    'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:35:20Z',
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
              resourceVersion: '15064612',
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
                    'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:34:15Z',
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
              resourceVersion: '15062508',
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
                  lastTransitionTime: '2023-05-01T13:34:15Z',
                  message: 'hypershift-addon add-on is available.',
                  reason: 'ManagedClusterAddOnLeaseUpdated',
                  status: 'True',
                  type: 'Available',
                },
                {
                  lastTransitionTime: '2023-05-01T13:33:45Z',
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
                    'client certificate rotated starting from 2023-05-01 13:28:45 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:33:56Z',
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
                    user: 'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon:agent:xgh4z',
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
              resourceVersion: '15064601',
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
                    'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:34:15Z',
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
              resourceVersion: '15062493',
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
                  lastTransitionTime: '2023-04-24T13:17:03Z',
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
                    'client certificate rotated starting from 2023-05-01 13:28:34 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                  reason: 'ClientCertificateUpdated',
                  status: 'True',
                  type: 'ClusterCertificateRotated',
                },
                {
                  lastTransitionTime: '2023-05-01T13:34:15Z',
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
              memory: '15928704Ki',
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
              memory: '15928704Ki',
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
      consoleURL: 'https://console-openshift-console.apps.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com',
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
  ]

  const result = {
    links: [
      {
        from: {
          uid: 'application--feng-cronjob',
        },
        specs: {
          isDesign: true,
        },
        to: {
          uid: 'member--subscription--feng-cronjob--feng-cronjob-subscription-1',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--subscription--feng-cronjob--feng-cronjob-subscription-1',
        },
        specs: {
          isDesign: true,
        },
        to: {
          uid: 'member--rules--feng-cronjob--feng-cronjob-placement-1-decision-1--0',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--subscription--feng-cronjob--feng-cronjob-subscription-1',
        },
        specs: {
          isDesign: true,
        },
        to: {
          uid: 'member--clusters--feng-managed--local-cluster--feng-cronjob-subscription-1',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--clusters--feng-managed--local-cluster--feng-cronjob-subscription-1',
        },
        to: {
          uid: 'member--deployed-resource--member--clusters--feng-managed--local-cluster--feng-cronjob-subscription-1------cronjob',
        },
        type: '',
      },
    ],
    nodes: [
      {
        id: 'application--feng-cronjob',
        name: '',
        namespace: 'feng-cronjob',
        specs: {
          activeChannel:
            'feng-cronjob/feng-cronjob-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
          allChannels: [
            {
              apiVersion: 'apps.open-cluster-management.io/v1',
              kind: 'Channel',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
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
          allClusters: {
            isLocal: true,
            remoteCount: 1,
          },
          allSubscriptions: [
            {
              apiVersion: 'apps.open-cluster-management.io/v1',
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
                    creationTimestamp: '2023-04-27T14:32:09Z',
                    generation: 1,
                    labels: {
                      'cluster.open-cluster-management.io/placement': 'feng-cronjob-placement-1',
                    },
                    name: 'feng-cronjob-placement-1-decision-1',
                    namespace: 'feng-cronjob',
                    ownerReferences: [
                      {
                        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                        blockOwnerDeletion: true,
                        controller: true,
                        kind: 'Placement',
                        name: 'feng-cronjob-placement-1',
                        uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
                      },
                    ],
                    resourceVersion: '15067334',
                    uid: '31368536-3ffa-4838-a849-4dfe00c89983',
                  },
                  status: {
                    decisions: [
                      {
                        clusterName: 'feng-managed',
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
              kind: 'Subscription',
              metadata: {
                annotations: {
                  'apps.open-cluster-management.io/git-branch': 'main',
                  'apps.open-cluster-management.io/git-current-commit': '7b1ca44656bfaffbdac5aaaabf78c367c52b91b0-new',
                  'apps.open-cluster-management.io/git-path': 'cronjob',
                  'apps.open-cluster-management.io/manual-refresh-time': '2023-04-27T18:08:02.500Z',
                  'apps.open-cluster-management.io/reconcile-option': 'merge',
                  'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                  'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                },
                creationTimestamp: '2023-04-27T14:32:09Z',
                generation: 1,
                labels: {
                  app: 'feng-cronjob',
                  'app.kubernetes.io/part-of': 'feng-cronjob',
                  'apps.open-cluster-management.io/reconcile-rate': 'medium',
                },
                name: 'feng-cronjob-subscription-1',
                namespace: 'feng-cronjob',
                resourceVersion: '15066022',
                uid: '30218235-d4c2-490d-8202-cd909d9c2824',
              },
              placements: [
                {
                  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                  kind: 'Placement',
                  metadata: {
                    creationTimestamp: '2023-04-27T14:32:09Z',
                    generation: 1,
                    labels: {
                      app: 'feng-cronjob',
                    },
                    name: 'feng-cronjob-placement-1',
                    namespace: 'feng-cronjob',
                    resourceVersion: '15067336',
                    uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
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
                        lastTransitionTime: '2023-04-27T14:32:09Z',
                        message: 'Placement configurations check pass',
                        reason: 'Succeedconfigured',
                        status: 'False',
                        type: 'PlacementMisconfigured',
                      },
                      {
                        lastTransitionTime: '2023-04-27T14:32:09Z',
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
              posthooks: [],
              prehooks: [],
              report: {
                apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                kind: 'SubscriptionReport',
                metadata: {
                  creationTimestamp: '2023-04-27T14:32:10Z',
                  generation: 271,
                  labels: {
                    'apps.open-cluster-management.io/hosting-subscription': 'feng-cronjob.feng-cronjob-subscription-1',
                  },
                  name: 'feng-cronjob-subscription-1',
                  namespace: 'feng-cronjob',
                  ownerReferences: [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Subscription',
                      name: 'feng-cronjob-subscription-1',
                      uid: '30218235-d4c2-490d-8202-cd909d9c2824',
                    },
                  ],
                  resourceVersion: '15067378',
                  uid: '0565dd80-4e28-49ce-add5-a2ba77ac31c5',
                },
                reportType: 'Application',
                resources: [
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: 'hello',
                    namespace: 'feng-cronjob',
                  },
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: 'hello2',
                    namespace: 'feng-cronjob',
                  },
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: 'hello3',
                    namespace: 'feng-cronjob',
                  },
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: 'hello5',
                    namespace: 'feng-cronjob',
                  },
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: 'hello7',
                    namespace: 'feng-cronjob',
                  },
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: 'hello8',
                    namespace: 'feng-cronjob',
                  },
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: 'hello1',
                    namespace: 'feng-cronjob',
                  },
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: 'hello4',
                    namespace: 'feng-cronjob',
                  },
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: 'hello6',
                    namespace: 'feng-cronjob',
                  },
                ],
                results: [
                  {
                    result: 'deployed',
                    source: 'feng-managed',
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
              spec: {
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                placement: {
                  placementRef: {
                    kind: 'Placement',
                    name: 'feng-cronjob-placement-1',
                  },
                },
              },
              status: {
                lastUpdateTime: '2023-05-01T13:36:20Z',
                message: 'Active',
                phase: 'Propagated',
              },
            },
          ],
          channels: [
            'feng-cronjob/feng-cronjob-subscription-1//ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
          ],
          isDesign: true,
          raw: {
            apiVersion: 'app.k8s.io/v1beta1',
            kind: 'Application',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/deployables': '',
                'apps.open-cluster-management.io/subscriptions':
                  'feng-cronjob/feng-cronjob-subscription-1,feng-cronjob/feng-cronjob-subscription-1-local',
                'open-cluster-management.io/user-group':
                  'c3lzdGVtOnNlcnZpY2VhY2NvdW50cyxzeXN0ZW06c2VydmljZWFjY291bnRzOm9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50LHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity':
                  'c3lzdGVtOnNlcnZpY2VhY2NvdW50Om9wZW4tY2x1c3Rlci1tYW5hZ2VtZW50Om11bHRpY2x1c3Rlci1hcHBsaWNhdGlvbnM=',
              },
              creationTimestamp: '2023-04-27T14:32:09Z',
              generation: 1,
              name: 'feng-cronjob',
              namespace: 'feng-cronjob',
              resourceVersion: '13641704',
              uid: 'eafafbed-763e-44c9-bf05-6505ba304c78',
            },
            spec: {
              componentKinds: [
                {
                  group: 'apps.open-cluster-management.io',
                  kind: 'Subscription',
                },
              ],
              descriptor: {},
              selector: {
                matchExpressions: [
                  {
                    key: 'app',
                    operator: 'In',
                    values: ['feng-cronjob'],
                  },
                ],
              },
            },
          },
        },
        type: 'application',
        uid: 'application--feng-cronjob',
      },
      {
        id: 'member--subscription--feng-cronjob--feng-cronjob-subscription-1',
        name: 'feng-cronjob-subscription-1',
        namespace: 'feng-cronjob',
        report: {
          apiVersion: 'apps.open-cluster-management.io/v1alpha1',
          kind: 'SubscriptionReport',
          metadata: {
            creationTimestamp: '2023-04-27T14:32:10Z',
            generation: 271,
            labels: {
              'apps.open-cluster-management.io/hosting-subscription': 'feng-cronjob.feng-cronjob-subscription-1',
            },
            name: 'feng-cronjob-subscription-1',
            namespace: 'feng-cronjob',
            ownerReferences: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Subscription',
                name: 'feng-cronjob-subscription-1',
                uid: '30218235-d4c2-490d-8202-cd909d9c2824',
              },
            ],
            resourceVersion: '15067378',
            uid: '0565dd80-4e28-49ce-add5-a2ba77ac31c5',
          },
          reportType: 'Application',
          resources: [
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello2',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello3',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello5',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello7',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello8',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello1',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello4',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello6',
              namespace: 'feng-cronjob',
            },
          ],
          results: [
            {
              result: 'deployed',
              source: 'feng-managed',
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
        specs: {
          clustersNames: ['feng-managed', 'local-cluster'],
          hasRules: false,
          isBlocked: false,
          isDesign: true,
          isPlaced: true,
          raw: {
            apiVersion: 'apps.open-cluster-management.io/v1',
            channels: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Channel',
                metadata: {
                  annotations: {
                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
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
                  creationTimestamp: '2023-04-27T14:32:09Z',
                  generation: 1,
                  labels: {
                    'cluster.open-cluster-management.io/placement': 'feng-cronjob-placement-1',
                  },
                  name: 'feng-cronjob-placement-1-decision-1',
                  namespace: 'feng-cronjob',
                  ownerReferences: [
                    {
                      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Placement',
                      name: 'feng-cronjob-placement-1',
                      uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
                    },
                  ],
                  resourceVersion: '15067334',
                  uid: '31368536-3ffa-4838-a849-4dfe00c89983',
                },
                status: {
                  decisions: [
                    {
                      clusterName: 'feng-managed',
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
            kind: 'Subscription',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'main',
                'apps.open-cluster-management.io/git-current-commit': '7b1ca44656bfaffbdac5aaaabf78c367c52b91b0-new',
                'apps.open-cluster-management.io/git-path': 'cronjob',
                'apps.open-cluster-management.io/manual-refresh-time': '2023-04-27T18:08:02.500Z',
                'apps.open-cluster-management.io/reconcile-option': 'merge',
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
              },
              creationTimestamp: '2023-04-27T14:32:09Z',
              generation: 1,
              labels: {
                app: 'feng-cronjob',
                'app.kubernetes.io/part-of': 'feng-cronjob',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
              name: 'feng-cronjob-subscription-1',
              namespace: 'feng-cronjob',
              resourceVersion: '15066022',
              uid: '30218235-d4c2-490d-8202-cd909d9c2824',
            },
            placements: [
              {
                apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                kind: 'Placement',
                metadata: {
                  creationTimestamp: '2023-04-27T14:32:09Z',
                  generation: 1,
                  labels: {
                    app: 'feng-cronjob',
                  },
                  name: 'feng-cronjob-placement-1',
                  namespace: 'feng-cronjob',
                  resourceVersion: '15067336',
                  uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
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
                      lastTransitionTime: '2023-04-27T14:32:09Z',
                      message: 'Placement configurations check pass',
                      reason: 'Succeedconfigured',
                      status: 'False',
                      type: 'PlacementMisconfigured',
                    },
                    {
                      lastTransitionTime: '2023-04-27T14:32:09Z',
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
            posthooks: [],
            prehooks: [],
            report: {
              apiVersion: 'apps.open-cluster-management.io/v1alpha1',
              kind: 'SubscriptionReport',
              metadata: {
                creationTimestamp: '2023-04-27T14:32:10Z',
                generation: 271,
                labels: {
                  'apps.open-cluster-management.io/hosting-subscription': 'feng-cronjob.feng-cronjob-subscription-1',
                },
                name: 'feng-cronjob-subscription-1',
                namespace: 'feng-cronjob',
                ownerReferences: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'Subscription',
                    name: 'feng-cronjob-subscription-1',
                    uid: '30218235-d4c2-490d-8202-cd909d9c2824',
                  },
                ],
                resourceVersion: '15067378',
                uid: '0565dd80-4e28-49ce-add5-a2ba77ac31c5',
              },
              reportType: 'Application',
              resources: [
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello2',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello3',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello5',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello7',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello8',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello1',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello4',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello6',
                  namespace: 'feng-cronjob',
                },
              ],
              results: [
                {
                  result: 'deployed',
                  source: 'feng-managed',
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
            spec: {
              channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
              placement: {
                placementRef: {
                  kind: 'Placement',
                  name: 'feng-cronjob-placement-1',
                },
              },
            },
            status: {
              lastUpdateTime: '2023-05-01T13:36:20Z',
              message: 'Active',
              phase: 'Propagated',
            },
          },
          title: 'cronjob',
        },
        type: 'subscription',
        uid: 'member--subscription--feng-cronjob--feng-cronjob-subscription-1',
      },
      {
        id: 'member--rules--feng-cronjob--feng-cronjob-placement-1-decision-1--0',
        name: 'feng-cronjob-placement-1-decision-1',
        namespace: 'feng-cronjob',
        specs: {
          isDesign: true,
          raw: {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'PlacementDecision',
            metadata: {
              creationTimestamp: '2023-04-27T14:32:09Z',
              generation: 1,
              labels: {
                'cluster.open-cluster-management.io/placement': 'feng-cronjob-placement-1',
              },
              name: 'feng-cronjob-placement-1-decision-1',
              namespace: 'feng-cronjob',
              ownerReferences: [
                {
                  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Placement',
                  name: 'feng-cronjob-placement-1',
                  uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
                },
              ],
              resourceVersion: '15067334',
              uid: '31368536-3ffa-4838-a849-4dfe00c89983',
            },
            status: {
              decisions: [
                {
                  clusterName: 'feng-managed',
                  reason: '',
                },
                {
                  clusterName: 'local-cluster',
                  reason: '',
                },
              ],
            },
          },
        },
        type: 'placements',
        uid: 'member--rules--feng-cronjob--feng-cronjob-placement-1-decision-1--0',
      },
      {
        id: 'member--clusters--feng-managed--local-cluster--feng-cronjob-subscription-1',
        name: '',
        namespace: '',
        specs: {
          appClusters: undefined,
          clusters: [
            {
              acmDistribution: {},
              addons: {
                addonList: [
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    kind: 'ManagedClusterAddOn',
                    metadata: {
                      creationTimestamp: '2023-04-24T21:16:35Z',
                      finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
                      generation: 1,
                      name: 'application-manager',
                      namespace: 'feng-managed',
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
                      resourceVersion: '15068160',
                      uid: '010c9b30-10ad-4663-9cfa-e2b095e3f558',
                    },
                    spec: {
                      installNamespace: 'open-cluster-management-agent-addon',
                    },
                    status: {
                      conditions: [
                        {
                          lastTransitionTime: '2023-04-24T21:16:35Z',
                          message: 'the supported config resources are required in ClusterManagementAddon',
                          reason: 'ConfigurationUnsupported',
                          status: 'True',
                          type: 'UnsupportedConfiguration',
                        },
                        {
                          lastTransitionTime: '2023-04-28T22:45:34Z',
                          message: 'manifests of addon are applied successfully',
                          reason: 'AddonManifestApplied',
                          status: 'True',
                          type: 'ManifestApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:16:35Z',
                          message: 'Registration of the addon agent is configured',
                          reason: 'RegistrationConfigured',
                          status: 'True',
                          type: 'RegistrationApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:18:40Z',
                          message:
                            'client certificate rotated starting from 2023-04-24 21:13:37 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:37:42Z',
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
                              'system:open-cluster-management:cluster:feng-managed:addon:application-manager',
                              'system:open-cluster-management:addon:application-manager',
                              'system:authenticated',
                            ],
                            user: 'system:open-cluster-management:cluster:feng-managed:addon:application-manager:agent:application-manager',
                          },
                        },
                      ],
                    },
                  },
                  {
                    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                    kind: 'ManagedClusterAddOn',
                    metadata: {
                      creationTimestamp: '2023-04-24T21:16:34Z',
                      generation: 1,
                      name: 'cert-policy-controller',
                      namespace: 'feng-managed',
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
                      resourceVersion: '15068149',
                      uid: '2a5476bd-5aa7-44b7-977a-b6a138fc80b1',
                    },
                    spec: {
                      installNamespace: 'open-cluster-management-agent-addon',
                    },
                    status: {
                      addOnConfiguration: {},
                      addOnMeta: {},
                      conditions: [
                        {
                          lastTransitionTime: '2023-04-28T22:45:33Z',
                          message: 'manifests of addon are applied successfully',
                          reason: 'AddonManifestApplied',
                          status: 'True',
                          type: 'ManifestApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:16:36Z',
                          message: 'Registration of the addon agent is configured',
                          reason: 'RegistrationConfigured',
                          status: 'True',
                          type: 'RegistrationApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:18:41Z',
                          message:
                            'client certificate rotated starting from 2023-04-24 21:13:37 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:37:42Z',
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
                              'system:open-cluster-management:cluster:feng-managed:addon:cert-policy-controller',
                              'system:open-cluster-management:addon:cert-policy-controller',
                              'system:authenticated',
                            ],
                            user: 'system:open-cluster-management:cluster:feng-managed:addon:cert-policy-controller:agent:cert-policy-controller',
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
                      creationTimestamp: '2023-04-24T21:16:34Z',
                      generation: 1,
                      name: 'cluster-proxy',
                      namespace: 'feng-managed',
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
                      resourceVersion: '15068111',
                      uid: '52313f90-f428-4702-b4ea-574acc17ead0',
                    },
                    spec: {
                      installNamespace: 'open-cluster-management-agent-addon',
                    },
                    status: {
                      addOnConfiguration: {},
                      addOnMeta: {},
                      conditions: [
                        {
                          lastTransitionTime: '2023-04-28T22:45:32Z',
                          message: 'manifests of addon are applied successfully',
                          reason: 'AddonManifestApplied',
                          status: 'True',
                          type: 'ManifestApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:16:35Z',
                          message: 'Registration of the addon agent is configured',
                          reason: 'RegistrationConfigured',
                          status: 'True',
                          type: 'RegistrationApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:18:39Z',
                          message:
                            'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:37:41Z',
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
                      creationTimestamp: '2023-04-24T21:16:34Z',
                      finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
                      generation: 1,
                      name: 'config-policy-controller',
                      namespace: 'feng-managed',
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
                      resourceVersion: '15068115',
                      uid: 'd37a04c7-5dcb-4188-983d-7357453a9743',
                    },
                    spec: {
                      installNamespace: 'open-cluster-management-agent-addon',
                    },
                    status: {
                      addOnConfiguration: {},
                      addOnMeta: {},
                      conditions: [
                        {
                          lastTransitionTime: '2023-04-28T05:04:56Z',
                          message: 'manifests of addon are applied successfully',
                          reason: 'AddonManifestApplied',
                          status: 'True',
                          type: 'ManifestApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:16:37Z',
                          message: 'Registration of the addon agent is configured',
                          reason: 'RegistrationConfigured',
                          status: 'True',
                          type: 'RegistrationApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:18:40Z',
                          message:
                            'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:37:41Z',
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
                              'system:open-cluster-management:cluster:feng-managed:addon:config-policy-controller',
                              'system:open-cluster-management:addon:config-policy-controller',
                              'system:authenticated',
                            ],
                            user: 'system:open-cluster-management:cluster:feng-managed:addon:config-policy-controller:agent:config-policy-controller',
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
                      creationTimestamp: '2023-04-24T21:16:35Z',
                      generation: 1,
                      name: 'governance-policy-framework',
                      namespace: 'feng-managed',
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
                      resourceVersion: '15068120',
                      uid: 'e365f86d-66ad-430a-9f0d-335e7c1bf57d',
                    },
                    spec: {
                      installNamespace: 'open-cluster-management-agent-addon',
                    },
                    status: {
                      addOnConfiguration: {},
                      addOnMeta: {},
                      conditions: [
                        {
                          lastTransitionTime: '2023-04-26T22:05:02Z',
                          message: 'manifests of addon are applied successfully',
                          reason: 'AddonManifestApplied',
                          status: 'True',
                          type: 'ManifestApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:16:37Z',
                          message: 'Registration of the addon agent is configured',
                          reason: 'RegistrationConfigured',
                          status: 'True',
                          type: 'RegistrationApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:18:40Z',
                          message:
                            'client certificate rotated starting from 2023-04-24 21:13:37 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:37:41Z',
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
                              'system:open-cluster-management:cluster:feng-managed:addon:governance-policy-framework',
                              'system:open-cluster-management:addon:governance-policy-framework',
                              'system:authenticated',
                            ],
                            user: 'system:open-cluster-management:cluster:feng-managed:addon:governance-policy-framework:agent:governance-policy-framework',
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
                      creationTimestamp: '2023-04-24T21:16:35Z',
                      generation: 1,
                      name: 'iam-policy-controller',
                      namespace: 'feng-managed',
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
                      resourceVersion: '15068131',
                      uid: '6367ebb9-6586-4774-861e-b77e58e230d8',
                    },
                    spec: {
                      installNamespace: 'open-cluster-management-agent-addon',
                    },
                    status: {
                      addOnConfiguration: {},
                      addOnMeta: {},
                      conditions: [
                        {
                          lastTransitionTime: '2023-04-28T05:04:58Z',
                          message: 'manifests of addon are applied successfully',
                          reason: 'AddonManifestApplied',
                          status: 'True',
                          type: 'ManifestApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:16:36Z',
                          message: 'Registration of the addon agent is configured',
                          reason: 'RegistrationConfigured',
                          status: 'True',
                          type: 'RegistrationApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:18:39Z',
                          message:
                            'client certificate rotated starting from 2023-04-24 21:13:35 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:37:41Z',
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
                              'system:open-cluster-management:cluster:feng-managed:addon:iam-policy-controller',
                              'system:open-cluster-management:addon:iam-policy-controller',
                              'system:authenticated',
                            ],
                            user: 'system:open-cluster-management:cluster:feng-managed:addon:iam-policy-controller:agent:iam-policy-controller',
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
                      creationTimestamp: '2023-04-24T21:16:35Z',
                      generation: 1,
                      name: 'search-collector',
                      namespace: 'feng-managed',
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
                      resourceVersion: '15068140',
                      uid: 'acbd1542-2c18-423c-8974-935a749f22b3',
                    },
                    spec: {
                      installNamespace: 'open-cluster-management-agent-addon',
                    },
                    status: {
                      addOnConfiguration: {},
                      addOnMeta: {},
                      conditions: [
                        {
                          lastTransitionTime: '2023-04-24T21:16:35Z',
                          message: 'Registration of the addon agent is configured',
                          reason: 'RegistrationConfigured',
                          status: 'True',
                          type: 'RegistrationApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-28T22:45:33Z',
                          message: 'manifests of addon are applied successfully',
                          reason: 'AddonManifestApplied',
                          status: 'True',
                          type: 'ManifestApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:18:40Z',
                          message:
                            'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:37:41Z',
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
                              'system:open-cluster-management:cluster:feng-managed:addon:search-collector',
                              'system:open-cluster-management:addon:search-collector',
                              'system:authenticated',
                            ],
                            user: 'system:open-cluster-management:cluster:feng-managed:addon:search-collector:agent:search-collector',
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
                      creationTimestamp: '2023-04-24T21:16:34Z',
                      generation: 1,
                      name: 'work-manager',
                      namespace: 'feng-managed',
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
                      resourceVersion: '15068126',
                      uid: '0ecefe51-ecd4-4203-9d2c-ff6e43fc6f46',
                    },
                    spec: {
                      installNamespace: 'open-cluster-management-agent-addon',
                    },
                    status: {
                      addOnConfiguration: {},
                      addOnMeta: {},
                      conditions: [
                        {
                          lastTransitionTime: '2023-04-24T21:16:35Z',
                          message: 'Registration of the addon agent is configured',
                          reason: 'RegistrationConfigured',
                          status: 'True',
                          type: 'RegistrationApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-28T22:45:32Z',
                          message: 'manifests of addon are applied successfully',
                          reason: 'AddonManifestApplied',
                          status: 'True',
                          type: 'ManifestApplied',
                        },
                        {
                          lastTransitionTime: '2023-04-24T21:18:40Z',
                          message:
                            'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:37:41Z',
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
                              'system:open-cluster-management:cluster:feng-managed:addon:work-manager',
                              'system:open-cluster-management:addon:work-manager',
                              'system:authenticated',
                            ],
                            user: 'system:open-cluster-management:cluster:feng-managed:addon:work-manager:agent:work-manager',
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
                ],
                available: 8,
                degraded: 0,
                progressing: 0,
                unknown: 0,
              },
              clusterSet: 'default',
              consoleURL:
                'https://console-openshift-console.apps.app-aws-east2-412-sno-tgmgh.dev11.red-chesterfield.com',
              creationTimestamp: '2023-04-24T21:16:34Z',
              displayName: 'feng-managed',
              distribution: {
                displayVersion: 'OpenShift 4.12.12',
                isManagedOpenShift: false,
                k8sVersion: 'v1.25.7+eab9cc9',
                ocp: {
                  availableUpdates: ['4.12.13', '4.12.14'],
                  channel: 'stable-4.12',
                  desired: {
                    channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                    image:
                      'quay.io/openshift-release-dev/ocp-release@sha256:31510c9b02d7dbfc31b5cc3d914415d7515961eb1a23066af3ae9639b344ed13',
                    url: 'https://access.redhat.com/errata/RHBA-2023:1734',
                    version: '4.12.12',
                  },
                  desiredVersion: '4.12.12',
                  managedClusterClientConfig: {
                    caBundle:
                      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJUlZwcnZzZVZkZzB3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpNd05ESTBNVGsxTnpFNVdoY05Nek13TkRJeE1UazFOekU1V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTDJnUEFWeFZPS1RMTFBmRkVNYzZ0cTFJZjVCZmJ5Vgo3NCtCZU9Beklud1N3WVIvelJJNzNrdldYclAxejV5ZDV4YXV5aStPdmNQSXNuLy9qL0NWZEJsSi9TTklaY1hJCmR0SlBIUHE3Sk8zTHFzQmxxZCtLNHdHL2dPdTV5TDd1WVRGLy81SjN5N3ViWVNrN2FkZjF0dnFUQVRKaTIxVlkKZFRHMTcwZG5way9kVXluZVQ2NGd1SjV1VmhKcWw5ZGFBR2J2QlM5UllRZzhtOXd0aDcxa1pkZ2lnRStJZHZJZQpha3g2enE3NEQrQ2xORy9MRFlPYnZ0dTNGaFQvNytBSjExUDVJZUV5VE1tSi94dVgxempEOXpacUpva2crWFV2CllkSW5CWEdycFBTeHFvYnZDNGorejNaK3pDNFlIcWN1elZGZHZxUjR0VWtMb3Z6NmtnUXV3TlVDQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkcxbQoxRDlmb2Z6RnROUVhaWHpYK2pRSnNlRXZNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUNGa1UwYjU2anlOSGpXCmtkU1BzL3F5RmxMMXkxZTdoOWNiWWR2bXl1N0w2SFl5WWxRQ05OcjdJOGVMbTVwOEV5THNaYXh2Rzg1aFNwYlgKTEZHVXFwSVVwMy9EdlBvRHRoTlFCYURVNHNtLzJYT3BKN2svdStSNkZxL2lvMTJHcXBvZHc1QWlzVkplb0FIVQpUV0RyYllNRnBQdzhZLzJzellYR2JnRjRjNHFSemdkWFpBZ0tVN21nZmc1OFI5OFMrVGxpNXdJY2I3ZWlEYSs1CmNCWXBhaXpVS1hFTTdkbEEzMHRYYzg5NTVRRmt6MW5oU1VDM3FUSE84aWluMXNFbHI2QTFiRkJhc2lFbVhhQkYKRldnT01oRFhSVmJ5YTl3K05ZVjFoY09vMDJvLy9oc2wvekUxZUorTHh5OVFRTVo4b2ZIQzQydXVpMmFIWG5RQwp3NU0zUXFkZgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSVFmZURtZmNGZC8wd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJek1EUXlOREU1TlRjeE9Wb1hEVE16TURReU1URTVOVGN4T1Zvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFzVTVvSmZsTkVFSlkKaGNyZDJZSjYvNnk2RXNzWi9aR3lEYmIwblVZSUFNVWFNWHJNVFNRUkFPMHBQa1JBTHZEMlJMdGVvWUh4ZSt6TAp4WXBpcTVSU2hzdDhHYTh3M1ZvQmFmT1ZpOHgxYTk4MlJKNzVrLzRLN0l6WnBUT1NyQlJMNUR2V213UCs2ZGtvCjVKSlNzVXMzVUQrbVhvck40VzFsRHZIU1h0ZFcxbU5HbDJ2L2RxTWZlZFBNTzZYdGQvZFh5T3FHdFBJcWtOQU0KRjFnUmZaMlBoQjNtY3lWZmEyREJwVittQWtGejN0UEFNWHhZVm9RdWVGb0tFWGlhRVBROElLSUFpM0ZNQms4OQpPZHNCVjlrZStoNGVZR1ZtNDdCV1JOUzQxdlNRSHVqQlY4WVB0WXlCZ1RNRmZkcC91ZHBkTFNoMWJmKytldVFpCjU0S2tydlpEelFJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVUJnRUtlRkdDS3JaV1I5T1FxUzI4MjUvN1Q1UXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUh2eDZmWXphZVJUQlJYbG0rSGJSR2NWSHliang1RnkrMXpLeHZTWGR3bEoxZlZPeG9ZenZETng2TmlaCmk0Qlh4ZlRXZkJ6WjRKcWpDUW5zb2VPNzlBb0dJdGFtVlFkVlQxSjgxM2lkK1RiUElnYlBINGdtNkpoNHQyN3IKTVVmcklpR2dpdlNuTkFVeHFRZVpFSk5uSDRjYm1vWEd2Q1FyUlZobFJUY0U2TmdwMXlPT29rc1FoMzFQM2VmSwpNazVmNkh3Vm1YM3NRTWZzb2VzUXgrQ0NSNldiQnhtNCtBQk1tL3hMQVFGME1xTTlNRE1ldnpXQmM0QUVYUjNnCmNsYWZWWk1yNWhzTWlUdFBwa0RnUEV4L3loaFBucDZ2V2E3eEw3QXFrdUhBeXpMcGVMZC80Y3crZzZNMDFMbkcKc0xUdlBzbG5rYUUwNGhhbjFZMDJtRnFQa1kwPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSUlRdGl4V2h2T2Jvd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl6TURReU5ERTVOVGN4T1ZvWERUTXpNRFF5TVRFNU5UY3hPVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXQ2SWdlTWtaQkV4cHM4Qlk0VithcElhR3l1YTczMnYzZFpjT1FWY0NiUFJuL21mTVpMc211dERzMC8yKwp6eDA4MnVjZnRpYkNaSTB6NE1hM1ZueWhPSnU0S1dpamZ1azNyK04vd0xXc3M4cjdtQ1ltMjE2RDhoVFZRTEhaCnM2Um5wWWFJYTZtN25CeVB3UzFRMU8yL0Z4c1AvdnY2cDAwbU5lNEZobmx3RVJBdDMrNU5mSlByNlV5VWI1aXIKeGFlckRXV3pVRGgyNUtpZFhlek1RZ2lBRXUyamdueEhDdTNiZ2o3N0dLeEJCbE9RREhKNy9UUU10V1pUUnNlZwpCRmJZR2IycVdFaGtVbXRid3UwY1M0VzU2bEdEeEdrekdSSGpCZU1WK0NiYlNWTVVmdEdHYkdncDR3eExaL2ZsCm1EK2RHbGRId0VkK3paL0k0Y2ZZWTZIc253SURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV2QzMzMk04UWVUMUlFM0UwUlRGUmxVcG4vSTB3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFBS1Vjc21EODdORFU3RmRmR2VoRTZnU3c3eDJVTXFWQmQ1UHdETlR6MUQ2ClN4TGxLMmtmeTJuNnJGZkNlVFE3WTR6Z1YyL0I1bXdqRk50MC9oeXZLZDVSbnhlUzdFRzhtNzdkK2Y4WkpVSzQKQzdoS1duWVp6R2RxSUZtcDVrOVpsOUs4RkY0Y2ZCc0h3U0xMc2lHZDgra2piMk5sTmJJOVE0OTFmd0xxOVFOQgp0Q0JZanB1MWxNZCtjOEVEVlBtT0s3UzQwcHNjaGFRbHZhWGJzbzFsSE00SUtTZHVyTExPTzUvcXRqcU9IeFN0CmIzbW9udzY3YldmaFZicHEwb21vb0NGUzAvaTZKcTdyd0UwU1JWSFoxK1ZCMkc1NGxLbjJMZllPT1k0Z0N6bkUKVGdkQnA5NTBNVWZCSkJ5RSt1VWFFS2R0QWtOVU5XVTZoMUVQK2JHTlZFQT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUlQdTNjQkh1UU04Y3dEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpneU16WTNNREkzTUI0WERUSXpNRFF5TkRJd01UQXkKT0ZvWERUTXpNRFF5TVRJd01UQXlPVm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOamd5TXpZM01ESTNNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQTFrOFUKMlZpaEtEZnJIZ2diaFFhbkhaNUx5QTd5Z1BRSkU4OHl4aERXcms1MVZtWG9HQWhhV1h0SERnNTZ2S1BpQWI0agpYb1ZGT0pLeTN5clc0eHhOUWR3a3g2Z3VqaXpsMnpaOC81Sk8rQXpaaFhNbmlXSzVrSGlkSTMrSTJURk5zL3pPCmNjbXJ3YWlyZWtVK05LVW5qdHNVTjBlRGxYQ2xxSFcrZ1U1cXYxcWY3d0ZydDgzMDFoa2NBYk9BcnhQdmF6dGYKSUFXeGtnRko2ZWdWNHdwSGIxQ3R1YXU1VjRLZkYxY2ZOamx3ZTAvaHozQ1RRUU1xeCt6bWxhWTJlYzVYajVkbQpLWEFSSElyQ25wT0dQbXZQYnRrZ2FnTzREQytaamNjR3cyL1VLZkhjU3dSZjVLU1VmUjJINUxGa3oyT2RucW4yClhxZXQxZnczWGl6Q3VmcS9vUUlEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVOUdyaHZuS08wQzRnOWl0RG5pdlVVdlVtc21Zd0h3WURWUjBqQkJndwpGb0FVOUdyaHZuS08wQzRnOWl0RG5pdlVVdlVtc21Zd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFDVkhiL29YCllscE1LSTBRbmlBcFdvQUJpTDJyRk1MdWJoeTFWLzB2ZDhtTi83NnVUWGtwT0RaMVpmcjA0UEZaSjN5SlFIemgKTHZFcGU5bGh6azhpMGVhb2VKbHZCTGFFZnRiZGd1R0dhMngzcGpHODJKQ2VuT0hlZ25td3NYUHZMSFBjd21DVQp6RVpoaHdoMEluWjdHYnFCTHBrZjFNcTZBV21tZWUza3Jnc1haaWNrZGdqaWFCY0o0WnF5V3ZRTmNpaUNjRlRTCkRDbUpWbm5ZeDdPOUxTMzEzU3FwVUJnU0sweTFqRzQ4L2pGVURFNVI4UE53WEpiRzVnSTJzQWZhelF6NmV1WVEKMHk2ajc1a0IwRE92ODdQWGNJLzlpN3pPdUIxQ3kzVnJxeVZlOGFGc3FLbVM5SmFNdnQvTDUxU2FWc0Npb0tTUAptNitFUzZXbjhNa0xKOGs9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURzVENDQXBtZ0F3SUJBZ0lJYjhSeFQ2aWZpRjR3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qZ3lNelkzTVRBM01CNFhEVEl6TURReU5ESXdNVEUwTjFvWApEVEkxTURReU16SXdNVEUwT0Zvd1NERkdNRVFHQTFVRUF3dzlLaTVoY0hCekxtRndjQzFoZDNNdFpXRnpkREl0Ck5ERXlMWE51YnkxMFoyMW5hQzVrWlhZeE1TNXlaV1F0WTJobGMzUmxjbVpwWld4a0xtTnZiVENDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTTdUeVp1M0JpVjRqenpDeGVPY3BvZngzQnBDM0tBdgp1N1IxRllhTXlvQUhURGxJZ0JxeDZaLzYxdENPZTdQNVlqRUxpNHdZT3ZabEk3YzhGNHBQVGxQVTIwOU5HQVNVCnFaWGxKSmJ1REdrbWlNb0NmOXo5b01OL0dGdXJncE51UDBZQm5UTWMvUnIrZ2d5TTlPR2VtR0E1Sm9rYmE5RlEKS3A1OEJnOVpuelFZcWRLR041UjBEZWhkOVZoc0hBMTN6N21QY2lOUmZxc2tWRU1idy9GTFB3Zm9yMldydnlZMwpBQnNGbElOMlcyM3doK08yNENCbjJPUkxGUC9adVNzWmxVQU5iYjZjclcwdFVPMGpjV3ZUd2NoZGlBL21aQzAvClN3RmNzRnJ3ZHV2YlZwWUZiVmwwSDBXOVU1VS9tM3J1Y0swb2krNEpGVnhDZ2t4MHJYTTVDcmNDQXdFQUFhT0IKd0RDQnZUQU9CZ05WSFE4QkFmOEVCQU1DQmFBd0V3WURWUjBsQkF3d0NnWUlLd1lCQlFVSEF3RXdEQVlEVlIwVApBUUgvQkFJd0FEQWRCZ05WSFE0RUZnUVVZSnMzR2lFbVp1dHhMOU14THdFRmxGc3hzWTB3SHdZRFZSMGpCQmd3CkZvQVVjSWxNL2tzUnZ2R0lia3hKb0JpTUthZEhnK0F3U0FZRFZSMFJCRUV3UDRJOUtpNWhjSEJ6TG1Gd2NDMWgKZDNNdFpXRnpkREl0TkRFeUxYTnVieTEwWjIxbmFDNWtaWFl4TVM1eVpXUXRZMmhsYzNSbGNtWnBaV3hrTG1OdgpiVEFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBVy8xNmMyKzlPTVZYMzdvWExKd0tQRTFDekFydXhneEp5R3RYCklaSXhIaWlvWjFONXU5WU9qUkZVR1hTOUlBc29ZVE9DWXU0R0lZd0lIUFpBRStzUnVxcVBxeGVQZzZ6RzhrczcKejZkZnROWHUwQTdPUWtuSHBUTERWWWpnSXlLUDhUME9FT2E5VEJhNnN0Wi9sbG4vQVVBbDQzczFIVnh6cHV6RgpPMjZkSGJMaXRBemN5aDBkSTZuZVpQalBYaWJuSy9wUzdwSnZ4NTBoK1ZLZjJ6MktDaUw4a3REQ3VMNFI0Qnc5ClB4V0ZDbWpTelNidGdaeEJJd3JMa29CWk1TWWlSc1FmNDJoeFYyNXhBOUdWL2VoRWVYN3U4QkFHcXhWeXc5blQKWXhjUFVsM1RIem1kYmZudGdROXd1Zk5qZmFKeHlrMSszT0Y3YlNhUjhEKzVCNzU5Z0E9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlERERDQ0FmU2dBd0lCQWdJQkFUQU5CZ2txaGtpRzl3MEJBUXNGQURBbU1TUXdJZ1lEVlFRRERCdHBibWR5ClpYTnpMVzl3WlhKaGRHOXlRREUyT0RJek5qY3hNRGN3SGhjTk1qTXdOREkwTWpBeE1UUTNXaGNOTWpVd05ESXoKTWpBeE1UUTRXakFtTVNRd0lnWURWUVFEREJ0cGJtZHlaWE56TFc5d1pYSmhkRzl5UURFMk9ESXpOamN4TURjdwpnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFETXppbS9yaWQ1bm9JSFFJbnJ0SzVpClFqWjFRQTE0cS85VEFmS0VGQkFzT2FzTEJUbEhwVDVHSUNxeWdXZk5zQ2doaDJ4SE8vQzFUbjJNeUR3L3hKZCsKazBicG41dEpQODBuZ3VVVE5Rc3RweUFJRThub1lSNXptWkN3QlJYdGhJZVgvWFpRc2doc1Z4aWg3cjVuMnBBbApVYVQ0SS9jdHRjR2tYZ3ptcUdYQVVJSWQyeldrZlBzS0lkZ3U2RTZCT0xESk1iRFRrbDV0QndHWEtUTmdhQkwyCmNGb0xaL3BTbHNPRkhjdDgxR2FWZUxmVGNXSSswd0pKQUp6a1hmM1hsb2tCbXhwbzdwRmlKbkpJVXIvQ080TVkKR200VjgvUURINGlheGxGVDh0dGpkTjRYSlhDbUo4VEpvaGdJTngzaU80R1I4STVLU0p1dVFJdzFQY3hIQ3BlQgpBZ01CQUFHalJUQkRNQTRHQTFVZER3RUIvd1FFQXdJQ3BEQVNCZ05WSFJNQkFmOEVDREFHQVFIL0FnRUFNQjBHCkExVWREZ1FXQkJSd2lVeitTeEcrOFlodVRFbWdHSXdwcDBlRDREQU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUEKVGFOVnB3aXFnODR0VjYvWG44NDNycDRVc1ltYUx1UEtjK2pOVzFacVlRWjFxczV1MXRJeHNPekFzU2ErN1l6bwpTOVFCdzI2TERSajh2eCswcE1vNzc1QWEzVkd5QTg5K1NUU2wxWnEzMThyVTBsR2V6Y0dpNXBITXBIaTVwYjR3CmZhRU8wSEd5aTFqLy9BcFlGZmJlanhsNzVWaGlsY1NWblErNFBZcXVFOTRMRmxTMmZ1OWdDbzZvN3JDYldKVC8KZTBvRExLWkx3K3NrU2FLOERCTUprZnI1N1hkMC91Z3Q0ZzZPdzJ0Z20yZmIvQytMekJXYTIwV3ZXSVRFS0pEZwpVVkJPOUtRY0VpUldDMWZxMlkvb2NReUZMN0RiTitqRFJTTzVkdUNkMTkweUpFclYzTlB4S1RzWC9XVTY0cmNRClg4d3N1SWhhZm5rcmplc041QXlzU2c9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
                    url: 'https://api.app-aws-east2-412-sno-tgmgh.dev11.red-chesterfield.com:6443',
                  },
                  version: '4.12.12',
                  versionAvailableUpdates: [
                    {
                      channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:5c8ef9fba0a75318e0dfeab9ac472ab34aab7334d0d3c56fb4e78e34913b3012',
                      url: 'https://access.redhat.com/errata/RHBA-2023:1750',
                      version: '4.12.13',
                    },
                    {
                      channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:3cbffaf162ab3328c6eb0c2479705eba6cb1b9df4d60bbe370019038b26dd66a',
                      url: 'https://access.redhat.com/errata/RHBA-2023:1858',
                      version: '4.12.14',
                    },
                  ],
                  versionHistory: [
                    {
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:31510c9b02d7dbfc31b5cc3d914415d7515961eb1a23066af3ae9639b344ed13',
                      state: 'Completed',
                      verified: false,
                      version: '4.12.12',
                    },
                  ],
                },
                upgradeInfo: {
                  availableChannels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                  availableUpdates: ['4.12.13', '4.12.14'],
                  currentChannel: 'stable-4.12',
                  currentVersion: '4.12.12',
                  desiredChannel: 'stable-4.12',
                  desiredVersion: '4.12.12',
                  hookFailed: false,
                  hooksInProgress: false,
                  isReadySelectChannels: true,
                  isReadyUpdates: true,
                  isSelectingChannel: false,
                  isUpgradeCuration: false,
                  isUpgrading: false,
                  latestJob: {
                    conditionMessage: '',
                    step: 'prehook-ansiblejob',
                  },
                  posthookDidNotRun: false,
                  posthooks: {
                    failed: false,
                    hasHooks: false,
                    inProgress: false,
                    success: false,
                  },
                  prehooks: {
                    failed: false,
                    hasHooks: false,
                    inProgress: false,
                    success: false,
                  },
                  upgradeFailed: false,
                  upgradePercentage: '',
                },
              },
              hive: {
                isHibernatable: false,
                secrets: {},
              },
              isCurator: false,
              isHive: false,
              isHostedCluster: false,
              isHypershift: false,
              isManaged: true,
              isRegionalHubCluster: false,
              isSNOCluster: false,
              kubeApiServer: 'https://api.app-aws-east2-412-sno-tgmgh.dev11.red-chesterfield.com:6443',
              labels: {
                cloud: 'Amazon',
                'cluster.open-cluster-management.io/clusterset': 'default',
                clusterID: 'eee92b88-cca4-415e-a1b5-15d34f6e136f',
                'feature.open-cluster-management.io/addon-application-manager': 'available',
                'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                'feature.open-cluster-management.io/addon-search-collector': 'available',
                'feature.open-cluster-management.io/addon-work-manager': 'available',
                name: 'feng-managed',
                openshiftVersion: '4.12.12',
                'openshiftVersion-major': '4',
                'openshiftVersion-major-minor': '4.12',
                vendor: 'OpenShift',
              },
              name: 'feng-managed',
              namespace: 'feng-managed',
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
                      'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                      'failure-domain.beta.kubernetes.io/zone': 'us-east-2a',
                      'node-role.kubernetes.io/control-plane': '',
                      'node-role.kubernetes.io/master': '',
                      'node-role.kubernetes.io/worker': '',
                      'node.kubernetes.io/instance-type': 'm5.xlarge',
                    },
                    name: 'ip-10-0-133-122.us-east-2.compute.internal',
                  },
                ],
                ready: 1,
                unhealthy: 0,
                unknown: 0,
              },
              owner: {},
              provider: 'aws',
              status: 'ready',
              uid: 'e0364872-d194-4010-866e-b2bfc2f31ce8',
            },
            {
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
                      resourceVersion: '15065979',
                      uid: '7e4bfc53-bfd9-433b-b810-d2242334604c',
                    },
                    spec: {
                      installNamespace: 'open-cluster-management-agent-addon',
                    },
                    status: {
                      conditions: [
                        {
                          lastTransitionTime: '2023-05-01T13:34:16Z',
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
                            'client certificate rotated starting from 2023-05-01 13:31:18 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
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
                      resourceVersion: '15064620',
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
                            'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:34:16Z',
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
                      resourceVersion: '15069086',
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
                            'client certificate rotated starting from 2023-05-01 13:33:20 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:34:15Z',
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
                      resourceVersion: '15064588',
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
                            'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:35:20Z',
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
                      resourceVersion: '15064612',
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
                            'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:34:15Z',
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
                      resourceVersion: '15062508',
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
                          lastTransitionTime: '2023-05-01T13:34:15Z',
                          message: 'hypershift-addon add-on is available.',
                          reason: 'ManagedClusterAddOnLeaseUpdated',
                          status: 'True',
                          type: 'Available',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:33:45Z',
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
                            'client certificate rotated starting from 2023-05-01 13:28:45 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:33:56Z',
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
                            user: 'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon:agent:xgh4z',
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
                      resourceVersion: '15064601',
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
                            'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:34:15Z',
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
                      resourceVersion: '15062493',
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
                          lastTransitionTime: '2023-04-24T13:17:03Z',
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
                            'client certificate rotated starting from 2023-05-01 13:28:34 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                          reason: 'ClientCertificateUpdated',
                          status: 'True',
                          type: 'ClusterCertificateRotated',
                        },
                        {
                          lastTransitionTime: '2023-05-01T13:34:15Z',
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
                ],
                available: 8,
                degraded: 0,
                progressing: 0,
                unknown: 0,
              },
              clusterSet: 'default',
              consoleURL:
                'https://console-openshift-console.apps.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com',
              creationTimestamp: '2023-04-07T21:42:28Z',
              displayName: 'local-cluster',
              distribution: {
                displayVersion: 'OpenShift 4.12.10',
                isManagedOpenShift: false,
                k8sVersion: 'v1.25.7+eab9cc9',
                ocp: {
                  availableUpdates: ['4.12.11', '4.12.13', '4.12.14'],
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
                    {
                      channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:5c8ef9fba0a75318e0dfeab9ac472ab34aab7334d0d3c56fb4e78e34913b3012',
                      url: 'https://access.redhat.com/errata/RHBA-2023:1750',
                      version: '4.12.13',
                    },
                    {
                      channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                      image:
                        'quay.io/openshift-release-dev/ocp-release@sha256:3cbffaf162ab3328c6eb0c2479705eba6cb1b9df4d60bbe370019038b26dd66a',
                      url: 'https://access.redhat.com/errata/RHBA-2023:1858',
                      version: '4.12.14',
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
                upgradeInfo: {
                  availableChannels: [],
                  availableUpdates: ['4.12.11', '4.12.13', '4.12.14'],
                  currentChannel: 'stable-4.12',
                  currentVersion: '4.12.10',
                  desiredChannel: 'stable-4.12',
                  desiredVersion: '4.12.10',
                  hookFailed: false,
                  hooksInProgress: false,
                  isReadySelectChannels: false,
                  isReadyUpdates: true,
                  isSelectingChannel: false,
                  isUpgradeCuration: false,
                  isUpgrading: false,
                  latestJob: {
                    conditionMessage: '',
                    step: 'prehook-ansiblejob',
                  },
                  posthookDidNotRun: false,
                  posthooks: {
                    failed: false,
                    hasHooks: false,
                    inProgress: false,
                    success: false,
                  },
                  prehooks: {
                    failed: false,
                    hasHooks: false,
                    inProgress: false,
                    success: false,
                  },
                  upgradeFailed: false,
                  upgradePercentage: '',
                },
              },
              hive: {
                isHibernatable: false,
                secrets: {},
              },
              isCurator: false,
              isHive: false,
              isHostedCluster: false,
              isHypershift: false,
              isManaged: true,
              isRegionalHubCluster: false,
              isSNOCluster: false,
              kubeApiServer: 'https://api.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com:6443',
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
              name: 'local-cluster',
              namespace: 'local-cluster',
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
                      memory: '15928704Ki',
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
                      memory: '15928704Ki',
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
              owner: {},
              provider: 'aws',
              status: 'ready',
              uid: '24a4025f-53be-44d6-8b11-6b1cc0836efc',
            },
          ],
          clustersNames: ['feng-managed', 'local-cluster'],
          resourceCount: 2,
          sortedClusterNames: ['feng-managed', 'local-cluster'],
          subscription: {
            apiVersion: 'apps.open-cluster-management.io/v1',
            channels: [
              {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Channel',
                metadata: {
                  annotations: {
                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
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
                  creationTimestamp: '2023-04-27T14:32:09Z',
                  generation: 1,
                  labels: {
                    'cluster.open-cluster-management.io/placement': 'feng-cronjob-placement-1',
                  },
                  name: 'feng-cronjob-placement-1-decision-1',
                  namespace: 'feng-cronjob',
                  ownerReferences: [
                    {
                      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                      blockOwnerDeletion: true,
                      controller: true,
                      kind: 'Placement',
                      name: 'feng-cronjob-placement-1',
                      uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
                    },
                  ],
                  resourceVersion: '15067334',
                  uid: '31368536-3ffa-4838-a849-4dfe00c89983',
                },
                status: {
                  decisions: [
                    {
                      clusterName: 'feng-managed',
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
            kind: 'Subscription',
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'main',
                'apps.open-cluster-management.io/git-current-commit': '7b1ca44656bfaffbdac5aaaabf78c367c52b91b0-new',
                'apps.open-cluster-management.io/git-path': 'cronjob',
                'apps.open-cluster-management.io/manual-refresh-time': '2023-04-27T18:08:02.500Z',
                'apps.open-cluster-management.io/reconcile-option': 'merge',
                'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
              },
              creationTimestamp: '2023-04-27T14:32:09Z',
              generation: 1,
              labels: {
                app: 'feng-cronjob',
                'app.kubernetes.io/part-of': 'feng-cronjob',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
              name: 'feng-cronjob-subscription-1',
              namespace: 'feng-cronjob',
              resourceVersion: '15066022',
              uid: '30218235-d4c2-490d-8202-cd909d9c2824',
            },
            placements: [
              {
                apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                kind: 'Placement',
                metadata: {
                  creationTimestamp: '2023-04-27T14:32:09Z',
                  generation: 1,
                  labels: {
                    app: 'feng-cronjob',
                  },
                  name: 'feng-cronjob-placement-1',
                  namespace: 'feng-cronjob',
                  resourceVersion: '15067336',
                  uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
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
                      lastTransitionTime: '2023-04-27T14:32:09Z',
                      message: 'Placement configurations check pass',
                      reason: 'Succeedconfigured',
                      status: 'False',
                      type: 'PlacementMisconfigured',
                    },
                    {
                      lastTransitionTime: '2023-04-27T14:32:09Z',
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
            posthooks: [],
            prehooks: [],
            report: {
              apiVersion: 'apps.open-cluster-management.io/v1alpha1',
              kind: 'SubscriptionReport',
              metadata: {
                creationTimestamp: '2023-04-27T14:32:10Z',
                generation: 271,
                labels: {
                  'apps.open-cluster-management.io/hosting-subscription': 'feng-cronjob.feng-cronjob-subscription-1',
                },
                name: 'feng-cronjob-subscription-1',
                namespace: 'feng-cronjob',
                ownerReferences: [
                  {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'Subscription',
                    name: 'feng-cronjob-subscription-1',
                    uid: '30218235-d4c2-490d-8202-cd909d9c2824',
                  },
                ],
                resourceVersion: '15067378',
                uid: '0565dd80-4e28-49ce-add5-a2ba77ac31c5',
              },
              reportType: 'Application',
              resources: [
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello2',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello3',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello5',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello7',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello8',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello1',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello4',
                  namespace: 'feng-cronjob',
                },
                {
                  apiVersion: 'batch/v1',
                  kind: 'CronJob',
                  name: 'hello6',
                  namespace: 'feng-cronjob',
                },
              ],
              results: [
                {
                  result: 'deployed',
                  source: 'feng-managed',
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
            spec: {
              channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
              placement: {
                placementRef: {
                  kind: 'Placement',
                  name: 'feng-cronjob-placement-1',
                },
              },
            },
            status: {
              lastUpdateTime: '2023-05-01T13:36:20Z',
              message: 'Active',
              phase: 'Propagated',
            },
          },
          targetNamespaces: undefined,
          title: '',
        },
        type: 'cluster',
        uid: 'member--clusters--feng-managed--local-cluster--feng-cronjob-subscription-1',
      },
      {
        id: 'member--deployed-resource--member--clusters--feng-managed--local-cluster--feng-cronjob-subscription-1------cronjob',
        name: '',
        namespace: '',
        specs: {
          clustersNames: ['feng-managed', 'local-cluster'],
          isDesign: false,
          parent: {
            parentId: 'member--clusters--feng-managed--local-cluster--feng-cronjob-subscription-1',
            parentName: '',
            parentSpecs: {
              appClusters: undefined,
              clusters: [
                {
                  acmDistribution: {},
                  addons: {
                    addonList: [
                      {
                        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                        kind: 'ManagedClusterAddOn',
                        metadata: {
                          creationTimestamp: '2023-04-24T21:16:35Z',
                          finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
                          generation: 1,
                          name: 'application-manager',
                          namespace: 'feng-managed',
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
                          resourceVersion: '15068160',
                          uid: '010c9b30-10ad-4663-9cfa-e2b095e3f558',
                        },
                        spec: {
                          installNamespace: 'open-cluster-management-agent-addon',
                        },
                        status: {
                          conditions: [
                            {
                              lastTransitionTime: '2023-04-24T21:16:35Z',
                              message: 'the supported config resources are required in ClusterManagementAddon',
                              reason: 'ConfigurationUnsupported',
                              status: 'True',
                              type: 'UnsupportedConfiguration',
                            },
                            {
                              lastTransitionTime: '2023-04-28T22:45:34Z',
                              message: 'manifests of addon are applied successfully',
                              reason: 'AddonManifestApplied',
                              status: 'True',
                              type: 'ManifestApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:16:35Z',
                              message: 'Registration of the addon agent is configured',
                              reason: 'RegistrationConfigured',
                              status: 'True',
                              type: 'RegistrationApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:18:40Z',
                              message:
                                'client certificate rotated starting from 2023-04-24 21:13:37 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:37:42Z',
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
                                  'system:open-cluster-management:cluster:feng-managed:addon:application-manager',
                                  'system:open-cluster-management:addon:application-manager',
                                  'system:authenticated',
                                ],
                                user: 'system:open-cluster-management:cluster:feng-managed:addon:application-manager:agent:application-manager',
                              },
                            },
                          ],
                        },
                      },
                      {
                        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                        kind: 'ManagedClusterAddOn',
                        metadata: {
                          creationTimestamp: '2023-04-24T21:16:34Z',
                          generation: 1,
                          name: 'cert-policy-controller',
                          namespace: 'feng-managed',
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
                          resourceVersion: '15068149',
                          uid: '2a5476bd-5aa7-44b7-977a-b6a138fc80b1',
                        },
                        spec: {
                          installNamespace: 'open-cluster-management-agent-addon',
                        },
                        status: {
                          addOnConfiguration: {},
                          addOnMeta: {},
                          conditions: [
                            {
                              lastTransitionTime: '2023-04-28T22:45:33Z',
                              message: 'manifests of addon are applied successfully',
                              reason: 'AddonManifestApplied',
                              status: 'True',
                              type: 'ManifestApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:16:36Z',
                              message: 'Registration of the addon agent is configured',
                              reason: 'RegistrationConfigured',
                              status: 'True',
                              type: 'RegistrationApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:18:41Z',
                              message:
                                'client certificate rotated starting from 2023-04-24 21:13:37 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:37:42Z',
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
                                  'system:open-cluster-management:cluster:feng-managed:addon:cert-policy-controller',
                                  'system:open-cluster-management:addon:cert-policy-controller',
                                  'system:authenticated',
                                ],
                                user: 'system:open-cluster-management:cluster:feng-managed:addon:cert-policy-controller:agent:cert-policy-controller',
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
                          creationTimestamp: '2023-04-24T21:16:34Z',
                          generation: 1,
                          name: 'cluster-proxy',
                          namespace: 'feng-managed',
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
                          resourceVersion: '15068111',
                          uid: '52313f90-f428-4702-b4ea-574acc17ead0',
                        },
                        spec: {
                          installNamespace: 'open-cluster-management-agent-addon',
                        },
                        status: {
                          addOnConfiguration: {},
                          addOnMeta: {},
                          conditions: [
                            {
                              lastTransitionTime: '2023-04-28T22:45:32Z',
                              message: 'manifests of addon are applied successfully',
                              reason: 'AddonManifestApplied',
                              status: 'True',
                              type: 'ManifestApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:16:35Z',
                              message: 'Registration of the addon agent is configured',
                              reason: 'RegistrationConfigured',
                              status: 'True',
                              type: 'RegistrationApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:18:39Z',
                              message:
                                'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:37:41Z',
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
                          creationTimestamp: '2023-04-24T21:16:34Z',
                          finalizers: ['cluster.open-cluster-management.io/addon-pre-delete'],
                          generation: 1,
                          name: 'config-policy-controller',
                          namespace: 'feng-managed',
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
                          resourceVersion: '15068115',
                          uid: 'd37a04c7-5dcb-4188-983d-7357453a9743',
                        },
                        spec: {
                          installNamespace: 'open-cluster-management-agent-addon',
                        },
                        status: {
                          addOnConfiguration: {},
                          addOnMeta: {},
                          conditions: [
                            {
                              lastTransitionTime: '2023-04-28T05:04:56Z',
                              message: 'manifests of addon are applied successfully',
                              reason: 'AddonManifestApplied',
                              status: 'True',
                              type: 'ManifestApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:16:37Z',
                              message: 'Registration of the addon agent is configured',
                              reason: 'RegistrationConfigured',
                              status: 'True',
                              type: 'RegistrationApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:18:40Z',
                              message:
                                'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:37:41Z',
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
                                  'system:open-cluster-management:cluster:feng-managed:addon:config-policy-controller',
                                  'system:open-cluster-management:addon:config-policy-controller',
                                  'system:authenticated',
                                ],
                                user: 'system:open-cluster-management:cluster:feng-managed:addon:config-policy-controller:agent:config-policy-controller',
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
                          creationTimestamp: '2023-04-24T21:16:35Z',
                          generation: 1,
                          name: 'governance-policy-framework',
                          namespace: 'feng-managed',
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
                          resourceVersion: '15068120',
                          uid: 'e365f86d-66ad-430a-9f0d-335e7c1bf57d',
                        },
                        spec: {
                          installNamespace: 'open-cluster-management-agent-addon',
                        },
                        status: {
                          addOnConfiguration: {},
                          addOnMeta: {},
                          conditions: [
                            {
                              lastTransitionTime: '2023-04-26T22:05:02Z',
                              message: 'manifests of addon are applied successfully',
                              reason: 'AddonManifestApplied',
                              status: 'True',
                              type: 'ManifestApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:16:37Z',
                              message: 'Registration of the addon agent is configured',
                              reason: 'RegistrationConfigured',
                              status: 'True',
                              type: 'RegistrationApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:18:40Z',
                              message:
                                'client certificate rotated starting from 2023-04-24 21:13:37 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:37:41Z',
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
                                  'system:open-cluster-management:cluster:feng-managed:addon:governance-policy-framework',
                                  'system:open-cluster-management:addon:governance-policy-framework',
                                  'system:authenticated',
                                ],
                                user: 'system:open-cluster-management:cluster:feng-managed:addon:governance-policy-framework:agent:governance-policy-framework',
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
                          creationTimestamp: '2023-04-24T21:16:35Z',
                          generation: 1,
                          name: 'iam-policy-controller',
                          namespace: 'feng-managed',
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
                          resourceVersion: '15068131',
                          uid: '6367ebb9-6586-4774-861e-b77e58e230d8',
                        },
                        spec: {
                          installNamespace: 'open-cluster-management-agent-addon',
                        },
                        status: {
                          addOnConfiguration: {},
                          addOnMeta: {},
                          conditions: [
                            {
                              lastTransitionTime: '2023-04-28T05:04:58Z',
                              message: 'manifests of addon are applied successfully',
                              reason: 'AddonManifestApplied',
                              status: 'True',
                              type: 'ManifestApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:16:36Z',
                              message: 'Registration of the addon agent is configured',
                              reason: 'RegistrationConfigured',
                              status: 'True',
                              type: 'RegistrationApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:18:39Z',
                              message:
                                'client certificate rotated starting from 2023-04-24 21:13:35 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:37:41Z',
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
                                  'system:open-cluster-management:cluster:feng-managed:addon:iam-policy-controller',
                                  'system:open-cluster-management:addon:iam-policy-controller',
                                  'system:authenticated',
                                ],
                                user: 'system:open-cluster-management:cluster:feng-managed:addon:iam-policy-controller:agent:iam-policy-controller',
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
                          creationTimestamp: '2023-04-24T21:16:35Z',
                          generation: 1,
                          name: 'search-collector',
                          namespace: 'feng-managed',
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
                          resourceVersion: '15068140',
                          uid: 'acbd1542-2c18-423c-8974-935a749f22b3',
                        },
                        spec: {
                          installNamespace: 'open-cluster-management-agent-addon',
                        },
                        status: {
                          addOnConfiguration: {},
                          addOnMeta: {},
                          conditions: [
                            {
                              lastTransitionTime: '2023-04-24T21:16:35Z',
                              message: 'Registration of the addon agent is configured',
                              reason: 'RegistrationConfigured',
                              status: 'True',
                              type: 'RegistrationApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-28T22:45:33Z',
                              message: 'manifests of addon are applied successfully',
                              reason: 'AddonManifestApplied',
                              status: 'True',
                              type: 'ManifestApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:18:40Z',
                              message:
                                'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:37:41Z',
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
                                  'system:open-cluster-management:cluster:feng-managed:addon:search-collector',
                                  'system:open-cluster-management:addon:search-collector',
                                  'system:authenticated',
                                ],
                                user: 'system:open-cluster-management:cluster:feng-managed:addon:search-collector:agent:search-collector',
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
                          creationTimestamp: '2023-04-24T21:16:34Z',
                          generation: 1,
                          name: 'work-manager',
                          namespace: 'feng-managed',
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
                          resourceVersion: '15068126',
                          uid: '0ecefe51-ecd4-4203-9d2c-ff6e43fc6f46',
                        },
                        spec: {
                          installNamespace: 'open-cluster-management-agent-addon',
                        },
                        status: {
                          addOnConfiguration: {},
                          addOnMeta: {},
                          conditions: [
                            {
                              lastTransitionTime: '2023-04-24T21:16:35Z',
                              message: 'Registration of the addon agent is configured',
                              reason: 'RegistrationConfigured',
                              status: 'True',
                              type: 'RegistrationApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-28T22:45:32Z',
                              message: 'manifests of addon are applied successfully',
                              reason: 'AddonManifestApplied',
                              status: 'True',
                              type: 'ManifestApplied',
                            },
                            {
                              lastTransitionTime: '2023-04-24T21:18:40Z',
                              message:
                                'client certificate rotated starting from 2023-04-24 21:13:36 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:37:41Z',
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
                                  'system:open-cluster-management:cluster:feng-managed:addon:work-manager',
                                  'system:open-cluster-management:addon:work-manager',
                                  'system:authenticated',
                                ],
                                user: 'system:open-cluster-management:cluster:feng-managed:addon:work-manager:agent:work-manager',
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
                    ],
                    available: 8,
                    degraded: 0,
                    progressing: 0,
                    unknown: 0,
                  },
                  clusterSet: 'default',
                  consoleURL:
                    'https://console-openshift-console.apps.app-aws-east2-412-sno-tgmgh.dev11.red-chesterfield.com',
                  creationTimestamp: '2023-04-24T21:16:34Z',
                  displayName: 'feng-managed',
                  distribution: {
                    displayVersion: 'OpenShift 4.12.12',
                    isManagedOpenShift: false,
                    k8sVersion: 'v1.25.7+eab9cc9',
                    ocp: {
                      availableUpdates: ['4.12.13', '4.12.14'],
                      channel: 'stable-4.12',
                      desired: {
                        channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                        image:
                          'quay.io/openshift-release-dev/ocp-release@sha256:31510c9b02d7dbfc31b5cc3d914415d7515961eb1a23066af3ae9639b344ed13',
                        url: 'https://access.redhat.com/errata/RHBA-2023:1734',
                        version: '4.12.12',
                      },
                      desiredVersion: '4.12.12',
                      managedClusterClientConfig: {
                        caBundle:
                          'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURNakNDQWhxZ0F3SUJBZ0lJUlZwcnZzZVZkZzB3RFFZSktvWklodmNOQVFFTEJRQXdOekVTTUJBR0ExVUUKQ3hNSmIzQmxibk5vYVdaME1TRXdId1lEVlFRREV4aHJkV0psTFdGd2FYTmxjblpsY2kxc1lpMXphV2R1WlhJdwpIaGNOTWpNd05ESTBNVGsxTnpFNVdoY05Nek13TkRJeE1UazFOekU1V2pBM01SSXdFQVlEVlFRTEV3bHZjR1Z1CmMyaHBablF4SVRBZkJnTlZCQU1UR0d0MVltVXRZWEJwYzJWeWRtVnlMV3hpTFhOcFoyNWxjakNDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTDJnUEFWeFZPS1RMTFBmRkVNYzZ0cTFJZjVCZmJ5Vgo3NCtCZU9Beklud1N3WVIvelJJNzNrdldYclAxejV5ZDV4YXV5aStPdmNQSXNuLy9qL0NWZEJsSi9TTklaY1hJCmR0SlBIUHE3Sk8zTHFzQmxxZCtLNHdHL2dPdTV5TDd1WVRGLy81SjN5N3ViWVNrN2FkZjF0dnFUQVRKaTIxVlkKZFRHMTcwZG5way9kVXluZVQ2NGd1SjV1VmhKcWw5ZGFBR2J2QlM5UllRZzhtOXd0aDcxa1pkZ2lnRStJZHZJZQpha3g2enE3NEQrQ2xORy9MRFlPYnZ0dTNGaFQvNytBSjExUDVJZUV5VE1tSi94dVgxempEOXpacUpva2crWFV2CllkSW5CWEdycFBTeHFvYnZDNGorejNaK3pDNFlIcWN1elZGZHZxUjR0VWtMb3Z6NmtnUXV3TlVDQXdFQUFhTkMKTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3SFFZRFZSME9CQllFRkcxbQoxRDlmb2Z6RnROUVhaWHpYK2pRSnNlRXZNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUNGa1UwYjU2anlOSGpXCmtkU1BzL3F5RmxMMXkxZTdoOWNiWWR2bXl1N0w2SFl5WWxRQ05OcjdJOGVMbTVwOEV5THNaYXh2Rzg1aFNwYlgKTEZHVXFwSVVwMy9EdlBvRHRoTlFCYURVNHNtLzJYT3BKN2svdStSNkZxL2lvMTJHcXBvZHc1QWlzVkplb0FIVQpUV0RyYllNRnBQdzhZLzJzellYR2JnRjRjNHFSemdkWFpBZ0tVN21nZmc1OFI5OFMrVGxpNXdJY2I3ZWlEYSs1CmNCWXBhaXpVS1hFTTdkbEEzMHRYYzg5NTVRRmt6MW5oU1VDM3FUSE84aWluMXNFbHI2QTFiRkJhc2lFbVhhQkYKRldnT01oRFhSVmJ5YTl3K05ZVjFoY09vMDJvLy9oc2wvekUxZUorTHh5OVFRTVo4b2ZIQzQydXVpMmFIWG5RQwp3NU0zUXFkZgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEUURDQ0FpaWdBd0lCQWdJSVFmZURtZmNGZC8wd0RRWUpLb1pJaHZjTkFRRUxCUUF3UGpFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNU2d3SmdZRFZRUURFeDlyZFdKbExXRndhWE5sY25abGNpMXNiMk5oYkdodmMzUXQKYzJsbmJtVnlNQjRYRFRJek1EUXlOREU1TlRjeE9Wb1hEVE16TURReU1URTVOVGN4T1Zvd1BqRVNNQkFHQTFVRQpDeE1KYjNCbGJuTm9hV1owTVNnd0pnWURWUVFERXg5cmRXSmxMV0Z3YVhObGNuWmxjaTFzYjJOaGJHaHZjM1F0CmMybG5ibVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFzVTVvSmZsTkVFSlkKaGNyZDJZSjYvNnk2RXNzWi9aR3lEYmIwblVZSUFNVWFNWHJNVFNRUkFPMHBQa1JBTHZEMlJMdGVvWUh4ZSt6TAp4WXBpcTVSU2hzdDhHYTh3M1ZvQmFmT1ZpOHgxYTk4MlJKNzVrLzRLN0l6WnBUT1NyQlJMNUR2V213UCs2ZGtvCjVKSlNzVXMzVUQrbVhvck40VzFsRHZIU1h0ZFcxbU5HbDJ2L2RxTWZlZFBNTzZYdGQvZFh5T3FHdFBJcWtOQU0KRjFnUmZaMlBoQjNtY3lWZmEyREJwVittQWtGejN0UEFNWHhZVm9RdWVGb0tFWGlhRVBROElLSUFpM0ZNQms4OQpPZHNCVjlrZStoNGVZR1ZtNDdCV1JOUzQxdlNRSHVqQlY4WVB0WXlCZ1RNRmZkcC91ZHBkTFNoMWJmKytldVFpCjU0S2tydlpEelFJREFRQUJvMEl3UURBT0JnTlZIUThCQWY4RUJBTUNBcVF3RHdZRFZSMFRBUUgvQkFVd0F3RUIKL3pBZEJnTlZIUTRFRmdRVUJnRUtlRkdDS3JaV1I5T1FxUzI4MjUvN1Q1UXdEUVlKS29aSWh2Y05BUUVMQlFBRApnZ0VCQUh2eDZmWXphZVJUQlJYbG0rSGJSR2NWSHliang1RnkrMXpLeHZTWGR3bEoxZlZPeG9ZenZETng2TmlaCmk0Qlh4ZlRXZkJ6WjRKcWpDUW5zb2VPNzlBb0dJdGFtVlFkVlQxSjgxM2lkK1RiUElnYlBINGdtNkpoNHQyN3IKTVVmcklpR2dpdlNuTkFVeHFRZVpFSk5uSDRjYm1vWEd2Q1FyUlZobFJUY0U2TmdwMXlPT29rc1FoMzFQM2VmSwpNazVmNkh3Vm1YM3NRTWZzb2VzUXgrQ0NSNldiQnhtNCtBQk1tL3hMQVFGME1xTTlNRE1ldnpXQmM0QUVYUjNnCmNsYWZWWk1yNWhzTWlUdFBwa0RnUEV4L3loaFBucDZ2V2E3eEw3QXFrdUhBeXpMcGVMZC80Y3crZzZNMDFMbkcKc0xUdlBzbG5rYUUwNGhhbjFZMDJtRnFQa1kwPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlEVERDQ0FqU2dBd0lCQWdJSUlRdGl4V2h2T2Jvd0RRWUpLb1pJaHZjTkFRRUxCUUF3UkRFU01CQUdBMVVFCkN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyYVdObExXNWwKZEhkdmNtc3RjMmxuYm1WeU1CNFhEVEl6TURReU5ERTVOVGN4T1ZvWERUTXpNRFF5TVRFNU5UY3hPVm93UkRFUwpNQkFHQTFVRUN4TUpiM0JsYm5Ob2FXWjBNUzR3TEFZRFZRUURFeVZyZFdKbExXRndhWE5sY25abGNpMXpaWEoyCmFXTmxMVzVsZEhkdmNtc3RjMmxuYm1WeU1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0MKQVFFQXQ2SWdlTWtaQkV4cHM4Qlk0VithcElhR3l1YTczMnYzZFpjT1FWY0NiUFJuL21mTVpMc211dERzMC8yKwp6eDA4MnVjZnRpYkNaSTB6NE1hM1ZueWhPSnU0S1dpamZ1azNyK04vd0xXc3M4cjdtQ1ltMjE2RDhoVFZRTEhaCnM2Um5wWWFJYTZtN25CeVB3UzFRMU8yL0Z4c1AvdnY2cDAwbU5lNEZobmx3RVJBdDMrNU5mSlByNlV5VWI1aXIKeGFlckRXV3pVRGgyNUtpZFhlek1RZ2lBRXUyamdueEhDdTNiZ2o3N0dLeEJCbE9RREhKNy9UUU10V1pUUnNlZwpCRmJZR2IycVdFaGtVbXRid3UwY1M0VzU2bEdEeEdrekdSSGpCZU1WK0NiYlNWTVVmdEdHYkdncDR3eExaL2ZsCm1EK2RHbGRId0VkK3paL0k0Y2ZZWTZIc253SURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0R3WUQKVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV2QzMzMk04UWVUMUlFM0UwUlRGUmxVcG4vSTB3RFFZSgpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFBS1Vjc21EODdORFU3RmRmR2VoRTZnU3c3eDJVTXFWQmQ1UHdETlR6MUQ2ClN4TGxLMmtmeTJuNnJGZkNlVFE3WTR6Z1YyL0I1bXdqRk50MC9oeXZLZDVSbnhlUzdFRzhtNzdkK2Y4WkpVSzQKQzdoS1duWVp6R2RxSUZtcDVrOVpsOUs4RkY0Y2ZCc0h3U0xMc2lHZDgra2piMk5sTmJJOVE0OTFmd0xxOVFOQgp0Q0JZanB1MWxNZCtjOEVEVlBtT0s3UzQwcHNjaGFRbHZhWGJzbzFsSE00SUtTZHVyTExPTzUvcXRqcU9IeFN0CmIzbW9udzY3YldmaFZicHEwb21vb0NGUzAvaTZKcTdyd0UwU1JWSFoxK1ZCMkc1NGxLbjJMZllPT1k0Z0N6bkUKVGdkQnA5NTBNVWZCSkJ5RSt1VWFFS2R0QWtOVU5XVTZoMUVQK2JHTlZFQT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRGx6Q0NBbitnQXdJQkFnSUlQdTNjQkh1UU04Y3dEUVlKS29aSWh2Y05BUUVMQlFBd1dURlhNRlVHQTFVRQpBd3hPYjNCbGJuTm9hV1owTFd0MVltVXRZWEJwYzJWeWRtVnlMVzl3WlhKaGRHOXlYMnh2WTJGc2FHOXpkQzF5ClpXTnZkbVZ5ZVMxelpYSjJhVzVuTFhOcFoyNWxja0F4TmpneU16WTNNREkzTUI0WERUSXpNRFF5TkRJd01UQXkKT0ZvWERUTXpNRFF5TVRJd01UQXlPVm93V1RGWE1GVUdBMVVFQXd4T2IzQmxibk5vYVdaMExXdDFZbVV0WVhCcApjMlZ5ZG1WeUxXOXdaWEpoZEc5eVgyeHZZMkZzYUc5emRDMXlaV052ZG1WeWVTMXpaWEoyYVc1bkxYTnBaMjVsCmNrQXhOamd5TXpZM01ESTNNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQTFrOFUKMlZpaEtEZnJIZ2diaFFhbkhaNUx5QTd5Z1BRSkU4OHl4aERXcms1MVZtWG9HQWhhV1h0SERnNTZ2S1BpQWI0agpYb1ZGT0pLeTN5clc0eHhOUWR3a3g2Z3VqaXpsMnpaOC81Sk8rQXpaaFhNbmlXSzVrSGlkSTMrSTJURk5zL3pPCmNjbXJ3YWlyZWtVK05LVW5qdHNVTjBlRGxYQ2xxSFcrZ1U1cXYxcWY3d0ZydDgzMDFoa2NBYk9BcnhQdmF6dGYKSUFXeGtnRko2ZWdWNHdwSGIxQ3R1YXU1VjRLZkYxY2ZOamx3ZTAvaHozQ1RRUU1xeCt6bWxhWTJlYzVYajVkbQpLWEFSSElyQ25wT0dQbXZQYnRrZ2FnTzREQytaamNjR3cyL1VLZkhjU3dSZjVLU1VmUjJINUxGa3oyT2RucW4yClhxZXQxZnczWGl6Q3VmcS9vUUlEQVFBQm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVOUdyaHZuS08wQzRnOWl0RG5pdlVVdlVtc21Zd0h3WURWUjBqQkJndwpGb0FVOUdyaHZuS08wQzRnOWl0RG5pdlVVdlVtc21Zd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFDVkhiL29YCllscE1LSTBRbmlBcFdvQUJpTDJyRk1MdWJoeTFWLzB2ZDhtTi83NnVUWGtwT0RaMVpmcjA0UEZaSjN5SlFIemgKTHZFcGU5bGh6azhpMGVhb2VKbHZCTGFFZnRiZGd1R0dhMngzcGpHODJKQ2VuT0hlZ25td3NYUHZMSFBjd21DVQp6RVpoaHdoMEluWjdHYnFCTHBrZjFNcTZBV21tZWUza3Jnc1haaWNrZGdqaWFCY0o0WnF5V3ZRTmNpaUNjRlRTCkRDbUpWbm5ZeDdPOUxTMzEzU3FwVUJnU0sweTFqRzQ4L2pGVURFNVI4UE53WEpiRzVnSTJzQWZhelF6NmV1WVEKMHk2ajc1a0IwRE92ODdQWGNJLzlpN3pPdUIxQ3kzVnJxeVZlOGFGc3FLbVM5SmFNdnQvTDUxU2FWc0Npb0tTUAptNitFUzZXbjhNa0xKOGs9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURzVENDQXBtZ0F3SUJBZ0lJYjhSeFQ2aWZpRjR3RFFZSktvWklodmNOQVFFTEJRQXdKakVrTUNJR0ExVUUKQXd3YmFXNW5jbVZ6Y3kxdmNHVnlZWFJ2Y2tBeE5qZ3lNelkzTVRBM01CNFhEVEl6TURReU5ESXdNVEUwTjFvWApEVEkxTURReU16SXdNVEUwT0Zvd1NERkdNRVFHQTFVRUF3dzlLaTVoY0hCekxtRndjQzFoZDNNdFpXRnpkREl0Ck5ERXlMWE51YnkxMFoyMW5hQzVrWlhZeE1TNXlaV1F0WTJobGMzUmxjbVpwWld4a0xtTnZiVENDQVNJd0RRWUoKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTTdUeVp1M0JpVjRqenpDeGVPY3BvZngzQnBDM0tBdgp1N1IxRllhTXlvQUhURGxJZ0JxeDZaLzYxdENPZTdQNVlqRUxpNHdZT3ZabEk3YzhGNHBQVGxQVTIwOU5HQVNVCnFaWGxKSmJ1REdrbWlNb0NmOXo5b01OL0dGdXJncE51UDBZQm5UTWMvUnIrZ2d5TTlPR2VtR0E1Sm9rYmE5RlEKS3A1OEJnOVpuelFZcWRLR041UjBEZWhkOVZoc0hBMTN6N21QY2lOUmZxc2tWRU1idy9GTFB3Zm9yMldydnlZMwpBQnNGbElOMlcyM3doK08yNENCbjJPUkxGUC9adVNzWmxVQU5iYjZjclcwdFVPMGpjV3ZUd2NoZGlBL21aQzAvClN3RmNzRnJ3ZHV2YlZwWUZiVmwwSDBXOVU1VS9tM3J1Y0swb2krNEpGVnhDZ2t4MHJYTTVDcmNDQXdFQUFhT0IKd0RDQnZUQU9CZ05WSFE4QkFmOEVCQU1DQmFBd0V3WURWUjBsQkF3d0NnWUlLd1lCQlFVSEF3RXdEQVlEVlIwVApBUUgvQkFJd0FEQWRCZ05WSFE0RUZnUVVZSnMzR2lFbVp1dHhMOU14THdFRmxGc3hzWTB3SHdZRFZSMGpCQmd3CkZvQVVjSWxNL2tzUnZ2R0lia3hKb0JpTUthZEhnK0F3U0FZRFZSMFJCRUV3UDRJOUtpNWhjSEJ6TG1Gd2NDMWgKZDNNdFpXRnpkREl0TkRFeUxYTnVieTEwWjIxbmFDNWtaWFl4TVM1eVpXUXRZMmhsYzNSbGNtWnBaV3hrTG1OdgpiVEFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBVy8xNmMyKzlPTVZYMzdvWExKd0tQRTFDekFydXhneEp5R3RYCklaSXhIaWlvWjFONXU5WU9qUkZVR1hTOUlBc29ZVE9DWXU0R0lZd0lIUFpBRStzUnVxcVBxeGVQZzZ6RzhrczcKejZkZnROWHUwQTdPUWtuSHBUTERWWWpnSXlLUDhUME9FT2E5VEJhNnN0Wi9sbG4vQVVBbDQzczFIVnh6cHV6RgpPMjZkSGJMaXRBemN5aDBkSTZuZVpQalBYaWJuSy9wUzdwSnZ4NTBoK1ZLZjJ6MktDaUw4a3REQ3VMNFI0Qnc5ClB4V0ZDbWpTelNidGdaeEJJd3JMa29CWk1TWWlSc1FmNDJoeFYyNXhBOUdWL2VoRWVYN3U4QkFHcXhWeXc5blQKWXhjUFVsM1RIem1kYmZudGdROXd1Zk5qZmFKeHlrMSszT0Y3YlNhUjhEKzVCNzU5Z0E9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlERERDQ0FmU2dBd0lCQWdJQkFUQU5CZ2txaGtpRzl3MEJBUXNGQURBbU1TUXdJZ1lEVlFRRERCdHBibWR5ClpYTnpMVzl3WlhKaGRHOXlRREUyT0RJek5qY3hNRGN3SGhjTk1qTXdOREkwTWpBeE1UUTNXaGNOTWpVd05ESXoKTWpBeE1UUTRXakFtTVNRd0lnWURWUVFEREJ0cGJtZHlaWE56TFc5d1pYSmhkRzl5UURFMk9ESXpOamN4TURjdwpnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFETXppbS9yaWQ1bm9JSFFJbnJ0SzVpClFqWjFRQTE0cS85VEFmS0VGQkFzT2FzTEJUbEhwVDVHSUNxeWdXZk5zQ2doaDJ4SE8vQzFUbjJNeUR3L3hKZCsKazBicG41dEpQODBuZ3VVVE5Rc3RweUFJRThub1lSNXptWkN3QlJYdGhJZVgvWFpRc2doc1Z4aWg3cjVuMnBBbApVYVQ0SS9jdHRjR2tYZ3ptcUdYQVVJSWQyeldrZlBzS0lkZ3U2RTZCT0xESk1iRFRrbDV0QndHWEtUTmdhQkwyCmNGb0xaL3BTbHNPRkhjdDgxR2FWZUxmVGNXSSswd0pKQUp6a1hmM1hsb2tCbXhwbzdwRmlKbkpJVXIvQ080TVkKR200VjgvUURINGlheGxGVDh0dGpkTjRYSlhDbUo4VEpvaGdJTngzaU80R1I4STVLU0p1dVFJdzFQY3hIQ3BlQgpBZ01CQUFHalJUQkRNQTRHQTFVZER3RUIvd1FFQXdJQ3BEQVNCZ05WSFJNQkFmOEVDREFHQVFIL0FnRUFNQjBHCkExVWREZ1FXQkJSd2lVeitTeEcrOFlodVRFbWdHSXdwcDBlRDREQU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUEKVGFOVnB3aXFnODR0VjYvWG44NDNycDRVc1ltYUx1UEtjK2pOVzFacVlRWjFxczV1MXRJeHNPekFzU2ErN1l6bwpTOVFCdzI2TERSajh2eCswcE1vNzc1QWEzVkd5QTg5K1NUU2wxWnEzMThyVTBsR2V6Y0dpNXBITXBIaTVwYjR3CmZhRU8wSEd5aTFqLy9BcFlGZmJlanhsNzVWaGlsY1NWblErNFBZcXVFOTRMRmxTMmZ1OWdDbzZvN3JDYldKVC8KZTBvRExLWkx3K3NrU2FLOERCTUprZnI1N1hkMC91Z3Q0ZzZPdzJ0Z20yZmIvQytMekJXYTIwV3ZXSVRFS0pEZwpVVkJPOUtRY0VpUldDMWZxMlkvb2NReUZMN0RiTitqRFJTTzVkdUNkMTkweUpFclYzTlB4S1RzWC9XVTY0cmNRClg4d3N1SWhhZm5rcmplc041QXlzU2c9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==',
                        url: 'https://api.app-aws-east2-412-sno-tgmgh.dev11.red-chesterfield.com:6443',
                      },
                      version: '4.12.12',
                      versionAvailableUpdates: [
                        {
                          channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:5c8ef9fba0a75318e0dfeab9ac472ab34aab7334d0d3c56fb4e78e34913b3012',
                          url: 'https://access.redhat.com/errata/RHBA-2023:1750',
                          version: '4.12.13',
                        },
                        {
                          channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:3cbffaf162ab3328c6eb0c2479705eba6cb1b9df4d60bbe370019038b26dd66a',
                          url: 'https://access.redhat.com/errata/RHBA-2023:1858',
                          version: '4.12.14',
                        },
                      ],
                      versionHistory: [
                        {
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:31510c9b02d7dbfc31b5cc3d914415d7515961eb1a23066af3ae9639b344ed13',
                          state: 'Completed',
                          verified: false,
                          version: '4.12.12',
                        },
                      ],
                    },
                    upgradeInfo: {
                      availableChannels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                      availableUpdates: ['4.12.13', '4.12.14'],
                      currentChannel: 'stable-4.12',
                      currentVersion: '4.12.12',
                      desiredChannel: 'stable-4.12',
                      desiredVersion: '4.12.12',
                      hookFailed: false,
                      hooksInProgress: false,
                      isReadySelectChannels: true,
                      isReadyUpdates: true,
                      isSelectingChannel: false,
                      isUpgradeCuration: false,
                      isUpgrading: false,
                      latestJob: {
                        conditionMessage: '',
                        step: 'prehook-ansiblejob',
                      },
                      posthookDidNotRun: false,
                      posthooks: {
                        failed: false,
                        hasHooks: false,
                        inProgress: false,
                        success: false,
                      },
                      prehooks: {
                        failed: false,
                        hasHooks: false,
                        inProgress: false,
                        success: false,
                      },
                      upgradeFailed: false,
                      upgradePercentage: '',
                    },
                  },
                  hive: {
                    isHibernatable: false,
                    secrets: {},
                  },
                  isCurator: false,
                  isHive: false,
                  isHostedCluster: false,
                  isHypershift: false,
                  isManaged: true,
                  isRegionalHubCluster: false,
                  isSNOCluster: false,
                  kubeApiServer: 'https://api.app-aws-east2-412-sno-tgmgh.dev11.red-chesterfield.com:6443',
                  labels: {
                    cloud: 'Amazon',
                    'cluster.open-cluster-management.io/clusterset': 'default',
                    clusterID: 'eee92b88-cca4-415e-a1b5-15d34f6e136f',
                    'feature.open-cluster-management.io/addon-application-manager': 'available',
                    'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
                    'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
                    'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
                    'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
                    'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
                    'feature.open-cluster-management.io/addon-search-collector': 'available',
                    'feature.open-cluster-management.io/addon-work-manager': 'available',
                    name: 'feng-managed',
                    openshiftVersion: '4.12.12',
                    'openshiftVersion-major': '4',
                    'openshiftVersion-major-minor': '4.12',
                    vendor: 'OpenShift',
                  },
                  name: 'feng-managed',
                  namespace: 'feng-managed',
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
                          'failure-domain.beta.kubernetes.io/region': 'us-east-2',
                          'failure-domain.beta.kubernetes.io/zone': 'us-east-2a',
                          'node-role.kubernetes.io/control-plane': '',
                          'node-role.kubernetes.io/master': '',
                          'node-role.kubernetes.io/worker': '',
                          'node.kubernetes.io/instance-type': 'm5.xlarge',
                        },
                        name: 'ip-10-0-133-122.us-east-2.compute.internal',
                      },
                    ],
                    ready: 1,
                    unhealthy: 0,
                    unknown: 0,
                  },
                  owner: {},
                  provider: 'aws',
                  status: 'ready',
                  uid: 'e0364872-d194-4010-866e-b2bfc2f31ce8',
                },
                {
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
                          resourceVersion: '15065979',
                          uid: '7e4bfc53-bfd9-433b-b810-d2242334604c',
                        },
                        spec: {
                          installNamespace: 'open-cluster-management-agent-addon',
                        },
                        status: {
                          conditions: [
                            {
                              lastTransitionTime: '2023-05-01T13:34:16Z',
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
                                'client certificate rotated starting from 2023-05-01 13:31:18 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
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
                          resourceVersion: '15064620',
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
                                'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:34:16Z',
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
                          resourceVersion: '15069086',
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
                                'client certificate rotated starting from 2023-05-01 13:33:20 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:34:15Z',
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
                          resourceVersion: '15064588',
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
                                'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:35:20Z',
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
                          resourceVersion: '15064612',
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
                                'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:34:15Z',
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
                          resourceVersion: '15062508',
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
                              lastTransitionTime: '2023-05-01T13:34:15Z',
                              message: 'hypershift-addon add-on is available.',
                              reason: 'ManagedClusterAddOnLeaseUpdated',
                              status: 'True',
                              type: 'Available',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:33:45Z',
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
                                'client certificate rotated starting from 2023-05-01 13:28:45 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:33:56Z',
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
                                user: 'system:open-cluster-management:cluster:local-cluster:addon:hypershift-addon:agent:xgh4z',
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
                          resourceVersion: '15064601',
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
                                'client certificate rotated starting from 2023-05-01 13:30:22 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:34:15Z',
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
                          resourceVersion: '15062493',
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
                              lastTransitionTime: '2023-04-24T13:17:03Z',
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
                                'client certificate rotated starting from 2023-05-01 13:28:34 +0000 UTC to 2023-05-24 13:19:24 +0000 UTC',
                              reason: 'ClientCertificateUpdated',
                              status: 'True',
                              type: 'ClusterCertificateRotated',
                            },
                            {
                              lastTransitionTime: '2023-05-01T13:34:15Z',
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
                    ],
                    available: 8,
                    degraded: 0,
                    progressing: 0,
                    unknown: 0,
                  },
                  clusterSet: 'default',
                  consoleURL:
                    'https://console-openshift-console.apps.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com',
                  creationTimestamp: '2023-04-07T21:42:28Z',
                  displayName: 'local-cluster',
                  distribution: {
                    displayVersion: 'OpenShift 4.12.10',
                    isManagedOpenShift: false,
                    k8sVersion: 'v1.25.7+eab9cc9',
                    ocp: {
                      availableUpdates: ['4.12.11', '4.12.13', '4.12.14'],
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
                        {
                          channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:5c8ef9fba0a75318e0dfeab9ac472ab34aab7334d0d3c56fb4e78e34913b3012',
                          url: 'https://access.redhat.com/errata/RHBA-2023:1750',
                          version: '4.12.13',
                        },
                        {
                          channels: ['candidate-4.12', 'candidate-4.13', 'eus-4.12', 'fast-4.12', 'stable-4.12'],
                          image:
                            'quay.io/openshift-release-dev/ocp-release@sha256:3cbffaf162ab3328c6eb0c2479705eba6cb1b9df4d60bbe370019038b26dd66a',
                          url: 'https://access.redhat.com/errata/RHBA-2023:1858',
                          version: '4.12.14',
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
                    upgradeInfo: {
                      availableChannels: [],
                      availableUpdates: ['4.12.11', '4.12.13', '4.12.14'],
                      currentChannel: 'stable-4.12',
                      currentVersion: '4.12.10',
                      desiredChannel: 'stable-4.12',
                      desiredVersion: '4.12.10',
                      hookFailed: false,
                      hooksInProgress: false,
                      isReadySelectChannels: false,
                      isReadyUpdates: true,
                      isSelectingChannel: false,
                      isUpgradeCuration: false,
                      isUpgrading: false,
                      latestJob: {
                        conditionMessage: '',
                        step: 'prehook-ansiblejob',
                      },
                      posthookDidNotRun: false,
                      posthooks: {
                        failed: false,
                        hasHooks: false,
                        inProgress: false,
                        success: false,
                      },
                      prehooks: {
                        failed: false,
                        hasHooks: false,
                        inProgress: false,
                        success: false,
                      },
                      upgradeFailed: false,
                      upgradePercentage: '',
                    },
                  },
                  hive: {
                    isHibernatable: false,
                    secrets: {},
                  },
                  isCurator: false,
                  isHive: false,
                  isHostedCluster: false,
                  isHypershift: false,
                  isManaged: true,
                  isRegionalHubCluster: false,
                  isSNOCluster: false,
                  kubeApiServer: 'https://api.app-aws-central1-412-hub-n6kwd.dev11.red-chesterfield.com:6443',
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
                  name: 'local-cluster',
                  namespace: 'local-cluster',
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
                          memory: '15928704Ki',
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
                          memory: '15928704Ki',
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
                  owner: {},
                  provider: 'aws',
                  status: 'ready',
                  uid: '24a4025f-53be-44d6-8b11-6b1cc0836efc',
                },
              ],
              clustersNames: ['feng-managed', 'local-cluster'],
              resourceCount: 2,
              sortedClusterNames: ['feng-managed', 'local-cluster'],
              subscription: {
                apiVersion: 'apps.open-cluster-management.io/v1',
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
                      creationTimestamp: '2023-04-27T14:32:09Z',
                      generation: 1,
                      labels: {
                        'cluster.open-cluster-management.io/placement': 'feng-cronjob-placement-1',
                      },
                      name: 'feng-cronjob-placement-1-decision-1',
                      namespace: 'feng-cronjob',
                      ownerReferences: [
                        {
                          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                          blockOwnerDeletion: true,
                          controller: true,
                          kind: 'Placement',
                          name: 'feng-cronjob-placement-1',
                          uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
                        },
                      ],
                      resourceVersion: '15067334',
                      uid: '31368536-3ffa-4838-a849-4dfe00c89983',
                    },
                    status: {
                      decisions: [
                        {
                          clusterName: 'feng-managed',
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
                kind: 'Subscription',
                metadata: {
                  annotations: {
                    'apps.open-cluster-management.io/git-branch': 'main',
                    'apps.open-cluster-management.io/git-current-commit':
                      '7b1ca44656bfaffbdac5aaaabf78c367c52b91b0-new',
                    'apps.open-cluster-management.io/git-path': 'cronjob',
                    'apps.open-cluster-management.io/manual-refresh-time': '2023-04-27T18:08:02.500Z',
                    'apps.open-cluster-management.io/reconcile-option': 'merge',
                    'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
                    'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
                  },
                  creationTimestamp: '2023-04-27T14:32:09Z',
                  generation: 1,
                  labels: {
                    app: 'feng-cronjob',
                    'app.kubernetes.io/part-of': 'feng-cronjob',
                    'apps.open-cluster-management.io/reconcile-rate': 'medium',
                  },
                  name: 'feng-cronjob-subscription-1',
                  namespace: 'feng-cronjob',
                  resourceVersion: '15066022',
                  uid: '30218235-d4c2-490d-8202-cd909d9c2824',
                },
                placements: [
                  {
                    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                    kind: 'Placement',
                    metadata: {
                      creationTimestamp: '2023-04-27T14:32:09Z',
                      generation: 1,
                      labels: {
                        app: 'feng-cronjob',
                      },
                      name: 'feng-cronjob-placement-1',
                      namespace: 'feng-cronjob',
                      resourceVersion: '15067336',
                      uid: 'b05f959a-c573-49e9-94d3-32ba37428a87',
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
                          lastTransitionTime: '2023-04-27T14:32:09Z',
                          message: 'Placement configurations check pass',
                          reason: 'Succeedconfigured',
                          status: 'False',
                          type: 'PlacementMisconfigured',
                        },
                        {
                          lastTransitionTime: '2023-04-27T14:32:09Z',
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
                posthooks: [],
                prehooks: [],
                report: {
                  apiVersion: 'apps.open-cluster-management.io/v1alpha1',
                  kind: 'SubscriptionReport',
                  metadata: {
                    creationTimestamp: '2023-04-27T14:32:10Z',
                    generation: 271,
                    labels: {
                      'apps.open-cluster-management.io/hosting-subscription':
                        'feng-cronjob.feng-cronjob-subscription-1',
                    },
                    name: 'feng-cronjob-subscription-1',
                    namespace: 'feng-cronjob',
                    ownerReferences: [
                      {
                        apiVersion: 'apps.open-cluster-management.io/v1',
                        blockOwnerDeletion: true,
                        controller: true,
                        kind: 'Subscription',
                        name: 'feng-cronjob-subscription-1',
                        uid: '30218235-d4c2-490d-8202-cd909d9c2824',
                      },
                    ],
                    resourceVersion: '15067378',
                    uid: '0565dd80-4e28-49ce-add5-a2ba77ac31c5',
                  },
                  reportType: 'Application',
                  resources: [
                    {
                      apiVersion: 'batch/v1',
                      kind: 'CronJob',
                      name: 'hello',
                      namespace: 'feng-cronjob',
                    },
                    {
                      apiVersion: 'batch/v1',
                      kind: 'CronJob',
                      name: 'hello2',
                      namespace: 'feng-cronjob',
                    },
                    {
                      apiVersion: 'batch/v1',
                      kind: 'CronJob',
                      name: 'hello3',
                      namespace: 'feng-cronjob',
                    },
                    {
                      apiVersion: 'batch/v1',
                      kind: 'CronJob',
                      name: 'hello5',
                      namespace: 'feng-cronjob',
                    },
                    {
                      apiVersion: 'batch/v1',
                      kind: 'CronJob',
                      name: 'hello7',
                      namespace: 'feng-cronjob',
                    },
                    {
                      apiVersion: 'batch/v1',
                      kind: 'CronJob',
                      name: 'hello8',
                      namespace: 'feng-cronjob',
                    },
                    {
                      apiVersion: 'batch/v1',
                      kind: 'CronJob',
                      name: 'hello1',
                      namespace: 'feng-cronjob',
                    },
                    {
                      apiVersion: 'batch/v1',
                      kind: 'CronJob',
                      name: 'hello4',
                      namespace: 'feng-cronjob',
                    },
                    {
                      apiVersion: 'batch/v1',
                      kind: 'CronJob',
                      name: 'hello6',
                      namespace: 'feng-cronjob',
                    },
                  ],
                  results: [
                    {
                      result: 'deployed',
                      source: 'feng-managed',
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
                spec: {
                  channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                  placement: {
                    placementRef: {
                      kind: 'Placement',
                      name: 'feng-cronjob-placement-1',
                    },
                  },
                },
                status: {
                  lastUpdateTime: '2023-05-01T13:36:20Z',
                  message: 'Active',
                  phase: 'Propagated',
                },
              },
              targetNamespaces: undefined,
              title: '',
            },
            parentType: 'cluster',
          },
          resourceCount: 18,
          resources: [
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello2',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello3',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello5',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello7',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello8',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello1',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello4',
              namespace: 'feng-cronjob',
            },
            {
              apiVersion: 'batch/v1',
              kind: 'CronJob',
              name: 'hello6',
              namespace: 'feng-cronjob',
            },
          ],
          template: undefined,
        },
        type: 'cronjob',
        uid: 'member--deployed-resource--member--clusters--feng-managed--local-cluster--feng-cronjob-subscription-1------cronjob',
      },
    ],
  }
  it('returns subscriptionTopology', () => {
    expect(getSubscriptionTopology(application, managedClusters, undefined)).toEqual(result)
  })
})
