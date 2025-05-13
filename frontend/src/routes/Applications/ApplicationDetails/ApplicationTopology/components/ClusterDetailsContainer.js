/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import PropTypes from 'prop-types'
import {
  Pagination,
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionToggle,
  SelectOption,
} from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant } from '../../../../../components/AcmSelectBase'
import { Component } from 'react'
import { processResourceActionLink, getPercentage, inflateKubeValue } from '../helpers/diagram-helpers'
import AcmTimestamp from '../../../../../lib/AcmTimestamp'

class ClusterDetailsContainer extends Component {
  static propTypes = {
    clusterDetailsContainerControl: PropTypes.shape({
      clusterDetailsContainerData: PropTypes.object,
      handleClusterDetailsContainerUpdate: PropTypes.func,
    }),
    clusterID: PropTypes.string,
    clusterList: PropTypes.array,
    t: PropTypes.func,
  }
  constructor(props) {
    super()
    const currentClusterID = props.clusterDetailsContainerControl.clusterDetailsContainerData.clusterID
    if (currentClusterID === props.clusterID) {
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
      // reset saved setting when a different cluster node is selected
      const {
        clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
      } = props

      handleClusterDetailsContainerUpdate(1, 0, false, new Set(), props.clusterID)
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

  processActionLink = (resource) => {
    processResourceActionLink(resource)
  }

  handleSelection = (selection) => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
      clusterList,
    } = this.props
    const { clusterID } = this.state
    let selectedCluster, newClusterList
    if (selection) {
      selectedCluster = clusterList.find((cls) => (cls.name ? cls.name === selection : cls.metadata.name === selection))
      newClusterList = [selectedCluster]
    } else {
      newClusterList = clusterList
    }

    handleClusterDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID,
      selected: selection,
      selectedClusterList: newClusterList,
    })
    this.setState({
      selected: selection,
      clusterList: newClusterList,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
      clusterSearchToggle: false,
      selectedClusterList: newClusterList,
    })
  }

  handleSelectionClear = () => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { clusterID } = this.state

    handleClusterDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID,
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

  handleFirstClick = () => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { clusterID } = this.state

    handleClusterDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID,
      selected: undefined,
      selectedClusterList: [],
    })
    this.setState({
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
    })
  }

  handleLastClick = () => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { clusterList, perPage, clusterID } = this.state

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
      clusterID,
      selected: undefined,
      selectedClusterList: [],
    })
    this.setState({
      startIdx: newStartIdx,
      page: lastPage,
      expandSectionToggleMap: new Set(),
    })
  }

  handleNextClick = (_event, currentPage) => {
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
      clusterID,
      selected: undefined,
      selectedClusterList: [],
    })
    this.setState({
      startIdx: newStartIdx,
      page: currentPage,
      expandSectionToggleMap: new Set(),
    })
  }

  handlePreviousClick = (_event, currentPage) => {
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
      clusterID,
      selected: undefined,
      selectedClusterList: [],
    })
    this.setState({
      startIdx: newStartIdx,
      page: currentPage,
      expandSectionToggleMap: new Set(),
    })
  }

  handlePageInput = (_event, newPage) => {
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
      clusterID,
      selected: undefined,
      selectedClusterList: [],
    })
    this.setState({
      startIdx: newStartIdx,
      page: newPage,
      expandSectionToggleMap: new Set(),
    })
  }

  handleKeyPress = (resource, _event) => {
    if (_event.key === 'Enter') {
      this.processActionLink(resource)
    }
  }

  handleSelectToggle = () => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { page, startIdx, clusterSearchToggle, expandSectionToggleMap, clusterID } = this.state
    const newClusterSearchToggle = !clusterSearchToggle

    handleClusterDetailsContainerUpdate({
      page,
      startIdx,
      newClusterSearchToggle,
      expandSectionToggleMap,
      clusterID,
      selected: undefined,
      selectedClusterList: [],
    })
    this.setState({
      clusterSearchToggle: newClusterSearchToggle,
    })
  }

  handleExpandSectionToggle = (itemNum) => {
    const {
      clusterDetailsContainerControl: { handleClusterDetailsContainerUpdate },
    } = this.props
    const { page, startIdx, clusterSearchToggle, expandSectionToggleMap, clusterID, selected, selectedClusterList } =
      this.state

    if (!expandSectionToggleMap.has(itemNum)) {
      expandSectionToggleMap.add(itemNum)
    } else {
      expandSectionToggleMap.delete(itemNum)
    }

    handleClusterDetailsContainerUpdate({
      page,
      startIdx,
      clusterSearchToggle,
      expandSectionToggleMap,
      clusterID,
      selected,
      selectedClusterList,
    })
    this.setState({
      expandSectionToggleMap: expandSectionToggleMap,
    })
  }

  renderConsoleURLLink = (consoleURL, resource, t) => {
    return (
      consoleURL && (
        <div className="sectionContent borderLeft">
          <span
            className="link sectionLabel"
            id="linkForNodeAction"
            tabIndex="0"
            role="button"
            onClick={this.processActionLink.bind(this, resource)}
            onKeyDown={this.handleKeyPress.bind(this, resource)}
          >
            {t('Open cluster console')}
            <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
              <use href="#drawerShapes_carbonLaunch" className="label-icon" />
            </svg>
          </span>
        </div>
      )
    )
  }

  renderCPUData = (cc, ac, divClass, labelClass, t, valueClass) => {
    let showData = false
    if (ac && ac !== '') {
      showData = true
    }

    return (
      showData && (
        <div className={divClass}>
          <span className={labelClass}>{t('CPU')}: </span>
          <span className={valueClass}>{getPercentage(inflateKubeValue(ac), inflateKubeValue(cc))}%</span>
        </div>
      )
    )
  }

  renderMemoryData = (cm, am, divClass, labelClass, t, valueClass) => {
    let showData = false
    if (am && am !== '') {
      showData = true
    }

    return (
      showData && (
        <div className={divClass}>
          <span className={labelClass}>{t('Memory')}: </span>
          <span className={valueClass}>{getPercentage(inflateKubeValue(am), inflateKubeValue(cm))}%</span>
        </div>
      )
    )
  }

  // This calculation is not accurate as search is not returning all the needed
  // data from the managedcluster resource YAML
  calculateClusterStatus = (clusterData) => {
    let status
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

  mapClusterStatusToIcon = (status) => {
    let icon = 'checkmark'

    if (status.toLowerCase() === 'pendingimport' || status.toLowerCase() === 'detaching') {
      icon = 'pending'
    } else if (status.toLowerCase() === 'notaccepted') {
      icon = 'warning'
    } else if (status.toLowerCase() === 'offline' || status.toLowerCase() === 'unknown') {
      icon = 'failure'
    }

    return icon
  }

  renderClusterStatusIcon = (icon) => {
    const fillMap = new Map([
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

  render() {
    const { selected, clusterList, page, perPage, startIdx, t, expandSectionToggleMap, selectedClusterList } =
      this.state
    const titleId = 'cluster-select-id-1'
    const findClusterMsg = 'Find cluster'
    const clusterItems = []
    const divClass = 'sectionContent borderLeft'
    const labelClass = 'label sectionLabel'
    const valueClass = 'value'
    const solidLineStyle = '1px solid #D2D2D2'
    const displayClusterList = selected ? selectedClusterList : clusterList

    for (let i = startIdx; i < displayClusterList.length && i < page * perPage; i++) {
      const { metadata = {}, capacity = {}, allocatable = {}, consoleURL } = displayClusterList[i]

      const status = displayClusterList[i].status || this.calculateClusterStatus(displayClusterList[i]) || 'unknown'
      const statusIcon = this.mapClusterStatusToIcon(status)
      const clusterName = displayClusterList[i].name || metadata.name
      const clusterNamespace =
        displayClusterList[i].namespace || displayClusterList[i]._clusterNamespace || metadata.namespace
      const creationTimestamp = displayClusterList[i].creationTimestamp || metadata.creationTimestamp
      const cc = displayClusterList[i].cpu ? displayClusterList[i].cpu.toString() : capacity.cpu
      const cm = displayClusterList[i].memory ? displayClusterList[i].memory.toString() : capacity.memory
      const am = allocatable.memory || ''
      const ac = allocatable.cpu || ''
      const resource = {
        action: 'open_link',
        targetLink: consoleURL,
      }
      const namespaceLabel = `${t('Namespace')}: ${clusterNamespace}`
      const parentDivStyle =
        i === startIdx
          ? {
              borderTop: solidLineStyle,
              borderBottom: solidLineStyle,
            }
          : { borderBottom: solidLineStyle }
      const toggleItemNum = i % perPage
      const namespaceStyle = {
        color: '#5A6872',
        fontFamily: 'RedHatText',
        fontSize: '12px',
        lineHeight: '21px',
        textAlign: 'left',
        display: 'block',
      }
      const outerNamespaceStyle = expandSectionToggleMap.has(toggleItemNum) ? { display: 'none' } : namespaceStyle

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
            <SelectOption key={cluster.name || cluster.metadata.name} value={cluster.name || cluster.metadata.name} />
          ))}
        </AcmSelectBase>
        <div className="spacer" />
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
        <Accordion>{clusterItems}</Accordion>
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
