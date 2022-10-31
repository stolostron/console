/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
/* istanbul ignore file */
// eslint-disable-next-line

import { useTranslation } from '../../../../lib/acm-i18next'

type template = {
    id: string
    name: string
    description: string
    resultHeader: string
    searchText: string
}

export default function useGetTemplates(): template[] {
    const { t } = useTranslation()

    return [
        {
            id: 'Workloads',
            name: t('Workloads'),
            description: t('A pre-defined search to help you review your workloads'),
            resultHeader: 'search.tile.results',
            searchText: 'kind:DaemonSet,Deployment,Job,StatefulSet,ReplicaSet',
        },
        {
            id: 'search.suggested.unhealthy.name',
            name: t('Unhealthy pods'),
            description: t('Show pods with unhealthy status'),
            resultHeader: 'table.header.status.unhealthy',
            searchText:
                'kind:Pod status:Pending,Error,Failed,Terminating,ImagePullBackOff,CrashLoopBackOff,RunContainerError,ContainerCreating',
        },
        {
            id: 'search.suggested.createdLastHour.name',
            name: t('Created last hour'),
            description: t('Search for resources created within the last hour'),
            resultHeader: 'search.tile.results',
            searchText: 'created:hour',
        },
    ]
}
