/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import React, { Component } from 'react'
import {
  Pagination,
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionToggle,
  SelectOption,
} from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant } from '../../../../../components/AcmSelectBase'
import { processResourceActionLink, createEditLink } from '../elements/helpers/diagram-helpers'
import type {
  ArgoApp,
  ArgoAppDetailsContainerProps,
  ArgoAppDetailsContainerState,
  ArgoStatusIcon,
  ArgoResourceAction,
  NodeLike,
  TranslationFunction,
} from '../types'

/**
 * ArgoAppDetailsContainer component provides a detailed view of Argo applications
 * with search, pagination, and expandable accordion sections for each application.
 *
 * Features:
 * - Search/filter applications by name
 * - Paginated view for large application lists
 * - Expandable sections showing application details
 * - Links to Argo editor and YAML view
 * - Health status indicators with appropriate icons
 */
class ArgoAppDetailsContainer extends Component<ArgoAppDetailsContainerProps, ArgoAppDetailsContainerState> {
  constructor(props: ArgoAppDetailsContainerProps) {
    super(props)

    // Initialize component state from props
    this.state = {
      argoAppList: props.argoAppList,
      t: props.t,
      selected: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.selected,
      page: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.page,
      perPage: 5, // Fixed page size for consistent UI
      startIdx: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.startIdx,
      argoAppSearchToggle: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.argoAppSearchToggle,
      expandSectionToggleMap: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.expandSectionToggleMap,
      selectedArgoAppList: props.argoAppDetailsContainerControl.argoAppDetailsContainerData.selectedArgoAppList,
      isLoading: false,
    }

    // Bind event handlers to maintain proper 'this' context
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

  /**
   * Processes action links for resources (Argo editor, YAML view)
   * @param resource - The resource to process the action for
   */
  processActionLink = (resource: ArgoResourceAction): void => {
    const { t, hubClusterName } = this.props
    processResourceActionLink(resource, this.toggleLinkLoading, t, hubClusterName || '')
  }

  /**
   * Toggles the loading state for action links
   */
  toggleLinkLoading = (): void => {
    this.setState((prevState) => ({
      isLoading: !prevState.isLoading,
    }))
  }

  /**
   * Handles expanding/collapsing accordion sections for individual applications
   * @param itemNum - The index of the item to toggle
   */
  handleExpandSectionToggle = (itemNum: number): void => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { page, startIdx, argoAppSearchToggle, expandSectionToggleMap, selected, selectedArgoAppList, isLoading } =
      this.state

    // Toggle the expansion state for this item
    if (!expandSectionToggleMap.has(itemNum)) {
      expandSectionToggleMap.add(itemNum)
    } else {
      expandSectionToggleMap.delete(itemNum)
    }

    // Persist state changes to parent component (DiagramView)
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

  /**
   * Handles application selection from the dropdown
   * @param selection - The name of the selected application, or null to show all
   */
  handleSelection = (selection: string | null): void => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
      argoAppList,
    } = this.props
    const { isLoading } = this.state

    let selectedApp: ArgoApp | undefined
    let newArgoAppList: ArgoApp[]

    if (selection) {
      // Filter to show only the selected application
      selectedApp = argoAppList.find((app) => app.name === selection)
      newArgoAppList = selectedApp ? [selectedApp] : []
    } else {
      // Show all applications
      newArgoAppList = argoAppList
    }

