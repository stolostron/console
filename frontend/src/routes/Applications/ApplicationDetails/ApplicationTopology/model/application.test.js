// Copyright Contributors to the Open Cluster Management project

import {
    getApplication
} from './application'

describe('getApplication Argo', () => {
    const appData = {
        namespace: 'openshift-gitops',
        name: 'feng-argo',
        selectedChannel: undefined,
        recoilStates: {
            argoApplications: [
                {
                    apiVersion: "argoproj.io/v1alpha1",
                    kind: "Application",
                    metadata: {
                        annotations: [
                            {
                                "argocd.argoproj.io/refresh": "normal"
                            }
                        ],
                        creationTimestamp: "2022-02-25T16:33:00Z",
                        name: "feng-argo",
                        namespace: "openshift-gitops"
                    },
                    spec: {
                        destination: {name: 'in-cluster', namespace: 'feng-argo'},
                        project: "default",
                        source: { path: 'helloworld', repoURL: 'https://github.com/fxiang1/app-samples.git', targetRevision: 'HEAD' },
                        syncPolicy: {
                            automated: {prune: true, selfHeal: true},
                            syncOptions: ['CreateNamespace=true']
                        }
                    },
                    status: {
                        health: {status: 'Healthy'},
                        resources: [
                            {
                                health: {status: 'Healthy'},
                                kind: "Service",
                                name: "helloworld-app-svc",
                                namespace: "feng-argo",
                                status: "Synced",
                                version: "v1"
                            },
                            {
                                group: "apps",
                                health: {status: 'Healthy'},
                                kind: "Deployment",
                                name: "helloworld-app-deploy",
                                namespace: "feng-argo",
                                status: "Synced",
                                version: "v1"
                            },
                            {
                                group: "route.openshift.io",
                                health: {message: 'Route is healthy', status: 'Healthy'},
                                kind: "Route",
                                name: "helloworld-app-route",
                                namespace: "feng-argo",
                                status: "Synced",
                                version: "v1"
                            }
                        ]
                    }
                }
            ]
        },
        cluster: undefined,
        apiversion: 'application.argoproj.io',
        clusters: [
            {
                consoleURL: "https://console-openshift-console.apps.rbrunopi-aws-01.dev02.red-chesterfield.com",
                name: "rbrunopi-aws-01",
                namespace: "rbrunopi-aws-01",
                kubeApiServer: "https://api.rbrunopi-aws-01.dev02.red-chesterfield.com:6443",
                status: "unknown",
                statusMessage: "Registration agent stopped updating its lease."
            },
            {
                consoleURL: "https://console-openshift-console.apps.cs-aws-410-527vx.dev02.red-chesterfield.com",
                name: "console-managed",
                namespace: "console-managed",
                kubeApiServer: "https://api.cs-aws-410-527vx.dev02.red-chesterfield.com:6443",
                status: "unknown",
                statusMessage: "Registration agent stopped updating its lease."
            },
            {
                consoleURL: "https://console-openshift-console.apps.cs-aws-410-srnb7.dev02.red-chesterfield.com",
                name: "local-cluster",
                namespace: "local-cluster",
                kubeApiServer: "https://api.cs-aws-410-srnb7.dev02.red-chesterfield.com:6443",
                status: "ready",
                statusMessage: undefined
            }
        ]
    }

    const result = {
           "app":  {
             "apiVersion": "argoproj.io/v1alpha1",
             "kind": "Application",
             "metadata":  {
               "annotations":  [
                  {
                   "argocd.argoproj.io/refresh": "normal",
                 },
               ],
               "creationTimestamp": "2022-02-25T16:33:00Z",
               "name": "feng-argo",
               "namespace": "openshift-gitops",
             },
             "spec":  {
               "destination":  {
                 "name": "in-cluster",
                 "namespace": "feng-argo",
               },
               "project": "default",
               "source":  {
                 "path": "helloworld",
                 "repoURL": "https://github.com/fxiang1/app-samples.git",
                 "targetRevision": "HEAD",
               },
               "syncPolicy":  {
                 "automated":  {
                   "prune": true,
                   "selfHeal": true,
                 },
                 "syncOptions":  [
                   "CreateNamespace=true",
                 ],
               },
             },
             "status":  {
               "health":  {
                 "status": "Healthy",
               },
               "resources":  [
                  {
                   "health":  {
                     "status": "Healthy",
                   },
                   "kind": "Service",
                   "name": "helloworld-app-svc",
                   "namespace": "feng-argo",
                   "status": "Synced",
                   "version": "v1",
                 },
                  {
                   "group": "apps",
                   "health":  {
                     "status": "Healthy",
                   },
                   "kind": "Deployment",
                   "name": "helloworld-app-deploy",
                   "namespace": "feng-argo",
                   "status": "Synced",
                   "version": "v1",
                 },
                  {
                   "group": "route.openshift.io",
                   "health":  {
                     "message": "Route is healthy",
                     "status": "Healthy",
                   },
                   "kind": "Route",
                   "name": "helloworld-app-route",
                   "namespace": "feng-argo",
                   "status": "Synced",
                   "version": "v1",
                 },
               ],
             },
           },
           "isAppSet": false,
           "isArgoApp": true,
           "metadata":  {
             "annotations":  [
                {
                 "argocd.argoproj.io/refresh": "normal",
               },
             ],
             "creationTimestamp": "2022-02-25T16:33:00Z",
             "name": "feng-argo",
             "namespace": "openshift-gitops",
           },
           "name": "feng-argo",
           "namespace": "openshift-gitops",
           "placement": undefined,
         }
    it('return Argo app model', async () => {
        const model = await getApplication(appData.namespace, appData.name, appData.selectedChannel, appData.recoilStates, appData.cluster, appData.apiversion, appData.clusters)
        expect(model).toEqual(result)
    })
})
