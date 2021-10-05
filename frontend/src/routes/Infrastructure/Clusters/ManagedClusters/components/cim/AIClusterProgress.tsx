/* Copyright Contributors to the Open Cluster Management project */
import { useMemo, useContext } from 'react'
import { AcmExpandableCard } from '@open-cluster-management/ui-components'
import { Button, ButtonVariant, Stack, StackItem } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'
import { backendUrl, fetchGet, getResource, Secret, SecretApiVersion, SecretKind } from '../../../../../../resources'

const {
    ClusterDeploymentProgress,
    ClusterInstallationError,
    AgentTable,
    shouldShowClusterInstallationProgress,
    shouldShowClusterCredentials,
    shouldShowClusterInstallationError,
    getConsoleUrl,
    ClusterDeploymentCredentials,
    ClusterDeploymentKubeconfigDownload,
    EventsModalButton,
    getAICluster,
    getEventsURL,
    formatEventsData,
    LogsDownloadButton,
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

const fetchEvents = async (url: string) => {
    const abortController = new AbortController()
    const result = await fetchGet(`${backendUrl}${url}`, abortController.signal)
    return result.data
}

const AIClusterProgress: React.FC = () => {
    const { clusterDeployment, agentClusterInstall, agents } = useContext(ClusterContext)

    const [clusterAgents, cluster] = useMemo(() => {
        const clusterAgents = agents
            ? agents.filter(
                  (a) =>
                      a.spec.clusterDeploymentName?.name === clusterDeployment?.metadata.name &&
                      a.spec.clusterDeploymentName?.namespace === clusterDeployment?.metadata.namespace
              )
            : []

        const cluster = getAICluster({ clusterDeployment, agentClusterInstall, agents: clusterAgents })

        return [clusterAgents, cluster]
    }, [clusterDeployment, agentClusterInstall, agents])

    const onFetchEvents: CIM.EventListFetchProps['onFetchEvents'] = async (params, onSuccess, onError) => {
        const eventsURL = getEventsURL(agentClusterInstall)
        if (!eventsURL) {
            onError('Cannot determine events URL')
            return
        }
        try {
            const result = await fetchEvents(eventsURL)
            const data = formatEventsData(result)
            onSuccess(data)
        } catch (e) {
            onError(e.message)
        }
    }

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
                                        fetchEvents={fetchEvents}
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
                                    <EventsModalButton
                                        id="cluster-events-button"
                                        entityKind="cluster"
                                        cluster={cluster}
                                        title="Cluster Events"
                                        variant={ButtonVariant.link}
                                        style={{ textAlign: 'right' }}
                                        onFetchEvents={onFetchEvents}
                                        ButtonComponent={Button}
                                    >
                                        View Cluster Events
                                    </EventsModalButton>
                                    <LogsDownloadButton
                                        id="cluster-logs-button"
                                        agentClusterInstall={agentClusterInstall}
                                        backendURL={backendUrl}
                                        variant={ButtonVariant.link}
                                    />
                                </StackItem>
                                {shouldShowClusterInstallationError(agentClusterInstall) && (
                                    <StackItem>
                                        <ClusterInstallationError
                                            clusterDeployment={clusterDeployment}
                                            agentClusterInstall={agentClusterInstall}
                                            backendURL={backendUrl}
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
