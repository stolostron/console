/* Copyright Contributors to the Open Cluster Management project */
import { AcmExpandableCard } from '@open-cluster-management/ui-components'
import { Stack, StackItem } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { useContext } from 'react'
import isMatch from 'lodash/isMatch'
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'
import ClusterDeploymentCredentials from './CusterDeploymentCredentials'

const { ClusterProgress, getAICluster, getClusterStatus, ClusterInstallationError, AgentTable } = CIM

const progressStates = [
    'preparing-for-installation',
    'installing',
    'installing-pending-user-action',
    'finalizing',
    'installed',
    'error',
    'cancelled',
    'adding-hosts',
]

const installedStates = ['installed', 'adding-hosts']
const errorStates = ['error', 'cancelled']

const AIClusterProgress: React.FC = () => {
    const { clusterDeployment, agentClusterInstall, agents, infraEnv } = useContext(ClusterContext)
    const infraAgents =
        infraEnv && agents
            ? agents.filter((a) => isMatch(a.metadata.labels, infraEnv.status?.agentLabelSelector?.matchLabels))
            : []
    const cluster = getAICluster({ clusterDeployment, agentClusterInstall, agents: infraAgents })
    const [clusterStatus, clusterStatusInfo] = getClusterStatus(agentClusterInstall)
    return (
        <>
            {progressStates.includes(clusterStatus) && (
                <div style={{ marginBottom: '24px' }}>
                    <AcmExpandableCard title="Cluster installation progress" id="aiprogress">
                        {!!clusterDeployment && !!agentClusterInstall && (
                            <Stack hasGutter>
                                <StackItem>
                                    <ClusterProgress cluster={cluster} onFetchEvents={async () => {}} />
                                </StackItem>
                                {installedStates.includes(clusterStatus) && (
                                    <StackItem>
                                        <ClusterDeploymentCredentials
                                            cluster={cluster}
                                            namespace={clusterDeployment.metadata.namespace as string}
                                            adminPasswordSecretRefName={
                                                agentClusterInstall.spec?.clusterMetadata?.adminPasswordSecretRef.name
                                            }
                                            consoleUrl={
                                                clusterDeployment.status?.webConsoleURL ||
                                                `https://console-openshift-console.apps.${cluster.name}.${cluster.baseDnsDomain}`
                                            }
                                        />
                                    </StackItem>
                                )}
                                {errorStates.includes(clusterStatus) && (
                                    <StackItem>
                                        <ClusterInstallationError
                                            title={
                                                clusterStatus === 'cancelled'
                                                    ? 'Cluster installation was cancelled'
                                                    : undefined
                                            }
                                            statusInfo={clusterStatusInfo}
                                            logsUrl={agentClusterInstall.status?.debugInfo?.logsURL}
                                            openshiftVersion={clusterDeployment.status?.installVersion}
                                        />
                                    </StackItem>
                                )}
                            </Stack>
                        )}
                    </AcmExpandableCard>
                </div>
            )}
            <div style={{ marginBottom: '24px' }}>
                <AcmExpandableCard title="Cluster hosts" id="aihosts">
                    <AgentTable agents={infraAgents} className="agents-table" />
                </AcmExpandableCard>
            </div>
        </>
    )
}

export default AIClusterProgress
