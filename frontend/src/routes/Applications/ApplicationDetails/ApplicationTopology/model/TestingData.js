/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
export const ansibleSuccess = {
    type: 'ansiblejob',
    name: 'bigjoblaunch',
    namespace: 'default',
    id: 'member--deployable--member--subscription--default--ansible-tower-job-app-subscription--ansiblejob--bigjoblaunch',
    specs: {
        clustersNames: ['local-cluster'],
        searchClusters: ['local-cluster'],
        raw: {
            metadata: {
                name: 'bigjoblaunch',
                namespace: 'default',
            },
            spec: {
                ansibleJobResult: {
                    url: 'http://ansible_url/job',
                    status: 'successful',
                },
                conditions: [
                    {
                        ansibleResult: {},
                        message: 'Success',
                        reason: 'Successful',
                    },
                ],
            },
        },
        ansiblejobModel: {
            'bigjoblaunch-local-cluster': [
                {
                    label: 'tower_job_id=999999999',
                    namespace: 'default',
                    cluster: 'local-cluster',
                },
            ],
        },
    },
}
export const ansibleError = {
    type: 'ansiblejob',
    name: 'bigjoblaunch',
    namespace: 'default',
    id: 'member--deployable--member--subscription--default--ansible-tower-job-app-subscription--ansiblejob--bigjoblaunch',
    specs: {
        clustersNames: ['local-cluster'],
        searchClusters: ['local-cluster'],
        raw: {
            hookType: 'pre-hook',
            metadata: {
                name: 'bigjoblaunch',
                namespace: 'default',
            },
        },
        ansiblejobModel: {
            'bigjoblaunch-local-cluster': {
                label: 'tower_job_id=999999999',
            },
        },
    },
}
export const ansibleError2 = {
    type: 'ansiblejob',
    name: 'bigjoblaunch',
    namespace: 'default',
    id: 'member--deployable--member--subscription--default--ansible-tower-job-app-subscription--ansiblejob--bigjoblaunch',
    specs: {
        clustersNames: ['local-cluster'],
        searchClusters: ['local-cluster'],
        raw: {
            hookType: 'pre-hook',
            metadata: {
                name: 'bigjoblaunch',
                namespace: 'default',
            },
            spec: {
                conditions: [
                    {
                        ansibleResult: {
                            failures: 0,
                        },
                        message: 'Awaiting next reconciliation',
                        reason: 'Failed',
                    },
                ],
                k8sJob: {
                    message: 'some message',
                },
            },
        },
        ansiblejobModel: {
            'bigjoblaunch-local-cluster': [
                {
                    label: 'tower_job_id=999999999',
                    cluster: 'local-cluster',
                    namespace: 'default',
                },
            ],
        },
    },
}

export const ansibleErrorAllClusters = {
    type: 'ansiblejob',
    name: 'bigjoblaunch',
    namespace: 'default',
    id: 'member--member--deployable--member--clusters--fxiang-eks,local-cluster,ui-remote--vb-ansible-2--prehook-test-1-c0b22a--ansiblejob--prehook-test-1-c0b22a',
    specs: {
        clustersNames: ['local-cluster', 'ui-remote', 'fxiang-eks'],
        searchClusters: ['local-cluster'],
        raw: {
            hookType: 'pre-hook',
            metadata: {
                name: 'bigjoblaunch',
                namespace: 'default',
            },
            spec: {
                conditions: [
                    {
                        ansibleResult: {
                            failures: 0,
                        },
                        message: 'Awaiting next reconciliation',
                        reason: 'Failed',
                    },
                ],
                k8sJob: {
                    message: 'some message',
                },
            },
        },
        ansiblejobModel: {
            'bigjoblaunch-local-cluster': [
                {
                    label: 'tower_job_id=999999999',
                    cluster: 'local-cluster',
                    namespace: 'default',
                },
            ],
        },
    },
}

export const serverProps = {
    context: {
        locale: 'en-US',
    },
    xsrfToken: 'test',
}

export const selectedApp = {
    isSingleApplicationView: true,
    selectedAppName: 'mortgage-app',
    selectedAppNamespace: 'default',
}

export const resourceType = {
    name: 'QueryApplications',
    list: 'QueryApplicationList',
}

export const appNormalizedItems = {
    items: [
        'mortgage-app-default',
        'samplebook-gbapp-sample',
        'stocktrader-app-stock-trader',
        'subscribed-guestbook-application-kube-system',
    ],
    totalResults: 4,
    totalPages: 1,
    normalizedItems: {
        'mortgage-app-default': {
            _uid: 'local-cluster/5cd1d4c7-52aa-11ea-bf05-00000a102d26',
            name: 'mortgage-app',
            namespace: 'default',
            cluster: 'local-cluster',
            dashboard:
                'https://localhost:443/grafana/dashboard/db/mortgage-app-dashboard-via-federated-prometheus?namespace=default',
            clusterCount: { remoteCount: 1 },
            hubSubscriptions: [
                {
                    _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26',
                    status: 'Propagated',
                    channel: 'default/mortgage-channel',
                    __typename: 'Subscription',
                },
            ],
            created: '2018-02-18T23:57:04Z',
            __typename: 'Application',
        },
        'samplebook-gbapp-sample': {
            _uid: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
            name: 'samplebook-gbapp',
            namespace: 'sample',
            dashboard:
                'https://localhost:443/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
            clusterCount: { remoteCount: 1 },
            hubSubscriptions: [
                {
                    _uid: 'local-cluster/42d9ec27-52b9-11ea-bf05-00000a102d26',
                    status: 'Propagated',
                    channel: 'gbook-ch/guestbook',
                    __typename: 'Subscription',
                },
            ],
            created: '2018-02-19T01:43:43Z',
            __typename: 'Application',
        },
        'stocktrader-app-stock-trader': {
            _uid: 'local-cluster/8f4799db-4cf4-11ea-a229-00000a102d26',
            name: 'stocktrader-app',
            namespace: 'stock-trader',
            dashboard: null,
            clusterCount: { remoteCount: 0, localCount: 0 },
            hubSubscriptions: [],
            created: '2019-02-11T17:33:04Z',
            __typename: 'Application',
        },
        'subscribed-guestbook-application-kube-system': {
            _uid: 'local-cluster/e77e69a7-4d25-11ea-a229-00000a102d26',
            name: 'subscribed-guestbook-application',
            namespace: 'kube-system',
            dashboard: null,
            clusterCount: { remoteCount: 2, localCount: 1 },
            hubSubscriptions: [
                {
                    _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26',
                    status: 'Propagated',
                    channel: 'default/hub-local-helm-repo',
                    __typename: 'Subscription',
                },
            ],
            created: '2019-02-11T23:26:18Z',
            __typename: 'Application',
        },
    },
}
export const QueryApplicationList = {
    status: 'DONE',
    page: 1,
    search: 'mortgage',
    sortDirection: 'asc',
    sortColumn: 1,
    mutateStatus: 'DONE',
    deleteStatus: 'DONE',
    responseTime: 1530518207007 - 15000,
    deleteMsg: 'app123',
    items: [
        {
            _uid: 'local-cluster/96218695-3798-4dac-b3d3-179fb86b6715',
            name: 'mortgage-app',
            namespace: 'default',
            cluster: 'local-cluster',
            dashboard:
                'https://localhost:443/grafana/dashboard/db/mortgage-app-dashboard-via-federated-prometheus?namespace=default',
            clusterCount: { remoteCount: 1 },
            hubSubscriptions: [
                {
                    _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26',
                    status: 'Propagated',
                    channel: 'default/mortgage-channel',
                    __typename: 'Subscription',
                },
            ],
            created: '2018-02-18T23:57:04Z',
            __typename: 'Application',
        },
        {
            _uid: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
            name: 'samplebook-gbapp',
            namespace: 'sample',
            dashboard:
                'https://localhost:443/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
            clusterCount: { remoteCount: 1 },
            hubSubscriptions: [
                {
                    _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26gbook',
                    status: 'Propagated',
                    channel: 'gbook-ch/guestbook',
                    __typename: 'Subscription',
                },
            ],
            created: '2018-02-19T01:43:43Z',
            __typename: 'Application',
        },
        {
            _uid: 'local-cluster/8f4799db-4cf4-11ea-a229-00000a102d26',
            name: 'stocktrader-app',
            namespace: 'stock-trader',
            dashboard: null,
            clusterCount: { remoteCount: 0, localCount: 0 },
            hubSubscriptions: [],
            created: '2019-02-11T17:33:04Z',
            __typename: 'Application',
        },
        {
            _uid: 'local-cluster/e77e69a7-4d25-11ea-a229-00000a102d26',
            name: 'subscribed-guestbook-application',
            namespace: 'kube-system',
            dashboard: null,
            clusterCount: { remoteCount: 2, localCount: 1 },
            hubSubscriptions: [
                {
                    _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26gbook',
                    status: 'Propagated',
                    channel: 'default/hub-local-helm-repo',
                    __typename: 'Subscription',
                },
            ],
            created: '2019-02-11T23:26:18Z',
            __typename: 'Application',
        },
        {
            _uid: 'local-cluster/e77e69a7-4d25-11ea-a229-00000a100',
            name: 'app-no-channel',
            namespace: 'default',
            dashboard: null,
            clusterCount: { remoteCount: 0, localCount: 0 },
            created: '2019-02-11T23:26:18Z',
            __typename: 'Application',
            hubSubscriptions: [],
        },
    ],
}

