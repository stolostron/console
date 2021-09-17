/* Copyright Contributors to the Open Cluster Management project */
import { AcmExpandableCard } from '@open-cluster-management/ui-components'
import { Stack, StackItem } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { useContext } from 'react'
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'
import { getResource, Secret, SecretApiVersion, SecretKind } from '../../../../../../resources'

const {
    ClusterDeploymentProgress,
    getClusterStatus,
    ClusterInstallationError,
    AgentTable,
    shouldShowClusterInstallationProgress,
    shouldShowClusterCredentials,
    shouldShowClusterInstallationError,
    getConsoleUrl,
    ClusterDeploymentCredentials,
    ClusterDeploymentKubeconfigDownload,
    formatEventsData,
} = CIM

const fetchSecret: CIM.FetchSecret = (name, namespace) =>
    getResource<Secret>({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: {
            name,
            namespace,
        },
    }).promise

const AIClusterProgress: React.FC = () => {
    const { clusterDeployment, agentClusterInstall, agents } = useContext(ClusterContext)
    const clusterAgents = agents
        ? agents.filter(
              (a) =>
                  a.spec.clusterDeploymentName?.name === clusterDeployment?.metadata.name &&
                  a.spec.clusterDeploymentName?.namespace === clusterDeployment?.metadata.namespace
          )
        : []

    /*
    // TODO(jtomasek): Figure out how to use this from ai-ui-lib (currently in ClusterDeploymentDetails which is not used by ACM)
    const handleFetchEvents: CIM.EventListFetchProps['onFetchEvents'] = async (_, onSuccess, onError) => {
        try {
            const eventsURL = agentClusterInstall.status?.debugInfo?.eventsURL
            if (!eventsURL) throw new Error('Events URL is not available.')

            const res = await fetch(eventsURL)
            const rawData: Record<string, string>[] = await res.json()
            const data = formatEventsData(rawData)

            onSuccess(data)
        } catch (e) {
            onError('Failed to fetch cluster events.')
        }
    }
    const [clusterStatus, clusterStatusInfo] = getClusterStatus(agentClusterInstall)
    */

    return (
        <>
            {shouldShowClusterInstallationProgress(agentClusterInstall) && (
                <div style={{ marginBottom: '24px' }}>
                    <AcmExpandableCard title="Cluster installation progress" id="aiprogress">
                        {!!clusterDeployment && !!agentClusterInstall && (
                            <Stack hasGutter>
                                <StackItem>
                                    <ClusterDeploymentProgress
                                        clusterDeployment={clusterDeployment}
                                        agentClusterInstall={agentClusterInstall}
                                        agents={clusterAgents}
                                        fetchEvents={() => Promise.resolve(/* will be impleented later */)}
                                    />
                                </StackItem>
                                {shouldShowClusterCredentials(agentClusterInstall) && (
                                    <StackItem>
                                        <ClusterDeploymentCredentials
                                            clusterDeployment={clusterDeployment}
                                            agentClusterInstall={agentClusterInstall}
                                            agents={clusterAgents}
                                            fetchSecret={fetchSecret}
                                            consoleUrl={getConsoleUrl(clusterDeployment)}
                                        />
                                    </StackItem>
                                )}
                                <StackItem>
                                    <ClusterDeploymentKubeconfigDownload
                                        clusterDeployment={clusterDeployment}
                                        agentClusterInstall={agentClusterInstall}
                                        fetchSecret={fetchSecret}
                                    />
                                </StackItem>
                                {shouldShowClusterInstallationError(agentClusterInstall) && (
                                    <StackItem>
                                        <ClusterInstallationError
                                            clusterDeployment={{}}
                                            agentClusterInstall={undefined}
                                            backendURL="will be implemented later"
                                            /*title={
                                                clusterStatus === 'cancelled'
                                                    ? 'Cluster installation was cancelled'
                                                    : undefined
                                            }
                                            statusInfo={clusterStatusInfo}
                                            logsUrl={agentClusterInstall.status?.debugInfo?.logsURL}
                                            openshiftVersion={clusterDeployment.status?.installVersion}
                                            */
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
                    <AgentTable agents={clusterAgents} className="agents-table" />
                </AcmExpandableCard>
            </div>
        </>
    )
}

export default AIClusterProgress
