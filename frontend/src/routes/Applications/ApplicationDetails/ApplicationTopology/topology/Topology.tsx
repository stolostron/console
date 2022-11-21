/* Copyright Contributors to the Open Cluster Management project */
import { useState, useRef } from 'react'
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
import { ToolbarItem, Split, SplitItem } from '@patternfly/react-core'
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
    processActionLink?: (resource: any, toggleLoading: boolean) => void
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
    } = topologyProps
    const [selectedIds, setSelectedIds] = useState<string[]>()

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

        selectedNodeId
            ? setDrawerContent(
                  t('Details'),
                  false, // inline
                  true, // resizable
                  true, // no drawerhead
                  true, // no padding for drawerpanelbody
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
                  />,
                  false
              )
            : setDrawerContent('Close', false, true, true, true, undefined, true)
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
            <div style={{ position: 'absolute', right: '30px' }}>
                <ToolbarItem style={{ marginLeft: 'auto', marginRight: 0 }}>
                    <div className="diagram-title">
                        <span
                            className="how-to-read-text"
                            tabIndex={0}
                            onClick={() => {
                                setDrawerContent(
                                    t('How to read topology'),
                                    false,
                                    false,
                                    false,
                                    false,
                                    <LegendView t={t} />,
                                    false
                                )
                            }}
                            onKeyPress={() => {
                                // noop function
                            }}
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
            controlBar={
                <TopologyControlBar
                    controlButtons={createTopologyControlButtons({
                        ...defaultControlButtonsOptions,
                        zoomInCallback: action(() => {
                            controller.getGraph().scaleBy(4 / 3)
                        }),
                        zoomOutCallback: action(() => {
                            controller.getGraph().scaleBy(0.75)
                        }),
                        fitToScreenCallback: action(() => {
                            controller.getGraph().fit(80)
                        }),
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
