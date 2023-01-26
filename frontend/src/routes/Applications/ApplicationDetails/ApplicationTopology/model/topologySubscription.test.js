/* Copyright Contributors to the Open Cluster Management project */

import { createReplicaChild } from './topologySubscription'

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
