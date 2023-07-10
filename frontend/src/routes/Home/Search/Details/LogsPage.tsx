/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { makeStyles } from '@mui/styles'
import {
  Button,
  Checkbox,
  PageSection,
  Select,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  Tooltip,
} from '@patternfly/react-core'
import { CompressIcon, DownloadIcon, ExpandIcon, OutlinedWindowRestoreIcon } from '@patternfly/react-icons'
import { LogViewer, LogViewerSearch } from '@patternfly/react-log-viewer'
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import screenfull from 'screenfull'
import { useTranslation } from '../../../../lib/acm-i18next'
import { DOC_BASE_PATH } from '../../../../lib/doc-util'
import { fetchRetry, getBackendUrl, ManagedCluster } from '../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmAlert, AcmLoadingPage } from '../../../../ui-components'

const useStyles = makeStyles({
  toolbarContainer: {
    alignItems: 'stretch',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: '5px',
  },
  toolbarContainerFullscreen: {
    alignItems: 'stretch',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: '5px',
    backgroundColor: 'var(--pf-global--BackgroundColor--100)',
    padding: '0 10px',
  },
  toolbarGroup: {
    alignItems: 'center',
    display: 'flex',
    padding: '5px 0',
  },
  toolbarGroupItem: {
    paddingRight: '15px',
  },
  toolbarItemIcon: {
    marginRight: '0.25rem',
  },
  toolbarItemSpacer: {
    margin: '0 10px',
  },
  logWindowHeader: {
    display: 'flex',
    alignItems: 'center',
    color: '#f5f5f5',
    backgroundColor: 'var(--pf-global--BackgroundColor--dark-300)',
    fontSize: '14px',
  },
  logWindowHeaderItem: {
    display: 'flex',
    alignItems: 'center',
    height: '36px',
    padding: '8px 10px 5px 10px',
    borderRight: '1px solid #4f5255',
  },
  logWindowHeaderItemLabel: {
    paddingRight: '.5rem',
  },
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
  const classes = useStyles()
  const [isContainerSelectOpen, setIsContainerSelectOpen] = useState(false)
  const [isPreviousSelectOpen, setIsPreviousSelectOpen] = useState(false)

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
      <Select
        id={'previous-log-select'}
        aria-label={'previous-log-select'}
        variant={SelectVariant.single}
        onToggle={() => setIsPreviousSelectOpen(!isPreviousSelectOpen)}
        onSelect={(
          _event: React.MouseEvent<Element, MouseEvent> | React.ChangeEvent<Element>,
          selection: string | SelectOptionObject
        ) => {
          selection === 'previous-log' ? setPreviousLogs(true) : setPreviousLogs(false)
          setIsPreviousSelectOpen(false)
        }}
        selections={previousLogs ? 'previous-log' : 'current-log'}
        isOpen={isPreviousSelectOpen}
        isDisabled={!containerHasPreviousLogs}
        noResultsFoundText={t('No results found')}
      >
        <SelectOption key={'current-log'} value={'current-log'}>
          {t('Current log')}
        </SelectOption>
        <SelectOption key={'previous-log'} value={'previous-log'}>
          {t('Previous log')}
        </SelectOption>
      </Select>
    )
  }, [containerHasPreviousLogs, isPreviousSelectOpen, previousLogs, setPreviousLogs, t])

  return (
    <div className={isFullscreen ? classes.toolbarContainerFullscreen : classes.toolbarContainer}>
      <div className={classes.toolbarGroup}>
        <div className={classes.toolbarGroupItem}>
          <Select
            id={'container-select'}
            aria-label={'container-select'}
            variant={SelectVariant.single}
            onToggle={() => setIsContainerSelectOpen(!isContainerSelectOpen)}
            onSelect={(
              _event: React.MouseEvent<Element, MouseEvent> | React.ChangeEvent<Element>,
              selection: string | SelectOptionObject
            ) => {
              setContainer(/* istanbul ignore next */ (selection as string) ?? container)
              sessionStorage.setItem(
                `${name}-${cluster}-container`,
                /* istanbul ignore next */ (selection as string) || container
              )
              setIsContainerSelectOpen(false)
              setPreviousLogs(false)
            }}
            selections={container}
            isOpen={isContainerSelectOpen}
            noResultsFoundText={t('No results found')}
          >
            {containers.map((container) => {
              return (
                <SelectOption key={container} value={container}>
                  {container}
                </SelectOption>
              )
            })}
          </Select>
        </div>
        {/* If previious logs are disabled then show a tooltip with - "Only the current log is available for this container." */}
        <div className={classes.toolbarGroupItem}>
          {containerHasPreviousLogs ? (
            previousLogsDropdown
          ) : (
            <Tooltip content={t('Only the current log is available for this container.')}>
              {previousLogsDropdown}
            </Tooltip>
          )}
        </div>
        <div className={classes.toolbarGroupItem}>
          <LogViewerSearch minSearchChars={1} placeholder="Search" />
        </div>
      </div>
      <div className={classes.toolbarGroup}>
        <Checkbox
          label={t('Wrap lines')}
          id="wrapLogLines"
          isChecked={wrapLines}
          data-checked-state={wrapLines}
          onChange={(checked: boolean) => {
            toggleWrapLines(checked)
          }}
        />
        <span aria-hidden="true" className={classes.toolbarItemSpacer}>
          |
        </span>
        <Button variant="link" isInline onClick={() => openRawTab()}>
          <OutlinedWindowRestoreIcon className={classes.toolbarItemIcon} />
          {t('Raw')}
        </Button>
        <span aria-hidden="true" className={classes.toolbarItemSpacer}>
          |
        </span>
        <a href={downloadUrl} download={downloadFilename}>
          <DownloadIcon className={classes.toolbarItemIcon} />
          {t('Download')}
        </a>
        {screenfull.isEnabled && (
          <>
            <span aria-hidden="true" className={classes.toolbarItemSpacer}>
              |
            </span>
            <Button variant="link" isInline onClick={toggleFullscreen}>
              {isFullscreen ? (
                <>
                  <CompressIcon className={classes.toolbarItemIcon} />
                  {t('Collapse')}
                </>
              ) : (
                <>
                  <ExpandIcon className={classes.toolbarItemIcon} />
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
  const classes = useStyles()
  return (
    <div className={classes.logWindowHeader}>
      <div className={classes.logWindowHeaderItem}>
        <p className={classes.logWindowHeaderItemLabel}>{'Cluster:'}</p>
        {cluster}
      </div>
      <div className={classes.logWindowHeaderItem}>
        <p className={classes.logWindowHeaderItemLabel}>{'Namespace:'}</p>
        {namespace}
      </div>
      <div className={classes.logWindowHeaderItem}>
        <p className={classes.logWindowHeaderItemLabel}>{`${linesLength} lines`}</p>
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

export default function LogsPage(props: {
  resource: any
  resourceError: string
  containers: string[]
  cluster: string
  namespace: string
  name: string
}) {
  const { resource, resourceError, containers, cluster, namespace, name } = props
  const logViewerRef = useRef<any>()
  const resourceLogRef = useRef<any>()
  const { t } = useTranslation()
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false)
  const [logs, setLogs] = useState<string>('')
  const [logsError, setLogsError] = useState<string>()
  const [container, setContainer] = useState<string>(sessionStorage.getItem(`${name}-${cluster}-container`) || '')

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
    if (cluster !== 'local-cluster' && container !== '') {
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
          const managedCluster = managedClusters.find(
            (mc: ManagedCluster) => /* istanbul ignore next */ mc.metadata?.name === cluster
          )
          const labels = managedCluster?.metadata?.labels ?? {}
          const vendor = labels['vendor'] ?? ''
          if (err.code === 400 && vendor.toLowerCase() !== 'openshift') {
            setLogsError(
              `Non-OpenShift Container Platform clusters require LoadBalancer to be enabled to retrieve logs. Follow the steps here to complete LoadBalancer setup: ${DOC_BASE_PATH}/release_notes/red-hat-advanced-cluster-management-for-kubernetes-release-notes#non-ocp-logs`
            )
          } else {
            setLogsError(err.message)
          }
        })
    } else if (cluster === 'local-cluster' && container !== '') {
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
  }, [cluster, container, managedClusters, name, namespace, previousLogs])

  const linesLength = useMemo(() => logs.split('\n').length - 1, [logs])

  const toggleFullscreen = () => {
    resourceLogRef.current && screenfull.isEnabled && screenfull.toggle(resourceLogRef.current)
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

  if (resourceError !== '') {
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