export const QuerySubscriptionList = {
    status: 'DONE',
    page: 1,
    search: 'aa',
    sortDirection: 'asc',
    sortColumn: 1,
    mutateStatus: 'DONE',
    deleteStatus: 'DONE',
    deleteMsg: 'app123',
    items: [
        {
            _uid: 'local-cluster/91bc6cd2-eb00-4104-9f2a-a53fa32ef72e',
            name: 'ansible-hook',
            selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ansible/subscriptions/ansible-hook',
            namespace: 'ansible',
            appCount: 1,
            clusterCount: { localCount: 0, remoteCount: 0 },
            localPlacement: false,
            timeWindow: null,
            status: 'Propagated',
            channel: 'ansible/git',
            created: '2019-09-24T21:06:23Z',
            __typename: 'Subscription',
        },
        {
            _uid: 'local-cluster/7bfcf0d6-9ecf-4910-89e3-93dc904c7745',
            name: 'app123-subscription-0',
            selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ansible/subscriptions/app123-subscription-0',
            namespace: 'ansible',
            appCount: 1,
            clusterCount: { localCount: 0, remoteCount: 2 },
            localPlacement: false,
            timeWindow: null,
            status: 'Propagated',
            channel: 'val-test-create-resource-ns-0/val-test-create-resource-0',
            created: '2019-09-28T20:03:59Z',
            __typename: 'Subscription',
        },
        {
            _uid: 'local-cluster/8c115e07-3440-4152-bb72-25909b470537',
            name: 'app123-subscription-0',
            selfLink:
                '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/subscriptions/app123-subscription-0',
            namespace: 'ns-sub-1',
            appCount: 0,
            clusterCount: { localCount: 0, remoteCount: 2 },
            localPlacement: false,
            timeWindow: null,
            status: 'Propagated',
            channel: 'val-test-create-resource-ns-0/val-test-create-resource-0',
            created: '2019-09-28T16:31:51Z',
            __typename: 'Subscription',
        },
        {
            _uid: 'local-cluster/4808d505-1edf-478a-bc96-dd1621ccc810',
            name: 'application-chart-sub',
            selfLink:
                '/apis/apps.open-cluster-management.io/v1/namespaces/open-cluster-management/subscriptions/application-chart-sub',
            namespace: 'open-cluster-management',
            appCount: 0,
            clusterCount: { localCount: 1, remoteCount: 0 },
            localPlacement: true,
            timeWindow: null,
            status: 'Subscribed',
            channel: 'open-cluster-management/charts-v1',
            created: '2019-09-24T02:11:39Z',
            __typename: 'Subscription',
        },
    ],
}

export const QueryPlacementRuleList = {
    status: 'DONE',
    page: 1,
    search: 'aa',
    sortDirection: 'asc',
    sortColumn: 1,
    mutateStatus: 'DONE',
    deleteStatus: 'DONE',
    deleteMsg: 'app123',
    items: [
        {
            _uid: 'local-cluster/29bd08d9-c33f-4bd1-a820-f399020f66d5',
            name: 'app123-placement-0',
            selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ansible/placementrules/app123-placement-0',
            namespace: 'ansible',
            clusterCount: { localCount: 0, remoteCount: 2 },
            replicas: null,
            created: '2019-09-28T20:03:59Z',
            __typename: 'PlacementRule',
        },
        {
            _uid: 'local-cluster/6c133c4c-749d-4649-8208-442f07309649',
            name: 'app123-placement-0',
            selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ns-sub-1/placementrules/app123-placement-0',
            namespace: 'ns-sub-1',
            clusterCount: { localCount: 0, remoteCount: 2 },
            replicas: null,
            created: '2019-09-28T16:31:51Z',
            __typename: 'PlacementRule',
        },
        {
            _uid: 'local-cluster/e10c41ac-3d0f-43f9-8187-ea864b0fcdbf',
            name: 'cassandra-app-placement',
            selfLink:
                '/apis/apps.open-cluster-management.io/v1/namespaces/cassandra-app-ns/placementrules/cassandra-app-placement',
            namespace: 'cassandra-app-ns',
            clusterCount: { localCount: 0, remoteCount: 2 },
            replicas: 2,
            created: '2019-09-24T21:34:33Z',
            __typename: 'PlacementRule',
        },
        {
            _uid: 'local-cluster/31cc3d22-18ce-43c9-9b47-056a0a16e1b1',
            name: 'demo-saude-digital',
            selfLink:
                '/apis/apps.open-cluster-management.io/v1/namespaces/demo-saude-digital/placementrules/demo-saude-digital',
            namespace: 'demo-saude-digital',
            clusterCount: { localCount: 0, remoteCount: 2 },
            replicas: 2,
            created: '2019-09-24T21:34:35Z',
            __typename: 'PlacementRule',
        },
    ],
}

export const QueryChannelList = {
    status: 'DONE',
    page: 1,
    search: 'aa',
    sortDirection: 'asc',
    sortColumn: 1,
    mutateStatus: 'DONE',
    deleteStatus: 'DONE',
    responseTime: 1530518207007 - 15000,
    deleteMsg: 'app123',
    items: [
        {
            _uid: 'local-cluster/9891b8d3-8d2f-4533-bf07-26e1b918fb55',
            name: 'cassandra-channel',
            selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/cassandra-ch/channels/cassandra-channel',
            namespace: 'cassandra-ch',
            subscriptionCount: 1,
            clusterCount: { localCount: 0, remoteCount: 2 },
            type: 'GitHub',
            pathname: 'https://github.com/kubernetes/examples.git',
            localPlacement: false,
            created: '2019-09-24T21:34:33Z',
            __typename: 'Channel',
        },
        {
            _uid: 'local-cluster/41828117-d4e1-44c9-b3b3-ce0e628b1c6d',
            name: 'charts-v1',
            selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/open-cluster-management/channels/charts-v1',
            namespace: 'open-cluster-management',
            subscriptionCount: 11,
            clusterCount: { localCount: 1, remoteCount: 0 },
            type: 'HelmRepo',
            pathname: 'http://multiclusterhub-repo.open-cluster-management.svc.cluster.local:3000/charts',
            localPlacement: true,
            created: '2019-09-24T02:11:07Z',
            __typename: 'Channel',
        },
        {
            _uid: 'local-cluster/d47103af-8717-4b55-864c-78365b160e3d',
            name: 'gbchn',
            selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/gbchn/channels/gbchn',
            namespace: 'gbchn',
            subscriptionCount: 1,
            clusterCount: { localCount: 0, remoteCount: 2 },
            type: 'Namespace',
            pathname: 'gbchn',
            localPlacement: false,
            created: '2019-09-24T21:34:36Z',
            __typename: 'Channel',
        },
        {
            _uid: 'local-cluster/e3a1dc76-0864-4c97-929b-c01a0477a83b',
            name: 'git',
            selfLink: '/apis/apps.open-cluster-management.io/v1/namespaces/ansible/channels/git',
            namespace: 'ansible',
            subscriptionCount: 1,
            clusterCount: { localCount: 0, remoteCount: 0 },
            type: 'git',
            pathname: 'https://github.com/ianzhang366/acm-applifecycle-samples.git',
            localPlacement: false,
            created: '2019-09-24T19:26:11Z',
            __typename: 'Channel',
        },
    ],
}

