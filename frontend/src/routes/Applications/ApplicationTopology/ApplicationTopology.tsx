/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlert } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './ApplicationTopology.css'
import './Topology/css/topology-controls.css'
import './Topology/css/resource-toolbar.css'
// import { useHistory } from 'react-router-dom'
// import { useRecoilState } from 'recoil'
// import { applicationsState } from '../../../atoms'


import Topology from './Topology/Topology'
import { processResourceActionLink } from './Topology/utils/diagram-helpers'


import nodes from './demo-etherpad-nodes.json'
import links from './demo-etherpad-links.json'

const portals = {
    assortedFilterOpenBtn: 'assorted-filter-open-portal-id',
    assortedFilterCloseBtns: 'assorted-filter-close-portal-id',
    typeFilterBar: 'type-filter-bar-portal-id',
    searchTextbox: 'search-textbox-portal-id',
}

export type ArgoAppDetailsContainerData = {
    page: number
    startIdx: number
    argoAppSearchToggle: boolean
    expandSectionToggleMap: Set<number>
    selected: undefined
    selectedArgoAppList: []
    isLoading: boolean
}

export default function ApplicationTopology() {
    const { t } = useTranslation('topology')
    //const [placementrules] = useRecoilState(placementRulesState)
    const [isLoaded, setIsLoaded] = useState<boolean>()
    const [isLoadError, setIsLoadError] = useState<boolean>()
    const [isFailed, setIsFailed] = useState<boolean>()
    const [isReloading, setIsReloading] = useState<boolean>()
    const [allChannels, setAllChannels] = useState<[]>()
    const [activeChannel, setActiveChannel] = useState<string>()
    const [isChangingChannel, setIsChangingChannel] = useState<boolean>()
    const [showLegendView, setShowLegendView] = useState<boolean>()
    const [argoAppDetailsContainerData, setArgoAppDetailsContainerData] = useState<ArgoAppDetailsContainerData>({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
    })

    const handleErrorMsg = () => {
        //show toast message in parent container
    }

    const changeTheChannel = (fetchChannel: string) => {
        setIsChangingChannel(true)
        setActiveChannel(fetchChannel)
        //this.props.fetchAppTopology(fetchChannel)
    }

    const renderTopology = () => {
        const fetchControl = {
            isLoaded,
            isFailed,
            isReloading,
        }
        const channelControl = {
            allChannels,
            activeChannel: activeChannel,
            isChangingChannel,
            changeTheChannel,
        }
        const argoAppDetailsContainerControl = {
            argoAppDetailsContainerData,
            handleArgoAppDetailsContainerUpdate: setArgoAppDetailsContainerData,
            handleErrorMsg,
        }

        const processActionLink = (resource: any, toggleLoading: boolean) => {
            processResourceActionLink(resource, toggleLoading, handleErrorMsg)
        }

        //const history = useHistory()

        return (
            <Topology
                links={links}
                nodes={nodes}
                portals={portals}
                processActionLink={processActionLink}
                fetchControl={fetchControl}
                channelControl={channelControl}
                // searchUrl={
                //     config.contextPath ? config.contextPath.replace(new RegExp('/applications$'), '/search') : ''
                // }
                showLegendView={showLegendView}
                handleLegendClose={() => setShowLegendView(false)}
                argoAppDetailsContainerControl={argoAppDetailsContainerControl}
                t={t}
            />
        )
    }

    return (
        <PageSection>
            <div className='resourceDiagramSourceContainer'>
            <>
                <>
                    <div className="topology-controls">
                        <div className="topology-control-container">
                            <div id={portals.searchTextbox} />
                        </div>
                    </div>
                    <div id="resource-toolbar" className="resource-toolbar">
                        <div className="resource-toolbar-container">
                            <div className="resource-toolbar-buttons">
                                <div id={portals.assortedFilterOpenBtn} />
                            </div>
                            <div id={portals.assortedFilterCloseBtns} />
                        </div>
                    </div>
                </>
                <div className="resourceDiagramControlsContainer">
                    {!isLoadError && (
                        <div className="diagram-title">
                            <span
                                className="how-to-read-text"
                                tabIndex={0}
                                onClick={() => setShowLegendView(true)}
                                onKeyPress={() => {
                                    // noop function
                                }}
                                role="button"
                            >
                                {t('application.diagram.how.to.read')}
                                <svg className="how-to-read-icon">
                                    <use href={'#diagramIcons_sidecar'} />
                                </svg>
                            </span>
                        </div>
                    )}
                    <>{!isLoadError && renderTopology()}</>
                </div>
                {isLoadError && (
                    <AcmAlert
                        title={t('error.load.resource')}
                        subtitle={t('error.load.topology')}
                        variant="danger"
                        isInline
                    />
                )}
            </>
            </div>
        </PageSection>
    )
}

