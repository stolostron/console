/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
/* istanbul ignore file */

import { useMemo } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'

export const useSuggestedQueryTemplates = () => {
  const { t } = useTranslation()
  return useMemo(
    () => ({
      templates: [
        {
          id: 'Workloads',
          name: t('Workloads'),
          description: t('A pre-defined search to help you review your workloads'),
          searchText: 'kind:DaemonSet,Deployment,Job,StatefulSet,ReplicaSet',
        },
        {
          id: 'search.suggested.unhealthy.name',
          name: t('Unhealthy pods'),
          description: t('Show pods with unhealthy status'),
          searchText:
            'kind:Pod status:Pending,Error,Failed,Terminating,ImagePullBackOff,CrashLoopBackOff,RunContainerError,ContainerCreating',
        },
        {
          id: 'search.suggested.createdLastHour.name',
          name: t('Created last hour'),
          description: t('Search for resources created within the last hour'),
          searchText: 'created:hour',
        },
      ],
    }),
    [t]
  )
}
