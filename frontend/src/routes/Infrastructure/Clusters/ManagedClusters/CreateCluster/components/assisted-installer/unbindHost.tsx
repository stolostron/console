/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { Alert, AlertVariant } from '@patternfly/react-core'
import { useRecoilState } from 'recoil'

import { useTranslation } from '../../../../../../../lib/acm-i18next'
import { patchResource } from '../../../../../../../resources'
import { IBulkActionModelProps } from '../../../../../../../components/BulkActionModel'
import { agentClusterInstallsState } from '../../../../../../../atoms'
import { agentNameSortFunc, getAgentName, setProvisionRequirements } from './utils'

import './unbindHost.css'

const {
    getInfraEnvNameOfAgent,
    getClusterNameOfAgent,
    getAgentStatus,
    isInstallationInProgress,
    isAIFlowInfraEnv,
    getAgentClusterInstallOfAgent,
} = CIM

const AGENT_UNBOUND = 'The agent is not bound to a cluster.'
const AGENT_INSTALLING = 'It is not possible to remove a host which is being installed.'
const CLUSTER_INSTALLING = 'It is not possible to remove a node from a cluster during installation.'
const UNSUPPORTED_MASTER_COUNT = 'It is not possible to remove control plane node from an installed cluster.'
const UNSUPPORTED_WORKER_COUNT = 'This host cannot be removed as there are only 2 workers in the cluster.'
const AI_FLOW = '' // 'This host is discovered for a single cluster, delete it instead.'

export const useCanUnbindAgent = (singleInfraEnv?: CIM.InfraEnvK8sResource) => {
    const [agentClusterInstalls] = useRecoilState(agentClusterInstallsState)
    const isAIFlow = isAIFlowInfraEnv(singleInfraEnv)

    const callback = useCallback(
        (
            agent?: CIM.AgentK8sResource,
            bmh?: CIM.BareMetalHostK8sResource
        ): [
            enabled: boolean,
            reason: string /* The action is expected to be not rendered when (!enabled && !reason) */
        ] => {
            if (isAIFlow) {
                // Unbind is for CIM flow only. Delete Agent otherwise.
                return [false, AI_FLOW]
            }

            if (!agent?.spec.clusterDeploymentName?.name) {
                // Must be bound to a cluster
                return [false, AGENT_UNBOUND]
            }

            if (agent) {
                const { status } = getAgentStatus(agent)
                if (
                    [
                        'preparing-for-installation',
                        'installing',
                        'installing-in-progress',
                        'installing-pending-user-action',
                        'resetting-pending-user-action',
                    ].includes(status.key)
                ) {
                    return [false, AGENT_INSTALLING]
                }

                if (
                    ['installed', 'error', 'cancelled'].includes(status.key) &&
                    (agent.status?.role === 'master' || agent.status?.role === 'bootstrap')
                ) {
                    return [false, UNSUPPORTED_MASTER_COUNT]
                }

                const aci: CIM.AgentClusterInstallK8sResource = getAgentClusterInstallOfAgent(
                    agentClusterInstalls,
                    agent
                )
                if (aci) {
                    if (isInstallationInProgress(aci)) {
                        return [false, CLUSTER_INSTALLING]
                    }

                    if (
                        ['installed', 'error', 'cancelled'].includes(status.key) &&
                        agent.status?.role === 'worker' &&
                        aci.spec?.provisionRequirements?.workerAgents === 5
                    ) {
                        return [false, UNSUPPORTED_WORKER_COUNT]
                    }
                }

                return [true, '']
            } else if (bmh) {
                // Should not happen
                return [false, 'Bare Metal Host can not be removed from cluster.']
            }

            return [false, 'No agent selected.']
        },
        [agentClusterInstalls]
    )
    return callback
}

export const getUnbindHostAction =
    (agent?: CIM.AgentK8sResource, agentClusterInstall?: CIM.AgentClusterInstallK8sResource) => () => {
        if (agent?.spec?.clusterDeploymentName?.name) {
            if (agentClusterInstall) {
                const masterCount = undefined /* Only workers can be removed */
                const workerCount = (agentClusterInstall.spec.provisionRequirements.workerAgents || 1) - 1
                // TODO(mlibra): include following promise in the returned one to handle errors
                setProvisionRequirements(agentClusterInstall, workerCount, masterCount)
            }

            return patchResource(agent, [
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
    clusterName?: string,
    agentClusterInstall?: CIM.AgentClusterInstallK8sResource
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