// import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
// import { withRouter } from 'react-router-dom'
// import { connect } from 'react-redux'
// import { withLocale } from '../../providers/LocaleProvider'
// import {
//   getActiveChannel,
//   getDiagramElements
// } from './definitions/hcm-application-diagram'
// import { fetchTopology } from '../../actions/topology'
// import { processResourceActionLink } from './utils/diagram-helpers'
// import {
//   DIAGRAM_QUERY_COOKIE,
//   LOCAL_HUB_NAME
// } from '../../../lib/shared/constants'
// import { AcmAlert } from '@open-cluster-management/ui-components'
// import {
//   TOPOLOGY_SET_ACTIVE_FILTERS,
//   DIAGRAM_RESTORE_FILTERS,
//   DIAGRAM_SAVE_FILTERS,
//   REQUEST_STATUS
// } from '../../actions'
// import resources from '../../../lib/shared/resources'
// import { Topology } from '.'
// import config from '../../../lib/shared/config'
// import _ from 'lodash'

// resources(() => {
//   require('./style.css')
//   require('./css/topology-controls.css')
//   require('./css/resource-toolbar.css')
// })

// // set up Topology component
// const portals = {
//   assortedFilterOpenBtn: 'assorted-filter-open-portal-id',
//   assortedFilterCloseBtns: 'assorted-filter-close-portal-id',
//   typeFilterBar: 'type-filter-bar-portal-id',
//   searchTextbox: 'search-textbox-portal-id'
// }

// const options = {
//   filtering: 'application',
//   layout: 'application',
//   showLineLabels: true, // show labels on lines
//   showGroupTitles: false // show titles over sections
// }

// class ApplicationTopologyModule extends React.Component {
//   static propTypes = {
//     activeChannel: PropTypes.string,
//     channels: PropTypes.array,
//     clusters: PropTypes.array,
//     detailsLoaded: PropTypes.bool,
//     detailsReloading: PropTypes.bool,
//     diagramFilters: PropTypes.array,
//     fetchAppTopology: PropTypes.func,
//     fetchError: PropTypes.object,
//     handleErrorMsg: PropTypes.func,
//     links: PropTypes.array,
//     locale: PropTypes.string,
//     nodes: PropTypes.array,
//     params: PropTypes.object,
//     resetFilters: PropTypes.func,
//     restoreSavedDiagramFilters: PropTypes.func,
//     storedVersion: PropTypes.bool,
//     topologyLoadError: PropTypes.bool,
//     topologyLoaded: PropTypes.bool,
//     topologyReloading: PropTypes.bool,
//     willLoadDetails: PropTypes.bool
//   };

//   constructor(props) {
//     super(props)
//     this.state = {
//       links: [],
//       nodes: [],
//       activeChannel: undefined,
//       showSpinner: false,
//       lastTimeUpdate: undefined,
//       userChanges: false /* eslint-disable-line react/no-unused-state */,
//       exceptions: [],
//       updateMessage: '',
//       topologyLoaded: false,
//       selectedNode: undefined,
//       showLegendView: false,
//       argoAppDetailsContainerData: {
//         page: 1,
//         startIdx: 0,
//         argoAppSearchToggle: false,
//         expandSectionToggleMap: new Set(),
//         selected: undefined,
//         selectedArgoAppList: [],
//         isLoading: false
//       }
//     }
//   }