export const QueryApplicationList_INCEPTION = {
    status: 'INCEPTION',
    page: 1,
    search: 'aa',
    sortDirection: 'asc',
    sortColumn: 1,
    items: [],
}
export const HCMChannelList = {
    status: 'DONE',
    items: [
        {
            kind: 'channel',
            name: 'mortgage-channel',
            namespace: 'default',
            selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/channels/mortgage-channel',
            created: '2019-02-18T23:56:15Z',
            cluster: 'local-cluster',
            apigroup: 'app.ibm.com',
            apiversion: 'v1alpha1',
            _rbac: 'default_app.ibm.com_channels',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
            pathname: 'default',
            label: 'app=mortgage-channel-mortgage; chart=mortgage-channel-1.0.0; heritage=Tiller; release=mortgage-channel',
            type: 'Namespace',
            data: {},
            related: [
                {
                    kind: 'subscription',
                    items: [
                        {
                            kind: 'subscription',
                            name: 'mortgage-app-subscription',
                            namespace: 'default',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-app-subscription',
                            created: '2018-02-18T23:57:04Z',
                            cluster: 'local-cluster',
                            channel: 'default/mortgage-channel',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'default_app.ibm.com_subscriptions',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26',
                            packageFilterVersion: '>=1.x',
                            label: 'app=mortgage-app-mortgage; chart=mortgage-1.0.3; heritage=Tiller; release=mortgage-app',
                        },
                        {
                            kind: 'subscription',
                            name: 'orphan',
                            namespace: 'default',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-app-subscription',
                            created: '2018-02-18T23:57:04Z',
                            cluster: 'local-cluster',
                            channel: 'default/mortgage-channel',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'default_app.ibm.com_subscriptions',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26orphan',
                            packageFilterVersion: '>=1.x',
                            label: 'app=mortgage-app-mortgage; chart=mortgage-1.0.3; heritage=Tiller; release=mortgage-app',
                        },
                    ],
                    __typename: 'SearchRelatedResult',
                },
            ],
        },
        {
            kind: 'channel',
            name: 'hub-local-helm-repo',
            namespace: 'default',
            selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/channels/hub-local-helm-repo',
            created: '2019-02-19T01:38:29Z',
            cluster: 'local-cluster',
            apigroup: 'app.ibm.com',
            apiversion: 'v1alpha1',
            _rbac: 'default_app.ibm.com_channels',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/87f95c96-52b8-11ea-bf05-00000a102d26',
            pathname: 'https://localhost:8443/helm-repo/charts',
            type: 'HelmRepo',
            related: [
                {
                    kind: 'subscription',
                    items: [
                        {
                            kind: 'subscription',
                            name: 'guestbook-subscription',
                            namespace: 'kube-system',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/subscriptions/guestbook-subscription',
                            created: '2019-02-19T01:38:58Z',
                            cluster: 'local-cluster',
                            channel: 'default/hub-local-helm-repo',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'kube-system_app.ibm.com_subscriptions',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26',
                            package: 'gbapp',
                            packageFilterVersion: '0.1.0',
                            label: 'app=subscribed-guestbook-application',
                        },
                    ],
                    __typename: 'SearchRelatedResult',
                },
            ],
        },
        {
            kind: 'channel',
            name: 'guestbook',
            namespace: 'gbook-ch',
            selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/gbook-ch/channels/guestbook',
            created: '2019-02-19T01:43:38Z',
            cluster: 'local-cluster',
            apigroup: 'app.ibm.com',
            apiversion: 'v1alpha1',
            _rbac: 'gbook-ch_app.ibm.com_channels',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/4019f8d8-52b9-11ea-bf05-00000a102d26',
            pathname: 'gbook-ch',
            label: 'app=gbchn; chart=gbchn-0.1.0; heritage=Tiller; release=guestbook',
            type: 'Namespace',
            related: [
                {
                    kind: 'subscription',
                    items: [
                        {
                            kind: 'subscription',
                            name: 'samplebook-gbapp-guestbook',
                            namespace: 'sample',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/sample/subscriptions/samplebook-gbapp-guestbook',
                            created: '2018-02-19T01:43:43Z',
                            cluster: 'local-cluster',
                            channel: 'gbook-ch/guestbook',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'sample_app.ibm.com_subscriptions',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/42d9ec27-52b9-11ea-bf05-00000a102d26',
                            label: 'app=gbapp; chart=gbapp-0.1.0; heritage=Tiller; release=samplebook',
                        },
                    ],
                },
            ],
        },
    ],
}

export const HCMChannelListEmpty = {
    status: 'DONE',
    items: [],
}

export const HCMApplication = {
    name: 'samplebook-gbapp',
    namespace: 'sample',
    dashboard: 'localhost/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
    selfLink: '/apis/app.k8s.io/v1beta1/namespaces/sample/applications/samplebook-gbapp',
    _uid: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
    created: '2018-02-19T01:43:43Z',
    apigroup: 'app.k8s.io',
    cluster: 'local-cluster',
    kind: 'application',
    label: 'app=gbapp; chart=gbapp-0.1.0; heritage=Tiller; release=samplebook',
    _hubClusterResource: 'true',
    _rbac: 'sample_app.k8s.io_applications',
}

export const HCMChannel = {
    name: 'samplebook-gbapp',
    namespace: 'sample',
    dashboard: 'localhost/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
    selfLink: '/apis/app.k8s.io/v1beta1/namespaces/sample/applications/samplebook-gbapp',
    _uid: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
    created: '2018-02-19T01:43:43Z',
    apigroup: 'app.k8s.io',
    cluster: 'local-cluster',
    kind: 'channel',
    label: 'app=gbapp; chart=gbapp-0.1.0; heritage=Tiller; release=samplebook',
    _hubClusterResource: 'true',
    _rbac: 'sample_app.k8s.io_applications',
}

