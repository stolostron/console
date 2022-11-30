/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { AcmExpandableCard } from '../../../../../../ui-components'
import { Button, ButtonVariant, Stack, StackItem } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'
import { getBackendUrl, fetchGet, getResource, Secret, SecretApiVersion, SecretKind } from '../../../../../../resources'
import { NavigationPath } from '../../../../../../NavigationPath'
import { BulkActionModel, IBulkActionModelProps } from '../../../../../../components/BulkActionModel'
import { useOnUnbindHost } from '../../CreateCluster/components/assisted-installer/unbindHost'
import { listMultiClusterEngines } from '../../../../../../resources/multi-cluster-engine'

const {
    ClusterDeploymentProgress,
    ClusterInstallationError,
    AgentTable,
    Alerts,
    AlertsContextProvider,
    shouldShowClusterInstallationProgress,
    shouldShowClusterCredentials,
    shouldShowClusterInstallationError,
    getConsoleUrl,
    ClusterDeploymentCredentials,
    ClusterDeploymentKubeconfigDownload,
    EventsModalButton,
    getAICluster,
    LogsDownloadButton,
    getOnFetchEventsHandler,
    ClusterDeploymentValidationsOverview,
    getClusterStatus,
    shouldShowClusterDeploymentValidationOverview,
} = CIM

const fetchSecret: CIM.FetchSecret = (name, namespace) =>
    getResource<Secret>({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: {
            name,
            namespace,
        },
    }).promise as Promise<CIM.SecretK8sResource>

const fetchEvents = async (url: string) => {
    const abortController = new AbortController()
    const result = await fetchGet(`${getBackendUrl()}${url}`, abortController.signal)
    return result.data as string
}