//   UNSAFE_componentWillMount() {
//     const { restoreSavedDiagramFilters, resetFilters, params } = this.props
//     restoreSavedDiagramFilters()
//     resetFilters()
//     const name = decodeURIComponent(params.name)
//     const namespace = decodeURIComponent(params.namespace)
//     const localStoreKey = `${DIAGRAM_QUERY_COOKIE}\\${namespace}\\${name}`
//     const activeChannel = getActiveChannel(localStoreKey)
//     this.props.fetchAppTopology(activeChannel)
//     this.setState({ activeChannel })
//   }

//   UNSAFE_componentWillReceiveProps(nextProps) {
//     this.setState(prevState => {
//       const { locale } = this.props
//       const links = _.cloneDeep(nextProps.links || [])
//       const nodes = _.cloneDeep(nextProps.nodes || [])
//       const clusters = _.cloneDeep(nextProps.clusters || [])
//       const diagramFilters = _.cloneDeep(nextProps.diagramFilters || [])

//       // update loading spinner
//       const {
//         topologyReloading,
//         willLoadDetails,
//         detailsLoaded,
//         detailsReloading,
//         storedVersion,
//         fetchError
//       } = nextProps

//       const showSpinner =
//         !fetchError &&
//         (topologyReloading ||
//           willLoadDetails ||
//           !detailsLoaded ||
//           detailsReloading ||
//           storedVersion)

//       // update last time refreshed
//       const { changingChannel } = prevState
//       let lastTimeUpdate = prevState.lastTimeUpdate

//       if (
//         changingChannel ||
//         (!showSpinner && prevState.showSpinner) ||
//         (!lastTimeUpdate && nextProps.topologyLoaded)
//       ) {
//         const time = new Date().toLocaleTimeString(locale)
//         lastTimeUpdate = t(
//           'application.diagram.view.last.time',
//           [time],
//           locale
//         )
//       }

//       return {
//         clusters,
//         links,
//         nodes,
//         diagramFilters,
//         changingChannel: false,
//         showSpinner,
//         lastTimeUpdate,
//         topologyLoaded: nextProps.topologyLoaded,
//         topologyLoadError: nextProps.topologyLoadError
//       }
//     })
//   }

//   shouldComponentUpdate(nextProps, nextState) {
//     if (
//       _.get(nextProps, 'HCMApplicationList.status', '') ===
//         REQUEST_STATUS.DONE ||
//       _.get(nextProps, 'HCMApplicationList.status', '') === REQUEST_STATUS.ERROR
//     ) {
//       return true //always update when search is done
//     }
//     if (
//       nextProps.activeChannel !== undefined &&
//       nextState.activeChannel !== undefined &&
//       nextProps.activeChannel !== nextState.activeChannel
//     ) {
//       return false
//     }

//     const isDiagramChanged =
//       !_.isEqual(
//         this.state.nodes.map(n => n.uid),
//         nextState.nodes.map(n => n.uid)
//       ) ||
//       !_.isEqual(
//         this.state.links.map(n => n.uid),
//         nextState.links.map(n => n.uid)
//       ) ||
//       !_.isEqual(this.state.diagramFilters, nextState.diagramFilters)

//     const loadedInfoChanged =
//       this.props.topologyLoaded !== nextProps.topologyLoaded ||
//       this.props.detailsLoaded !== nextProps.detailsLoaded ||
//       this.props.detailsReloading !== nextProps.detailsReloading ||
//       this.state.topologyLoadError !== nextState.topologyLoadError

//     const channelInfoChanged =
//       this.state.activeChannel !== nextState.activeChannel ||
//       this.props.storedVersion !== nextProps.storedVersion ||
//       !_.isEqual(this.props.channels, nextProps.channels)

//     const genericChange =
//       !_.isEqual(this.state.exceptions, nextState.exceptions) ||
//       this.state.updateMessage !== nextState.updateMessage ||
//       this.state.showSpinner !== nextState.showSpinner ||
//       this.state.showLegendView !== nextState.showLegendView

//     return (
//       isDiagramChanged ||
//       loadedInfoChanged ||
//       channelInfoChanged ||
//       genericChange
//     )
//   }

//   setContainerRef = container => {
//     this.containerRef = container
//   };

//   setViewer = viewer => {
//     this.viewer = viewer
//   };

