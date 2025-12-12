/* Copyright Contributors to the Open Cluster Management project */
import { useState, useRef } from 'react'
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
import { TopologyContext, useTopologyContextValue } from './components/TopologyContext'

import { ArgoAppDetailsContainerData, ClusterDetailsContainerData } from '../ApplicationTopology'
import TopologyZoomBar from './components/TopologyZoomBar'
import TopologyToolbar from './components/TopologyToolbar'

import './css/topology-components.css'
import './css/topology-view.css'
import { TFunction } from 'react-i18next'

export interface TopologyProps {
  elements: {
    activeChannel?: string
    channels?: string[]
    nodes: any[]
    links: any[]
  }
  channelControl: {
    allChannels: string[]
    activeChannel: string | undefined
    setActiveChannel: (channel: string) => void
  }
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
  } = topologyProps
  const [selectedIds, setSelectedIds] = useState<string[]>()
  const topologyOptions = useTopologyContextValue()

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
        />
      ) : undefined,
      !selectedNodeId
    )
  })

  return (
    <TopologyContext.Provider value={{ ...topologyOptions }}>
      <TopologyView controlBar={<TopologyZoomBar />} contextToolbar={<TopologyToolbar {...topologyProps} />}>
        <VisualizationSurface state={{ selectedIds }} />
      </TopologyView>
    </TopologyContext.Provider>
  )
}

export const Topology = (props: TopologyProps) => {
  const controllerRef = useRef<Controller>()
  let controller = controllerRef.current
  const nodeIds = props.elements.nodes.map((node) => node.id).join(',')
  const currentNodeIds = useRef<string>()
  if (!controller || currentNodeIds.current !== nodeIds) {
    controller = controllerRef.current = new Visualization()
    controller.registerLayoutFactory(layoutFactory)
    controller.registerComponentFactory(componentFactory)
    currentNodeIds.current = nodeIds
  }
  controller.fromModel(getLayoutModel(props.elements))

  return (
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
  )
}
