/* Copyright Contributors to the Open Cluster Management project */

import { KeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { SelectOption } from '@patternfly/react-core'
import { LogViewer } from '@patternfly/react-log-viewer'
import screenfull from 'screenfull'
import { useLocalHubName } from '~/hooks/use-local-hub'
import { Trans, useTranslation } from '~/lib/acm-i18next'
import { LogsFooterButton, LogsHeader, LogsToolbar } from '~/routes/Search/Details/LogsPage'
import type {
  PodInfo,
  ResourceMap,
  TopologyNode,
} from '~/routes/Applications/ApplicationDetails/ApplicationTopology/types'
import { fetchRetry, getBackendUrl, isRequestAbortedError } from '~/resources/utils'
import { fleetLogsRequest } from '~/resources/utils/fleet-logs-request'
import { useRecoilValue, useSharedAtoms } from '~/shared-recoil'
import { AcmAlert, AcmLoadingPage, AcmModal, AcmSelect } from '~/ui-components'
import { createResourceURL } from '../helpers/diagram-helpers'
import type { ResourceAction } from '../types'

export interface ILogsModalProps {
  close: () => void
  open: boolean
  node: TopologyNode
  processActionLink?: (resource: ResourceAction, toggleLoading: () => void, hubClusterName: string) => void
  hubClusterName: string
}

function getPodsFromNode(node: TopologyNode): PodInfo[] {
  const podModel = node?.specs?.podModel as ResourceMap | undefined
  if (!podModel || Object.keys(podModel).length === 0) {
    return []
  }
  const firstKey = Object.keys(podModel)[0]
  return podModel[firstKey] ?? []
}

function parseContainers(container?: string): string[] {
  return container ? container.split(';').map((item) => item.trim()) : []
}

export function LogsModal(props: ILogsModalProps | { open: false }) {
  if (props.open === false) {
    return null
  }

  return <LogsModalContent {...props} />
}

function LogsModalContent({
  close,
  node,
  processActionLink,
  hubClusterName,
}: Readonly<Omit<ILogsModalProps, 'open'>>) {
  const { t } = useTranslation()

  const renderResourceURLLink = (resource: { data: ResourceAction }, isLogURL = false) => {
    const processLink = () => {
      if (processActionLink) {
        processActionLink(resource.data, () => {}, hubClusterName)
      }
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        processLink()
      }
    }

    return (
      <div>
        <div className="spacer" />
        <span
          className="link sectionLabel"
          id="linkForNodeAction"
          tabIndex={0}
          role="button"
          onClick={processLink}
          onKeyDown={handleKeyPress}
          style={{ padding: '10px' }}
        >
          {isLogURL && t('View logs in Search details')}
          {!isLogURL && t('View YAML in Search details')}
          <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
            <use href="#drawerShapes_carbonLaunch" className="label-icon" />
          </svg>
        </span>
        <div className="spacer" />
      </div>
    )
  }

  return (
    <AcmModal
      id="view-logs-modal"
      isOpen={true}
      title={t('Logs')}
      aria-label={t('Logs')}
      showClose={true}
      onClose={close}
      variant={ModalVariant.large}
      position="top"
      hasNoBodyWrapper
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '70vh',
          overflow: 'auto',
          paddingTop: 'var(--pf-t--global--spacer--sm)',
          paddingLeft: 'var(--pf-t--global--spacer--lg)',
          paddingRight: 'var(--pf-t--global--spacer--lg)',
          paddingBottom: 'var(--pf-t--global--spacer--lg)',
        }}
      >
        <TopologyLogsViewer node={node} renderResourceURLLink={renderResourceURLLink} />
      </div>
    </AcmModal>
  )
}