export const HCMApplicationList = {
    forceReload: false,
    items: [
        {
            apigroup: 'app.k8s.io',
            cluster: 'local-cluster',
            created: '2018-08-13T19:23:00Z',
            dashboard: '',
            kind: 'application',
            label: '',
            name: 'mortgage-app',
            namespace: 'default',
            related: [
                {
                    items: [
                        {
                            kind: 'cluster',
                            kubernetesVersion: '',
                            name: 'local-cluster',
                            status: 'OK',
                        },
                    ],
                    kind: 'cluster',
                    __typename: 'SearchRelatedResult',
                },
                {
                    items: [
                        {
                            apigroup: 'apps.open-cluster-management.io',
                            apiversion: 'v1',
                            channel: 'mortgage-ch/mortgage-channel',
                            cluster: 'kcormier-cluster',
                            created: '2019-09-18T21:20:00Z',
                            kind: 'subscription',
                            label: 'app=mortgage-app-mortgage; hosting-deployable-name=mortgage-app-subscription-deployable; subscription-pause=false',
                            localPlacement: 'true',
                            name: 'mortgage-app-subscription',
                            namespace: 'default',
                            selfLink:
                                '/apis/apps.open-cluster-management.io/v1/namespaces/default/subscriptions/mortgage-app-subscription',
                            status: 'Failed',
                            timeWindow: 'none',
                            _clusterNamespace: 'kcormier-cluster',
                            _gitbranch: 'main',
                            _gitpath: 'mortgage',
                            _hostingDeployable: 'kcormier-cluster/mortgage-app-subscription-deployable-w2qpd',
                            _hostingSubscription: 'default/mortgage-app-subscription',
                            _rbac: 'kcormier-cluster_apps.open-cluster-management.io_subscriptions',
                            _uid: 'kcormier-cluster/727109c7-0742-44b2-bc19-37eccc63508b',
                        },
                        {
                            apigroup: 'apps.open-cluster-management.io',
                            apiversion: 'v1',
                            channel: 'mortgage-ch/mortgage-channel',
                            cluster: 'local-cluster',
                            created: '2018-08-13T19:23:01Z',
                            kind: 'subscription',
                            label: 'app=mortgage-app-mortgage',
                            name: 'mortgage-app-subscription',
                            namespace: 'default',
                            selfLink:
                                '/apis/apps.open-cluster-management.io/v1/namespaces/default/subscriptions/mortgage-app-subscription',
                            status: 'Propagated',
                            timeWindow: 'active',
                            _gitbranch: 'main',
                            _gitpath: 'mortgage',
                            _gitcommit: '0660bd66c02d09a4c8813d3ae2e711fc98b6426b',
                            _hubClusterResource: 'true',
                            _rbac: 'default_apps.open-cluster-management.io_subscriptions',
                            _uid: 'local-cluster/e5a9d3e2-a5df-43de-900c-c15a2079f760',
                        },
                    ],
                    kind: 'subscription',
                    __typename: 'SearchRelatedResult',
                },
                {
                    items: [
                        {
                            apigroup: 'apps.open-cluster-management.io',
                            apiversion: 'v1',
                            cluster: 'local-cluster',
                            created: '2019-08-15T09:11:11Z',
                            kind: 'deployable',
                            label: 'apps.open-cluster-management.io/channel-type=GitHub; apps.open-cluster-management.io/channel=mortgage-channel; apps.open-cluster-management.io/subscription=default-mortgage-app-subscription',
                            name: 'mortgage-app-subscription-mortgage-mortgage-app-svc-service',
                            namespace: 'default',
                            selfLink:
                                '/apis/apps.open-cluster-management.io/v1/namespaces/default/deployables/mortgage-app-subscription-mortgage-mortgage-app-svc-service',
                            _hubClusterResource: 'true',
                            _rbac: 'default_apps.open-cluster-management.io_deployables',
                            _uid: 'local-cluster/96551002-3e14-41fc-ad28-3912b51dd958',
                        },
                        {
                            apigroup: 'apps.open-cluster-management.io',
                            apiversion: 'v1',
                            cluster: 'local-cluster',
                            created: '2019-08-15T09:11:11Z',
                            kind: 'deployable',
                            label: 'apps.open-cluster-management.io/channel-type=GitHub; apps.open-cluster-management.io/channel=mortgage-channel; apps.open-cluster-management.io/subscription=default-mortgage-app-subscription',
                            name: 'mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment',
                            namespace: 'default',
                            selfLink:
                                '/apis/apps.open-cluster-management.io/v1/namespaces/default/deployables/mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment',
                            _hubClusterResource: 'true',
                            _rbac: 'default_apps.open-cluster-management.io_deployables',
                            _uid: 'local-cluster/c2e1cc72-3ae9-4b4a-acaa-e87ca5247a73',
                        },
                    ],
                    kind: 'deployable',
                    __typename: 'SearchRelatedResult',
                },
                {
                    items: [
                        {
                            apigroup: 'apps.open-cluster-management.io',
                            apiversion: 'v1',
                            cluster: 'local-cluster',
                            created: '2018-08-13T19:23:00Z',
                            kind: 'placementrule',
                            label: 'app=mortgage-app-mortgage',
                            name: 'mortgage-app-placement',
                            namespace: 'default',
                            selfLink:
                                '/apis/apps.open-cluster-management.io/v1/namespaces/default/placementrules/mortgage-app-placement',
                            _hubClusterResource: 'true',
                            _rbac: 'default_apps.open-cluster-management.io_placementrules',
                            _uid: 'local-cluster/0533baf0-e272-4db6-ae00-b99f1d4e2e1c',
                        },
                    ],
                    kind: 'placementrule',
                    __typename: 'SearchRelatedResult',
                },
                {
                    items: [
                        {
                            apigroup: 'apps.open-cluster-management.io',
                            apiversion: 'v1',
                            cluster: 'local-cluster',
                            created: '2018-08-13T19:23:00Z',
                            kind: 'channel',
                            name: 'mortgage-channel',
                            namespace: 'mortgage-ch',
                            pathname: 'https://github.com/fxiang1/app-samples.git',
                            selfLink:
                                '/apis/apps.open-cluster-management.io/v1/namespaces/mortgage-ch/channels/mortgage-channel',
                            type: 'GitHub',
                            _hubClusterResource: 'true',
                            _rbac: 'mortgage-ch_apps.open-cluster-management.io_channels',
                            _uid: 'local-cluster/54bb2ff5-7545-49fa-9020-6ea14b47f346',
                        },
                    ],
                    kind: 'channel',
                    __typename: 'SearchRelatedResult',
                },
            ],
            selfLink: '/apis/app.k8s.io/v1beta1/namespaces/default/applications/mortgage-app',
            _hubClusterResource: 'true',
            _rbac: 'default_app.k8s.io_applications',
            _uid: 'local-cluster/dc9499ab-d23f-4dac-ba9d-9232218a383f',
        },
    ],
    page: 1,
    pendingActions: [],
    postErrorMsg: '',
    putErrorMsg: '',
    resourceVersion: undefined,
    search: '',
    sortDirection: 'asc',
    responseTime: 1530518207007 - 15000,
    status: 'DONE',
}

