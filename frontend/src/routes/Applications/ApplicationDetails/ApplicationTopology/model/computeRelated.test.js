// Copyright Contributors to the Open Cluster Management project

import { mapSingleApplication } from './computeRelated'

describe('mapSingleApplication', () => {
    const app = {
        items: [
            {
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                cluster: 'local-cluster',
                created: '2022-09-16T21:13:04Z',
                kind: 'application',
                kind_plural: 'applications',
                label: 'app.kubernetes.io/part-of=feng-hello; app=feng-hello; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'false',
                name: 'feng-hello-application',
                namespace: 'feng-hello',
                status: 'Propagated',
                timeWindow: 'none',
                _gitbranch: 'main',
                _gitpath: 'helloworld',
                _hubClusterResource: 'true',
                _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
                _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
            },
        ],
        related: [
            {
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                cluster: 'local-cluster',
                created: '2022-09-16T21:13:04Z',
                kind: 'application',
                kind_plural: 'applications',
                label: 'app.kubernetes.io/part-of=feng-hello; app=feng-hello; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'false',
                name: 'feng-hello-application',
                namespace: 'feng-hello',
                status: 'Propagated',
                timeWindow: 'none',
                _gitbranch: 'main',
                _gitpath: 'helloworld',
                _hubClusterResource: 'true',
                _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
                _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
            },
        ],
    }

    const result = {
        _gitbranch: 'main',
        _gitpath: 'helloworld',
        _hubClusterResource: 'true',
        _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
        _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
        apigroup: 'apps.open-cluster-management.io',
        apiversion: 'v1',
        channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        cluster: 'local-cluster',
        created: '2022-09-16T21:13:04Z',
        kind: 'application',
        kind_plural: 'applications',
        label: 'app.kubernetes.io/part-of=feng-hello; app=feng-hello; apps.open-cluster-management.io/reconcile-rate=medium',
        localPlacement: 'false',
        name: 'feng-hello-application',
        namespace: 'feng-hello',
        related: [
            {
                _gitbranch: 'main',
                _gitpath: 'helloworld',
                _hubClusterResource: 'true',
                _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
                _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                cluster: 'local-cluster',
                created: '2022-09-16T21:13:04Z',
                kind: 'application',
                kind_plural: 'applications',
                label: 'app.kubernetes.io/part-of=feng-hello; app=feng-hello; apps.open-cluster-management.io/reconcile-rate=medium',
                localPlacement: 'false',
                name: 'feng-hello-application',
                namespace: 'feng-hello',
                status: 'Propagated',
                timeWindow: 'none',
            },
        ],
        status: 'Propagated',
        timeWindow: 'none',
    }
    it('mapSingleApplication primary app', () => {
        expect(mapSingleApplication(app)).toEqual(result)
    })
})

describe('mapSingleApplication', () => {
    const app = {
        items: [
            {
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                cluster: 'local-cluster',
                created: '2022-09-16T21:13:04Z',
                kind: 'application',
                kind_plural: 'applications',
                label: 'app.kubernetes.io/instance=feng-hello',
                localPlacement: 'false',
                name: 'feng-hello-application',
                namespace: 'feng-hello',
                status: 'Propagated',
                timeWindow: 'none',
                _gitbranch: 'main',
                _gitpath: 'helloworld',
                _hubClusterResource: 'true',
                _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
                _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
            },
        ],
        related: [
            {
                items: [
                    {
                        ClusterCertificateRotated: 'True',
                        HubAcceptedManagedCluster: 'True',
                        ManagedClusterConditionAvailable: 'True',
                        ManagedClusterImportSucceeded: 'True',
                        ManagedClusterJoined: 'True',
                        addon: 'application-manager=true; cert-policy-controller=true; iam-policy-controller=true; policy-controller=true; search-collector=false',
                        apigroup: 'internal.open-cluster-management.io',
                        consoleURL:
                            'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                        cpu: 24,
                        created: '2022-08-30T15:07:12Z',
                        kind: 'cluster',
                        kubernetesVersion: 'v1.23.5+3afdacb',
                        label: 'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; cluster=error; clusterID=c5f0b499-3a45-4280-bb80-b1547a948fe3; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; local-cluster=true; name=local-cluster; openshiftVersion=4.10.20; velero.io/exclude-from-backup=true; vendor=OpenShift',
                        memory: '97683300Ki',
                        name: 'local-cluster',
                        nodes: 3,
                        status: 'OK',
                        _clusterNamespace: 'local-cluster',
                        _rbac: 'local-cluster_internal.open-cluster-management.io_managedclusterinfos',
                        _uid: 'cluster__local-cluster',
                    },
                ],
                kind: 'cluster',
            },
        ],
    }

    const result = {
        _gitbranch: 'main',
        _gitpath: 'helloworld',
        _hubClusterResource: 'true',
        _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
        _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
        apigroup: 'apps.open-cluster-management.io',
        apiversion: 'v1',
        channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
        cluster: 'local-cluster',
        created: '2022-09-16T21:13:04Z',
        kind: 'application',
        kind_plural: 'applications',
        label: 'app.kubernetes.io/instance=feng-hello',
        localPlacement: 'false',
        name: 'feng-hello-application',
        namespace: 'feng-hello',
        related: [
            {
                items: [
                    {
                        ClusterCertificateRotated: 'True',
                        HubAcceptedManagedCluster: 'True',
                        ManagedClusterConditionAvailable: 'True',
                        ManagedClusterImportSucceeded: 'True',
                        ManagedClusterJoined: 'True',
                        _clusterNamespace: 'local-cluster',
                        _rbac: 'local-cluster_internal.open-cluster-management.io_managedclusterinfos',
                        _uid: 'cluster__local-cluster',
                        addon: 'application-manager=true; cert-policy-controller=true; iam-policy-controller=true; policy-controller=true; search-collector=false',
                        apigroup: 'internal.open-cluster-management.io',
                        consoleURL:
                            'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                        cpu: 24,
                        created: '2022-08-30T15:07:12Z',
                        kind: 'cluster',
                        kubernetesVersion: 'v1.23.5+3afdacb',
                        label: 'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; cluster=error; clusterID=c5f0b499-3a45-4280-bb80-b1547a948fe3; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=available; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-iam-policy-controller=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; local-cluster=true; name=local-cluster; openshiftVersion=4.10.20; velero.io/exclude-from-backup=true; vendor=OpenShift',
                        memory: '97683300Ki',
                        name: 'local-cluster',
                        nodes: 3,
                        status: 'OK',
                    },
                ],
                kind: 'cluster',
            },
            {
                items: [
                    {
                        _gitbranch: 'main',
                        _gitpath: 'helloworld',
                        _hubClusterResource: 'true',
                        _rbac: 'feng-hello_apps.open-cluster-management.io_subscriptions',
                        _uid: 'local-cluster/10cee29e-d5a1-4ade-8329-70a18aad830f',
                        apigroup: 'apps.open-cluster-management.io',
                        apiversion: 'v1',
                        channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                        cluster: 'local-cluster',
                        created: '2022-09-16T21:13:04Z',
                        kind: 'application',
                        kind_plural: 'applications',
                        label: 'app.kubernetes.io/instance=feng-hello',
                        localPlacement: 'false',
                        name: 'feng-hello-application',
                        namespace: 'feng-hello',
                        status: 'Propagated',
                        timeWindow: 'none',
                    },
                ],
                kind: 'application',
            },
        ],
        status: 'Propagated',
        timeWindow: 'none',
    }
    it('mapSingleApplication argo child app', () => {
        expect(mapSingleApplication(app)).toEqual(result)
    })
})
