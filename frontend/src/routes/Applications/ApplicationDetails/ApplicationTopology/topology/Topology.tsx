/* Copyright Contributors to the Open Cluster Management project */
import { useState, useRef, useEffect } from 'react'
import { action } from 'mobx'
import head from 'lodash/head'
import { useTranslation } from '../../../../../lib/acm-i18next'
import {
  TopologyView,
  TopologyControlBar,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  VisualizationSurface,
  SELECTION_EVENT,
  SelectionEventListener,
  useEventListener,
  Controller,
  Visualization,
  VisualizationProvider,
  isNode,
} from '@patternfly/react-topology'
import { ToolbarItem, Split, SplitItem, Alert, Button } from '@patternfly/react-core'
import layoutFactory from './layout/layoutFactory'
import getLayoutModel from './layout/layoutModel'
import '@patternfly/patternfly/patternfly.css'
import '@patternfly/patternfly/patternfly-addons.css'
import componentFactory from './components/componentFactory'
import { NodeIcons } from './components/nodeIcons'
import { NodeStatusIcons } from './components/nodeStatusIcons'
import LegendView from '../components/LegendView'
import DetailsView from '../components/DetailsView'
import { ArgoAppDetailsContainerData, ClusterDetailsContainerData } from '../ApplicationTopology'
import ChannelControl from '../components/ChannelControl'
import noop from 'lodash/noop'

import './components/future/topology-components.css'
import './components/future/topology-controlbar.css'
import './components/future/topology-view.css'
import { NavigationPath } from '../../../../../NavigationPath'
import { querySearchDisabledManagedClusters } from '../../../../../lib/search'
import { useQuery } from '../../../../../lib/useQuery'

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
  options: any
  setDrawerContent: (
    title: string,
    isInline: boolean,
    isResizable: boolean,
    disableDrawerHead: boolean,
    drawerPanelBodyHasNoPadding: boolean,
    panelContent: React.ReactNode | React.ReactNode[],
    closeDrawer: boolean
  ) => void
  canUpdateStatuses?: boolean
  disableRenderConstraint?: boolean
  processActionLink?: (resource: any, toggleLoading: boolean, hubClusterName: string) => void
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
    channelControl,
    setDrawerContent,
    options,
    elements,
    hubClusterName,
  } = topologyProps
  const [selectedIds, setSelectedIds] = useState<string[]>()
  const [isSearchDisabled, setIsSearchDisabled] = useState<boolean>(false)
  const clusterNodes = elements.nodes.filter((node) => node.type === 'cluster')
  const clusterNames = clusterNodes.map((clusterNode) => clusterNode.name)
  const { data, startPolling } = useQuery(querySearchDisabledManagedClusters)

  useEffect(startPolling, [startPolling])
  useEffect(() => {
    const clustersWithSearchDisabled = data?.[0]?.data?.searchResult?.[0]?.items || []
    const clusterWithDisabledSearch = clustersWithSearchDisabled.map((item: { name: string }) => item.name)
    const found = clusterNames.some((r) => clusterWithDisabledSearch.includes(r))
    if (found) {
      setIsSearchDisabled(true)
    }
  }, [data, clusterNames])

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
          options={options}
          getLayoutNodes={getLayoutNodes}
          selectedNodeId={selectedNodeId}
          processActionLink={processActionLink}
          nodes={elements.nodes}
          clusterDetailsContainerControl={clusterDetailsContainerControl}
          argoAppDetailsContainerControl={argoAppDetailsContainerControl}
          activeFilters={{}}
          t={t}
          hubClusterName={hubClusterName}
        />
      ) : undefined,
      !selectedNodeId
    )
  })

  const channelChanger = (
    <Split>
      <SplitItem>
        {channelControl?.allChannels?.length > 1 && (
          <ChannelControl channelControl={channelControl} t={t} setDrawerContent={setDrawerContent} />
        )}
      </SplitItem>
    </Split>
  )

  const viewToolbar = (
    <>
      <ToolbarItem>{channelChanger}</ToolbarItem>
      {isSearchDisabled && (
        <Alert
          variant="warning"
          title={t(
            'Currently, search is disabled on some of your managed clusters. Some data might be missing from the topology view.'
          )}
        >
          <Button
            variant="link"
            className={'abc'}
            style={{ padding: '0' }}
            onClick={() =>
              window.open(
                `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20addon%3Asearch-collector%3Dfalse%20name%3A!${hubClusterName}"}`,
                '_blank'
              )
            }
          >
            {t('View clusters with search add-on disabled.')}
          </Button>
        </Alert>
      )}

      <div style={{ position: 'absolute', right: '30px' }}>
        <ToolbarItem style={{ marginLeft: 'auto', marginRight: 0 }}>
          <div className="diagram-title">
            <span
              className="how-to-read-text"
              tabIndex={0}
              onClick={() => {
                setDrawerContent(t('How to read topology'), false, false, false, false, <LegendView t={t} />, false)
              }}
              onKeyPress={noop}
              role="button"
            >
              {t('How to read topology')}
              <svg className="how-to-read-icon">
                <use href={'#drawerShapes__sidecar'} />
              </svg>
            </span>
          </div>
        </ToolbarItem>
      </div>
    </>
  )

  return (
    <TopologyView
      className="app-topology-view"
      controlBar={
        <TopologyControlBar
          controlButtons={createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            zoomInTip: t('Zoom In'),
            zoomInAriaLabel: t('Zoom In'),
            zoomInCallback: action(() => {
              controller.getGraph().scaleBy(4 / 3)
            }),
            zoomOutTip: t('Zoom Out'),
            zoomOutAriaLabel: t('Zoom Out'),
            zoomOutCallback: action(() => {
              controller.getGraph().scaleBy(0.75)
            }),
            fitToScreenTip: t('Fit to Screen'),
            fitToScreenAriaLabel: t('Fit to Screen'),
            fitToScreenCallback: action(() => {
              controller.getGraph().fit(160)
            }),
            resetViewTip: t('Reset View'),
            resetViewAriaLabel: t('Reset View'),
            resetViewCallback: action(() => {
              controller.getGraph().reset()
              controller.getGraph().layout()
            }),
            legend: false,
          })}
        />
      }
      viewToolbar={viewToolbar}
    >
      <VisualizationSurface state={{ selectedIds }} />
    </TopologyView>
  )
}

export const Topology = (props: TopologyProps) => {
  const controllerRef = useRef<Controller>()
  let controller = controllerRef.current
  if (!controller) {
    controller = controllerRef.current = new Visualization()
    controller.registerLayoutFactory(layoutFactory)
    controller.registerComponentFactory(componentFactory)
  }
  controller.fromModel(getLayoutModel(props.elements))
  // 4.86 controller.setRenderConstraint(!props.disableRenderConstraint) // for testing

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
