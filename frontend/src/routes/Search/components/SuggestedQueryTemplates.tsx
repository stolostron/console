/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
/* istanbul ignore file */

import { useMemo } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { KubevirtProviderAlert } from '../../../components/KubevirtProviderAlert'

// Suggested query templates are used as back up if the console-search-config ConfigMap is not found
export const useSuggestedQueryTemplates = () => {
  const { t } = useTranslation()

  return useMemo(() => {
    const alertComponent = (
      <KubevirtProviderAlert variant="search" component="hint" useLabelAlert hideAlertWhenNoVMsExists />
    )

    return {
      templates: [
        {
          id: 'search.suggested.workloads.name',
          name: t('Workloads'),
          description: t('Show workloads running on your fleet'),
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
          description: t('Show resources created within the last hour'),
          searchText: 'created:hour',
        },
        {
          id: 'search.suggested.virtualmachines.name',
          name: t('Virtual Machines'),
          description: t('Show virtual machine resources'),
          searchText: 'kind:VirtualMachine',
          alert: alertComponent,
        },
      ],
    }
  }, [t])
}
