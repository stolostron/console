/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useEffect, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { AcmExpandableCard } from '../../../../../../ui-components'
import { Button, ButtonVariant, Stack, StackItem } from '@patternfly/react-core'
import { useClusterDetailsContext } from '../../ClusterDetails/ClusterDetails'
import { getBackendUrl, fetchGet, getResource, Secret, SecretApiVersion, SecretKind } from '../../../../../../resources'
import { NavigationPath } from '../../../../../../NavigationPath'
import { BulkActionModal, BulkActionModalProps } from '../../../../../../components/BulkActionModal'
import { useOnUnbindHost } from '../../CreateCluster/components/assisted-installer/unbindHost'
import { listMultiClusterEngines } from '../../../../../../resources/multi-cluster-engine'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import {
  AgentK8sResource,
  AgentTable,
  Alerts,
  AlertsContextProvider,
  BareMetalHostK8sResource,
  ClusterDeploymentCredentials,
  ClusterDeploymentK8sResource,
  ClusterDeploymentKubeconfigDownload,
  ClusterDeploymentProgress,
  ClusterDeploymentValidationsOverview,
  ClusterInstallationError,
  EventsModal,
  FetchSecret,
  LogsDownloadButton,
  SecretK8sResource,
  getAICluster,
  getClusterStatus,
  getConsoleUrl,
  getOnFetchEventsHandler,
  shouldShowClusterCredentials,
  shouldShowClusterDeploymentValidationOverview,
  shouldShowClusterInstallationError,
  shouldShowClusterInstallationProgress,
  PostInstallAlert,
} from '@openshift-assisted/ui-lib/cim'
import { DOC_LINKS } from '../../../../../../lib/doc-util'

const fetchSecret: FetchSecret = (name, namespace) =>
  getResource<Secret>({
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
      name,
      namespace,
    },
  }).promise as Promise<SecretK8sResource>

const fetchEvents = async (url: string) => {
  const abortController = new AbortController()
  const result = await fetchGet(`${getBackendUrl()}${url}`, abortController.signal)
  return result.data as string
}

const AIClusterDetails: React.FC = () => {
  const { clusterDeployment, agentClusterInstall, agents } = useClusterDetailsContext()
  const [aiNamespace, setAiNamespace] = useState<string>('')
  const [namespaceError, setNamespaceError] = useState<boolean>()
  const navigate = useNavigate()
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false)

  const cdName = clusterDeployment?.metadata?.name
  const cdNamespace = clusterDeployment?.metadata?.namespace

  const [bulkModalProps, setBulkModalProps] = useState<
    BulkActionModalProps<AgentK8sResource | BareMetalHostK8sResource> | { open: false }
  >({ open: false })

  const onUnbindHost = useOnUnbindHost(setBulkModalProps, clusterDeployment?.metadata?.name, agentClusterInstall)

  const { t } = useTranslation()

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
            a.spec?.clusterDeploymentName?.name === cdName && a.spec?.clusterDeploymentName?.namespace === cdNamespace
        )
      : []

    const cluster = cdName
      ? getAICluster({
          clusterDeployment: clusterDeployment as ClusterDeploymentK8sResource,
          agentClusterInstall,
          agents: clusterAgents,
        })
      : undefined

    return [clusterAgents, cluster]
  }, [clusterDeployment, agentClusterInstall, agents])

  const onFetchEvents = useMemo(
    () => getOnFetchEventsHandler(fetchEvents, aiNamespace, agents || [], agentClusterInstall),
    [aiNamespace, agentClusterInstall, agents]
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
              navigate(
                generatePath(NavigationPath.editCluster, {
                  namespace: clusterDeployment.metadata.namespace!,
                  name: clusterDeployment.metadata.name!,
                })
              )
            }
          />
        </div>
      )}
      {shouldShowClusterCredentials(agentClusterInstall) && agentClusterInstall?.spec?.platformType === 'Nutanix' && (
        <div style={{ marginBottom: '24px' }}>
          <PostInstallAlert link={DOC_LINKS.NUTANIX_POST_INSTALL} />
        </div>
      )}
      {shouldShowClusterInstallationProgress(agentClusterInstall) && (
        <div style={{ marginBottom: '24px' }}>
          <AcmExpandableCard title={t('Cluster installation progress')} id="aiprogress">
            {!!clusterDeployment && !!agentClusterInstall && (
              <Stack hasGutter>
                <StackItem>
                  <ClusterDeploymentProgress
                    clusterDeployment={clusterDeployment as ClusterDeploymentK8sResource}
                    agentClusterInstall={agentClusterInstall}
                    agents={clusterAgents}
                    onFetchEvents={onFetchEvents}
                    fallbackEventsURL={fallbackEventsURL}
                  />
                </StackItem>
                {shouldShowClusterCredentials(agentClusterInstall) && (
                  <StackItem>
                    <ClusterDeploymentCredentials
                      clusterDeployment={clusterDeployment as ClusterDeploymentK8sResource}
                      agentClusterInstall={agentClusterInstall}
                      agents={clusterAgents}
                      fetchSecret={fetchSecret}
                      consoleUrl={
                        getConsoleUrl(clusterDeployment as ClusterDeploymentK8sResource, agentClusterInstall) || 'N/A'
                      }
                    />
                  </StackItem>
                )}
                <StackItem>
                  <ClusterDeploymentKubeconfigDownload
                    clusterDeployment={clusterDeployment as ClusterDeploymentK8sResource}
                    agentClusterInstall={agentClusterInstall}
                    fetchSecret={fetchSecret}
                  />
                  {cluster && (
                    <Button
                      id="cluster-events-button"
                      variant={ButtonVariant.link}
                      style={{ textAlign: 'right' }}
                      onClick={() => setIsEventsModalOpen(true)}
                    >
                      {t('View cluster events')}
                    </Button>
                  )}
                  <LogsDownloadButton
                    id="cluster-logs-button"
                    agentClusterInstall={agentClusterInstall}
                    variant={ButtonVariant.link}
                  />
                </StackItem>
                {shouldShowClusterInstallationError(agentClusterInstall) && (
                  <StackItem>
                    <ClusterInstallationError agentClusterInstall={agentClusterInstall} />
                  </StackItem>
                )}
              </Stack>
            )}
          </AcmExpandableCard>
        </div>
      )}
      <div style={{ marginBottom: '24px' }}>
        <AcmExpandableCard title={t('Cluster hosts')} id="aihosts">
          {!!agentClusterInstall && (
            <>
              <BulkActionModal<AgentK8sResource | BareMetalHostK8sResource> {...bulkModalProps} />
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
      {isEventsModalOpen && cluster && (
        <EventsModal
          entityKind="cluster"
          title={t('Cluster Events')}
          cluster={cluster}
          onFetchEvents={onFetchEvents}
          fallbackEventsURL={fallbackEventsURL}
          disablePagination
          isOpen
          onClose={() => setIsEventsModalOpen(false)}
          hostId={undefined}
        />
      )}
    </>
  )
}

export default (props: object) => (
  // @ts-expect-error @openshift-assisted/ui-lib needs React 18 updates
  <AlertsContextProvider>
    <AIClusterDetails {...props} />
  </AlertsContextProvider>
)
