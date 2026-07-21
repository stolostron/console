/* Copyright Contributors to the Open Cluster Management project */

import { AcmDrawerContext } from '~/ui-components'
import cloneDeep from 'lodash/cloneDeep'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Topology } from './topology/Topology'
import { useTranslation } from '~/lib/acm-i18next'
import { useApplicationDetailsContext } from '~/routes/Applications/ApplicationDetails/ApplicationDetails'
import { ISyncArgoCDModalProps, SyncArgoCDModal } from '~/routes/Applications/components/SyncArgoCDModal'
import { EditAppSetModal, IEditAppSetModalProps } from './modals/EditAppSetModal'
import { EditYamlModal, IEditYamlModalProps } from './modals/EditYamlModal'
import { ILogsModalProps, LogsModal } from './modals/LogsModal'
import { processResourceActionLink } from './helpers/diagram-helpers'
import { getDiagramElements } from './model/topology'
import type { TopologyAlert } from './analysis/analyzeTopology'
import type { TopologyNode } from './types'
import { DrawerShapes } from './components/DrawerShapes'
import './ApplicationTopology.css'
import './topology/css/Drawer.css'
import { ArgoApp, ClusterDetailsContainerControl } from './types'
import { nodeDetailsProvider } from './model/NodeDetailsProvider'
import { useSharedAtoms, useRecoilValue } from '~/shared-recoil'

type ProcessingSaveState = {
  isProcessingSave: boolean
  nodeId?: string
  start?: number
}

const ANALYZING_ALERT_THRESHOLD_MS = 1000

export type ArgoAppDetailsContainerData = {
  page: number
  startIdx: number
  argoAppSearchToggle: boolean
  expandSectionToggleMap: Set<number>
  selected?: any
  selectedArgoAppList: ArgoApp[]
  isLoading: boolean
}

export type ClusterDetailsContainerData = {
  page: number
  startIdx: number
  clusterSearchToggle: boolean
  expandSectionToggleMap: any
  clusterID?: string
  selected?: any
  selectedClusterList: any[]
  isSelectOpen?: boolean
}

