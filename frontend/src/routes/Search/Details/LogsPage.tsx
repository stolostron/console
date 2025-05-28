/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { css } from '@emotion/css'
import { Button, Checkbox, PageSection, Tooltip, SelectOption } from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant, SelectOptionObject } from '../../../components/AcmSelectBase'
import { CompressIcon, DownloadIcon, ExpandIcon, OutlinedWindowRestoreIcon } from '@patternfly/react-icons'
import { LogViewer } from '@patternfly/react-log-viewer'
import { Dispatch, MutableRefObject, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom-v5-compat'
import screenfull from 'screenfull'
import { Trans, useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { fetchRetry, getBackendUrl } from '../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmAlert, AcmLoadingPage } from '../../../ui-components'
import { useSearchDetailsContext } from './DetailsPage'
import { LogViewerSearch } from './LogsViewerSearch'

const toolbarContainer = css({
  alignItems: 'stretch',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginBottom: '5px',
})
const toolbarContainerFullscreen = css({
  alignItems: 'stretch',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginBottom: '5px',
  backgroundColor: 'var(--pf-v5-global--BackgroundColor--100)',
  padding: '0 10px',
})
const toolbarGroup = css({
  alignItems: 'center',
  display: 'flex',
  padding: '5px 0',
})
const toolbarGroupItem = css({
  paddingRight: '15px',
})
const toolbarItemIcon = css({
  marginRight: '0.25rem',
})
const toolbarItemSpacer = css({
  margin: '0 10px',
})
const logWindowHeader = css({
  display: 'flex',
  alignItems: 'center',
  color: '#f5f5f5',
  backgroundColor: 'var(--pf-v5-global--BackgroundColor--dark-300)',
  fontSize: '14px',
})
const logWindowHeaderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: '36px',
  padding: '8px 10px 5px 10px',
  borderRight: '1px solid #4f5255',
})
const logWindowHeaderItemLabel = css({
  paddingRight: '.5rem',
})

