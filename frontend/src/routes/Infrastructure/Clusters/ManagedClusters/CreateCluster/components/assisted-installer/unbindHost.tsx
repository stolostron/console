/* Copyright Contributors to the Open Cluster Management project */
import { useCallback } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { Alert, AlertVariant } from '@patternfly/react-core'

import { useTranslation } from '../../../../../../../lib/acm-i18next'
import { patchResource } from '../../../../../../../resources'
import { IBulkActionModelProps } from '../../../../../../../components/BulkActionModel'
import { agentNameSortFunc, getAgentName } from './utils'

import './unbindHost.css'

const { getInfraEnvNameOfAgent, getClusterNameOfAgent, getAgentStatus } = CIM

export const canUnbindAgent = (agent?: CIM.AgentK8sResource, bmh?: CIM.BareMetalHostK8sResource) => {
    if (!agent?.spec.clusterDeploymentName?.name) {
        // Must be bound to a cluster
        return false
    }

    if (agent) {
        const [status] = getAgentStatus(agent)
        return ![
            'preparing-for-installation',
            'installing',
            'installing-in-progress',
            'installing-pending-user-action',
            'resetting-pending-user-action',
        ].includes(status)
    } else if (bmh) {
        // TODO(mlibra): To be done
        return true
    }
    return false
}

export const getUnbindHostAction = (agent?: CIM.AgentK8sResource) => () => {
    if (agent?.spec?.clusterDeploymentName?.name) {
        return patchResource(agent, [
            {
                op: 'replace',
                path: '/spec/clusterDeploymentName',
                value: null, // TODO(mlibra): check it to delete the value!!!!
            },
        ])
    }

    return {
        promise: Promise.resolve(null),
        abort: () => {},
    }
}

const Description = ({ bmh }: { agent?: CIM.AgentK8sResource; bmh?: CIM.BareMetalHostK8sResource }) => {
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
    a: CIM.AgentK8sResource | CIM.BareMetalHostK8sResource,
    b: CIM.AgentK8sResource | CIM.BareMetalHostK8sResource
) => (getInfraEnvNameOfAgent(a) || '').localeCompare(getInfraEnvNameOfAgent(b) || '')

const agentClusterSortFunc = (
    a: CIM.AgentK8sResource | CIM.BareMetalHostK8sResource,
    b: CIM.AgentK8sResource | CIM.BareMetalHostK8sResource
) => (getClusterNameOfAgent(a) || '').localeCompare(getClusterNameOfAgent(b) || '')

export const useOnUnbindHost = (
    toggleDialog: (props: IBulkActionModelProps | { open: false }) => void,
    clusterName?: string
) => {
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
            cell: getClusterNameOfAgent,
            sort: agentClusterSortFunc,
        })
    }

    return useCallback(
        (agent?: CIM.AgentK8sResource, bmh?: CIM.BareMetalHostK8sResource) => {
            toggleDialog({
                open: true,
                title: clusterName
                    ? t('host.action.title.unbind.single', { clusterName })
                    : t('host.action.title.unbind'),
                action: t('unbind'),
                processing: t('unbinding'),
                resources: [agent, bmh].filter(Boolean),
                description: <Description agent={agent} bmh={bmh} />,
                columns,
                keyFn: (resource: CIM.AgentK8sResource | CIM.BareMetalHostK8sResource) =>
                    resource.metadata?.uid as string,
                actionFn: getUnbindHostAction(agent),
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
