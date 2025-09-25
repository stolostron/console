/* Copyright Contributors to the Open Cluster Management project */

import React, { Component, Fragment, KeyboardEvent, MouseEvent } from 'react'
import classNames from 'classnames'
import { Button, Spinner, Tabs, Tab, TabTitleText } from '@patternfly/react-core'
import { createResourceSearchLink, createResourceURL, getFilteredNode } from '../elements/helpers/diagram-helpers'
import ClusterDetailsContainer from './ClusterDetailsContainer'
import ArgoAppDetailsContainer from './ArgoAppDetailsContainer'
import DetailsTable from './DetailsTable'
import { LogsContainer } from './LogsContainer'
import { YAMLContainer } from './YAMLContainer'
import {
  DetailsViewProps,
  DetailsViewState,
  DetailsViewDecoratorProps,
  DetailItemExtended,
  LinkValue,
  TopologyNodeWithStatus,
  StatusType,
  ResourceAction,
} from '../types'
import { typeToShapeMap } from './DetailsViewHelper'
import { TFunction } from 'react-i18next'

/**
 * Decorator component that renders an icon for the details view header
 * Displays a circular background with a resource type icon
 */
const DetailsViewDecorator: React.FC<DetailsViewDecoratorProps> = ({ shape, className }) => {
  return (
    <div className="detailsIconContainer">
      <svg width="58px" height="58px" viewBox="0 0 58 58">
        <circle cx="29" cy="29" r="25" className={'pf-topology__node__background'} stroke="#a7a7a7" strokeWidth="1" />
        <use href={`#nodeIcon_${shape}`} className={`${className} detailsIcon`} />
      </svg>
    </div>
  )
}

/**
 * DetailsView component displays detailed information about a selected topology node
 * Supports multiple tabs for different views (Details, Logs, YAML)
 * Handles both single resource and table views for multiple resources
 */
class DetailsView extends Component<DetailsViewProps, DetailsViewState> {
  constructor(props: DetailsViewProps) {
    super(props)

    // Bind methods to maintain proper 'this' context
    this.toggleLinkLoading = this.toggleLinkLoading.bind(this)
    this.handleTabClick = this.handleTabClick.bind(this)

    this.state = {
      isLoading: false,
      linkID: '',
      activeTabKey: this.props.activeTabKey || 0,
      filteredNode: undefined,
    }
  }

  /**
   * Handles click events on action links
   * Sets the loading state and processes the action link
   */
  handleClick = (value: LinkValue): void => {
    this.setState({ linkID: value.id })
    this.processActionLink(value)
  }