export function LogsToolbar(props: {
  logs: string
  name: string
  container: string
  cluster: string
  containers: string[]
  setContainer: (value: SetStateAction<string>) => void
  toggleWrapLines: (wrapLines: boolean) => void
  wrapLines: boolean
  toggleFullscreen: () => void
  isFullscreen: boolean
  containerHasPreviousLogs: boolean
  previousLogs: boolean
  setPreviousLogs: (value: SetStateAction<boolean>) => void
}) {
  const {
    logs,
    name,
    container,
    cluster,
    containers,
    setContainer,
    toggleWrapLines,
    wrapLines,
    toggleFullscreen,
    isFullscreen,
    containerHasPreviousLogs,
    previousLogs,
    setPreviousLogs,
  } = props
  const { t } = useTranslation()

  const openRawTab = () => {
    const rawWindow = window.open('about:blank')
    /* istanbul ignore next */
    rawWindow?.document.write(`<pre>${logs}</pre>`)
  }

  const { downloadUrl, downloadFilename } = useMemo(() => {
    const downloadFile = new File([logs], `${name}-${cluster}-${container}.log`, {
      type: 'text/plain',
    })
    const downloadUrl = URL.createObjectURL(downloadFile)
    return { downloadUrl, downloadFilename: downloadFile.name }
  }, [name, cluster, container, logs])

  const previousLogsDropdown = useMemo(() => {
    return (
      <AcmSelectBase
        id={'previous-log-select'}
        aria-label={'previous-log-select'}
        variant={SelectVariant.single}
        onSelect={(selection) => {
          setPreviousLogs(selection === 'previous-log')
        }}
        selections={previousLogs ? 'previous-log' : 'current-log'}
        isDisabled={!containerHasPreviousLogs}
      >
        <SelectOption key={'current-log'} value={'current-log'}>
          {t('Current log')}
        </SelectOption>
        <SelectOption key={'previous-log'} value={'previous-log'}>
          {t('Previous log')}
        </SelectOption>
      </AcmSelectBase>
    )
  }, [containerHasPreviousLogs, previousLogs, setPreviousLogs, t])

  return (
    <div className={isFullscreen ? toolbarContainerFullscreen : toolbarContainer}>
      <div className={toolbarGroup}>
        <div className={toolbarGroupItem}>
          <AcmSelectBase
            id={'container-select'}
            aria-label={'container-select'}
            variant={SelectVariant.single}
            onSelect={(selection: string | SelectOptionObject) => {
              setContainer(/* istanbul ignore next */ (selection as string) ?? container)
              sessionStorage.setItem(
                `${name}-${cluster}-container`,
                /* istanbul ignore next */ (selection as string) || container
              )
              setPreviousLogs(false)
            }}
            selections={container}
          >
            {containers.map((container) => {
              return (
                <SelectOption key={container} value={container}>
                  {container}
                </SelectOption>
              )
            })}
          </AcmSelectBase>
        </div>
        {/* If previious logs are disabled then show a tooltip with - "Only the current log is available for this container." */}
        <div className={toolbarGroupItem}>
          {containerHasPreviousLogs ? (
            previousLogsDropdown
          ) : (
            <Tooltip content={t('Only the current log is available for this container.')}>
              {previousLogsDropdown}
            </Tooltip>
          )}
        </div>
        <div className={toolbarGroupItem}>
          <LogViewerSearch minSearchChars={1} placeholder="Search" />
        </div>
      </div>
      <div className={toolbarGroup}>
        <Checkbox
          label={t('Wrap lines')}
          id="wrapLogLines"
          isChecked={wrapLines}
          data-checked-state={wrapLines}
          onChange={(_event, checked: boolean) => {
            toggleWrapLines(checked)
          }}
        />
        <span aria-hidden="true" className={toolbarItemSpacer}>
          |
        </span>
        <Button variant="link" isInline onClick={() => openRawTab()}>
          <OutlinedWindowRestoreIcon className={toolbarItemIcon} />
          {t('Raw')}
        </Button>
        <span aria-hidden="true" className={toolbarItemSpacer}>
          |
        </span>
        <a href={downloadUrl} download={downloadFilename}>
          <DownloadIcon className={toolbarItemIcon} />
          {t('Download')}
        </a>
        {screenfull.isEnabled && (
          <>
            <span aria-hidden="true" className={toolbarItemSpacer}>
              |
            </span>
            <Button variant="link" isInline onClick={toggleFullscreen}>
              {isFullscreen ? (
                <>
                  <CompressIcon className={toolbarItemIcon} />
                  {t('Collapse')}
                </>
              ) : (
                <>
                  <ExpandIcon className={toolbarItemIcon} />
                  {t('Expand')}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function LogsHeader(props: { cluster: string; namespace: string; linesLength: number }) {
  const { cluster, namespace, linesLength } = props
  return (
    <div className={logWindowHeader}>
      <div className={logWindowHeaderItem}>
        <p className={logWindowHeaderItemLabel}>{'Cluster:'}</p>
        {cluster}
      </div>
      <div className={logWindowHeaderItem}>
        <p className={logWindowHeaderItemLabel}>{'Namespace:'}</p>
        {namespace}
      </div>
      <div className={logWindowHeaderItem}>
        <p className={logWindowHeaderItemLabel}>{`${linesLength} lines`}</p>
      </div>
    </div>
  )
}

export function LogsFooterButton(props: {
  logViewerRef: MutableRefObject<any>
  showJumpToBottomBtn: boolean
  setShowJumpToBottomBtn: Dispatch<SetStateAction<boolean>>
}) {
  const { logViewerRef, showJumpToBottomBtn, setShowJumpToBottomBtn } = props
  const { t } = useTranslation()

  function handleClick() {
    logViewerRef.current?.scrollToBottom()
    setShowJumpToBottomBtn(false)
  }
  return (
    <Button style={{ visibility: showJumpToBottomBtn ? 'visible' : 'hidden' }} onClick={handleClick}>
      {t('Jump to the bottom')}
    </Button>
  )
}

export default function LogsPage() {
  const { kind, resource, resourceError, containers, cluster, namespace, name, isHubClusterResource } =
    useSearchDetailsContext()
  const { search } = useLocation()
  const logViewerRef = useRef<any>()
  const resourceLogRef = useRef<any>()
  const { t } = useTranslation()
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
    if (containers.length > 0 && sessionStorage.getItem(`${name}-${cluster}-container`) === null) {
      sessionStorage.setItem(`${name}-${cluster}-container`, containers[0])
      setContainer(containers[0])
    }
  }, [containers, cluster, name])

  // init screenfull
  useEffect(() => {
    if (screenfull.isEnabled) {
      /* istanbul ignore next */
      screenfull.on('change', () => {
        setIsFullscreen(screenfull.isFullscreen)
      })
      /* istanbul ignore next */
      screenfull.on('error', () => {
        setIsFullscreen(false)
      })
    }

    return () => {
      if (screenfull.isEnabled) {
        /* istanbul ignore next */
        screenfull.off('change', () => {
          setIsFullscreen(false)
        })
        /* istanbul ignore next */
        screenfull.off('error', () => {
          setIsFullscreen(false)
        })
      }
    }
  }, [])

  useEffect(() => {
    if (resource) {
      const containerStatus = resource.status?.containerStatuses?.find(
        (containerStatus: any) => containerStatus.name === container
      )
      setContainerHasPreviousLogs(containerStatus?.restartCount > 0) // Assuming previous log is available if the container has been restarted at least once
    }
  }, [container, resource])

  useEffect(() => {
    if (!isHubClusterResource && container !== '') {
      setIsLoadingLogs(true)
      const abortController = new AbortController()
      const logsResult = fetchRetry({
        method: 'GET',
        url:
          getBackendUrl() +
          `/apis/proxy.open-cluster-management.io/v1beta1/namespaces/${cluster}/clusterstatuses/${cluster}/log/${namespace}/${name}/${container}?tailLines=1000${
            previousLogs ? '&previous=true' : ''
          }`,
        signal: abortController.signal,
        retries: /* istanbul ignore next */ process.env.NODE_ENV === 'production' ? 2 : 0,
        headers: { Accept: '*/*' },
      })
      logsResult
        .then((result) => {
          setLogs(result.data as string)
          setIsLoadingLogs(false)
        })
        .catch((err) => {
          if (err.code === 400) {
            setLogsError(<Trans i18nKey="acm.logs.error" components={{ code: <code /> }} />)
          } else {
            setLogsError(err.message)
          }
        })
    } else if (isHubClusterResource && container !== '') {
      const abortController = new AbortController()
      const logsResult = fetchRetry({
        method: 'GET',
        url:
          getBackendUrl() +
          `/api/v1/namespaces/${namespace}/pods/${name}/log?container=${container}&tailLines=1000${
            previousLogs ? '&previous=true' : ''
          }`,
        signal: abortController.signal,
        retries: /* istanbul ignore next */ process.env.NODE_ENV === 'production' ? 2 : 0,
        headers: { Accept: '*/*' },
      })
      logsResult
        .then((result) => {
          setLogs(result.data as string)
          setIsLoadingLogs(false)
        })
        .catch((err) => {
          setLogsError(err.message)
        })
    }
  }, [cluster, container, managedClusters, name, namespace, previousLogs, isHubClusterResource])

  const linesLength = useMemo(() => logs.split('\n').length - 1, [logs])

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

  if (!(kind.toLowerCase() === 'pod' || kind.toLowerCase() === 'pods') || !containers.length) {
    return <Navigate to={{ pathname: NavigationPath.resources, search }} replace />
  } else if (resourceError !== '') {
    return (
      <PageSection>
        <AcmAlert
          noClose={true}
          variant={'danger'}
          isInline={true}
          title={`${t('Error querying resource logs:')} ${name}`}
          subtitle={resourceError}
        />
      </PageSection>
    )
  } else if (logsError) {
    return (
      <PageSection>
        <AcmAlert
          noClose={true}
          variant={'danger'}
          isInline={true}
          title={`${t('Error querying resource logs:')} ${name}`}
          subtitle={logsError}
        />
      </PageSection>
    )
  } else if (resourceError === '' && !logsError && isLoadingLogs) {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  return (
    <PageSection>
      <div ref={resourceLogRef} style={{ height: '100%' }}>
        <LogViewer
          ref={logViewerRef}
          height={'100%'}
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
      </div>
    </PageSection>
  )
}