export const HCMSubscriptionList = {
    status: 'DONE',
    items: [
        {
            kind: 'subscription',
            name: 'orphan',
            namespace: 'default',
            status: 'Propagated',
            selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-app-subscription',
            created: '2018-02-18T23:57:04Z',
            cluster: 'local-cluster',
            channel: 'default/mortgage-channel',
            apigroup: 'app.ibm.com',
            apiversion: 'v1alpha1',
            _rbac: 'default_app.ibm.com_subscriptions',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26orphan',
            packageFilterVersion: '>=1.x',
            label: 'app=mortgage-app-mortgage; chart=mortgage-1.0.3; heritage=Tiller; release=mortgage-app',
            related: [],
        },
        {
            kind: 'subscription',
            name: 'mortgage-app-subscription',
            namespace: 'default',
            status: 'Propagated',
            selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-app-subscription',
            created: '2018-02-18T23:57:04Z',
            cluster: 'local-cluster',
            channel: 'default/mortgage-channel',
            apigroup: 'app.ibm.com',
            apiversion: 'v1alpha1',
            _rbac: 'default_app.ibm.com_subscriptions',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/5cdc0d8d-52aa-11ea-bf05-00000a102d26',
            packageFilterVersion: '>=1.x',
            label: 'app=mortgage-app-mortgage; chart=mortgage-1.0.3; heritage=Tiller; release=mortgage-app',
            related: [
                {
                    kind: 'placementrule',
                    items: [
                        {
                            kind: 'placementrule',
                            name: 'guestbook-placementrule',
                            namespace: 'kube-system',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/placementrules/guestbook-placementrule',
                            created: '2019-02-11T23:26:17Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'kube-system_app.ibm.com_placementrules',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/e72e6c06-4d25-11ea-a229-00000a102d26',
                            label: 'app=subscribed-guestbook-application',
                        },
                    ],
                    __typename: 'SearchRelatedResult',
                },
                {
                    kind: 'application',
                    items: [
                        {
                            kind: 'application',
                            name: 'samplebook-gbapp',
                            namespace: 'sample',
                            dashboard:
                                'localhost/grafana/dashboard/db/samplebook-gbapp-dashboard-via-federated-prometheus?namespace=sample',
                            selfLink: '/apis/app.k8s.io/v1beta1/namespaces/sample/applications/samplebook-gbapp',
                            _uid: 'local-cluster/96218695-3798-4dac-b3d3-179fb86b6715',
                            created: '2018-02-19T01:43:43Z',
                            apigroup: 'app.k8s.io',
                            cluster: 'local-cluster',
                            label: 'app=gbapp; chart=gbapp-0.1.0; heritage=Tiller; release=samplebook',
                            _hubClusterResource: 'true',
                            _rbac: 'sample_app.k8s.io_applications',
                        },
                    ],
                },
                {
                    kind: 'deployable',
                    items: [
                        {
                            kind: 'deployable',
                            name: 'mortgage-app-subscription-deployable',
                            namespace: 'default',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
                            created: '2018-02-18T23:57:04Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'default_app.ibm.com_deployables',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
                        },
                        {
                            kind: 'deployable',
                            name: 'mortgage-app-subscription-deployable2',
                            namespace: 'default',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
                            created: '2018-02-18T23:57:04Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'default_app.ibm.com_deployables',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
                        },
                        {
                            kind: 'deployable',
                            name: 'mortgage-app-subscription-deployable3',
                            namespace: 'default',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
                            created: '2018-02-18T23:57:04Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'default_app.ibm.com_deployables',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
                        },
                        {
                            kind: 'deployable',
                            name: 'mortgage-app-subscription-deployable4',
                            namespace: 'default',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
                            created: '2018-02-18T23:57:04Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'default_app.ibm.com_deployables',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
                        },
                        {
                            kind: 'deployable',
                            name: 'mortgage-app-subscription-deployable5',
                            namespace: 'default',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
                            created: '2018-02-18T23:57:04Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'default_app.ibm.com_deployables',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
                        },
                        {
                            kind: 'deployable',
                            name: 'mortgage-app-subscription-deployable6',
                            namespace: 'default',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
                            created: '2018-02-18T23:57:04Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'default_app.ibm.com_deployables',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
                        },
                        {
                            kind: 'deployable',
                            name: 'mortgage-app-subscription-deployable7',
                            namespace: 'default',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/default/deployables/mortgage-app-subscription-deployable',
                            created: '2018-02-18T23:57:04Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'default_app.ibm.com_deployables',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/e2a1af5a-1830-46d3-ac8d-b481ecf6726b',
                        },
                    ],
                },
            ],
        },
        {
            kind: 'subscription',
            name: 'guestbook-subscription',
            namespace: 'kube-system',
            status: 'Propagated',
            selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/subscriptions/guestbook-subscription',
            created: '2019-02-19T01:38:58Z',
            cluster: 'local-cluster',
            channel: 'default/hub-local-helm-repo',
            apigroup: 'app.ibm.com',
            apiversion: 'v1alpha1',
            _rbac: 'kube-system_app.ibm.com_subscriptions',
            _hubClusterResource: 'true',
            _uid: 'local-cluster/98dce449-52b8-11ea-bf05-00000a102d26gbook',
            package: 'gbapp',
            packageFilterVersion: '0.1.0',
            label: 'app=subscribed-guestbook-application',
            related: [
                {
                    kind: 'deployable',
                    items: [
                        {
                            kind: 'deployable',
                            name: 'guestbook-subscription-deployable',
                            namespace: 'kube-system',
                            status: 'Propagated',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/deployables/guestbook-subscription-deployable',
                            created: '2019-02-19T01:38:58Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'kube-system_app.ibm.com_deployables',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/98df502a-52b8-11ea-bf05-00000a102d26',
                        },
                    ],
                    __typename: 'SearchRelatedResult',
                },
                {
                    kind: 'placementrule',
                    items: [
                        {
                            kind: 'placementrule',
                            name: 'guestbook-placementrule',
                            namespace: 'kube-system',
                            selfLink:
                                '/apis/app.ibm.com/v1alpha1/namespaces/kube-system/placementrules/guestbook-placementrule',
                            created: '2019-02-11T23:26:17Z',
                            cluster: 'local-cluster',
                            apigroup: 'app.ibm.com',
                            apiversion: 'v1alpha1',
                            _rbac: 'kube-system_app.ibm.com_placementrules',
                            _hubClusterResource: 'true',
                            _uid: 'local-cluster/e72e6c06-4d25-11ea-a229-00000a102d26',
                            label: 'app=subscribed-guestbook-application',
                        },
                    ],
                    __typename: 'SearchRelatedResult',
                },
            ],
        },
    ],
}

export const HCMPlacementRuleList = {
    items: [],
    page: 1,
    search: '',
    sortDirection: 'asc',
    status: 'INCEPTION',
    putErrorMsg: '',
    postErrorMsg: '',
    pendingActions: [],
    forceReload: false,
}

