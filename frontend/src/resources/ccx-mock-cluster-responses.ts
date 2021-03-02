import { Provider } from '@open-cluster-management/ui-components'
import { ClusterStatus } from '../lib/get-cluster'

/* istanbul ignore file */
export const MockCluster = (clusterName: string) => {
    return {
        name: clusterName,
        namespace: clusterName,
        status: "ready" as ClusterStatus,
        provider: "aws" as Provider,
        distribution: {
            k8sVersion: "v1.18.3+6c42de8",
            ocp: {
                availableUpdates: [
                    "4.5.9",
                    "4.5.17",
                    "4.5.24",
                    "4.5.15",
                    "4.5.11",
                    "4.5.18",
                    "4.5.13",
                    "4.5.16",
                    "4.5.19",
                    "4.5.14",
                    "4.5.21",
                    "4.5.20"
                ],
                desiredVersion: "4.5.8",
                version: "4.5.8",
                upgradeFailed: false
            },
            displayVersion: "OpenShift 4.5.8",
            isManagedOpenShift: false
        },
        labels: {
            cloud: "Amazon",
            clusterID: "0423d368-1f67-4300-bd26-05955bbbbf58",
            installerName: "multiclusterhub",
            installerNamespace: "open-cluster-management",
            localCluster: "false",
            name: "34c3ecc5-624a-49a5-bab8-4fdc5e51a266",
            vendor: "OpenShift"
        },
        nodes: {
            nodeList: [
                {
                    capacity: {
                        cpu: "4",
                        memory: "16116152Ki"
                    },
                    conditions: [
                        {
                            status: "True",
                            type: "Ready"
                        }
                    ],
                    labels: {
                        betaKubernetesIoInstanceType: "m5.xlarge",
                        failureDomainBetaKubernetesIoRegion: "us-east-2",
                        failureDomainBetaKubernetesIoZone: "us-east-2a",
                        nodeRoleKubernetesIoMaster: "",
                        nodeKubernetesIoInstanceType: "m5.xlarge"
                    },
                    name: "ip-10-0-128-203.us-east-2.compute.internal"
                },
            ],
            ready: 6,
            unhealthy: 0,
            unknown: 0
        },
        consoleURL: "https://console-openshift-console.apps.zlayne-dev.dev07.red-chesterfield.com",
        isHive: false,
        isManaged: true,
        kubeApiServer: '',
        hiveSecrets: {
            kubeconfig: undefined,
            kubeadmin: undefined,
            installConfig: undefined,
        }
    }
}

