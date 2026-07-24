/* Copyright Contributors to the Open Cluster Management project */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import head from 'lodash/head'
import { useTranslation } from '../../../../../lib/acm-i18next'
import {
  TopologyView,
  VisualizationSurface,
  SELECTION_EVENT,
  SelectionEventListener,
  useEventListener,
  Controller,
  Visualization,
  VisualizationProvider,
  isNode,
} from '@patternfly/react-topology'
import layoutFactory from './layout/layoutFactory'
import getLayoutModel from './layout/layoutModel'
import '@patternfly/patternfly/patternfly.css'
import '@patternfly/patternfly/patternfly-addons.css'
import componentFactory from './components/componentFactory'
import { NodeIcons } from './components/nodeIcons'
import { NodeStatusIcons } from './components/nodeStatusIcons'
import DetailsView from '../components/DetailsView'
import TopologyToolbar, { ToolbarControl } from './components/TopologyToolbar'

import { ArgoAppDetailsContainerData, ClusterDetailsContainerData } from '../ApplicationTopology'
import TopologyZoomBar from './components/TopologyZoomBar'
import { TopologyAlerts } from './components/TopologyAlerts'
import type { TopologyAlert } from '../analysis/analyzeTopology'
import type { TopologyNode } from '../types'

import './css/topology-view.css'
import type { TFunction } from 'i18next'
import { TopologyRefreshContext } from './contexts/TopologyRefreshContext'

const PROCESSING_SAVE_TIMEOUT_MS = 60 * 1000

const getAlertsTitlesKey = (alerts: TopologyAlert[] | undefined): string =>
  [...new Set((alerts ?? []).map((alert) => alert.title))].sort((a, b) => a.localeCompare(b)).join('\0')

export interface TopologyProps {
  elements: {
    activeChannel?: string
    channels?: string[]
    nodes: any[]
    links: any[]
  }
  alerts?: TopologyAlert[]
  currentAlertsKey?: string
  isAnalyzing?: boolean
  isProcessingSave?: boolean
  processingSaveStart?: number
  onClearProcessingSave?: () => void
  channelControl: {
    allChannels: string[]
    activeChannel: string | undefined
    setActiveChannel: (channel: string) => void
  }
  toolbarControl: ToolbarControl
  argoAppDetailsContainerControl: {
    argoAppDetailsContainerData: ArgoAppDetailsContainerData
    handleArgoAppDetailsContainerUpdate: React.Dispatch<React.SetStateAction<ArgoAppDetailsContainerData>>
    handleErrorMsg: () => void
  }
  clusterDetailsContainerControl: {
    clusterDetailsContainerData: ClusterDetailsContainerData
    handleClusterDetailsContainerUpdate: React.Dispatch<React.SetStateAction<ClusterDetailsContainerData>>
  }
  options?: any
  setDrawerContent: (
    title: string,
    isInline: boolean,
    isResizable: boolean,
    disableDrawerHead: boolean,
    drawerPanelBodyHasNoPadding: boolean,
    panelContent: React.ReactNode | React.ReactNode[],
    closeDrawer: boolean
  ) => void
  nodeDetailsProvider?: (node: any, activeFilters: Record<string, any>, t: TFunction, hubClusterName: string) => any
  canUpdateStatuses?: boolean
  disableRenderConstraint?: boolean
  processActionLink?: (resource: any, toggleLoading: () => void, hubClusterName: string) => void
  hubClusterName: string
  onRefreshResources?: () => void
  onEditAppSet?: (node: TopologyNode) => void
  onEditYaml?: (node: TopologyNode, highlightEditorPath?: string) => void
  onViewLogs?: (node: TopologyNode) => void
  onSyncResources?: (node: TopologyNode) => void
  onLaunchArgo?: (node: TopologyNode) => void
}

interface TopologyViewComponentsProps {
  controller: Controller
  topologyProps: TopologyProps
}