//   getViewer = () => this.viewer;
//   handleTopologyErrorClosed = () => this.setState({ topologyLoadError: false });
//   handleUpdateMessageClosed = () => this.setState({ updateMessage: '' });

//   render() {
//     const { channels, locale, handleErrorMsg } = this.props
//     const {
//       nodes,
//       links,
//       selectedNode,
//       topologyLoadError,
//       activeChannel,
//       showLegendView,
//       topologyLoaded,
//       showSpinner,
//       changingChannel,
//       argoAppDetailsContainerData
//     } = this.state

//     const diagramTitle = t('application.diagram')

//     const isLoadError = topologyLoadError
//     const diagramClasses = classNames({
//       resourceDiagramSourceContainer: true,
//       showExpandedTopology: false
//     })
//     const argoAppDetailsContainerControl = {
//       argoAppDetailsContainerData,
//       handleArgoAppDetailsContainerUpdate: this
//         .handleArgoAppDetailsContainerUpdate,
//       handleErrorMsg
//     }
//     const renderTopology = () => {
//       const fetchControl = {
//         isLoaded: topologyLoaded,
//         isFailed: isLoadError,
//         isReloading: showSpinner
//       }
//       const channelControl = {
//         allChannels: channels,
//         activeChannel: activeChannel,
//         isChangingChannel: changingChannel,
//         changeTheChannel: this.changeTheChannel.bind(this)
//       }
//       const selectionControl = {
//         selectedNode
//       }
//       options.scrollOnScroll = true
//       return (
//         <Topology
//           links={links}
//           nodes={nodes}
//           options={options}
//           portals={portals}
//           selectionControl={selectionControl}
//           processActionLink={this.processActionLink.bind(this)}
//           fetchControl={fetchControl}
//           channelControl={channelControl}
//           searchUrl={
//             config.contextPath
//               ? config.contextPath.replace(
//                 new RegExp('/applications$'),
//                 '/search'
//               )
//               : ''
//           }
//           locale={locale}
//           showLegendView={showLegendView}
//           handleLegendClose={this.handleLegendClose.bind(this)}
//           argoAppDetailsContainerControl={argoAppDetailsContainerControl}
//         />
//       )
//     }

//     const renderDiagramView = () => {
//       return (
//         <React.Fragment>
//           <React.Fragment>
//             <div className="topology-controls">
//               <div className="topology-control-container">
//                 <div id={portals.searchTextbox} />
//               </div>
//             </div>
//             <div id="resource-toolbar" className="resource-toolbar">
//               <div className="resource-toolbar-container">
//                 <div className="resource-toolbar-buttons">
//                   <div id={portals.assortedFilterOpenBtn} />
//                 </div>
//                 <div id={portals.assortedFilterCloseBtns} />
//               </div>
//             </div>
//           </React.Fragment>
//           <div className="resourceDiagramControlsContainer">
//             {!isLoadError && (
//               <div className="diagram-title">
//                 {diagramTitle}
//                 <svg className="diagram-title-divider">
//                   <rect />
//                 </svg>
//                 <span
//                   className="how-to-read-text"
//                   tabIndex="0"
//                   onClick={() => {
//                     this.setState({ showLegendView: true })
//                   }}
//                   onKeyPress={() => {
//                     // noop function
//                   }}
//                   role="button"
//                 >
//                   {t(
//                     'application.diagram.how.to.read',
//                     this.context.locale
//                   )}
//                   <svg className="how-to-read-icon">
//                     <use href={'#diagramIcons_sidecar'} />
//                   </svg>
//                 </span>
//               </div>
//             )}
//             <React.Fragment>{!isLoadError && renderTopology()}</React.Fragment>
//           </div>
//           {isLoadError && (
//             <AcmAlert
//               title={t('error.load.resource', this.context.locale)}
//               subtitle={t('error.load.topology', this.context.locale)}
//               variant="danger"
//               onClick={this.handleTopologyErrorClosed}
//               isInline
//             />
//           )}
//         </React.Fragment>
//       )
//     }

//     return (
//       <div className={diagramClasses} ref={this.setContainerRef}>
//         {renderDiagramView()}
//       </div>
//     )
//   }