const AIClusterDetails: React.FC = () => {
    const { clusterDeployment, agentClusterInstall, agents } = useContext(ClusterContext)
    const [aiNamespace, setAiNamespace] = useState<string>('')
    const [namespaceError, setNamespaceError] = useState<boolean>()
    const history = useHistory()

    const cdName = clusterDeployment?.metadata?.name
    const cdNamespace = clusterDeployment?.metadata?.namespace

    const [bulkModalProps, setBulkModalProps] = useState<
        IBulkActionModelProps<CIM.AgentK8sResource | CIM.BareMetalHostK8sResource> | { open: false }
    >({ open: false })

    const onUnbindHost = useOnUnbindHost(setBulkModalProps, clusterDeployment?.metadata?.name, agentClusterInstall)

    useEffect(() => {
        const getAssistedServiceNS = async () => {
            try {
                const [multiClusterEngine] = await listMultiClusterEngines().promise
                setAiNamespace(multiClusterEngine.spec?.targetNamespace ?? 'multicluster-engine')
            } catch {
                setNamespaceError(true)
            }
        }
        getAssistedServiceNS()
    }, [])

    const [clusterAgents, cluster] = useMemo(() => {
        const clusterAgents = agents
            ? agents.filter(
                  (a) =>
                      a.spec?.clusterDeploymentName?.name === cdName &&
                      a.spec?.clusterDeploymentName?.namespace === cdNamespace
              )
            : []

        const cluster = cdName
            ? getAICluster({
                  clusterDeployment: clusterDeployment as CIM.ClusterDeploymentK8sResource,
                  agentClusterInstall,
                  agents: clusterAgents,
              })
            : undefined

        return [clusterAgents, cluster]
    }, [clusterDeployment, agentClusterInstall, agents])

    const onFetchEvents = useMemo(
        () => getOnFetchEventsHandler(fetchEvents, aiNamespace, agentClusterInstall),
        [aiNamespace, agentClusterInstall]
    )

    const fallbackEventsURL = namespaceError === true ? agentClusterInstall?.status?.debugInfo?.eventsURL : undefined

    return (
        <>
            <Alerts />
            {clusterDeployment && shouldShowClusterDeploymentValidationOverview(agentClusterInstall) && (
                <div style={{ marginBottom: '24px' }}>
                    <ClusterDeploymentValidationsOverview
                        validationsInfo={agentClusterInstall?.status?.validationsInfo!}
                        clusterStatus={getClusterStatus(agentClusterInstall)}
                        onContinueClusterConfiguration={() =>
                            history.push(
                                NavigationPath.editCluster
                                    .replace(':namespace', clusterDeployment.metadata.namespace!)
                                    .replace(':name', clusterDeployment.metadata.name!)
                            )
                        }
                    />
                </div>
            )}
            {shouldShowClusterInstallationProgress(agentClusterInstall) && (
                <div style={{ marginBottom: '24px' }}>
                    <AcmExpandableCard title="Cluster installation progress" id="aiprogress">
                        {!!clusterDeployment && !!agentClusterInstall && (
                            <Stack hasGutter>
                                <StackItem>
                                    <ClusterDeploymentProgress
                                        clusterDeployment={clusterDeployment as CIM.ClusterDeploymentK8sResource}
                                        agentClusterInstall={agentClusterInstall}
                                        agents={clusterAgents}
                                        onFetchEvents={onFetchEvents}
                                        fallbackEventsURL={fallbackEventsURL}
                                    />
                                </StackItem>
                                {shouldShowClusterCredentials(agentClusterInstall) && (
                                    <StackItem>
                                        <ClusterDeploymentCredentials
                                            clusterDeployment={clusterDeployment as CIM.ClusterDeploymentK8sResource}
                                            agentClusterInstall={agentClusterInstall}
                                            agents={clusterAgents}
                                            fetchSecret={fetchSecret}
                                            consoleUrl={
                                                getConsoleUrl(
                                                    clusterDeployment as CIM.ClusterDeploymentK8sResource,
                                                    agentClusterInstall
                                                ) || 'N/A'
                                            }
                                        />
                                    </StackItem>
                                )}
                                <StackItem>
                                    <ClusterDeploymentKubeconfigDownload
                                        clusterDeployment={clusterDeployment as CIM.ClusterDeploymentK8sResource}
                                        agentClusterInstall={agentClusterInstall}
                                        fetchSecret={fetchSecret}
                                    />
                                    {cluster && (
                                        <EventsModalButton
                                            id="cluster-events-button"
                                            entityKind="cluster"
                                            cluster={cluster}
                                            title="Cluster Events"
                                            variant={ButtonVariant.link}
                                            style={{ textAlign: 'right' }}
                                            onFetchEvents={onFetchEvents}
                                            ButtonComponent={Button}
                                            fallbackEventsURL={fallbackEventsURL}
                                        >
                                            View Cluster Events
                                        </EventsModalButton>
                                    )}
                                    <LogsDownloadButton
                                        id="cluster-logs-button"
                                        agentClusterInstall={agentClusterInstall}
                                        variant={ButtonVariant.link}
                                    />
                                </StackItem>
                                {shouldShowClusterInstallationError(agentClusterInstall) && (
                                    <StackItem>
                                        <ClusterInstallationError
                                            clusterDeployment={clusterDeployment as CIM.ClusterDeploymentK8sResource}
                                            agentClusterInstall={agentClusterInstall}
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
                    {!!agentClusterInstall && (
                        <>
                            <BulkActionModel<CIM.AgentK8sResource | CIM.BareMetalHostK8sResource> {...bulkModalProps} />
                            <AgentTable
                                agents={clusterAgents}
                                className="agents-table"
                                onUnbindHost={onUnbindHost}
                                agentClusterInstall={agentClusterInstall}
                            />
                        </>
                    )}
                </AcmExpandableCard>
            </div>
        </>
    )
}

export default (props: {}) => (
    <AlertsContextProvider>
        <AIClusterDetails {...props} />
    </AlertsContextProvider>
)
