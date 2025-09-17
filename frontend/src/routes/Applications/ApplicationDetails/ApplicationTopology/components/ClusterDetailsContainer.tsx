/* Copyright Contributors to the Open Cluster Management project */

import React, { Component, KeyboardEvent, SyntheticEvent } from 'react'
import {
  Pagination,
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionToggle,
  SelectOption,
} from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant } from '../../../../../components/AcmSelectBase'
import { processResourceActionLink, getPercentage, inflateKubeValue } from '../helpers/diagram-helpers'
import AcmTimestamp from '../../../../../lib/AcmTimestamp'
import {
  ClusterDetailsContainerProps,
  ClusterDetailsContainerState,
  ClusterData,
  ClusterStatusIcon,
  ResourceAction,
  TranslationFunction,
} from '../model/types'

/**
 * ClusterDetailsContainer component displays detailed information about clusters
 * in a paginated, searchable accordion format. It allows users to:
 * - Search and filter clusters using a typeahead select
 * - View cluster details including status, resources (CPU/Memory), and console links
 * - Navigate through clusters using pagination
 * - Expand/collapse individual cluster details
 */
class ClusterDetailsContainer extends Component<ClusterDetailsContainerProps, ClusterDetailsContainerState> {
  /**
   * Constructor initializes the component state based on props and existing container data.
   * If the current cluster ID matches the props cluster ID, it restores the previous state.
   * Otherwise, it resets the state for a new cluster selection.
   */
  constructor(props: ClusterDetailsContainerProps) {
    super(props)

    const currentClusterID = props.clusterDetailsContainerControl.clusterDetailsContainerData.clusterID

    if (currentClusterID === props.clusterID) {
      // Restore previous state for the same cluster
      this.state = {
        clusterList: props.clusterList,
        t: props.t,
        selected: props.clusterDetailsContainerControl.clusterDetailsContainerData.selected,
        page: props.clusterDetailsContainerControl.clusterDetailsContainerData.page,
        perPage: 5,
        startIdx: props.clusterDetailsContainerControl.clusterDetailsContainerData.startIdx,
        clusterSearchToggle: props.clusterDetailsContainerControl.clusterDetailsContainerData.clusterSearchToggle,
        expandSectionToggleMap: props.clusterDetailsContainerControl.clusterDetailsContainerData.expandSectionToggleMap,
        selectedClusterList: props.clusterDetailsContainerControl.clusterDetailsContainerData.selectedClusterList,
      }
    } else {
      // Reset state for a different cluster node selection
      const {
        clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
      } = props

      handleClusterDetailsContainerUpdate({
        page: 1,
        startIdx: 0,
        clusterSearchToggle: false,
        expandSectionToggleMap: new Set(),
        clusterID: props.clusterID,
        selected: undefined,
        selectedClusterList: [],
      })

      this.state = {
        clusterList: props.clusterList,
        t: props.t,
        selected: undefined,
        page: 1,
        perPage: 5,
        startIdx: 0,
        clusterSearchToggle: false,
        expandSectionToggleMap: new Set(),
        clusterID: props.clusterID,
        selectedClusterList: [],
      }
    }

    // Bind event handlers to maintain proper 'this' context
    this.handleFirstClick = this.handleFirstClick.bind(this)
    this.handleLastClick = this.handleLastClick.bind(this)
    this.handleNextClick = this.handleNextClick.bind(this)
    this.handlePreviousClick = this.handlePreviousClick.bind(this)
    this.handlePageInput = this.handlePageInput.bind(this)
    this.handleSelection = this.handleSelection.bind(this)
    this.handleSelectToggle = this.handleSelectToggle.bind(this)
    this.handleExpandSectionToggle = this.handleExpandSectionToggle.bind(this)
    this.handleSelectionClear = this.handleSelectionClear.bind(this)
  }

  /**
   * Processes action links for cluster resources (e.g., opening cluster console)
   */
  processActionLink = (resource: ResourceAction): void => {
    const { t } = this.state
    // Note: Using empty function for toggleLoading and empty string for hubClusterName
    // as these are not available in this context
    processResourceActionLink(resource, () => {}, t, '')
  }