//   changeTheChannel(fetchChannel) {
//     this.setState({ changingChannel: true, activeChannel: fetchChannel })
//     this.props.fetchAppTopology(fetchChannel)
//   }

//   processActionLink = (resource, toggleLoading) => {
//     const { handleErrorMsg } = this.props
//     processResourceActionLink(resource, toggleLoading, handleErrorMsg)
//   };

//   handleLegendClose = () => {
//     this.setState({ showLegendView: false })
//   };

//   handleArgoAppDetailsContainerUpdate = (
//     page,
//     startIdx,
//     argoAppSearchToggle,
//     expandSectionToggleMap,
//     selected,
//     selectedArgoAppList,
//     isLoading
//   ) => {
//     this.setState({
//       argoAppDetailsContainerData: {
//         page,
//         startIdx,
//         argoAppSearchToggle,
//         expandSectionToggleMap,
//         selected,
//         selectedArgoAppList,
//         isLoading
//       }
//     })
//   };
// }

// const mapStateToProps = (state, ownProps) => {
//   const { params } = ownProps
//   const { HCMApplicationList } = state
//   const name = decodeURIComponent(params.name)
//   const namespace = decodeURIComponent(params.namespace)
//   let { topology } = state

//   if (!topology) {
//     topology = {
//       activeFilters: {},
//       fetchFilters: null,
//       fetchError: null,
//       diagramFilters: []
//     }
//   }
//   if (topology && topology.status === 'CLUSTER_OFFLINE') {
//     topology = {
//       activeFilters: {},
//       fetchFilters: null,
//       fetchError: null,
//       diagramFilters: [],
//       detailsLoaded: true,
//       loaded: true
//     }
//   }
//   const {
//     activeFilters,
//     fetchFilters,
//     fetchError,
//     diagramFilters = []
//   } = topology

//   let localStoreKey = `${DIAGRAM_QUERY_COOKIE}\\${namespace}\\${name}`
//   const fetchApplication = _.get(topology, 'fetchFilters.application')
//   if (fetchApplication) {
//     localStoreKey = `${DIAGRAM_QUERY_COOKIE}\\${fetchApplication.namespace}\\${
//       fetchApplication.name
//     }`
//   }
//   const diagramElements = getDiagramElements(
//     topology,
//     localStoreKey,
//     name,
//     namespace,
//     HCMApplicationList
//   )

//   return {
//     ...diagramElements,
//     activeFilters,
//     fetchFilters,
//     fetchError,
//     diagramFilters,
//     HCMApplicationList
//   }
// }

// const mapDispatchToProps = (dispatch, ownProps) => {
//   const { params: { namespace, name }, location: { search } } = ownProps
//   const searchItems = search ? new URLSearchParams(search) : undefined
//   let cluster = LOCAL_HUB_NAME
//   let apiVersion = 'app.k8s.io/v1beta1'
//   if (searchItems && searchItems.get('apiVersion')) {
//     apiVersion = searchItems.get('apiVersion')
//   }
//   if (searchItems && searchItems.get('cluster')) {
//     cluster = searchItems.get('cluster')
//   }
//   return {
//     resetFilters: () => {
//       dispatch({
//         type: TOPOLOGY_SET_ACTIVE_FILTERS,
//         activeFilters: {}
//       })
//     },
//     fetchAppTopology: (fetchChannel, reloading) => {
//       const fetchFilters = {
//         application: {
//           name,
//           namespace,
//           channel: fetchChannel,
//           apiVersion,
//           cluster
//         }
//       }
//       dispatch(
//         fetchTopology({ filter: { ...fetchFilters } }, fetchFilters, reloading)
//       )
//     },
//     restoreSavedDiagramFilters: () => {
//       dispatch({
//         type: DIAGRAM_RESTORE_FILTERS,
//         namespace,
//         name,
//         initialDiagramFilters: []
//       })
//     },
//     onDiagramFilterChange: (filterType, diagramFilters) => {
//       dispatch({
//         type: DIAGRAM_SAVE_FILTERS,
//         namespace,
//         name,
//         diagramFilters
//       })
//     }
//   }
// }

// export default withRouter(
//   connect(mapStateToProps, mapDispatchToProps)(
//     withLocale(ApplicationTopologyModule)
//   )
// )
