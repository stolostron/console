/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { Component } from 'react'
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
import { processResourceActionLink, createEditLink } from '../helpers/diagram-helpers'

class ArgoAppDetailsContainer extends Component {
  static propTypes = {
    argoAppDetailsContainerControl: PropTypes.shape({
      argoAppDetailsContainerData: PropTypes.object,
      handleArgoAppDetailsContainerUpdate: PropTypes.func,
      handleErrorMsg: PropTypes.func,
    }),
    argoAppList: PropTypes.array,
    t: PropTypes.func,
  }
  constructor(props) {
    super()

    this.state = {
      argoAppList: props.argoAppList,
      t: props.t,
      selected: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.selected,
      page: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.page,
      perPage: 5,
      startIdx: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.startIdx,
      argoAppSearchToggle: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.argoAppSearchToggle,
      expandSectionToggleMap: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.expandSectionToggleMap,
      selectedArgoAppList: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.selectedArgoAppList,
      isLoading: false,
    }

    this.handleSelection = this.handleSelection.bind(this)
    this.handleSelectToggle = this.handleSelectToggle.bind(this)
    this.handleSelectionClear = this.handleSelectionClear.bind(this)
    this.handleExpandSectionToggle = this.handleExpandSectionToggle.bind(this)
    this.handleFirstClick = this.handleFirstClick.bind(this)
    this.handleLastClick = this.handleLastClick.bind(this)
    this.handleNextClick = this.handleNextClick.bind(this)
    this.handlePreviousClick = this.handlePreviousClick.bind(this)
    this.handlePageInput = this.handlePageInput.bind(this)
    this.toggleLinkLoading = this.toggleLinkLoading.bind(this)
  }

  processActionLink = (resource) => {
    const { t } = this.props
    processResourceActionLink(resource, this.toggleLinkLoading, t)
  }

  toggleLinkLoading = () => {
    this.setState((prevState) => ({
      isLoading: !prevState.isLoading,
    }))
  }

  handleExpandSectionToggle = (itemNum) => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { page, startIdx, argoAppSearchToggle, expandSectionToggleMap, selected, selectedArgoAppList, isLoading } =
      this.state

    if (!expandSectionToggleMap.has(itemNum)) {
      expandSectionToggleMap.add(itemNum)
    } else {
      expandSectionToggleMap.delete(itemNum)
    }