  /**
   * Handles keyboard events on action links (Enter key)
   * Provides accessibility support for keyboard navigation
   */
  handleKeyPress = (value: LinkValue, e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      this.setState({ linkID: value.id })
      this.processActionLink(value)
    }
  }

  /**
   * Toggles the loading state for action links
   * Used as a callback for processActionLink operations
   */
  toggleLinkLoading(): void {
    this.setState((prevState) => ({
      isLoading: !prevState.isLoading,
    }))
  }

  /**
   * Processes action links by delegating to the parent component
   * Handles navigation to external resources, YAML editors, etc.
   */
  processActionLink(value: LinkValue): void {
    const { processActionLink, hubClusterName } = this.props
    const { data } = value
    if (processActionLink) {
      processActionLink(data, this.toggleLinkLoading, hubClusterName ?? '')
    }
  }

  /**
   * Handles tab click events to switch between different views
   * Updates the active tab in component state
   */
  handleTabClick = (_event: MouseEvent, tabIndex: number): void => {
    this.setState({
      activeTabKey: tabIndex,
    })
  }

  /**
   * Lifecycle method to reset tab when selected node changes
   * Ensures consistent UX when navigating between different nodes
   */
  componentDidUpdate(prevProps: DetailsViewProps): void {
    if (prevProps.selectedNodeId !== this.props.selectedNodeId) {
      this.setState({
        activeTabKey: 0,
      })
    }
  }

  /**
   * Renders a resource URL link that opens in Search details
   * Supports both log and YAML viewing modes
   */
  renderResourceURLLink = (resource: { data: ResourceAction }, t: TFunction, isLogURL = false): JSX.Element => {
    return (
      <div>
        <div className="spacer" />
        <span
          className="link sectionLabel"
          id="linkForNodeAction"
          tabIndex={0}
          role="button"
          onClick={() => this.processActionLink(resource as LinkValue)}
          onKeyDown={(e) => this.handleKeyPress(resource as LinkValue, e)}
          style={{ padding: '10px' }}
        >
          {isLogURL && t('View logs in Search details')}
          {!isLogURL && t('View YAML in Search details')}
          <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
            <use href="#drawerShapes_carbonLaunch" className="label-icon" />
          </svg>
        </span>
        <div className="spacer" />
      </div>
    )
  }

  /**
   * Legacy lifecycle method - resets filtered node state
   * @deprecated This method is unsafe and should be replaced with componentDidUpdate
   */
  UNSAFE_componentWillReceiveProps(): void {
    this.setState({ filteredNode: undefined })
  }

  /**
   * Main render method for the DetailsView component
   * Determines whether to show table view or tabbed view based on resource count
   */
  render(): JSX.Element {
    const { filteredNode, activeTabKey } = this.state
    const { getLayoutNodes, selectedNodeId, nodes, t } = this.props

    // Get the current node from layout or nodes array
    const currentNode =
      filteredNode || getLayoutNodes().find((n) => n.uid === selectedNodeId) || ({} as TopologyNodeWithStatus)
    const currentUpdatedNode = filteredNode || nodes.find((n) => n.uid === selectedNodeId)

    const { layout = {} } = currentNode as any
    const resourceType = (layout?.type as string) || currentNode.type || currentUpdatedNode?.type || ''

    // Determine if we should show table view (multiple resources) or single resource view
    const isTableView =
      ((currentNode as any)?.specs?.resourceCount ?? 0) > 1 &&
      currentNode.type !== 'cluster' &&
      currentNode.type !== 'application'

    // Get shape and styling information for the resource type
    const { shape = 'other', className = 'default' } =
      typeToShapeMap[String(resourceType) as keyof typeof typeToShapeMap] || {}

    // Determine the display name for the resource
    let name = isTableView || currentNode.type === 'cluster' ? '' : currentNode.name
    if (!name) {
      name = (currentNode as any)?.specs?.raw?.metadata?.name ?? ''
    }

    const legend = getLegendTitle(resourceType)
    const searchLink = createResourceSearchLink(currentNode, t)

    return (
      <div className="topologyDetails" style={{ overflow: activeTabKey !== 2 ? 'auto' : 'hidden' }}>
        <div className="detailsHeader">
          {/* Back button when viewing filtered node details */}
          {filteredNode && (
            <div style={{ margin: '0 0 20px 10px' }}>
              <Button onClick={() => this.setState({ filteredNode: undefined })} variant="link" isInline>
                {t('< Back to all {{resourceType}} resources', [resourceType])}
              </Button>
            </div>
          )}

          {/* Header with icon, title, and search link */}
          <div className="innerDetailsHeader">
            <DetailsViewDecorator shape={shape} className={className} />
            <div>
              <div className="sectionContent">
                <span className="label">{legend}</span>
              </div>
              {!isTableView && (
                <Fragment>
                  <div className="sectionContent">
                    <span className="titleNameText">{name}</span>
                  </div>
                  <div className="openSearchLink">{this.renderLink(searchLink)}</div>
                </Fragment>
              )}
            </div>
          </div>

          {/* Tabs for single resource view */}
          {!isTableView && this.renderTabs(currentNode)}
        </div>

        {/* Content area - either table or tabbed content */}
        <section style={{ height: activeTabKey !== 2 ? undefined : '100%' }}>
          {isTableView ? this.renderTableContents(currentUpdatedNode!) : this.renderTabContents(currentUpdatedNode!)}
        </section>
      </div>
    )
  }

  /**
   * Handles opening filtered node details from table view
   * Sets the filtered node state to show specific resource details
   */
  handleOpen = (node: TopologyNodeWithStatus, item: any): void => {
    const filteredNode = getFilteredNode(node, item)
    this.setState({ filteredNode })
  }

  /**
   * Renders the tab navigation for single resource view
   * Shows/hides tabs based on resource type capabilities
   */
  renderTabs(node: TopologyNodeWithStatus): JSX.Element {
    const { t } = this.props

    // Determine which tabs should be hidden based on resource type
    const isLogTabHidden = node.type !== 'pod'
    const isYAMLTabHidden = node.type === 'cluster' || node.type === 'ocpapplication' || node.type === 'fluxapplication'
    const { activeTabKey } = this.state

    return (
      <Tabs
        activeKey={activeTabKey}
        onSelect={(_event, eventKey) =>
          this.handleTabClick(_event, typeof eventKey === 'number' ? eventKey : Number(eventKey))
        }
        mountOnEnter={true}
        unmountOnExit={true}
      >
        <Tab eventKey={0} title={<TabTitleText>{t('Details')}</TabTitleText>} isHidden={false} />
        <Tab eventKey={1} title={<TabTitleText>{t('Logs')}</TabTitleText>} isHidden={isLogTabHidden} />
        <Tab eventKey={2} title={<TabTitleText>{t('YAML')}</TabTitleText>} isHidden={isYAMLTabHidden} />
      </Tabs>
    )
  }

  /**
   * Renders table contents for resources with multiple items
   * Uses DetailsTable component to display resource list
   */
  renderTableContents(node: TopologyNodeWithStatus): JSX.Element {
    const { t } = this.props
    // Adapt node and item types to match DetailsTable's expected props
    // DetailsTable expects node: DetailsTableNode and handleOpen: (node: DetailsTableNode, item: DetailsTableResourceItem) => void
    // We'll cast node to DetailsTableNode for compatibility
    return (
      <DetailsTable
        id="details-view-table"
        node={node as any} // Type cast to satisfy DetailsTable's prop type
        handleOpen={(tableNode, item) => {
          // tableNode is DetailsTableNode, but our handleOpen expects TopologyNodeWithStatus
          // We'll cast back to TopologyNodeWithStatus for compatibility
          this.handleOpen(tableNode as TopologyNodeWithStatus, item)
        }}
        t={t}
      />
    )
  }

  /**
   * Renders tab contents based on the currently active tab
   * Switches between Details, Logs, and YAML views
   */
  renderTabContents(node: TopologyNodeWithStatus): JSX.Element | JSX.Element[] {
    const { activeFilters, t, hubClusterName, options } = this.props
    const selectedNodeId = node.id

    // Get detailed information for the node
    const details =
      options && typeof options.getNodeDetails === 'function'
        ? options.getNodeDetails(node, activeFilters, t, hubClusterName as string)
        : []
    const name = node.type === 'cluster' ? '' : node.name
    const yamlURL = createResourceURL(node, t)
    const { namespace, type } = node
    const { activeTabKey } = this.state

    // Render content based on active tab
    switch (activeTabKey) {
      case 0: // Details tab
      default:
        return details.map((detail) => this.renderDetail(detail as DetailItemExtended, t)) as unknown as JSX.Element[]

      case 1: // Logs tab
        return <LogsContainer node={node} t={t} renderResourceURLLink={this.renderResourceURLLink} />

      case 2: // YAML tab
        {
          // Render the resource URL link for YAML viewing
          this.renderResourceURLLink(
            { data: { action: 'open_link', targetLink: yamlURL, name, namespace, kind: type } },
            t
          )
        }
        return <YAMLContainer key={selectedNodeId} node={node} t={t} hubClusterName={hubClusterName as string} />
    }
  }

  /**
   * Renders individual detail items based on their type
   * Supports various detail types: labels, links, snippets, etc.
   */
  renderDetail = (detail: DetailItemExtended, t: TFunction): JSX.Element | null => {
    switch (detail.type) {
      case 'spacer':
        return this.renderSpacer()
      case 'link':
        return this.renderLink(detail)
      case 'clusterdetailcombobox':
        return this.renderClusterDetailComboBox(detail, t)
      case 'relatedargoappdetails':
        return this.renderRelatedArgoAppDetails(detail, t)
      default:
        return this.renderLabel(detail, t)
    }
  }

  /**
   * Renders label details with optional status icons and values
   * Supports different styling based on label type and status
   */
  renderLabel = ({ labelValue, value, indent, status }: DetailItemExtended, t: TFunction): JSX.Element => {
    // Map status types to fill colors for status icons
    const fillMap = new Map<StatusType, string>([
      ['checkmark', '#3E8635'],
      ['failure', '#C9190B'],
      ['warning', '#F0AB00'],
      ['pending', '#878D96'],
    ])

    const label = value !== undefined ? `${labelValue}:` : labelValue // Add colon for non-empty values

    // Dynamic CSS classes based on content and structure
    const mainSectionClasses = classNames({
      sectionContent: true,
      borderLeft: value !== undefined ? true : false,
    })

    const labelClass = classNames({
      label: true,
      sectionLabel: value ? true : false,
    })

    const valueClass = classNames({
      value: true,
      ksLabelBackground: label && label === `${t('resource.labels')}:` ? true : false,
    })

    const statusIcon = status ? status : undefined
    const iconFill = statusIcon ? fillMap.get(statusIcon) : '#FFFFFF'

    return (
      <div className={mainSectionClasses} key={Math.random()}>
        {/* Label with optional status icon */}
        {labelValue && statusIcon ? (
          <span className="label sectionLabel">
            <svg width="10px" height="10px" fill={iconFill} style={{ marginRight: '8px' }}>
              <use href={`#drawerShapes_${statusIcon}`} className="label-icon" />
            </svg>
            <span>{label} </span>
          </span>
        ) : (
          <span className={labelClass}>{label} </span>
        )}

        {/* Optional indentation */}
        {indent && <span className="indent" />}

        {/* Value content */}
        <span className={valueClass}>{value}</span>
      </div>
    )
  }

  /**
   * Renders clickable links with loading states and external link indicators
   * Supports both internal navigation and external resource links
   */
  renderLink = (linkDetail: DetailItemExtended | any): JSX.Element => {
    const { value } = linkDetail

    if (!value) {
      return <div />
    }

    const { isLoading, linkID } = this.state
    const loadingArgoLink = isLoading && value.id === linkID
    const handleClick = () => this.handleClick(value)
    const handleKeyPress = (e: KeyboardEvent) => this.handleKeyPress(value, e)

    // Determine if we should show launch icon (not for design/YAML views)
    const showLaunchOutIcon = !(value?.data?.specs?.isDesign ?? false)
    const isExternal =
      (value?.data?.action ?? '') !== 'show_search' && (value?.data?.action ?? '') !== 'show_resource_yaml'

    const label = value.labelValue || value.label

    // Dynamic CSS classes for link styling
    const mainSectionClasses = classNames({
      sectionContent: true,
      borderLeft: linkDetail.indent ? true : false,
    })

    const linkLabelClasses = classNames({
      link: true,
      sectionLabel: linkDetail.indent ? true : false,
    })

    return (
      <div className={mainSectionClasses} key={Math.random()}>
        <span
          className={`${linkLabelClasses} ${loadingArgoLink ? 'loadingLink' : ''}`}
          id="linkForNodeAction"
          tabIndex={0}
          role={'button'}
          onClick={handleClick}
          onKeyPress={handleKeyPress}
        >
          {/* Loading spinner for active links */}
          {loadingArgoLink && <Spinner size="sm" />}
          {label}

          {/* External link indicators */}
          {showLaunchOutIcon &&
            (isExternal ? (
              <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
                <use href="#drawerShapes_carbonLaunch" className="label-icon" />
              </svg>
            ) : (
              <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
                <use href="#drawerShapes_open-new-tab" className="label-icon" />
              </svg>
            ))}
        </span>
      </div>
    )
  }

  /**
   * Renders a spacer element for visual separation
   * Used to add whitespace between detail sections
   */
  renderSpacer = (): JSX.Element => {
    return (
      <div className="sectionContent" key={Math.random()}>
        <div className="spacer" />
      </div>
    )
  }

  /**
   * Renders cluster details combo box for cluster selection
   * Integrates with ClusterDetailsContainer for cluster management
   */
  renderClusterDetailComboBox = ({ comboboxdata }: DetailItemExtended, t: TFunction): JSX.Element => {
    const { clusterDetailsContainerControl } = this.props

    if (!comboboxdata) {
      return <div />
    }

    return (
      <div className="sectionContent" key={Math.random()}>
        <ClusterDetailsContainer
          clusterList={comboboxdata.clusterList}
          clusterID={comboboxdata.clusterID}
          t={t}
          clusterDetailsContainerControl={clusterDetailsContainerControl}
        />
      </div>
    )
  }

  /**
   * Renders related Argo application details
   * Integrates with ArgoAppDetailsContainer for Argo app management
   */
  renderRelatedArgoAppDetails = ({ relatedargoappsdata }: DetailItemExtended, t: TFunction): JSX.Element => {
    const { argoAppDetailsContainerControl, hubClusterName } = this.props

    if (!relatedargoappsdata) {
      return <div />
    }

    return (
      <div className="sectionContent" key={Math.random()}>
        <ArgoAppDetailsContainer
          argoAppList={relatedargoappsdata.argoAppList}
          t={t}
          argoAppDetailsContainerControl={argoAppDetailsContainerControl}
          hubClusterName={hubClusterName}
        />
      </div>
    )
  }
}

export const getLegendTitle = (type: string) => {
  if (type === undefined) {
    return ''
  }
  return (type.charAt(0).toUpperCase() + type.slice(1))
    .replace('stream', ' Stream')
    .replace('channel', ' Channel')
    .replace('controller', 'Controller')
  //}
}

export default DetailsView