    // Reset pagination and expansion state when selection changes
    handleArgoAppDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: selection || undefined,
      selectedArgoAppList: newArgoAppList,
      isLoading,
    })

    this.setState({
      selected: selection || undefined,
      argoAppList: newArgoAppList,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
      argoAppSearchToggle: false,
      selectedArgoAppList: newArgoAppList,
    })
  }

  /**
   * Toggles the search dropdown open/closed state
   */
  handleSelectToggle = (): void => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { page, startIdx, argoAppSearchToggle, expandSectionToggleMap, isLoading } = this.state
    const newArgoAppSearchToggle = !argoAppSearchToggle

    // Clear selection when toggling search
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

  /**
   * Clears the current application selection and shows all applications
   */
  handleSelectionClear = (): void => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { isLoading } = this.state

    // Reset to initial state showing all applications
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

  /**
   * Navigates to the first page of applications
   */
  handleFirstClick = (): void => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { isLoading } = this.state

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

  /**
   * Navigates to the last page of applications
   */
  handleLastClick = (): void => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { argoAppList, perPage, isLoading } = this.state

    // Calculate the last page and its starting index
    let divResult = Math.floor(argoAppList.length / perPage)
    let lastPage = divResult
    const modResult = argoAppList.length % perPage

    if (modResult === 0) {
      divResult = divResult - 1
    } else {
      lastPage = lastPage + 1
    }

    const newStartIdx = perPage * divResult

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

  /**
   * Navigates to the next page of applications
   * @param _event - The click event (unused)
   * @param currentPage - The current page number
   */
  handleNextClick = (_event: React.MouseEvent, currentPage: number): void => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { perPage, startIdx, isLoading } = this.state
    const newStartIdx = startIdx + perPage

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

  /**
   * Navigates to the previous page of applications
   * @param _event - The click event (unused)
   * @param currentPage - The current page number
   */
  handlePreviousClick = (_event: React.MouseEvent, currentPage: number): void => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { perPage, startIdx, isLoading } = this.state
    const newStartIdx = startIdx - perPage

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

  /**
   * Handles direct page input navigation
   * @param _event - The input event (unused)
   * @param newPage - The target page number
   */
  handlePageInput = (_event: React.FormEvent, newPage: number): void => {
    const {
      argoAppDetailsContainerControl: { handleArgoAppDetailsContainerUpdate },
    } = this.props
    const { perPage, isLoading } = this.state
    const newStartIdx = (newPage - 1) * perPage

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

  /**
   * Handles keyboard navigation for action links
   * @param resource - The resource to process
   * @param _event - The keyboard event
   */
  handleKeyPress = (resource: ArgoResourceAction, _event: React.KeyboardEvent): void => {
    if (_event.key === 'Enter') {
      this.processActionLink(resource)
    }
  }

  /**
   * Renders a clickable link for resource actions (Argo editor or YAML view)
   * @param resource - The resource action configuration
   * @param isExternal - Whether this opens in an external window
   * @param t - Translation function
   * @returns JSX element for the action link
   */
  renderURLLink = (resource: ArgoResourceAction, isExternal: boolean, t: TranslationFunction): JSX.Element => {
    return (
      <span
        className="link sectionLabel"
        id="linkForNodeAction"
        tabIndex={0}
        role="button"
        onClick={() => this.processActionLink(resource)}
        onKeyDown={(event) => this.handleKeyPress(resource, event)}
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

  /**
   * Maps Argo application health status to appropriate status icon
   * @param status - The health status from Argo
   * @returns The corresponding icon identifier
   */
  mapArgoStatusToStatusIcon = (status: string): ArgoStatusIcon => {
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

  /**
   * Renders the appropriate status icon for an Argo application
   * @param icon - The icon type to render
   * @returns JSX element for the status icon
   */
  renderArgoAppStatusIcon = (icon: ArgoStatusIcon): JSX.Element => {
    // Color mapping for different status types
    const fillMap = new Map<ArgoStatusIcon, string>([
      ['checkmark', '#3E8635'], // Green for healthy
      ['failure', '#C9190B'], // Red for failed/degraded
      ['warning', '#F0AB00'], // Yellow/orange for warnings
      ['pending', '#878D96'], // Gray for pending/unknown
    ])

    const iconFill = fillMap.get(icon)
    return (
      <svg width="12px" height="12px" fill={iconFill}>
        <use href={`#drawerShapes_${icon}`} className="label-icon" />
      </svg>
    )
  }

  /**
   * Renders error/warning messages for applications with problematic health status
   * @param name - Application name
   * @param status - Health status
   * @param t - Translation function
   * @returns JSX element for error message or null if no warning needed
   */
  renderErrorMessage = (name: string, status: string, t: TranslationFunction): JSX.Element | null => {
    let showWarning = false
    if (status === 'Unknown' || status === 'Degraded' || status === 'Missing') {
      showWarning = true
    }

    if (!showWarning) {
      return null
    }

    return (
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
  }

  render(): JSX.Element {
    const { selected, argoAppList, page, perPage, startIdx, t, expandSectionToggleMap, selectedArgoAppList } =
      this.state

    // UI constants
    const titleId = 'app-select-id-1'
    const findAppMsg = 'Find application'
    const appItems: JSX.Element[] = []
    const divClass = 'sectionContent borderLeft'
    const labelClass = 'label sectionLabel'
    const valueClass = 'value'
    const solidLineStyle = '1px solid #D2D2D2'

    // Determine which list to display (filtered or full)
    const displayArgoAppList = selected ? selectedArgoAppList : argoAppList

    const argoEditorLinkStyle: React.CSSProperties = {
      display: 'block',
    }

    // Build the list of application items for the current page
    for (let i = startIdx; i < displayArgoAppList.length && i < page * perPage; i++) {
      const { name, cluster, namespace, destinationName, destinationNamespace, healthStatus } = displayArgoAppList[i]
      const statusIcon = this.mapArgoStatusToStatusIcon(healthStatus)

      // Style for application item borders
      const parentDivStyle: React.CSSProperties =
        i === startIdx
          ? {
              borderTop: solidLineStyle,
              borderBottom: solidLineStyle,
            }
          : { borderBottom: solidLineStyle }

      const toggleItemNum = i % perPage

      // Resource action for opening Argo editor
      const argoEditorResource: ArgoResourceAction = {
        action: 'open_argo_editor',
        cluster: cluster,
        namespace: namespace,
        name: name,
      }

      // Hide editor link when section is expanded
      const outerArgoEditorLinkStyle = expandSectionToggleMap.has(toggleItemNum)
        ? { display: 'none' }
        : argoEditorLinkStyle

      // Create a node-like object for edit link generation
      const searchResultToNode: NodeLike = {
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

      const editLink = createEditLink(searchResultToNode, this.props.hubClusterName || '')

      // Resource action for viewing YAML
      const appResourceYaml: ArgoResourceAction = {
        action: 'show_resource_yaml',
        editLink,
      }

      // Create the accordion item for this application
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
              {/* Argo editor link */}
              <span style={argoEditorLinkStyle}>{this.renderURLLink(argoEditorResource, true, t)}</span>
              <div className="spacer" />

              {/* Details section header */}
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

              {/* Application details */}
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

              {/* Error message for problematic status */}
              {this.renderErrorMessage(name, healthStatus, t)}
            </AccordionContent>
          </AccordionItem>

          {/* External Argo editor link (shown when not expanded) */}
          <span style={outerArgoEditorLinkStyle}>{this.renderURLLink(argoEditorResource, true, t)}</span>
        </div>
      )
    }

    return (
      <div className="appDetails">
        {/* Application search/filter dropdown */}
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

        {/* Top pagination (only shown for large lists) */}
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

        {/* Application list accordion */}
        <Accordion>{appItems}</Accordion>

        {/* Bottom pagination (only shown for large lists) */}
        {this.props.argoAppList.length > 5 && (
          <Pagination
            itemCount={displayArgoAppList.length}
            perPage={perPage}
            page={page}
            widgetId="argoappdetails-pagination-options-menu-bottom"
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