    // save details state to DiagramView
    handleArgoAppDetailsContainerUpdate({
      page,
      startIdx,
      argoAppSearchToggle,
      expandSectionToggleMap,
      selected,
      selectedArgoAppList,
      isLoading,
    })
    this.setState({
      expandSectionToggleMap: expandSectionToggleMap,
    })
  }

  handleSelection = (selection) => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
      argoAppList,
    } = this.props
    const { isLoading } = this.state
    let selectedApp, newArgoAppList
    if (selection) {
      selectedApp = argoAppList.find((app) => app.name === selection)
      newArgoAppList = [selectedApp]
    } else {
      newArgoAppList = argoAppList
    }

    // save details state to DiagramViewer
    handleArgoAppDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: selection,
      selectedArgoAppList: newArgoAppList,
      isLoading,
    })
    this.setState({
      selected: selection,
      argoAppList: newArgoAppList,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
      argoAppSearchToggle: false,
      selectedArgoAppList: newArgoAppList,
    })
  }

  handleSelectToggle = () => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { page, startIdx, argoAppSearchToggle, expandSectionToggleMap, isLoading } = this.state
    const newArgoAppSearchToggle = !argoAppSearchToggle

    // save details state to DiagramViewer
    handleArgoAppDetailsContainerUpdate({
      page,
      startIdx,
      argoAppSearchToggle: newArgoAppSearchToggle,
      expandSectionToggleMap,
      selected: undefined,
      selectedArgoAppList: [],
      isLoading,
    })
    this.setState({
      argoAppSearchToggle: newArgoAppSearchToggle,
    })
  }

  handleSelectionClear = () => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { isLoading } = this.state

    // save details state to DiagramViewer
    handleArgoAppDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: undefined,
      selectedArgoAppList: [],
      isLoading,
    })
    this.setState({
      selected: undefined,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
      argoAppList: this.props.argoAppList,
    })
  }

  handleFirstClick = () => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { isLoading } = this.state

    // save details state to DiagramViewer
    handleArgoAppDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: undefined,
      selectedArgoAppList: [],
      isLoading,
    })
    this.setState({
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
    })
  }

  handleLastClick = () => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { argoAppList, perPage, isLoading } = this.state

    let divResult = Math.floor(argoAppList.length / perPage)
    let lastPage = divResult
    const modResult = argoAppList.length % perPage
    if (modResult === 0) {
      divResult = divResult - 1
    } else {
      lastPage = lastPage + 1
    }
    const newStartIdx = perPage * divResult

    // save details state to DiagramViewer
    handleArgoAppDetailsContainerUpdate({
      page: lastPage,
      startIdx: newStartIdx,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: undefined,
      selectedArgoAppList: [],
      isLoading,
    })
    this.setState({
      startIdx: newStartIdx,
      page: lastPage,
      expandSectionToggleMap: new Set(),
    })
  }

  handleNextClick = (_event, currentPage) => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { perPage, startIdx, isLoading } = this.state
    const newStartIdx = startIdx + perPage

    // save details state to DiagramViewer
    handleArgoAppDetailsContainerUpdate({
      page: currentPage,
      startIdx: newStartIdx,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: undefined,
      selectedArgoAppList: [],
      isLoading,
    })
    this.setState({
      startIdx: newStartIdx,
      page: currentPage,
      expandSectionToggleMap: new Set(),
    })
  }

  handlePreviousClick = (_event, currentPage) => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { perPage, startIdx, isLoading } = this.state
    const newStartIdx = startIdx - perPage

    // save details state to DiagramViewer
    handleArgoAppDetailsContainerUpdate({
      page: currentPage,
      startIdx: newStartIdx,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: undefined,
      selectedArgoAppList: [],
      isLoading,
    })
    this.setState({
      startIdx: newStartIdx,
      page: currentPage,
      expandSectionToggleMap: new Set(),
    })
  }

  handlePageInput = (_event, newPage) => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { perPage, isLoading } = this.state
    const newStartIdx = (newPage - 1) * perPage

    // save details state to DiagramViewer
    handleArgoAppDetailsContainerUpdate({
      page: newPage,
      startIdx: newStartIdx,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: undefined,
      selectedArgoAppList: [],
      isLoading,
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

  renderURLLink = (resource, isExternal, t) => {
    return (
      <span
        className="link sectionLabel"
        id="linkForNodeAction"
        tabIndex="0"
        role="button"
        onClick={this.processActionLink.bind(this, resource)}
        onKeyDown={this.handleKeyPress.bind(this, resource)}
      >
        {resource.action === 'open_argo_editor' ? t('Launch Argo editor') : t('View resource YAML')}
        {isExternal ? (
          <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
            <use href="#drawerShapes_carbonLaunch" className="label-icon" />
          </svg>
        ) : (
          <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
            <use href="#drawerShapes_open-new-tab" className="label-icon" />
          </svg>
        )}
      </span>
    )
  }

  mapArgoStatusToStatusIcon = (status) => {
    if (status === 'Healthy') {
      return 'checkmark'
    }
    if (status === 'Missing' || status === 'Unknown' || status === 'Progressing' || status === '' || !status) {
      return 'pending'
    }
    if (status === 'Degraded') {
      return 'failure'
    }
    return 'warning'
  }

  renderArgoAppStatusIcon = (icon) => {
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

  renderErrorMessage = (name, status, t) => {
    let showWarning = false
    if (status === 'Unknown' || status === 'Degraded' || status === 'Missing') {
      showWarning = true
    }

    return (
      showWarning && (
        <div className="sectionContent borderLeft">
          <span className="label sectionLabel">
            <svg width="13px" height="13px" fill="#F0AB00" style={{ marginRight: '8px' }}>
              <use href="#drawerShapes_warning" className="label-icon" />
            </svg>
            <span>{t('Health status')}: </span>
          </span>
          <span className="value">
            {t(
              'The health status for application {{0}} is {{1}}. Use the Launch Argo editor action above to view the application details.',
              [name, status]
            )}
          </span>
        </div>
      )
    )
  }

  render() {
    const { selected, argoAppList, page, perPage, startIdx, t, expandSectionToggleMap, selectedArgoAppList } =
      this.state
    const titleId = 'app-select-id-1'
    const findAppMsg = 'Find application'
    const appItems = []
    const divClass = 'sectionContent borderLeft'
    const labelClass = 'label sectionLabel'
    const valueClass = 'value'
    const solidLineStyle = '1px solid #D2D2D2'
    const displayArgoAppList = selected ? selectedArgoAppList : argoAppList
    const argoEditorLinkStyle = {
      display: 'block',
    }
    for (let i = startIdx; i < displayArgoAppList.length && i < page * perPage; i++) {
      const { name, cluster, namespace, destinationName, destinationNamespace, healthStatus } = displayArgoAppList[i]
      const statusIcon = this.mapArgoStatusToStatusIcon(healthStatus)
      const parentDivStyle =
        i === startIdx
          ? {
              borderTop: solidLineStyle,
              borderBottom: solidLineStyle,
            }
          : { borderBottom: solidLineStyle }
      const toggleItemNum = i % perPage
      const argoEditorResource = {
        action: 'open_argo_editor',
        cluster: cluster,
        namespace: namespace,
        name: name,
      }
      const outerArgoEditorLinkStyle = expandSectionToggleMap.has(toggleItemNum)
        ? { display: 'none' }
        : argoEditorLinkStyle
      const searchResultToNode = {
        name,
        namespace,
        cluster,
        specs: {
          raw: {
            kind: 'Application',
            apiVersion: 'argoproj.io/v1alpha1',
          },
        },
      }
      const editLink = createEditLink(searchResultToNode, this.props.hubClusterName)
      const appResourceYaml = {
        action: 'show_resource_yaml',
        editLink,
      }
      // render list of argo app
      appItems.push(
        <div className="appDetailItem" style={parentDivStyle} key={`${name}${i}`}>
          <AccordionItem>
            <AccordionToggle
              onClick={() => this.handleExpandSectionToggle(toggleItemNum)}
              isExpanded={expandSectionToggleMap.has(toggleItemNum)}
              id={name}
            >
              {this.renderArgoAppStatusIcon(statusIcon)}
              <span style={{ paddingRight: '10px' }} />
              {name}
            </AccordionToggle>
            <AccordionContent isHidden={!expandSectionToggleMap.has(toggleItemNum)}>
              <span style={argoEditorLinkStyle}>{this.renderURLLink(argoEditorResource, true, t)}</span>
              <div className="spacer" />
              <span
                className={labelClass}
                style={{
                  paddingLeft: '1rem',
                  fontSize: '0.75rem',
                }}
              >
                {t('Details')}
              </span>
              <div className="spacer" />
              <div className={divClass}>{this.renderURLLink(appResourceYaml, false, t)}</div>
              <div className={divClass}>
                <span className={labelClass}>{t('Created on')}: </span>
                <span className={valueClass}>{cluster}</span>
              </div>
              <div className={divClass}>
                <span className={labelClass}>{t('Destination cluster')}: </span>
                <span className={valueClass}>{destinationName}</span>
              </div>
              <div className={divClass}>
                <span className={labelClass}>{t('Destination namespace')}: </span>
                <span className={valueClass}>{destinationNamespace}</span>
              </div>
              <div className={divClass}>
                <span className={labelClass}>{t('Status')}: </span>
                <span className={valueClass}>{healthStatus}</span>
              </div>
              <div className="spacer" />
              {this.renderErrorMessage(name, healthStatus, t)}
            </AccordionContent>
          </AccordionItem>
          <span style={outerArgoEditorLinkStyle}>{this.renderURLLink(argoEditorResource, true, t)}</span>
        </div>
      )
    }

    return (
      <div className="appDetails">
        <AcmSelectBase
          variant={SelectVariant.typeahead}
          typeAheadAriaLabel={findAppMsg}
          onSelect={this.handleSelection}
          selections={selected}
          aria-label={findAppMsg}
          aria-labelledby={titleId}
          placeholderText={findAppMsg}
          onClear={this.handleSelectionClear}
        >
          {this.props.argoAppList.map((app) => (
            <SelectOption key={app.name} value={app.name} />
          ))}
        </AcmSelectBase>
        <div className="spacer" />
        {this.props.argoAppList.length > 5 && (
          <Pagination
            itemCount={displayArgoAppList.length}
            perPage={perPage}
            page={page}
            widgetId="argoappdetails-pagination-options-menu-top"
            onFirstClick={this.handleFirstClick}
            onLastClick={this.handleLastClick}
            onNextClick={this.handleNextClick}
            onPreviousClick={this.handlePreviousClick}
            onPageInput={this.handlePageInput}
          />
        )}
        <div className="spacer" />
        <Accordion>{appItems}</Accordion>
        {this.props.argoAppList.length > 5 && (
          <Pagination
            itemCount={displayArgoAppList.length}
            perPage={perPage}
            page={page}
            widgetId="argoappdetails-pagination-options-menu-top"
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

export default ArgoAppDetailsContainer