  /**
   * Handles cluster selection from the typeahead dropdown.
   * Updates both local state and parent container state.
   */
  handleSelection = (selection: string | string[]): void => {
    const selectedValue = Array.isArray(selection) ? selection[0] : selection
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
      clusterList,
    } = this.props
    const { clusterID } = this.state

    let selectedCluster: ClusterData | undefined
    let newClusterList: ClusterData[]

    if (selectedValue) {
      // Find the selected cluster by name
      selectedCluster = clusterList.find((cls) =>
        cls.name ? cls.name === selectedValue : cls.metadata?.name === selectedValue
      )
      newClusterList = selectedCluster ? [selectedCluster] : []
    } else {
      // No selection - show all clusters
      newClusterList = clusterList
    }

    // Update parent container state
    handleClusterDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID: clusterID || '',
      selected: selectedValue,
      selectedClusterList: newClusterList,
    })

    // Update local component state
    this.setState({
      selected: selectedValue,
      clusterList: newClusterList,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
      clusterSearchToggle: false,
      selectedClusterList: newClusterList,
    })
  }

  /**
   * Clears the current cluster selection and shows all clusters
   */
  handleSelectionClear = (): void => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { clusterID } = this.state

    handleClusterDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID: clusterID || '',
      selected: undefined,
      selectedClusterList: [],
    })

    this.setState({
      selected: undefined,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
      clusterList: this.props.clusterList,
    })
  }

  /**
   * Navigates to the first page of clusters
   */
  handleFirstClick = (): void => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { clusterID } = this.state

    handleClusterDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID: clusterID || '',
      selected: undefined,
      selectedClusterList: [],
    })

    this.setState({
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
    })
  }

  /**
   * Navigates to the last page of clusters
   */
  handleLastClick = (): void => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { clusterList, perPage, clusterID } = this.state

    // Calculate the last page and starting index
    let divResult = Math.floor(clusterList.length / perPage)
    let lastPage = divResult
    const modResult = clusterList.length % perPage

    if (modResult === 0) {
      divResult = divResult - 1
    } else {
      lastPage = lastPage + 1
    }

    const newStartIdx = perPage * divResult

    handleClusterDetailsContainerUpdate({
      page: lastPage,
      startIdx: newStartIdx,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID: clusterID || '',
      selected: undefined,
      selectedClusterList: [],
    })

    this.setState({
      startIdx: newStartIdx,
      page: lastPage,
      expandSectionToggleMap: new Set(),
    })
  }

  /**
   * Navigates to the next page of clusters
   */
  handleNextClick = (_event: SyntheticEvent<HTMLButtonElement>, currentPage: number): void => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { perPage, startIdx, clusterID } = this.state
    const newStartIdx = startIdx + perPage

    handleClusterDetailsContainerUpdate({
      page: currentPage,
      startIdx: newStartIdx,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID: clusterID || '',
      selected: undefined,
      selectedClusterList: [],
    })

    this.setState({
      startIdx: newStartIdx,
      page: currentPage,
      expandSectionToggleMap: new Set(),
    })
  }

  /**
   * Navigates to the previous page of clusters
   */
  handlePreviousClick = (_event: SyntheticEvent<HTMLButtonElement>, currentPage: number): void => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { perPage, startIdx, clusterID } = this.state
    const newStartIdx = startIdx - perPage

    handleClusterDetailsContainerUpdate({
      page: currentPage,
      startIdx: newStartIdx,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID: clusterID || '',
      selected: undefined,
      selectedClusterList: [],
    })

    this.setState({
      startIdx: newStartIdx,
      page: currentPage,
      expandSectionToggleMap: new Set(),
    })
  }

  /**
   * Handles direct page input navigation
   */
  handlePageInput = (_event: KeyboardEvent<HTMLInputElement>, newPage: number): void => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { perPage, clusterID } = this.state
    const newStartIdx = (newPage - 1) * perPage

    handleClusterDetailsContainerUpdate({
      page: newPage,
      startIdx: newStartIdx,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID: clusterID || '',
      selected: undefined,
      selectedClusterList: [],
    })

    this.setState({
      startIdx: newStartIdx,
      page: newPage,
      expandSectionToggleMap: new Set(),
    })
  }

  /**
   * Handles keyboard events for cluster console links
   */
  handleKeyPress = (resource: ResourceAction, event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.processActionLink(resource)
    }
  }

  /**
   * Toggles the cluster search dropdown visibility
   */
  handleSelectToggle = (): void => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { page, startIdx, clusterSearchToggle, expandSectionToggleMap, clusterID } = this.state
    const newClusterSearchToggle = !clusterSearchToggle

    handleClusterDetailsContainerUpdate({
      page,
      startIdx,
      clusterSearchToggle: newClusterSearchToggle,
      expandSectionToggleMap,
      clusterID: clusterID || '',
      selected: undefined,
      selectedClusterList: [],
    })

    this.setState({
      clusterSearchToggle: newClusterSearchToggle,
    })
  }

  /**
   * Toggles the expansion state of individual cluster detail sections
   */
  handleExpandSectionToggle = (itemNum: number): void => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { page, startIdx, clusterSearchToggle, expandSectionToggleMap, clusterID, selected, selectedClusterList } =
      this.state

    // Create a new Set to avoid mutating the existing one
    const newExpandSectionToggleMap = new Set(expandSectionToggleMap)

    if (!newExpandSectionToggleMap.has(itemNum)) {
      newExpandSectionToggleMap.add(itemNum)
    } else {
      newExpandSectionToggleMap.delete(itemNum)
    }

    handleClusterDetailsContainerUpdate({
      page,
      startIdx,
      clusterSearchToggle,
      expandSectionToggleMap: newExpandSectionToggleMap,
      clusterID: clusterID || '',
      selected,
      selectedClusterList,
    })

    this.setState({
      expandSectionToggleMap: newExpandSectionToggleMap,
    })
  }

  /**
   * Renders a clickable console URL link for cluster access
   */
  renderConsoleURLLink = (
    consoleURL: string | undefined,
    resource: ResourceAction,
    t: TranslationFunction
  ): JSX.Element | null => {
    return consoleURL ? (
      <div className="sectionContent borderLeft">
        <span
          className="link sectionLabel"
          id="linkForNodeAction"
          tabIndex={0}
          role="button"
          onClick={() => this.processActionLink(resource)}
          onKeyDown={(event) => this.handleKeyPress(resource, event)}
        >
          {t('Open cluster console')}
          <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
            <use href="#drawerShapes_carbonLaunch" className="label-icon" />
          </svg>
        </span>
      </div>
    ) : null
  }

  /**
   * Renders CPU usage data as a percentage if available
   */
  renderCPUData = (
    cc: string | undefined,
    ac: string | undefined,
    divClass: string,
    labelClass: string,
    t: TranslationFunction,
    valueClass: string
  ): JSX.Element | null => {
    const showData = ac && ac !== ''

    return showData ? (
      <div className={divClass}>
        <span className={labelClass}>{t('CPU')}: </span>
        <span className={valueClass}>
          {getPercentage(
            inflateKubeValue(typeof ac === 'string' ? ac : String(ac || 0)),
            inflateKubeValue(typeof cc === 'string' ? cc : String(cc || 0))
          )}
          %
        </span>
      </div>
    ) : null
  }

  /**
   * Renders Memory usage data as a percentage if available
   */
  renderMemoryData = (
    cm: string | undefined,
    am: string | undefined,
    divClass: string,
    labelClass: string,
    t: TranslationFunction,
    valueClass: string
  ): JSX.Element | null => {
    const showData = am && am !== ''

    return showData ? (
      <div className={divClass}>
        <span className={labelClass}>{t('Memory')}: </span>
        <span className={valueClass}>
          {getPercentage(
            inflateKubeValue(typeof am === 'string' ? am : String(am || 0)),
            inflateKubeValue(typeof cm === 'string' ? cm : String(cm || 0))
          )}
          %
        </span>
      </div>
    ) : null
  }

  /**
   * Calculates cluster status based on cluster acceptance, join, and availability conditions.
   * Note: This calculation may not be fully accurate as search doesn't return all needed
   * data from the managedcluster resource YAML.
   */
  calculateClusterStatus = (clusterData: ClusterData): string => {
    let status: string
    const clusterAccepted = clusterData.HubAcceptedManagedCluster
    const clusterJoined = clusterData.ManagedClusterJoined
    const clusterAvailable = clusterData.ManagedClusterConditionAvailable

    if (clusterAccepted === false) {
      status = 'notaccepted'
    } else if (clusterJoined === false) {
      status = 'pendingimport'
    } else {
      status = clusterAvailable && clusterAvailable === 'True' ? 'ok' : 'offline'
    }

    return status
  }

  /**
   * Maps cluster status strings to appropriate icon names for visual representation
   */
  mapClusterStatusToIcon = (status: string): ClusterStatusIcon => {
    let icon: ClusterStatusIcon = 'checkmark'

    const statusLower = status.toLowerCase()
    if (statusLower === 'pendingimport' || statusLower === 'detaching') {
      icon = 'pending'
    } else if (statusLower === 'notaccepted') {
      icon = 'warning'
    } else if (statusLower === 'offline' || statusLower === 'unknown') {
      icon = 'failure'
    }

    return icon
  }

  /**
   * Renders an SVG status icon with appropriate color based on the icon type
   */
  renderClusterStatusIcon = (icon: ClusterStatusIcon): JSX.Element => {
    const fillMap = new Map<ClusterStatusIcon, string>([
      ['checkmark', '#3E8635'],
      ['failure', '#C9190B'],
      ['warning', '#F0AB00'],
      ['pending', '#878D96'],
    ])

    const iconFill = fillMap.get(icon)

    return (
      <svg width="12px" height="12px" fill={iconFill}>
        <use href={`#drawerShapes_${icon}`} className="label-icon" />
      </svg>
    )
  }

  /**
   * Main render method that displays the cluster details interface including:
   * - Cluster search/filter dropdown
   * - Pagination controls (if more than 5 clusters)
   * - Accordion with expandable cluster details
   */
  render(): JSX.Element {
    const { selected, clusterList, page, perPage, startIdx, t, expandSectionToggleMap, selectedClusterList } =
      this.state

    // UI constants
    const titleId = 'cluster-select-id-1'
    const findClusterMsg = 'Find cluster'
    const clusterItems: JSX.Element[] = []
    const divClass = 'sectionContent borderLeft'
    const labelClass = 'label sectionLabel'
    const valueClass = 'value'
    const solidLineStyle = '1px solid #D2D2D2'

    // Determine which cluster list to display (filtered or all)
    const displayClusterList = selected ? selectedClusterList : clusterList

    // Generate cluster detail items for the current page
    for (let i = startIdx; i < displayClusterList.length && i < page * perPage; i++) {
      const cluster = displayClusterList[i]
      const { metadata = {}, capacity = {}, allocatable = {}, consoleURL } = cluster

      // Extract cluster information with fallbacks
      const status = cluster.status || this.calculateClusterStatus(cluster) || 'unknown'
      const statusIcon = this.mapClusterStatusToIcon(status)
      const clusterName = cluster.name || (metadata as any)?.name || ''
      const clusterNamespace = cluster.namespace || cluster._clusterNamespace || (metadata as any)?.namespace || ''
      const creationTimestamp = cluster.creationTimestamp || (metadata as any)?.creationTimestamp
      const cc = cluster.cpu ? cluster.cpu.toString() : capacity.cpu
      const cm = cluster.memory ? cluster.memory.toString() : capacity.memory
      const am = allocatable.memory || ''
      const ac = allocatable.cpu || ''

      // Resource action for console URL
      const resource: ResourceAction = {
        action: 'open_link',
        targetLink: consoleURL,
      }

      const namespaceLabel = `${t('Namespace')}: ${clusterNamespace}`

      // Styling for cluster item borders
      const parentDivStyle =
        i === startIdx
          ? {
              borderTop: solidLineStyle,
              borderBottom: solidLineStyle,
            }
          : { borderBottom: solidLineStyle }

      const toggleItemNum = i % perPage

      // Namespace label styling
      const namespaceStyle: React.CSSProperties = {
        color: '#5A6872',
        fontFamily: 'RedHatText',
        fontSize: '12px',
        lineHeight: '21px',
        textAlign: 'left',
        display: 'block',
      }

      const outerNamespaceStyle: React.CSSProperties = expandSectionToggleMap.has(toggleItemNum)
        ? { display: 'none' }
        : namespaceStyle

      clusterItems.push(
        <div className="clusterDetailItem" style={parentDivStyle} key={clusterName}>
          <AccordionItem>
            <AccordionToggle
              onClick={() => this.handleExpandSectionToggle(toggleItemNum)}
              isExpanded={expandSectionToggleMap.has(toggleItemNum)}
              id={clusterName}
            >
              {this.renderClusterStatusIcon(statusIcon)}
              <span style={{ paddingRight: '10px' }} />
              {clusterName}
            </AccordionToggle>
            <AccordionContent isHidden={!expandSectionToggleMap.has(toggleItemNum)}>
              <span style={namespaceStyle}>{namespaceLabel}</span>
              <span
                className={labelClass}
                style={{
                  paddingLeft: '1rem',
                  fontSize: '1rem',
                }}
              >
                {t('Details')}
              </span>
              <div className="spacer" />
              <div className={divClass}>
                <span className={labelClass}>{t('Name')}: </span>
                <span className={valueClass}>{clusterName}</span>
              </div>
              <div className={divClass}>
                <span className={labelClass}>{t('Namespace')}: </span>
                <span className={valueClass}>{clusterNamespace}</span>
              </div>
              {this.renderConsoleURLLink(consoleURL, resource, t)}
              <div className={divClass}>
                <span className={labelClass}>{t('Status')}: </span>
                <span className={valueClass}>{status.toLowerCase()}</span>
              </div>
              {this.renderCPUData(cc, ac, divClass, labelClass, t, valueClass)}
              {this.renderMemoryData(cm, am, divClass, labelClass, t, valueClass)}
              <div className={divClass}>
                <span className={labelClass}>{t('Created')}: </span>
                <span className={valueClass}>
                  <AcmTimestamp timestamp={creationTimestamp} />
                </span>
              </div>
              <div className="spacer" />
            </AccordionContent>
          </AccordionItem>
          <span style={outerNamespaceStyle}>{namespaceLabel}</span>
        </div>
      )
    }

    return (
      <div className="clusterDetails">
        {/* Cluster search/filter dropdown */}
        <AcmSelectBase
          variant={SelectVariant.typeahead}
          onSelect={this.handleSelection}
          selections={selected}
          aria-label={findClusterMsg}
          aria-labelledby={titleId}
          placeholderText={findClusterMsg}
          onClear={this.handleSelectionClear}
        >
          {this.props.clusterList.map((cluster) => (
            <SelectOption key={cluster.name || cluster.metadata?.name} value={cluster.name || cluster.metadata?.name} />
          ))}
        </AcmSelectBase>

        <div className="spacer" />

        {/* Top pagination - only show if more than 5 clusters */}
        {this.props.clusterList.length > 5 && (
          <Pagination
            itemCount={displayClusterList.length}
            perPage={perPage}
            page={page}
            widgetId="pagination-options-menu-top"
            onFirstClick={this.handleFirstClick}
            onLastClick={this.handleLastClick}
            onNextClick={this.handleNextClick}
            onPreviousClick={this.handlePreviousClick}
            onPageInput={this.handlePageInput}
          />
        )}

        <div className="spacer" />

        {/* Cluster details accordion */}
        <Accordion>{clusterItems}</Accordion>

        {/* Bottom pagination - only show if more than 5 clusters */}
        {this.props.clusterList.length > 5 && (
          <Pagination
            itemCount={displayClusterList.length}
            perPage={perPage}
            page={page}
            widgetId="pagination-options-menu-bottom"
            onFirstClick={this.handleFirstClick}
            onLastClick={this.handleLastClick}
            onNextClick={this.handleNextClick}
            onPreviousClick={this.handlePreviousClick}
            onPageInput={this.handlePageInput}
          />
        )}
      </div>
    )
  }
}

export default ClusterDetailsContainer