function TopologyLogsViewer({
  node,
  renderResourceURLLink,
}: {
  node: TopologyNode
  renderResourceURLLink: (resource: { data: ResourceAction }, isLogURL?: boolean) => ReactNode
}) {
  const { t } = useTranslation()
  const localHubName = useLocalHubName()
  const logViewerRef = useRef<any>()
  const resourceLogRef = useRef<any>()
  const pods = useMemo(() => getPodsFromNode(node), [node])
  const [selectedPodName, setSelectedPodName] = useState(pods[0]?.name ?? '')
  const selectedPod = useMemo(
    () => pods.find((pod) => pod.name === selectedPodName) ?? pods[0],
    [pods, selectedPodName]
  )
  const cluster = selectedPod?.cluster ?? ''
  const namespace = selectedPod?.namespace ?? ''
  const name = selectedPod?.name ?? ''
  const containers = useMemo(() => parseContainers(selectedPod?.container as string | undefined), [selectedPod])
  const isHubClusterResource = String(selectedPod?._hubClusterResource) === 'true' || cluster === localHubName
  const currentPodURL = useMemo(() => {
    if (!selectedPod) {
      return ''
    }
    return createResourceURL(
      {
        cluster: selectedPod.cluster,
        type: selectedPod.kind ?? 'Pod',
        namespace: selectedPod.namespace,
        name: selectedPod.name,
        specs: {
          raw: {
            apiVersion: selectedPod.apiversion,
          },
        },
      },
      t,
      true
    )
  }, [selectedPod, t])

  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false)
  const [logs, setLogs] = useState<string>('')
  const [logsError, setLogsError] = useState<ReactNode>()
  const [container, setContainer] = useState<string>(sessionStorage.getItem(`${name}-${cluster}-container`) ?? '')
  const [showJumpToBottomBtn, setShowJumpToBottomBtn] = useState<boolean>(false)
  const [wrapLines, setWrapLines] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previousLogs, setPreviousLogs] = useState(false)
  const [containerHasPreviousLogs, setContainerHasPreviousLogs] = useState(false)
  const { managedClustersState } = useSharedAtoms()
  const managedClusters = useRecoilValue(managedClustersState)

  useEffect(() => {
    if (pods.length > 0 && !selectedPodName) {
      setSelectedPodName(pods[0]?.name ?? '')
    }
  }, [pods, selectedPodName])

  useEffect(() => {
    if (containers.length > 0 && sessionStorage.getItem(`${name}-${cluster}-container`) === null) {
      sessionStorage.setItem(`${name}-${cluster}-container`, containers[0])
      setContainer(containers[0])
    }
  }, [containers, cluster, name])

  useEffect(() => {
    const handleChange = () => setIsFullscreen(screenfull.isFullscreen)
    const handleError = () => setIsFullscreen(false)

    if (screenfull.isEnabled) {
      screenfull.on('change', handleChange)
      screenfull.on('error', handleError)
    }

    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', handleChange)
        screenfull.off('error', handleError)
      }
    }
  }, [])

  useEffect(() => {
    setContainerHasPreviousLogs(Number(selectedPod?.restarts ?? 0) > 0)
  }, [selectedPod])

  useEffect(() => {
    setLogs('')
    setLogsError(undefined)
  }, [selectedPodName, container, previousLogs])

  useEffect(() => {
    if (container === '') {
      return
    }

    setIsLoadingLogs(true)
    const abortController = new AbortController()
    const { signal } = abortController

    const applyIfCurrent = (update: () => void) => {
      if (signal.aborted) {
        return
      }
      update()
      setIsLoadingLogs(false)
    }

    if (!isHubClusterResource) {
      fleetLogsRequest({
        cluster,
        namespace,
        podName: name,
        container,
        tailLines: 1000,
        previous: previousLogs,
        signal,
      })
        .then((result) => {
          applyIfCurrent(() => {
            if (result.errorMessage) {
              setLogsError(result.errorMessage)
            } else {
              setLogs(result.data)
            }
          })
        })
        .catch((err) => {
          if (signal.aborted || isRequestAbortedError(err)) {
            return
          }
          applyIfCurrent(() => {
            if (err.code === 400) {
              setLogsError(<Trans i18nKey="acm.logs.error" components={{ code: <code /> }} />)
            } else {
              setLogsError(err.message)
            }
          })
        })
    } else {
      fetchRetry({
        method: 'GET',
        url:
          getBackendUrl() +
          `/api/v1/namespaces/${namespace}/pods/${name}/log?container=${container}&tailLines=1000${
            previousLogs ? '&previous=true' : ''
          }`,
        signal,
        retries: process.env.NODE_ENV === 'production' ? 2 : 0,
        headers: { Accept: '*/*' },
      })
        .then((result) => {
          applyIfCurrent(() => {
            setLogs((result.data as string) ?? '')
          })
        })
        .catch((err) => {
          if (signal.aborted || isRequestAbortedError(err)) {
            return
          }
          applyIfCurrent(() => {
            setLogsError(err.message)
          })
        })
    }

    return () => abortController.abort()
  }, [cluster, container, managedClusters, name, namespace, previousLogs, isHubClusterResource])

  const linesLength = useMemo(() => logs?.split('\n').length - 1, [logs])

  const toggleFullscreen = () => {
    if (resourceLogRef.current && screenfull.isEnabled) {
      screenfull.toggle(resourceLogRef.current)
    }
  }

  const onScroll = ({
    scrollOffsetToBottom,
    scrollDirection,
    scrollUpdateWasRequested,
  }: {
    scrollOffsetToBottom: number
    scrollDirection: 'backward' | 'forward'
    scrollUpdateWasRequested: boolean
  }) => {
    if (!scrollUpdateWasRequested) {
      if (scrollOffsetToBottom < 1) {
        setShowJumpToBottomBtn(false)
      } else if (scrollDirection === 'backward') {
        setShowJumpToBottomBtn(true)
      }
    }
  }

  if (pods.length === 0) {
    return (
      <AcmAlert
        noClose={true}
        variant={'danger'}
        isInline={true}
        title={`${t('Error querying resource logs:')} ${name}`}
        subtitle={t('No pods found')}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {renderResourceURLLink(
        {
          data: {
            action: 'open_link',
            targetLink: currentPodURL,
            name,
            namespace,
            kind: 'pod',
          },
        },
        true
      )}
      <span style={{ display: 'block', paddingLeft: '0.5rem', fontSize: '1rem' }}>{t('Select pod')}</span>
      <AcmSelect
        id={'pod-select'}
        label={''}
        value={selectedPodName}
        isRequired={true}
        onChange={(value) => {
          const pod = pods.find((item) => item.name === value)
          const podContainers = parseContainers(pod?.container as string | undefined)
          setSelectedPodName(value as string)
          setPreviousLogs(false)
          setContainer(podContainers[0] ?? '')
        }}
      >
        {pods.map((pod) => {
          return (
            <SelectOption key={pod.name} value={pod.name}>
              {pod.name}
            </SelectOption>
          )
        })}
      </AcmSelect>
      <div ref={resourceLogRef} style={{ flex: 1, minHeight: 0, marginTop: '0.5rem' }}>
        {logsError ? (
          <>
            <LogsToolbar
              logs={logs}
              name={name}
              container={container}
              containers={containers}
              setContainer={setContainer}
              cluster={cluster}
              toggleWrapLines={setWrapLines}
              wrapLines={wrapLines}
              toggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              containerHasPreviousLogs={containerHasPreviousLogs}
              previousLogs={previousLogs}
              setPreviousLogs={setPreviousLogs}
            />
            <AcmAlert
              noClose={true}
              variant={'danger'}
              isInline={true}
              title={`${t('Error querying resource logs:')} ${name}`}
              subtitle={logsError}
            />
          </>
        ) : isLoadingLogs ? (
          <AcmLoadingPage />
        ) : (
          <LogViewer
            ref={logViewerRef}
            height={'calc(70vh - 200px)'}
            data={logs}
            theme="dark"
            isTextWrapped={wrapLines}
            toolbar={
              <LogsToolbar
                logs={logs}
                name={name}
                container={container}
                containers={containers}
                setContainer={setContainer}
                cluster={cluster}
                toggleWrapLines={setWrapLines}
                wrapLines={wrapLines}
                toggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
                containerHasPreviousLogs={containerHasPreviousLogs}
                previousLogs={previousLogs}
                setPreviousLogs={setPreviousLogs}
              />
            }
            header={<LogsHeader cluster={cluster} namespace={namespace} linesLength={linesLength} />}
            scrollToRow={linesLength}
            onScroll={onScroll}
            footer={
              <LogsFooterButton
                logViewerRef={logViewerRef}
                showJumpToBottomBtn={showJumpToBottomBtn}
                setShowJumpToBottomBtn={setShowJumpToBottomBtn}
              />
            }
          />
        )}
      </div>
    </div>
  )
}