export const topologyNoChannel = {
    activeFilters: {
        application: {
            channel: '__ALL__/__ALL__//__ALL__/__ALL__',
            name: 'mortgage-app',
            namespace: 'default',
        },
    },
    availableFilters: {
        clusters: [],
        labels: [],
        namespaces: [],
        types: [],
    },
    detailsLoaded: true,
    detailsReloading: false,
    diagramFilters: [],
    fetchFilters: {
        application: {
            channel: '__ALL__/__ALL__//__ALL__/__ALL__',
            name: 'mortgage-app',
            namespace: 'default',
        },
    },
    links: [
        {
            from: { uid: 'application--mortgage-app', __typename: 'Resource' },
            specs: { isDesign: true },
            to: {
                uid: 'member--subscription--default--mortgage-app-subscription',
                __typename: 'Resource',
            },
            type: '',
            __typename: 'Relationship',
        },
        {
            from: {
                uid: 'member--subscription--default--mortgage-app-subscription',
                __typename: 'Resource',
            },
            specs: { isDesign: true },
            to: {
                uid: 'member--rules--default--mortgage-app-placement--0',
                __typename: 'Resource',
            },
            type: 'uses',
            __typename: 'Relationship',
        },
        {
            from: {
                uid: 'member--subscription--default--mortgage-app-subscription',
                __typename: 'Resource',
            },
            specs: { isDesign: true },
            to: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
            type: '',
            __typename: 'Relationship',
        },
        {
            from: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
            specs: null,
            to: {
                uid: 'member--member--deployable--member--clusters--fxia…rtgage-app-svc-service--service--mortgage-app-svc',
                __typename: 'Resource',
            },
            type: '',
            __typename: 'Relationship',
        },
        {
            from: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
            specs: null,
            to: {
                uid: 'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
                __typename: 'Resource',
            },
            type: '',
            __typename: 'Relationship',
        },
        {
            from: {
                uid: 'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
                __typename: 'Resource',
            },
            specs: null,
            to: {
                uid: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
                __typename: 'Resource',
            },
            type: '',
            __typename: 'Relationship',
        },
    ],
    loaded: true,
    nodes: [
        {
            cluster: null,
            clusterName: null,
            id: 'application--mortgage-app',
            labels: null,
            name: 'mortgage-app',
            namespace: 'default',
            specs: {
                allChannels: [],
                allClusters: {
                    isLocal: false,
                    remoteCount: 1,
                },
                allSubscriptions: [
                    {
                        kind: 'Subscription',
                        metadata: {
                            name: 'mortgage-app-subscription',
                            namespace: 'default',
                            annotations: {
                                'apps.open-cluster-management.io/git-branch': 'main',
                                'apps.open-cluster-management.io/git-path': 'mortgage',
                            },
                        },
                        spec: {
                            channel: 'mortgage-ch/mortgage-channel',
                            timewindow: {
                                hours: [{ end: '09:10PM', start: '8:00AM' }],
                                location: 'America/Toronto',
                                daysofweek: ['Monday', 'Tuesday', 'Wednesday'],
                                windowtype: 'active',
                            },
                        },
                    },
                ],
                activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
                channels: ['default/mortgage-app-subscription//mortgage-ch/mortgage-channel'],
                isDesign: true,
                pulse: 'green',
                raw: {
                    apiVersion: 'app.k8s.io/v1beta1',
                    kind: 'Application',
                    metadata: {
                        creationTimestamp: '2018-08-13T19:23:00Z',
                        generation: 2,
                        name: 'mortgage-app',
                        namespace: 'default',
                        resourceVersion: '2349939',
                        selfLink: '/apis/app.k8s.io/v1beta1/namespaces/default/applications/mortgage-app',
                        uid: 'dc9499ab-d23f-4dac-ba9d-9232218a383f',
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
                                    values: ['mortgage-app-mortgage'],
                                },
                            ],
                        },
                    },
                },
                row: 0,
            },
            topology: null,
            type: 'application',
            uid: 'application--mortgage-app',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--subscription--default--mortgage-app-subscription',
            labels: null,
            name: 'mortgage-app-subscription',
            namespace: 'default',
            specs: {
                hasRules: true,
                isDesign: true,
                isPlaced: true,
                pulse: 'yellow',
                raw: {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    channels: [],
                    kind: 'Subscription',
                    metadata: {
                        annotations: {
                            'apps.open-cluster-management.io/github-branch': 'main',
                            'apps.open-cluster-management.io/github-path': 'mortgage',
                        },
                        creationTimestamp: '2018-08-13T19:23:01Z',
                        generation: 2,
                        name: 'mortgage-app-subscription',
                    },
                    spec: {
                        channel: 'mortgage-ch/mortgage-channel',
                        timewindow: {
                            hours: [{ end: '09:10PM', start: '8:00AM' }],
                            location: 'America/Toronto',
                            daysofweek: ['Monday', 'Tuesday', 'Wednesday'],
                            windowtype: 'active',
                        },
                    },
                    status: {
                        lastUpdateTime: '2019-08-15T09:11:11Z',
                        phase: 'Propagated',
                    },
                },
                row: 18,
            },
            topology: null,
            type: 'subscription',
            uid: 'member--subscription--default--mortgage-app-subscription',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--rules--default--mortgage-app-placement--0',
            labels: null,
            name: 'mortgage-app-placement',
            namespace: 'default',
            specs: {
                isDesign: true,
                pulse: 'green',
                raw: {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    kind: 'PlacementRule',
                },
                row: 34,
            },
            topology: null,
            type: 'placements',
            uid: 'member--rules--default--mortgage-app-placement--0',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--clusters--fxiang',
            labels: null,
            name: 'fxiang',
            namespace: '',
            specs: {
                cluster: {
                    allocatable: { cpu: '33', memory: '137847Mi' },
                    capacity: { cpu: '36', memory: '144591Mi' },
                    consoleURL: 'https://console-openshift-console.apps.fxiang.dev06.red-chesterfield.com',
                    metadata: {
                        creationTimestamp: '2019-08-13T18:17:34Z',
                        finalizers: Array(5),
                        generation: 1,
                        name: 'fxiang',
                    },
                    rawCluster: {
                        apiVersion: 'cluster.open-cluster-management.io/v1',
                        kind: 'ManagedCluster',
                    },
                    rawStatus: {
                        apiVersion: 'internal.open-cluster-management.io/v1beta1',
                        kind: 'ManagedClusterInfo',
                    },
                    status: 'ok',
                },
                clusterNames: ['fxiang'],
                clusters: [
                    {
                        allocatable: { cpu: '33', memory: '137847Mi' },
                        capacity: { cpu: '36', memory: '144591Mi' },
                        consoleURL: 'https://console-openshift-console.apps.fxiang.dev06.red-chesterfield.com',
                        metadata: {
                            creationTimestamp: '2019-08-13T18:17:34Z',
                            finalizers: Array(5),
                            generation: 1,
                            name: 'fxiang',
                        },
                        rawCluster: {
                            apiVersion: 'cluster.open-cluster-management.io/v1',
                            kind: 'ManagedCluster',
                        },
                        rawStatus: {
                            apiVersion: 'internal.open-cluster-management.io/v1beta1',
                            kind: 'ManagedClusterInfo',
                        },
                        status: 'ok',
                    },
                ],
                pulse: 'orange',
            },
            topology: null,
            type: 'cluster',
            uid: 'member--clusters--fxiang',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
            labels: null,
            name: 'mortgage-app-svc',
            namespace: 'default',
            specs: {
                deployStatuses: [],
                isDesign: false,
                parent: {
                    parentId: 'member--clusters--fxiang',
                    parentName: 'fxiang',
                    parentType: 'cluster',
                },
                pulse: 'orange',
                raw: { apiVersion: 'v1', kind: 'Service' },
                row: 48,
            },
            topology: null,
            type: 'service',
            uid: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
            labels: null,
            name: 'mortgage-app-deploy',
            namespace: 'default',
            specs: {
                deployStatuses: [],
                isDesign: false,
                parent: {
                    parentId: 'member--clusters--fxiang',
                    parentName: 'fxiang',
                    parentType: 'cluster',
                },
                pulse: 'orange',
                raw: { apiVersion: 'apps/v1', kind: 'Deployment' },
                row: 63,
            },
            topology: null,
            type: 'deployment',
            uid: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
            labels: null,
            name: 'mortgage-app-deploy',
            namespace: 'default',
            specs: {
                isDesign: false,
                parent: {
                    parentId:
                        'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
                    parentName: 'mortgage-app-deploy',
                    parentType: 'deployment',
                },
                pulse: 'orange',
                raw: { kind: 'replicaset' },
                row: 93,
            },
            topology: null,
            type: 'replicaset',
            uid: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
            __typename: 'Resource',
        },
    ],
    otherTypeFilters: [],
    reloading: false,
    status: 'DONE',
    willLoadDetails: false,
}

