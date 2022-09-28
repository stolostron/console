/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
/* istanbul ignore file */
// eslint-disable-next-line
export default {
    templates: [
        {
            id: 'Workloads',
            name: 'Workloads',
            description: 'A pre-defined search to help you review your workloads',
            resultHeader: 'search.tile.results',
            searchText: 'kind:daemonset,deployment,job,statefulset,replicaset',
        },
        {
            id: 'search.suggested.unhealthy.name',
            name: 'Unhealthy pods',
            description: 'Show pods with unhealthy status',
            resultHeader: 'table.header.status.unhealthy',
            searchText:
                'kind:pod status:Pending,Error,Failed,Terminating,ImagePullBackOff,CrashLoopBackOff,RunContainerError,ContainerCreating,CreateContainerConfigError',
        },
        {
            id: 'search.suggested.createdLastHour.name',
            name: 'Created last hour',
            description: 'Search for resources created within the last hour',
            resultHeader: 'search.tile.results',
            searchText: 'created:hour',
        },
    ],
}