export const TopologyViewComponents: React.FC<TopologyViewComponentsProps> = ({ controller, topologyProps }) => {
  const { t } = useTranslation()
  const {
    processActionLink,
    argoAppDetailsContainerControl,
    clusterDetailsContainerControl,
    setDrawerContent,
    elements,
    nodeDetailsProvider,
    hubClusterName,
    alerts,
    currentAlertsKey,
    isAnalyzing,
    isProcessingSave,
    processingSaveStart,
    onClearProcessingSave,
    onEditAppSet,
    onEditYaml,
    onViewLogs,
    onSyncResources,
    onLaunchArgo,
  } = topologyProps
  const [selectedIds, setSelectedIds] = useState<string[]>()

  const hasGraph = controller.hasGraph()

  useEffect(() => {
    if (hasGraph) {
      controller.getGraph().layout()
    }
  }, [hasGraph, controller])

  useEventListener<SelectionEventListener>(SELECTION_EVENT, (ids) => {
    setSelectedIds(ids)
    const selectedNodeId = head(ids)
    const getLayoutNodes = () => {
      return controller
        .getElements()
        .filter((n) => isNode(n))
        .map((n) => {
          return n.getData()
        })
    }
    setDrawerContent(
      selectedNodeId ? t('Details') : '',
      false, // inline
      true, // resizable
      true, // no drawerhead
      true, // no padding for drawerpanelbody
      selectedNodeId ? (
        <DetailsView
          getLayoutNodes={getLayoutNodes}
          selectedNodeId={selectedNodeId}
          processActionLink={processActionLink}
          nodes={elements.nodes}
          clusterDetailsContainerControl={clusterDetailsContainerControl}
          argoAppDetailsContainerControl={argoAppDetailsContainerControl}
          activeFilters={{}}
          nodeDetailsProvider={nodeDetailsProvider}
          t={t}
          hubClusterName={hubClusterName}
          onEditYaml={onEditYaml}
          onViewLogs={onViewLogs}
        />
      ) : undefined,
      !selectedNodeId
    )
  })

  const handleSurfaceClick = useCallback(() => {
    setSelectedIds([])
    setDrawerContent('Close', false, true, true, true, undefined, true)
  }, [setDrawerContent])

  const alertsTitlesKey = useMemo(() => getAlertsTitlesKey(alerts), [alerts])
  const alertsKeyAtProcessingStartRef = useRef<string>()
  const prevIsProcessingSaveRef = useRef(false)

  useEffect(() => {
    if (isProcessingSave && !prevIsProcessingSaveRef.current) {
      alertsKeyAtProcessingStartRef.current = alertsTitlesKey
    }
    if (!isProcessingSave) {
      alertsKeyAtProcessingStartRef.current = undefined
    }
    prevIsProcessingSaveRef.current = !!isProcessingSave
  }, [isProcessingSave, alertsTitlesKey])

  useEffect(() => {
    if (!isProcessingSave || !onClearProcessingSave) {
      return
    }

    const savedAlertsKey = alertsKeyAtProcessingStartRef.current
    const alertsKeyChanged = savedAlertsKey !== undefined && alertsTitlesKey !== savedAlertsKey

    if (alertsKeyChanged) {
      onClearProcessingSave()
    }
  }, [isProcessingSave, alertsTitlesKey, onClearProcessingSave])

  useEffect(() => {
    if (!isProcessingSave || processingSaveStart === undefined || !onClearProcessingSave) {
      return
    }

    const remaining = processingSaveStart + PROCESSING_SAVE_TIMEOUT_MS - Date.now()
    if (remaining <= 0) {
      onClearProcessingSave()
      return
    }

    const timer = setTimeout(() => {
      onClearProcessingSave()
    }, remaining)

    return () => clearTimeout(timer)
  }, [isProcessingSave, processingSaveStart, onClearProcessingSave])

  const showAlerts = (alerts && alerts.length > 0) || isProcessingSave || isAnalyzing

  return (
    <TopologyView controlBar={<TopologyZoomBar />} contextToolbar={<TopologyToolbar {...topologyProps} />}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleSurfaceClick}
        onDoubleClickCapture={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        onKeyDown={() => {}}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        {showAlerts && (
          <TopologyAlerts
            alerts={alerts ?? []}
            currentAlertsKey={currentAlertsKey ?? '[]'}
            isAnalyzing={isAnalyzing}
            isProcessingSave={isProcessingSave}
            onEditAppSet={onEditAppSet}
            onEditYaml={onEditYaml}
            onViewLogs={onViewLogs}
            onSyncResources={onSyncResources}
            onLaunchArgo={onLaunchArgo}
          />
        )}
        <VisualizationSurface state={{ selectedIds }} />
      </div>
    </TopologyView>
  )
}

export const Topology = (props: TopologyProps) => {
  const { onRefreshResources } = props
  const topologyRefreshValue = useMemo(() => ({ refreshResources: onRefreshResources }), [onRefreshResources])
  const controllerRef = useRef<Controller>()
  let controller = controllerRef.current
  if (!controller) {
    controller = controllerRef.current = new Visualization()
    controller.registerLayoutFactory(layoutFactory)
    controller.registerComponentFactory(componentFactory)
  }

  const nodesKey = JSON.stringify(
    props.elements.nodes
      .map((node: any) => ({
        id: node.id,
        name: node.name,
        pulse: node.specs?.pulse,
      }))
      .sort((a: any, b: any) => a.id.localeCompare(b.id))
  )
  useEffect(() => {
    if (props.elements.nodes.length > 0) {
      // this creates the StyledNodes and StyledEdges from the props.elements
      // when called a second time, Nodes and Edges are added removed
      controller.fromModel(getLayoutModel(props.elements))
      controller.getGraph()?.layout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, nodesKey])

  return (
    <TopologyRefreshContext.Provider value={topologyRefreshValue}>
      <VisualizationProvider controller={controller}>
        <NodeIcons />
        <NodeStatusIcons />
        {!props.canUpdateStatuses && (
          <svg width="0" height="0">
            <symbol className="spinner" viewBox="0 0 40 40" id="nodeStatusIcon_spinner">
              <circle cx="20" cy="20" r="18" fill="white"></circle>
              <circle className="swirly" cx="20" cy="20" r="18"></circle>
            </symbol>
          </svg>
        )}
        <TopologyViewComponents controller={controller} topologyProps={props} />
      </VisualizationProvider>
    </TopologyRefreshContext.Provider>
  )
}