export const topology = {
    activeFilters: {
        application: {
            channel: '__ALL__/__ALL__//__ALL__/__ALL__',
            name: 'mortgage-app',
            namespace: 'default',
        },
    },
    availableFilters: {
        clusters: [],
        labels: [],
        namespaces: [],
        types: [],
    },
    detailsLoaded: true,
    detailsReloading: false,
    diagramFilters: [],
    fetchFilters: {
        application: {
            channel: '__ALL__/__ALL__//__ALL__/__ALL__',
            name: 'mortgage-app',
            namespace: 'default',
        },
    },
    links: [
        {
            from: { uid: 'application--mortgage-app', __typename: 'Resource' },
            specs: { isDesign: true },
            to: {
                uid: 'member--subscription--default--mortgage-app-subscription',
                __typename: 'Resource',
            },
            type: '',
            __typename: 'Relationship',
        },
        {
            from: {
                uid: 'member--subscription--default--mortgage-app-subscription',
                __typename: 'Resource',
            },
            specs: { isDesign: true },
            to: {
                uid: 'member--rules--default--mortgage-app-placement--0',
                __typename: 'Resource',
            },
            type: 'uses',
            __typename: 'Relationship',
        },
        {
            from: {
                uid: 'member--subscription--default--mortgage-app-subscription',
                __typename: 'Resource',
            },
            specs: { isDesign: true },
            to: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
            type: '',
            __typename: 'Relationship',
        },
        {
            from: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
            specs: null,
            to: {
                uid: 'member--member--deployable--member--clusters--fxia…rtgage-app-svc-service--service--mortgage-app-svc',
                __typename: 'Resource',
            },
            type: '',
            __typename: 'Relationship',
        },
        {
            from: { uid: 'member--clusters--fxiang', __typename: 'Resource' },
            specs: null,
            to: {
                uid: 'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
                __typename: 'Resource',
            },
            type: '',
            __typename: 'Relationship',
        },
        {
            from: {
                uid: 'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
                __typename: 'Resource',
            },
            specs: null,
            to: {
                uid: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
                __typename: 'Resource',
            },
            type: '',
            __typename: 'Relationship',
        },
    ],
    loaded: true,
    nodes: [
        {
            cluster: null,
            clusterName: null,
            id: 'application--mortgage-app',
            labels: null,
            name: 'mortgage-app',
            namespace: 'default',
            specs: {
                //allChannels: [],
                allClusters: {
                    isLocal: false,
                    remoteCount: 1,
                },
                allChannels: [
                    {
                        kind: 'Channel',
                        metadata: {
                            name: 'mortgage-channel',
                            namespace: 'mortgage-ch',
                        },
                        spec: {
                            pathname: 'https://github.com/fxiang1/app-samples.git',
                            type: 'GitHub',
                        },
                    },
                ],
                allSubscriptions: [
                    {
                        kind: 'Subscription',
                        metadata: {
                            name: 'mortgage-app-subscription',
                            namespace: 'default',
                            annotations: {
                                'apps.open-cluster-management.io/git-branch': 'main',
                                'apps.open-cluster-management.io/git-path': 'mortgage',
                                'apps.open-cluster-management.io/manual-refresh-time': '2020-09-13T18:25:01Z',
                            },
                        },
                        spec: {
                            channel: 'mortgage-ch/mortgage-channel',
                            timewindow: {
                                hours: [{ end: '09:10PM', start: '8:00AM' }],
                                location: 'America/Toronto',
                                daysofweek: ['Monday', 'Tuesday', 'Wednesday'],
                                windowtype: 'active',
                            },
                        },
                    },
                ],
                activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
                channels: ['default/mortgage-app-subscription//mortgage-ch/mortgage-channel'],
                isDesign: true,
                pulse: 'green',
                raw: {
                    apiVersion: 'app.k8s.io/v1beta1',
                    kind: 'Application',
                    metadata: {
                        creationTimestamp: '2018-08-13T19:23:00Z',
                        generation: 2,
                        name: 'mortgage-app',
                        namespace: 'default',
                        resourceVersion: '2349939',
                        selfLink: '/apis/app.k8s.io/v1beta1/namespaces/default/applications/mortgage-app',
                        uid: 'dc9499ab-d23f-4dac-ba9d-9232218a383f',
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
                                    values: ['mortgage-app-mortgage'],
                                },
                            ],
                        },
                    },
                },
                row: 0,
            },
            topology: null,
            type: 'application',
            uid: 'application--mortgage-app',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--subscription--default--mortgage-app-subscription',
            labels: null,
            name: 'mortgage-app-subscription',
            namespace: 'default',
            specs: {
                hasRules: true,
                isDesign: true,
                isPlaced: true,
                pulse: 'yellow',
                raw: {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    channels: [],
                    kind: 'Subscription',
                    metadata: {
                        annotations: {
                            'apps.open-cluster-management.io/github-branch': 'main',
                            'apps.open-cluster-management.io/github-path': 'mortgage',
                        },
                        creationTimestamp: '2018-08-13T19:23:01Z',
                        generation: 2,
                        name: 'mortgage-app-subscription',
                    },
                    spec: {
                        channel: 'mortgage-ch/mortgage-channel',
                        timewindow: {
                            hours: [{ end: '09:10PM', start: '8:00AM' }],
                            location: 'America/Toronto',
                            daysofweek: ['Monday', 'Tuesday', 'Wednesday'],
                            windowtype: 'active',
                        },
                    },
                    status: {
                        lastUpdateTime: '2019-08-15T09:11:11Z',
                        phase: 'Propagated',
                    },
                },
                row: 18,
            },
            topology: null,
            type: 'subscription',
            uid: 'member--subscription--default--mortgage-app-subscription',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--rules--default--mortgage-app-placement--0',
            labels: null,
            name: 'mortgage-app-placement',
            namespace: 'default',
            specs: {
                isDesign: true,
                pulse: 'green',
                raw: {
                    apiVersion: 'apps.open-cluster-management.io/v1',
                    kind: 'PlacementRule',
                },
                row: 34,
            },
            topology: null,
            type: 'placements',
            uid: 'member--rules--default--mortgage-app-placement--0',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--clusters--fxiang',
            labels: null,
            name: 'fxiang',
            namespace: '',
            specs: {
                cluster: {
                    allocatable: { cpu: '33', memory: '137847Mi' },
                    capacity: { cpu: '36', memory: '144591Mi' },
                    consoleURL: 'https://console-openshift-console.apps.fxiang.dev06.red-chesterfield.com',
                    metadata: {
                        creationTimestamp: '2019-08-13T18:17:34Z',
                        finalizers: Array(5),
                        generation: 1,
                        name: 'fxiang',
                    },
                    rawCluster: {
                        apiVersion: 'cluster.open-cluster-management.io/v1',
                        kind: 'ManagedCluster',
                    },
                    rawStatus: {
                        apiVersion: 'internal.open-cluster-management.io/v1beta1',
                        kind: 'ManagedClusterInfo',
                    },
                    status: 'ok',
                },
                clusterNames: ['fxiang'],
                clusters: [
                    {
                        allocatable: { cpu: '33', memory: '137847Mi' },
                        capacity: { cpu: '36', memory: '144591Mi' },
                        consoleURL: 'https://console-openshift-console.apps.fxiang.dev06.red-chesterfield.com',
                        metadata: {
                            creationTimestamp: '2019-08-13T18:17:34Z',
                            finalizers: Array(5),
                            generation: 1,
                            name: 'fxiang',
                        },
                        rawCluster: {
                            apiVersion: 'cluster.open-cluster-management.io/v1',
                            kind: 'ManagedCluster',
                        },
                        rawStatus: {
                            apiVersion: 'internal.open-cluster-management.io/v1beta1',
                            kind: 'ManagedClusterInfo',
                        },
                        status: 'ok',
                    },
                ],
                pulse: 'orange',
            },
            topology: null,
            type: 'cluster',
            uid: 'member--clusters--fxiang',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
            labels: null,
            name: 'mortgage-app-svc',
            namespace: 'default',
            specs: {
                deployStatuses: [],
                isDesign: false,
                parent: {
                    parentId: 'member--clusters--fxiang',
                    parentName: 'fxiang',
                    parentType: 'cluster',
                },
                pulse: 'orange',
                raw: { apiVersion: 'v1', kind: 'Service' },
                row: 48,
            },
            topology: null,
            type: 'service',
            uid: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-svc-service--service--mortgage-app-svc',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
            labels: null,
            name: 'mortgage-app-deploy',
            namespace: 'default',
            specs: {
                deployStatuses: [],
                isDesign: false,
                parent: {
                    parentId: 'member--clusters--fxiang',
                    parentName: 'fxiang',
                    parentType: 'cluster',
                },
                pulse: 'orange',
                raw: { apiVersion: 'apps/v1', kind: 'Deployment' },
                row: 63,
            },
            topology: null,
            type: 'deployment',
            uid: 'member--member--deployable--member--clusters--fxiang--default--mortgage-app-subscription-mortgage-mortgage-app-deploy-deployment--deployment--mortgage-app-deploy',
            __typename: 'Resource',
        },
        {
            cluster: null,
            clusterName: null,
            id: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
            labels: null,
            name: 'mortgage-app-deploy',
            namespace: 'default',
            specs: {
                isDesign: false,
                parent: {
                    parentId:
                        'member--member--deployable--member--clusters--fxia…eploy-deployment--deployment--mortgage-app-deploy',
                    parentName: 'mortgage-app-deploy',
                    parentType: 'deployment',
                },
                pulse: 'orange',
                raw: { kind: 'replicaset' },
                row: 93,
            },
            topology: null,
            type: 'replicaset',
            uid: 'member--member--deployable--member--clusters--fxiang--replicaset--mortgage-app-deploy',
            __typename: 'Resource',
        },
    ],
    otherTypeFilters: [],
    reloading: false,
    status: 'DONE',
    willLoadDetails: false,
}

export const channelObjectForEdit = {
    data: {
        items: [
            {
                metadata: {
                    resourceVersion: '1487949',
                    creationTimestamp: '2019-03-18T20:06:46Z',
                    kind: 'channel',
                    name: 'mortgage-channel',
                    namespace: 'default',
                    selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/channels/mortgage-channel',
                    created: '2019-02-18T23:56:15Z',
                    cluster: 'local-cluster',
                    apigroup: 'app.ibm.com',
                    apiversion: 'v1alpha1',
                    _rbac: 'default_app.ibm.com_channels',
                    _hubClusterResource: 'true',
                    uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
                    pathname: 'default',
                    labels: {
                        app: 'mortgage-channel-mortgage',
                    },
                },
                type: 'Namespace',
            },
        ],
    },
}

export const subscriptionObjectForEdit = {
    data: {
        items: [
            {
                metadata: {
                    resourceVersion: '1487949',
                    creationTimestamp: '2019-03-18T20:06:46Z',
                    kind: 'subscription',
                    name: 'mortgage-channel-subscr',
                    namespace: 'default',
                    selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-subscr',
                    created: '2019-02-18T23:56:15Z',
                    cluster: 'local-cluster',
                    apigroup: 'app.ibm.com',
                    apiversion: 'v1alpha1',
                    _rbac: 'default_app.ibm.com_channels',
                    _hubClusterResource: 'true',
                    uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
                    pathname: 'default',
                    labels: {
                        app: 'mortgage-channel-mortgage',
                    },
                },
            },
        ],
    },
}

export const appObjectForEdit = {
    data: {
        items: [
            {
                metadata: {
                    resourceVersion: '1487949',
                    creationTimestamp: '2019-03-18T20:06:46Z',
                    kind: 'application',
                    name: 'mortgage-channel-subscr',
                    namespace: 'default',
                    selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-subscr',
                    created: '2019-02-18T23:56:15Z',
                    cluster: 'local-cluster',
                    apigroup: 'app.ibm.com',
                    apiversion: 'v1alpha1',
                    _rbac: 'default_app.ibm.com_channels',
                    _hubClusterResource: 'true',
                    uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
                    pathname: 'default',
                    labels: {
                        app: 'mortgage-channel-mortgage',
                    },
                },
            },
        ],
    },
}

