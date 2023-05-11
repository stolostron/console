/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react'
import { Alert, AlertVariant } from '@patternfly/react-core'

import { useTranslation } from '../../../../../../../lib/acm-i18next'
import { IResource, patchResource } from '../../../../../../../resources'
import { BulkActionModalProps } from '../../../../../../../components/BulkActionModal'
import { agentNameSortFunc, getAgentName, setProvisionRequirements } from './utils'

import './unbindHost.css'
import {
  AgentK8sResource,
  getInfraEnvNameOfAgent,
  getClusterNameOfAgent,
  BareMetalHostK8sResource,
  AgentClusterInstallK8sResource,
} from '@openshift-assisted/ui-lib/cim'

const getClusterNameFromAgentOrBMH = (resource?: AgentK8sResource | BareMetalHostK8sResource) => {
  return (
    getClusterNameOfAgent(resource as AgentK8sResource) ||
    (resource as BareMetalHostK8sResource).spec?.consumerRef?.name
  )
}

export const getUnbindHostAction =
  (agent?: AgentK8sResource, agentClusterInstall?: AgentClusterInstallK8sResource) => () => {
    if (agent?.spec?.clusterDeploymentName?.name) {
      if (agentClusterInstall) {
        const masterCount = undefined /* Only workers can be removed */
        const workerCount = (agentClusterInstall.spec?.provisionRequirements.workerAgents || 1) - 1
        // TODO(mlibra): include following promise in the returned one to handle errors
        setProvisionRequirements(agentClusterInstall, workerCount, masterCount)
      }

      return patchResource(agent as IResource, [
        {
          op: 'replace',
          path: '/spec/clusterDeploymentName',
          value: null,
        },
        {
          op: 'replace',
          path: '/spec/role',
          value: '',
        },
      ])
    }

    return {
      promise: Promise.resolve(null),
      abort: () => {},
    }
  }

const Description = ({ bmh }: { agent?: AgentK8sResource; bmh?: BareMetalHostK8sResource }) => {
  const { t } = useTranslation()
  return (
    <>
      <Alert
        isInline
        variant={AlertVariant.info}
        title={bmh ? t('host.action.message.unbind.alert.bmh') : t('host.action.message.unbind.alert.iso')}
      />
      <div className="unbind-confirmation-description__spacer">{t('host.action.message.unbind')}</div>
    </>
  )
}

const agentInfraSortFunc = (
  a: AgentK8sResource | BareMetalHostK8sResource,
  b: AgentK8sResource | BareMetalHostK8sResource
) => (getInfraEnvNameOfAgent(a) || '').localeCompare(getInfraEnvNameOfAgent(b) || '')

const agentClusterSortFunc = (
  a: AgentK8sResource | BareMetalHostK8sResource,
  b: AgentK8sResource | BareMetalHostK8sResource
) => (getClusterNameFromAgentOrBMH(a) || '').localeCompare(getClusterNameFromAgentOrBMH(b) || '')

export function useOnUnbindHost(
  toggleDialog: (props: BulkActionModalProps<AgentK8sResource | BareMetalHostK8sResource> | { open: false }) => void,
  clusterName?: string,
  agentClusterInstall?: AgentClusterInstallK8sResource
) {
  const { t } = useTranslation()

  const columns = [
    {
      header: t('infraEnv.tableHeader.name'),
      cell: getAgentName,
      sort: agentNameSortFunc,
    },
    {
      header: t('infraenv'),
      cell: getInfraEnvNameOfAgent,
      sort: agentInfraSortFunc,
    },
  ]

  if (!clusterName) {
    columns.splice(1, 0, {
      header: t('cluster'),
      cell: getClusterNameFromAgentOrBMH,
      sort: agentClusterSortFunc,
    })
  }

  return useCallback(
    (agent: AgentK8sResource, bmh?: BareMetalHostK8sResource) => {
      toggleDialog({
        open: true,
        title: clusterName ? t('host.action.title.unbind.single', { clusterName }) : t('host.action.title.unbind'),
        action: t('unbind'),
        processing: t('unbinding'),
        items: [agent, bmh].filter(Boolean) as (AgentK8sResource | BareMetalHostK8sResource)[],
        emptyState: undefined, // agent is not optional, items is never empty
        description: <Description agent={agent} bmh={bmh} />,
        columns,
        keyFn: (resource: AgentK8sResource | BareMetalHostK8sResource) => resource.metadata?.uid as string,
        actionFn: getUnbindHostAction(agent, agentClusterInstall),
        close: () => {
          toggleDialog({ open: false })
        },
        isDanger: true,
        icon: 'warning',
      })
    },
    [toggleDialog]
  )
}