export function ApplicationTopologyPageContent() {
  const {
    applicationData = {
      refreshTime: undefined,
      application: undefined,
      appData: undefined,
      topology: undefined,
      statuses: undefined,
    },
    channelControl,
    toolbarControl,
  } = useApplicationDetailsContext()
  const { t } = useTranslation()
  const { placementsState } = useSharedAtoms()
  const placements = useRecoilValue(placementsState)
  const { refreshTime, topology, statuses, application } = applicationData
  let hubClusterName = ''
  if (topology) {
    hubClusterName = topology.hubClusterName
  }
  const { setDrawerContext } = useContext(AcmDrawerContext)
  const [elements, setElements] = useState<{
    nodes: any[]
    links: any[]
  }>({ nodes: [], links: [] })
  const [alertsState, setAlertsState] = useState<TopologyAlert[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [processingSave, setProcessingSave] = useState<ProcessingSaveState>({ isProcessingSave: false })
  const hasShownAnalyzingAlertRef = useRef(false)
  const applicationKey = application?.metadata?.uid ?? application?.metadata?.name ?? ''

  useEffect(() => {
    hasShownAnalyzingAlertRef.current = false
  }, [applicationKey])

  const [argoAppDetailsContainerData, setArgoAppDetailsContainerData] = useState<ArgoAppDetailsContainerData>({
    page: 1,
    startIdx: 0,
    argoAppSearchToggle: false,
    expandSectionToggleMap: new Set(),
    selected: undefined,
    selectedArgoAppList: [],
    isLoading: false,
  })
  const [clusterDetailsContainerData, setClusterDetailsContainerData] = useState<ClusterDetailsContainerData>({
    page: 1,
    startIdx: 0,
    clusterSearchToggle: false,
    expandSectionToggleMap: new Set(),
    clusterID: undefined,
    selected: undefined,
    selectedClusterList: [],
  })

  const [startup, setStartup] = useState(false)

  useEffect(() => {
    setStartup(true)
  }, [])

  const handleErrorMsg = () => {
    //show toast message in parent container
  }

  const setDrawerContent = (
    title: string,
    isInline: boolean,
    isResizable: boolean,
    disableDrawerHead: boolean,
    drawerPanelBodyHasNoPadding: boolean,
    panelContent: React.ReactNode | React.ReactNode[],
    closeDrawer: boolean
  ) => {
    if (closeDrawer) {
      setDrawerContext(undefined)
    } else {
      setDrawerContext({
        isExpanded: true,
        onCloseClick: () => setDrawerContext(undefined),
        title,
        panelContent,
        isInline,
        panelContentProps: { minSize: '20%' },
        isResizable,
        disableDrawerHead,
        drawerPanelBodyHasNoPadding,
      })
    }
  }

  const argoAppDetailsContainerControl = {
    argoAppDetailsContainerData,
    handleArgoAppDetailsContainerUpdate: setArgoAppDetailsContainerData,
    handleErrorMsg,
  }

  const clusterDetailsContainerControl: ClusterDetailsContainerControl = {
    clusterDetailsContainerData,
    handleClusterDetailsContainerUpdate: setClusterDetailsContainerData,
  }

  const processActionLink = useCallback(
    (resource: any, toggleLoading: () => void, hubClusterName: string) => {
      processResourceActionLink(resource, toggleLoading, t, hubClusterName)
    },
    [t]
  )

  const canUpdateStatuses = !!statuses
  useEffect(() => {
    if (!topology) {
      setElements({ nodes: [], links: [] })
      setAlertsState([])
      setIsAnalyzing(false)
      return
    }

    let isCancelled = false
    let analyzingTimer: ReturnType<typeof setTimeout> | undefined
    const { diagramElements, alertsPromise } = getDiagramElements(
      cloneDeep(topology),
      statuses,
      canUpdateStatuses,
      t,
      placements
    )

    if (isCancelled) {
      return
    }

    setElements({ nodes: diagramElements.nodes, links: diagramElements.links })

    if (alertsPromise) {
      if (!hasShownAnalyzingAlertRef.current) {
        analyzingTimer = setTimeout(() => {
          if (!isCancelled) {
            setIsAnalyzing(true)
          }
        }, ANALYZING_ALERT_THRESHOLD_MS)
      }

      void alertsPromise
        .then((alerts) => {
          if (isCancelled) {
            return
          }
          setAlertsState(alerts)
        })
        .catch(() => {
          if (!isCancelled) {
            setAlertsState([])
          }
        })
        .finally(() => {
          if (!isCancelled) {
            if (analyzingTimer) {
              clearTimeout(analyzingTimer)
            }
            setIsAnalyzing(false)
            hasShownAnalyzingAlertRef.current = true
          }
        })
    } else {
      setIsAnalyzing(false)
      setAlertsState([])
    }

    return () => {
      isCancelled = true
      if (analyzingTimer) {
        clearTimeout(analyzingTimer)
      }
      setIsAnalyzing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startup, refreshTime])

  const handleResourceUpdateSuccess = useCallback((nodeId: string) => {
    setProcessingSave({
      isProcessingSave: true,
      nodeId,
      start: Date.now(),
    })
  }, [])

  const clearProcessingSave = useCallback(() => {
    setProcessingSave({ isProcessingSave: false })
  }, [])

  const [syncArgoCDModalProps, setSyncArgoCDModalProps] = useState<ISyncArgoCDModalProps | { open: false }>({
    open: false,
  })
  const [editAppSetModalProps, setEditAppSetModalProps] = useState<IEditAppSetModalProps | { open: false }>({
    open: false,
  })
  const [editYamlModalProps, setEditYamlModalProps] = useState<IEditYamlModalProps | { open: false }>({
    open: false,
  })
  const [logsModalProps, setLogsModalProps] = useState<ILogsModalProps | { open: false }>({
    open: false,
  })

  const handleEditAppSet = useCallback(
    (node: TopologyNode, showWizardInput?: string) => {
      setEditAppSetModalProps({
        open: true,
        close: () => setEditAppSetModalProps({ open: false }),
        node,
        showWizardInput,
        onUpdateSuccess: handleResourceUpdateSuccess,
      })
    },
    [handleResourceUpdateSuccess]
  )

  const handleEditYaml = useCallback(
    (node: TopologyNode, highlightEditorPath?: string) => {
      setEditYamlModalProps({
        open: true,
        close: () => setEditYamlModalProps({ open: false }),
        node,
        hubClusterName,
        highlightEditorPath,
        onUpdateSuccess: handleResourceUpdateSuccess,
      })
    },
    [hubClusterName, handleResourceUpdateSuccess]
  )

  const handleViewLogs = useCallback(
    (node: TopologyNode) => {
      setLogsModalProps({
        open: true,
        close: () => setLogsModalProps({ open: false }),
        node,
        hubClusterName,
        processActionLink,
      })
    },
    [hubClusterName, processActionLink]
  )

  const handleSyncResources = useCallback((node: TopologyNode) => {
    setSyncArgoCDModalProps({
      open: true,
      close: () => setSyncArgoCDModalProps({ open: false }),
      appOrAppSet: {
        metadata: { name: node.name },
        appSetApps: node.specs.appSetApps,
      },
    })
  }, [])

  const handleLaunchArgo = useCallback(
    (node: TopologyNode) => {
      processActionLink(
        {
          action: 'open_argo_editor',
          name: node.name,
          namespace: node.namespace,
          cluster: hubClusterName,
        },
        () => {},
        hubClusterName
      )
    },
    [hubClusterName, processActionLink]
  )

  const refreshResources = useCallback(() => {
    const app = applicationData?.application
    if (app) {
      setSyncArgoCDModalProps({
        open: true,
        close: () => setSyncArgoCDModalProps({ open: false }),
        appOrAppSet: app,
      })
    }
  }, [applicationData?.application])

  return (
    <>
      <SyncArgoCDModal {...syncArgoCDModalProps} />
      <EditAppSetModal {...editAppSetModalProps} />
      <EditYamlModal {...editYamlModalProps} />
      <LogsModal {...logsModalProps} />
      <DrawerShapes />
      <Topology
        elements={elements}
        alerts={alertsState}
        currentAlertsKey={applicationKey}
        isAnalyzing={isAnalyzing}
        isProcessingSave={processingSave.isProcessingSave}
        processingSaveStart={processingSave.start}
        onClearProcessingSave={clearProcessingSave}
        processActionLink={processActionLink}
        canUpdateStatuses={canUpdateStatuses}
        argoAppDetailsContainerControl={argoAppDetailsContainerControl}
        clusterDetailsContainerControl={clusterDetailsContainerControl}
        channelControl={channelControl}
        toolbarControl={toolbarControl}
        nodeDetailsProvider={nodeDetailsProvider}
        setDrawerContent={setDrawerContent}
        hubClusterName={hubClusterName}
        onRefreshResources={refreshResources}
        onEditAppSet={handleEditAppSet}
        onEditYaml={handleEditYaml}
        onViewLogs={handleViewLogs}
        onSyncResources={handleSyncResources}
        onLaunchArgo={handleLaunchArgo}
      />
    </>
  )
}