export const prObjectForEdit = {
    data: {
        items: [
            {
                metadata: {
                    resourceVersion: '1487949',
                    creationTimestamp: '2019-03-18T20:06:46Z',
                    kind: 'placementrule',
                    name: 'mortgage-channel-subscr',
                    namespace: 'default',
                    selfLink: '/apis/app.ibm.com/v1alpha1/namespaces/default/subscriptions/mortgage-subscr',
                    created: '2019-02-18T23:56:15Z',
                    cluster: 'local-cluster',
                    apigroup: 'app.ibm.com',
                    apiversion: 'v1alpha1',
                    _rbac: 'default_app.ibm.com_channels',
                    _hubClusterResource: 'true',
                    uid: 'local-cluster/3fc2a87a-52aa-11ea-bf05-00000a102d26',
                    pathname: 'default',
                    labels: {
                        app: 'mortgage-channel-mortgage',
                    },
                },
            },
        ],
    },
}

export const AppOverview = {
    selectedAppTab: 0,
    showAppDetails: false,
    showExpandedTopology: false,
    selectedNodeId: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
}

export const AppOverviewWithCEM = {
    selectedAppTab: 0,
    showAppDetails: false,
    showExpandedTopology: false,
    selectedNodeId: 'local-cluster/42d4c013-52b9-11ea-bf05-00000a102d26',
}

export const secondaryHeader = {
    breadcrumbItems: [{ url: '/multicloud/applications' }, { url: '/multicloud/applications/default/mortgage-app' }],
}

export const secondaryHeaderAllApps = {
    breadcrumbItems: [],
}

export const portals = Object.freeze({
    cancelBtn: 'cancel-button-portal-id',
    createBtn: 'create-button-portal-id',
    editBtn: 'edit-button-portal-id',
})

export const controlData = [
    {
        id: 'main',
        type: 'section',
        note: 'creation.view.required.mark',
    },
    {
        name: 'creation.app.name',
        tooltip: 'tooltip.creation.app.name',
        id: 'name',
        type: 'text',
        syncWith: 'namespace',
    },
    {
        name: 'creation.app.namespace',
        tooltip: 'tooltip.creation.app.namespace',
        id: 'namespace',
        type: 'text',
        syncedWith: 'name',
        syncedSuffix: '-ns',
    },
]

export const createAppStore = {
    controlData: controlData,
    portals: portals,
}

export const reduxStoreAppPipeline = {
    AppDeployments: {
        displaySubscriptionModal: false,
        subscriptionModalHeaderInfo: {
            application: 'app',
            deployable: 'depp',
        },
    },
    resourceFilters: {
        filters: {},
        selectedFilters: {},
    },
    secondaryHeader: secondaryHeader,
    QueryApplicationList: QueryApplicationList,
    QuerySubscriptionList: QuerySubscriptionList,
    QueryPlacementRuleList: QueryPlacementRuleList,
    QueryChannelList: QueryChannelList,
    HCMChannelList: HCMChannelList,
    HCMSubscriptionList: HCMSubscriptionList,
    HCMPlacementRuleList: HCMPlacementRuleList,
    AppOverview: AppOverview,
}

export const reduxStoreAppPipelineWithCEM = {
    AppDeployments: {
        displaySubscriptionModal: false,
    },
    resourceFilters: {
        filters: {},
        selectedFilters: {},
    },
    secondaryHeader: secondaryHeader,
    QueryApplicationList: QueryApplicationList,
    HCMApplicationList: HCMApplicationList,
    HCMChannelList: HCMChannelList,
    HCMSubscriptionList: HCMSubscriptionList,
    HCMPlacementRuleList: HCMPlacementRuleList,
    AppOverview: AppOverviewWithCEM,
    topology: topology,
    role: {
        role: 'ClusterAdministrator',
    },
}

export const reduxStoreAppPipelineWithCEM_Inception = {
    AppDeployments: {
        displaySubscriptionModal: false,
    },
    topology: topology,
    resourceFilters: {
        filters: {},
        selectedFilters: {},
    },
    secondaryHeader: secondaryHeader,
    HCMApplicationList: HCMApplicationList,
    QueryApplicationList: QueryApplicationList_INCEPTION,
    HCMChannelList: HCMChannelList,
    HCMSubscriptionList: HCMSubscriptionList,
    HCMPlacementRuleList: HCMPlacementRuleList,
    AppOverview: AppOverviewWithCEM,
    role: {
        role: 'ClusterAdministrator',
    },
}

export const reduxStoreAllAppsPipeline = {
    AppDeployments: {
        displaySubscriptionModal: false,
    },
    location: {
        pathname: '/multicloud/applications/',
    },
    resourceFilters: {
        filters: {},
        selectedFilters: {},
    },
    secondaryHeader: secondaryHeaderAllApps,
    QueryApplicationList: QueryApplicationList,
    QuerySubscriptionList: QuerySubscriptionList,
    QueryPlacementRuleList: QueryPlacementRuleList,
    QueryChannelList: QueryChannelList,
    HCMChannelList: HCMChannelList,
    HCMSubscriptionList: HCMSubscriptionList,
    HCMPlacementRuleList: HCMPlacementRuleList,
    AppOverview: AppOverview,
}

export const reduxStoreAllAppsPipelineNoChannels = {
    AppDeployments: {
        displaySubscriptionModal: false,
    },
    secondaryHeader: secondaryHeaderAllApps,
    QueryApplicationList: QueryApplicationList,
    HCMChannelList: HCMChannelListEmpty,
    HCMSubscriptionList: HCMSubscriptionList,
    HCMPlacementRuleList: HCMPlacementRuleList,
}

export const reduxStoreAppPipelineNoChannels = {
    AppDeployments: {
        displaySubscriptionModal: false,
    },
    secondaryHeader: secondaryHeader,
    QueryApplicationList: QueryApplicationList,
    HCMChannelList: HCMChannelListEmpty,
    HCMSubscriptionList: HCMSubscriptionList,
    HCMPlacementRuleList: HCMPlacementRuleList,
}

export const staticResourceData = {
    defaultSortField: 'name',
    uriKey: 'name',
    primaryKey: 'name',
    secondaryKey: 'namespace',
    applicationName: {
        resourceKey: 'items',
        title: 'table.header.applicationName',
        defaultSortField: 'name',
        normalizedKey: 'name',

        uriKey: 'name',
        primaryKey: 'name',
        secondaryKey: 'namespace',
        tableKeys: [
            {
                msgKey: 'table.header.applicationName',
                resourceKey: 'name',
                transformFunction: (item) => item.name,
            },
            {
                msgKey: 'table.header.namespace',
                resourceKey: 'namespace',
            },
            {
                msgKey: 'table.header.managedClusters',
                resourceKey: 'clusters',
            },
            {
                msgKey: 'table.header.subscriptions',
                resourceKey: 'subscriptions',
            },
            {
                msgKey: 'table.header.created',
                resourceKey: 'created',
            },
        ],
        tableActions: ['table.actions.applications.edit', 'table.actions.applications.remove'],
    },
}

export const staticResourceDataApp = {
    defaultSortField: 'name',
    uriKey: 'name',
    primaryKey: 'name',
    secondaryKey: 'namespace',

    resourceKey: 'items',
    title: 'table.header.applicationName',
    normalizedKey: 'name',

    tableKeys: [
        {
            msgKey: 'table.header.applicationName',
            resourceKey: 'name',
            transformFunction: (item) => item.name,
        },
        {
            msgKey: 'table.header.namespace',
            resourceKey: 'namespace',
        },
        {
            msgKey: 'table.header.managedClusters',
            resourceKey: 'clusters',
        },
        {
            msgKey: 'table.header.subscriptions',
            resourceKey: 'subscriptions',
        },
        {
            msgKey: 'table.header.created',
            resourceKey: 'created',
        },
    ],
    tableActions: ['table.actions.applications.edit', 'table.actions.applications.remove'],
}