export const MockSingleClusterResponse = (clusterName: string) => {
    return [
        {
            status: "rejected",
            reason: {
                code: 404,
                name: "ResourceError"
            }
        },
        {
            status: "fulfilled",
            value: {
                apiVersion: "internal.open-cluster-management.io/v1beta1",
                kind: "ManagedClusterInfo",
                metadata: {
                    creationTimestamp: "2021-02-19T17:54:55Z",
                    generation: 1,
                    labels: {
                        cloud: "Amazon",
                        clusterID: "0423d368-1f67-4300-bd26-05955bbbbf58",
                        installerName: "multiclusterhub",
                        installerNamespace: "open-cluster-management",
                        localCluster: "false",
                        name: clusterName,
                        vendor: "OpenShift"
                    },
                    managedFields: [
                        {
                            apiVersion: "internal.open-cluster-management.io/v1beta1",
                            fieldsType: "FieldsV1",
                            manager: "controller",
                            operation: "Update",
                            time: "2021-02-20T21:57:09Z"
                        },
                        {
                            apiVersion: "internal.open-cluster-management.io/v1beta1",
                            fieldsType: "FieldsV1",
                            manager: "agent",
                            operation: "Update",
                            time: "2021-03-01T16:09:52Z"
                        }
                    ],
                    name: clusterName,
                    namespace: clusterName,
                    resourceVersion: "69617864",
                    selfLink: `/apis/internal.open-cluster-management.io/v1beta1/namespaces/${clusterName}/managedclusterinfos/${clusterName}`,
                    uid: "92d9e1e8-6ea6-4bbb-8dae-d98743f42762"
                },
                spec: {
                    loggingCA: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURGakNDQWY2Z0F3SUJBZ0lRWWhqS1hZb25NLzcwdlByY0ZYTEIwekFOQmdrcWhraUc5dzBCQVFzRkFEQWwKTVNNd0lRWURWUVFERXhwdGRXeDBhV05zZFhOMFpYSm9kV0l0YTJ4MWMzUmxjbXhsZERBZUZ3MHlNVEF5TVRreApOelV3TXpSYUZ3MHlNakF5TVRreE56VXdNelJhTUNVeEl6QWhCZ05WQkFNVEdtMTFiSFJwWTJ4MWMzUmxjbWgxCllpMXJiSFZ6ZEdWeWJHVjBNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXdtVGQKM3E2WEJxVlhpZXlhdTJ4NVZWUGJoNTNCMXdkU1VpWHVnQWhFeUE3dWRycmNLbC9KZTA5cWpMbHJRajZpOE9scQpBWHBUSmFZUWpuUndWZ1ZWZ29BWXlYTGtISDJuTlpoYzkzWEtSMHJOYWl1akR0Z2pKczBRUTlEYmt0QUZMOFhDCmdSRFNiVXp2TUo5eGsrODFuL3Y1eHc1K202T0ZVWElsVEh4dEZ0K1FxSXp4S0IxWGFpUUovb3NFV3lWREtCRjQKS2k4OVhOSXRtaXJEdWJaL0FHRDBDWUhkMkhHbUJ0WmhTY0JqQnlZVXc2SU5sa1ZaeUlqVmRodDNFVXFocUJtWQorSFg3VnN3eDNYSnJiZWZHK1RWSlFKaUNMUlFSZjAvakZmak94OVlYamNrV2gvTktxT0dybjdWOXBYWnpYTXd3Cmx4K1cxZmV0SmYvQmRsSi9qUUlEQVFBQm8wSXdRREFPQmdOVkhROEJBZjhFQkFNQ0FxUXdIUVlEVlIwbEJCWXcKRkFZSUt3WUJCUVVIQXdFR0NDc0dBUVVGQndNQ01BOEdBMVVkRXdFQi93UUZNQU1CQWY4d0RRWUpLb1pJaHZjTgpBUUVMQlFBRGdnRUJBSG41dFdCQ0k2QjN0cFdiY2JKbjVrUE56cjVJWmxxaldLVEIySHNQdi9VSVFOeGJCVlUwClpNcCt1aGFvN3RhekJOa1dibTJkUjQ2a3hTMEw0QjZKWkY4UzB3NlZnUWtRZFp5cnptTWpibVhuWTdIUmxWNUcKUzZmQSs3N29scC9RSnZVV0VhaGQxeGJJWERFVzdyTUFqVWNjK0ZOL0oxOGVrNXRma2l4endCOElqTm8zendGcApndFh1QnJYOUNTNDZkcUdPSU5YaEdmWFR6UjQ1YS9Va21GaTg2UWhrcFVyOXFKTUErSnAxZmYrSWtWRFJyNzZnClIydlFyYVlnVjQ5YXFKN1BjdXVKRUdLa2tYVjFhUmhUT1RLeDlLVTZESmtPeTFZdWN0Sk13enlyMmRhVmw4b0oKMmJXeXZnUjF3UlVpMTVBVitReXpTR2xGdUNLK0VESEUyenc9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K"
                },
                status: {
                    cloudVendor: "Amazon",
                    clusterID: "0423d368-1f67-4300-bd26-05955bbbbf58",
                    conditions: [
                        {
                            lastTransitionTime: "2021-02-19T17:54:52Z",
                            message: "Accepted by hub cluster admin",
                            reason: "HubClusterAdminAccepted",
                            status: "True",
                            type: "HubAcceptedManagedCluster"
                        },
                        {
                            lastTransitionTime: "2021-02-20T21:57:09Z",
                            message: "Managed cluster is available",
                            reason: "ManagedClusterAvailable",
                            status: "True",
                            type: "ManagedClusterConditionAvailable"
                        },
                        {
                            lastTransitionTime: "2021-02-19T17:55:09Z",
                            message: "Managed cluster joined",
                            reason: "ManagedClusterJoined",
                            status: "True",
                            type: "ManagedClusterJoined"
                        },
                        {
                            lastTransitionTime: "2021-02-19T17:57:16Z",
                            message: "Managed cluster info is synced",
                            reason: "ManagedClusterInfoSynced",
                            status: "True",
                            type: "ManagedClusterInfoSynced"
                        }
                    ],
                    consoleURL: "https://console-openshift-console.apps.zlayne-dev.dev07.red-chesterfield.com",
                    distributionInfo: {
                        ocp: {
                            availableUpdates: [
                                "4.5.24",
                                "4.5.9",
                                "4.5.13",
                                "4.5.19",
                                "4.5.20",
                                "4.5.21",
                                "4.5.14",
                                "4.5.17",
                                "4.5.16",
                                "4.5.11",
                                "4.5.18",
                                "4.5.15"
                            ],
                            desiredVersion: "4.5.8",
                            version: "4.5.8"
                        },
                        type: "OCP"
                    },
                    kubeVendor: "OpenShift",
                    loggingEndpoint: {
                        hostname: "klusterlet-addon-workmgr.open-cluster-management-agent-addon.svc",
                        ip: ""
                    },
                    loggingPort: {
                        name: "https",
                        port: 443,
                        protocol: "TCP"
                    },
                    nodeList: [
                        {
                            capacity: {
                                cpu: "4",
                                memory: "16116152Ki"
                            },
                            conditions: [
                                {
                                    status: "True",
                                    type: "Ready"
                                }
                            ],
                            labels: {
                                betaKubernetesIoInstanceType: "m5.xlarge",
                                failureDomainBetaKubernetesIoRegion: "us-east-2",
                                failureDomainBetaKubernetesIoZone: "us-east-2a",
                                nodeRoleKubernetesIoMaster: "",
                                nodeKubernetesIoInstanceType: "m5.xlarge"
                            },
                            name: "ip-10-0-128-203.us-east-2.compute.internal"
                        },
                        {
                            capacity: {
                                cpu: "4",
                                memory: "15944104Ki"
                            },
                            conditions: [
                                {
                                    status: "True",
                                    type: "Ready"
                                }
                            ],
                            labels: {
                                betaKubernetesIoInstanceType: "m5.xlarge",
                                failureDomainBetaKubernetesIoRegion: "us-east-2",
                                failureDomainBetaKubernetesIoZone: "us-east-2a",
                                nodeRoleKubernetesIoWorker: "",
                                nodeKubernetesIoInstanceType: "m5.xlarge"
                            },
                            name: "ip-10-0-157-253.us-east-2.compute.internal"
                        },
                        {
                            capacity: {
                                cpu: "4",
                                memory: "16116152Ki"
                            },
                            conditions: [
                                {
                                    status: "True",
                                    type: "Ready"
                                }
                            ],
                            labels: {
                                betaKubernetesIoInstanceType: "m5.xlarge",
                                failureDomainBetaKubernetesIoRegion: "us-east-2",
                                failureDomainBetaKubernetesIoZone: "us-east-2b",
                                nodeRoleKubernetesIoWorker: "",
                                nodeKubernetesIoInstanceType: "m5.xlarge"
                            },
                            name: "ip-10-0-167-120.us-east-2.compute.internal"
                        },
                        {
                            capacity: {
                                cpu: "4",
                                memory: "16116152Ki"
                            },
                            conditions: [
                                {
                                    status: "True",
                                    type: "Ready"
                                }
                            ],
                            labels: {
                                betaKubernetesIoInstanceType: "m5.xlarge",
                                failureDomainBetaKubernetesIoRegion: "us-east-2",
                                failureDomainBetaKubernetesIoZone: "us-east-2b",
                                nodeRoleKubernetesIoMaster: "",
                                nodeKubernetesIoInstanceType: "m5.xlarge"
                            },
                            name: "ip-10-0-170-179.us-east-2.compute.internal"
                        },
                        {
                            capacity: {
                                cpu: "4",
                                memory: "16116152Ki"
                            },
                            conditions: [
                                {
                                    status: "True",
                                    type: "Ready"
                                }
                            ],
                            labels: {
                                betaKubernetesIoInstanceType: "m5.xlarge",
                                failureDomainBetaKubernetesIoRegion: "us-east-2",
                                failureDomainBetaKubernetesIoZone: "us-east-2c",
                                nodeRoleKubernetesIoWorker: "",
                                nodeKubernetesIoInstanceType: "m5.xlarge"
                            },
                            name: "ip-10-0-214-254.us-east-2.compute.internal"
                        },
                        {
                            capacity: {
                                cpu: "4",
                                memory: "16116152Ki"
                            },
                            conditions: [
                                {
                                    status: "True",
                                    type: "Ready"
                                }
                            ],
                            labels: {
                                betaKubernetesIoInstanceType: "m5.xlarge",
                                failureDomainBetaKubernetesIoRegion: "us-east-2",
                                failureDomainBetaKubernetesIoZone: "us-east-2c",
                                nodeRoleKubernetesIoMaster: "",
                                nodeKubernetesIoInstanceType: "m5.xlarge"
                            },
                            name: "ip-10-0-221-108.us-east-2.compute.internal"
                        }
                    ],
                    version: "v1.18.3+6c42de8"
                }
            }
        },
        {
            status: "fulfilled",
            value: []
        },
        {
            status: "fulfilled",
            value: {
                apiVersion: "cluster.open-cluster-management.io/v1",
                kind: "ManagedCluster",
                metadata: {
                    creationTimestamp: "2021-02-19T17:54:52Z",
                    finalizers: [
                        "cluster.open-cluster-management.io/api-resource-cleanup",
                        "agent.open-cluster-management.io/klusterletaddonconfig-cleanup",
                        "managedcluster-import-controller.open-cluster-management.io/cleanup",
                        "open-cluster-management.io/managedclusterrole",
                        "managedclusterinfo.finalizers.open-cluster-management.io"
                    ],
                    generation: 1,
                    labels: {
                        cloud: "Amazon",
                        clusterID: "0423d368-1f67-4300-bd26-05955bbbbf58",
                        installerName: "multiclusterhub",
                        installerNamespace: "open-cluster-management",
                        localCluster: "false",
                        name: clusterName,
                        vendor: "OpenShift"
                    },
                    managedFields: [
                        {
                            apiVersion: "cluster.open-cluster-management.io/v1",
                            fieldsType: "FieldsV1",
                            manager: "multiclusterhub-operator",
                            operation: "Update",
                            time: "2021-02-19T17:54:52Z"
                        },
                        {
                            apiVersion: "cluster.open-cluster-management.io/v1",
                            fieldsType: "FieldsV1",
                            manager: "rcm-controller",
                            operation: "Update",
                            time: "2021-02-19T17:54:53Z"
                        },
                        {
                            apiVersion: "cluster.open-cluster-management.io/v1",
                            fieldsType: "FieldsV1",
                            manager: "controller",
                            operation: "Update",
                            time: "2021-02-19T17:57:16Z"
                        },
                        {
                            apiVersion: "cluster.open-cluster-management.io/v1",
                            fieldsType: "FieldsV1",
                            manager: "registration",
                            operation: "Update",
                            time: "2021-02-20T21:57:09Z"
                        }
                    ],
                    name: clusterName,
                    resourceVersion: "58527575",
                    selfLink: `/apis/cluster.open-cluster-management.io/v1/managedclusters/${clusterName}`,
                    uid: "393c53d1-bdf8-4a3b-974c-f8f161b8fc16"
                },
                spec: {
                    hubAcceptsClient: true,
                    leaseDurationSeconds: 60
                },
                status: {
                    allocatable: {
                        cpu: "21",
                        memory: "87518Mi"
                    },
                    capacity: {
                        cpu: "24",
                        memory: "94262Mi"
                    },
                    clusterClaims: [
                        {
                            name: "id.k8s.io",
                            value: clusterName
                        },
                        {
                            name: "kubeversion.open-cluster-management.io",
                            value: "v1.18.3+6c42de8"
                        },
                        {
                            name: "platform.open-cluster-management.io",
                            value: "AWS"
                        },
                        {
                            name: "product.open-cluster-management.io",
                            value: "OpenShift"
                        },
                        {
                            name: "consoleurl.cluster.open-cluster-management.io",
                            value: "https://console-openshift-console.apps.zlayne-dev.dev07.red-chesterfield.com"
                        },
                        {
                            name: "id.openshift.io",
                            value: "0423d368-1f67-4300-bd26-05955bbbbf58"
                        },
                        {
                            name: "infrastructure.openshift.io",
                            value: "{'infraName':'zlayne-dev-nt7fl'}"
                        },
                        {
                            name: "region.open-cluster-management.io",
                            value: "us-east-2"
                        },
                        {
                            name: "version.openshift.io",
                            value: "4.5.8"
                        }
                    ],
                    conditions: [
                        {
                            lastTransitionTime: "2021-02-19T17:54:52Z",
                            message: "Accepted by hub cluster admin",
                            reason: "HubClusterAdminAccepted",
                            status: "True",
                            type: "HubAcceptedManagedCluster"
                        },
                        {
                            lastTransitionTime: "2021-02-20T21:57:09Z",
                            message: "Managed cluster is available",
                            reason: "ManagedClusterAvailable",
                            status: "True",
                            type: "ManagedClusterConditionAvailable"
                        },
                        {
                            lastTransitionTime: "2021-02-19T17:55:09Z",
                            message: "Managed cluster joined",
                            reason: "ManagedClusterJoined",
                            status: "True",
                            type: "ManagedClusterJoined"
                        }
                    ],
                    version: {
                        kubernetes: "v1.18.3+6c42de8"
                    }
                }
            }
        }
    ]
}