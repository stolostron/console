/* Copyright Contributors to the Open Cluster Management project */

import React, { Fragment, KeyboardEvent, MouseEvent, useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'
import { Button, Spinner, Tabs, Tab, TabTitleText } from '@patternfly/react-core'
import { createResourceSearchLink, getFilteredNode } from '../helpers/diagram-helpers'
import ClusterDetailsContainer from './ClusterDetailsContainer'
import ArgoAppDetailsContainer from './ArgoAppDetailsContainer'
import DetailsTable from './DetailsTable'
import { LogsContainer } from './LogsContainer'
import { YAMLContainer } from './YAMLContainer'
import {
  DetailsViewProps,
  DetailsViewDecoratorProps,
  DetailItemExtended,
  LinkValue,
  TopologyNodeWithStatus,
  StatusType,
  ResourceAction,
} from '../types'
import { typeToShapeMap } from '../model/NodeDetailsProvider'
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
function DetailsView(props: DetailsViewProps): JSX.Element {
  const {
    getLayoutNodes,
    selectedNodeId,
    nodes,
    t,
    activeTabKey: activeTabKeyProp,
    activeFilters,
    hubClusterName,
    processActionLink: processActionLinkProp,
    nodeDetailsProvider,
    clusterDetailsContainerControl,
    argoAppDetailsContainerControl,
  } = props

  const [isLoading, setIsLoading] = useState(false)
  const [linkID, setLinkID] = useState('')
  const [activeTabKey, setActiveTabKey] = useState(activeTabKeyProp ?? 0)
  const [filteredNode, setFilteredNode] = useState<TopologyNodeWithStatus | undefined>(undefined)

  useEffect(() => {
    setActiveTabKey(0)
  }, [selectedNodeId])

  useEffect(() => {
    setFilteredNode(undefined)
  }, [selectedNodeId, activeFilters, hubClusterName])

  const toggleLinkLoading = useCallback((): void => {
    setIsLoading((prev) => !prev)
  }, [])

  const processActionLink = useCallback(
    (value: LinkValue): void => {
      const { data } = value
      if (processActionLinkProp) {
        processActionLinkProp(data, toggleLinkLoading, hubClusterName ?? '')
      }
    },
    [processActionLinkProp, hubClusterName, toggleLinkLoading]
  )

  const handleClick = useCallback(
    (value: LinkValue): void => {
      setLinkID(value.id)
      processActionLink(value)
    },
    [processActionLink]
  )

  const handleKeyPressLink = useCallback(
    (value: LinkValue, e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        setLinkID(value.id)
        processActionLink(value)
      }
    },
    [processActionLink]
  )

  const handleTabClick = useCallback((_event: MouseEvent, tabIndex: number): void => {
    setActiveTabKey(tabIndex)
  }, [])

  const renderResourceURLLink = useCallback(
    (resource: { data: ResourceAction }, tf: TFunction, isLogURL = false): JSX.Element => {
      return (
        <div>
          <div className="spacer" />
          <span
            className="link sectionLabel"
            id="linkForNodeAction"
            tabIndex={0}
            role="button"
            onClick={() => processActionLink(resource as LinkValue)}
            onKeyDown={(e) => handleKeyPressLink(resource as LinkValue, e)}
            style={{ padding: '10px' }}
          >
            {isLogURL && tf('View logs in Search details')}
            {!isLogURL && tf('View YAML in Search details')}
            <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
              <use href="#drawerShapes_carbonLaunch" className="label-icon" />
            </svg>
          </span>
          <div className="spacer" />
        </div>
      )
    },
    [handleKeyPressLink, processActionLink]
  )

  const handleOpen = useCallback((node: TopologyNodeWithStatus, item: unknown): void => {
    setFilteredNode(getFilteredNode(node, item as { name: string; namespace: string; cluster: string }))
  }, [])

  const renderTabs = useCallback(
    (node: TopologyNodeWithStatus): JSX.Element => {
      const isLogTabHidden = node.type !== 'pod'
      const isYAMLTabHidden =
        node.type === 'cluster' || node.type === 'ocpapplication' || node.type === 'fluxapplication'

      return (
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, eventKey) =>
            handleTabClick(_event, typeof eventKey === 'number' ? eventKey : Number(eventKey))
          }
          mountOnEnter={true}
          unmountOnExit={true}
        >
          <Tab eventKey={0} title={<TabTitleText>{t('Details')}</TabTitleText>} isHidden={false} />
          <Tab eventKey={1} title={<TabTitleText>{t('Logs')}</TabTitleText>} isHidden={isLogTabHidden} />
          <Tab eventKey={2} title={<TabTitleText>{t('YAML')}</TabTitleText>} isHidden={isYAMLTabHidden} />
        </Tabs>
      )
    },
    [activeTabKey, handleTabClick, t]
  )

  const renderTableContents = useCallback(
    (node: TopologyNodeWithStatus): JSX.Element => {
      return (
        <DetailsTable
          id="details-view-table"
          node={node as never}
          handleOpen={(tableNode, item) => {
            handleOpen(tableNode as TopologyNodeWithStatus, item)
          }}
          t={t}
        />
      )
    },
    [handleOpen, t]
  )

  const renderLabel = useCallback(
    ({ labelValue, value, indent, status }: DetailItemExtended, tf: TFunction): JSX.Element => {
      const fillMap = new Map<StatusType, string>([
        ['checkmark', '#3E8635'],
        ['failure', '#C9190B'],
        ['warning', '#F0AB00'],
        ['pending', '#878D96'],
      ])

      const label = value !== undefined ? `${labelValue}:` : labelValue

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
        ksLabelBackground: label && label === `${tf('resource.labels')}:` ? true : false,
      })

      const statusIcon = status ? status : undefined
      const iconFill = statusIcon ? fillMap.get(statusIcon) : '#FFFFFF'

      return (
        <div className={mainSectionClasses} key={Math.random()}>
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

          {indent && <span className="indent" />}

          <span className={valueClass}>{value}</span>
        </div>
      )
    },
    []
  )

  const renderLink = useCallback(
    (linkDetail: DetailItemExtended | Record<string, unknown>): JSX.Element => {
      const { value } = linkDetail as { value?: LinkValue }

      if (!value) {
        return <div />
      }

      const loadingArgoLink = isLoading && value.id === linkID
      const onClick = () => handleClick(value)
      const onKeyPress = (e: KeyboardEvent) => handleKeyPressLink(value, e)

      const showLaunchOutIcon = !(value?.data?.specs?.isDesign ?? false)
      const isExternal =
        (value?.data?.action ?? '') !== 'show_search' && (value?.data?.action ?? '') !== 'show_resource_yaml'

      const label = value.labelValue || value.label

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
            onClick={onClick}
            onKeyPress={onKeyPress}
          >
            {loadingArgoLink && <Spinner size="sm" />}
            {label}

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
    },
    [handleClick, handleKeyPressLink, isLoading, linkID]
  )

  const renderSpacer = useCallback((): JSX.Element => {
    return (
      <div className="sectionContent" key={Math.random()}>
        <div className="spacer" />
      </div>
    )
  }, [])

  const renderClusterDetailComboBox = useCallback(
    ({ comboboxdata }: DetailItemExtended, tf: TFunction): JSX.Element => {
      if (!comboboxdata) {
        return <div />
      }

      return (
        <div className="sectionContent" key={Math.random()}>
          <ClusterDetailsContainer
            clusterList={comboboxdata.clusterList}
            clusterID={comboboxdata.clusterID}
            t={tf}
            clusterDetailsContainerControl={clusterDetailsContainerControl}
          />
        </div>
      )
    },
    [clusterDetailsContainerControl]
  )

  const renderRelatedArgoAppDetails = useCallback(
    ({ relatedargoappsdata }: DetailItemExtended, tf: TFunction): JSX.Element => {
      if (!relatedargoappsdata) {
        return <div />
      }

      return (
        <div className="sectionContent" key={Math.random()}>
          <ArgoAppDetailsContainer
            argoAppList={relatedargoappsdata.argoAppList}
            t={tf}
            argoAppDetailsContainerControl={argoAppDetailsContainerControl}
            hubClusterName={hubClusterName}
          />
        </div>
      )
    },
    [argoAppDetailsContainerControl, hubClusterName]
  )

  const renderDetail = useCallback(
    (detail: DetailItemExtended, tf: TFunction): JSX.Element | null => {
      switch (detail.type) {
        case 'spacer':
          return renderSpacer()
        case 'link':
          return renderLink(detail)
        case 'clusterdetailcombobox':
          return renderClusterDetailComboBox(detail, tf)
        case 'relatedargoappdetails':
          return renderRelatedArgoAppDetails(detail, tf)
        default:
          return renderLabel(detail, tf)
      }
    },
    [renderClusterDetailComboBox, renderLabel, renderLink, renderRelatedArgoAppDetails, renderSpacer]
  )

  const renderTabContents = useCallback(
    (node: TopologyNodeWithStatus): JSX.Element | JSX.Element[] => {
      const details =
        nodeDetailsProvider && typeof nodeDetailsProvider === 'function'
          ? nodeDetailsProvider(node, activeFilters, t, hubClusterName as string)
          : ([] as DetailItemExtended[])

      switch (activeTabKey) {
        case 0:
        default:
          return details.map((detail: DetailItemExtended) => renderDetail(detail, t)) as JSX.Element[]

        case 1:
          return <LogsContainer node={node} t={t} renderResourceURLLink={renderResourceURLLink} />

        case 2:
          return <YAMLContainer key={node.id} node={node} t={t} hubClusterName={hubClusterName as string} />
      }
    },
    [activeFilters, activeTabKey, hubClusterName, nodeDetailsProvider, renderDetail, renderResourceURLLink, t]
  )

  const currentNode =
    filteredNode || getLayoutNodes().find((n) => n.uid === selectedNodeId) || ({} as TopologyNodeWithStatus)
  let currentUpdatedNode = filteredNode || nodes.find((n) => n.uid === selectedNodeId)
  if (currentUpdatedNode && 'detailsNode' in currentUpdatedNode) {
    currentUpdatedNode = currentUpdatedNode.detailsNode as TopologyNodeWithStatus
  }

  const { layout = {} } = currentNode as { layout?: { type?: string } }
  const resourceType = (layout?.type as string) || currentNode.type || currentUpdatedNode?.type || ''

  const isTableView =
    ((currentNode as { specs?: { resourceCount?: number } }).specs?.resourceCount ?? 0) > 1 &&
    currentNode.type !== 'cluster' &&
    currentNode.type !== 'git' &&
    currentNode.type !== 'chart' &&
    currentNode.type !== 'application'

  const { shape = 'other', className = 'default' } =
    typeToShapeMap[String(resourceType) as keyof typeof typeToShapeMap] || {}

  let name = isTableView || currentNode.type === 'cluster' ? '' : currentNode.name
  if (!name) {
    name = (currentNode as { specs?: { raw?: { metadata?: { name?: string } } } }).specs?.raw?.metadata?.name ?? ''
  }

  const legend = getLegendTitle(resourceType)
  const searchLink = createResourceSearchLink(currentNode, t)

  return (
    <div className="topologyDetails" style={{ overflow: activeTabKey !== 2 ? 'auto' : 'hidden' }}>
      <div className="detailsHeader">
        {filteredNode && (
          <div style={{ margin: '0 0 20px 10px' }}>
            <Button onClick={() => setFilteredNode(undefined)} variant="link" isInline>
              {t('< Back to all {{resourceType}} resources', { resourceType })}
            </Button>
          </div>
        )}

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
                <div className="openSearchLink">{renderLink(searchLink)}</div>
              </Fragment>
            )}
          </div>
        </div>

        {!isTableView && renderTabs(currentNode)}
      </div>

      <section style={{ height: activeTabKey !== 2 ? undefined : '100%' }}>
        {isTableView ? renderTableContents(currentUpdatedNode!) : renderTabContents(currentUpdatedNode!)}
      </section>
    </div>
  )
}

export const getLegendTitle = (type: string) => {
  if (type === undefined) {
    return ''
  }
  return (type.charAt(0).toUpperCase() + type.slice(1))
    .replace('stream', ' Stream')
    .replace('channel', ' Channel')
    .replace('controller', 'Controller')
}

export default DetailsView
