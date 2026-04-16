/* Copyright Contributors to the Open Cluster Management project */

import React, { useCallback, useState, KeyboardEvent, SyntheticEvent } from 'react'
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
} from '../types'
import { TFunction } from 'react-i18next'

function buildInitialState(props: ClusterDetailsContainerProps): ClusterDetailsContainerState {
  const currentClusterID = props.clusterDetailsContainerControl.clusterDetailsContainerData.clusterID

  if (currentClusterID === props.clusterID) {
    return {
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
  }

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

  return {
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

/**
 * ClusterDetailsContainer component displays detailed information about clusters
 * in a paginated, searchable accordion format. It allows users to:
 * - Search and filter clusters using a typeahead select
 * - View cluster details including status, resources (CPU/Memory), and console links
 * - Navigate through clusters using pagination
 * - Expand/collapse individual cluster details
 */
function ClusterDetailsContainer(props: ClusterDetailsContainerProps): JSX.Element {
  const { clusterList, clusterDetailsContainerControl } = props
  const [state, setState] = useState<ClusterDetailsContainerState>(() => buildInitialState(props))

  const processActionLink = useCallback(
    (resource: ResourceAction): void => {
      const { t } = state
      processResourceActionLink(resource, () => {}, t, '')
    },
    [state]
  )

  const handleKeyPress = useCallback(
    (resource: ResourceAction, event: KeyboardEvent): void => {
      if (event.key === 'Enter') {
        processActionLink(resource)
      }
    },
    [processActionLink]
  )

  const handleSelection = useCallback(
    (selection: string | string[] | undefined): void => {
      const selectedValue = Array.isArray(selection) ? selection[0] : selection
      const { handleClusterDetailsContainerUpdate } = clusterDetailsContainerControl
      const { clusterID: stateClusterId } = state

      let selectedCluster: ClusterData | undefined
      let newClusterList: ClusterData[]

      if (selectedValue) {
        selectedCluster = clusterList.find((cls) =>
          cls.name ? cls.name === selectedValue : cls.metadata?.name === selectedValue
        )
        newClusterList = selectedCluster ? [selectedCluster] : []
      } else {
        newClusterList = clusterList
      }

      handleClusterDetailsContainerUpdate({
        page: 1,
        startIdx: 0,
        clusterSearchToggle: false,
        expandSectionToggleMap: new Set(),
        clusterID: stateClusterId || '',
        selected: selectedValue,
        selectedClusterList: newClusterList,
      })

      setState((prev) => ({
        ...prev,
        selected: selectedValue,
        clusterList: newClusterList,
        startIdx: 0,
        page: 1,
        expandSectionToggleMap: new Set(),
        clusterSearchToggle: false,
        selectedClusterList: newClusterList,
      }))
    },
    [clusterList, clusterDetailsContainerControl, state.clusterID]
  )

  const handleSelectionClear = useCallback((): void => {
    const { handleClusterDetailsContainerUpdate } = clusterDetailsContainerControl
    const { clusterID: stateClusterId } = state

    handleClusterDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID: stateClusterId || '',
      selected: undefined,
      selectedClusterList: [],
    })

    setState((prev) => ({
      ...prev,
      selected: undefined,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
      clusterList,
    }))
  }, [clusterDetailsContainerControl, clusterList, state.clusterID])

  const handleFirstClick = useCallback((): void => {
    const { handleClusterDetailsContainerUpdate } = clusterDetailsContainerControl
    const { clusterID: stateClusterId } = state

    handleClusterDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      clusterID: stateClusterId || '',
      selected: undefined,
      selectedClusterList: [],
    })

    setState((prev) => ({
      ...prev,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
    }))
  }, [clusterDetailsContainerControl, state.clusterID])

  const handleLastClick = useCallback((): void => {
    const { handleClusterDetailsContainerUpdate } = clusterDetailsContainerControl
    const { clusterList: list, perPage, clusterID: stateClusterId } = state

    let divResult = Math.floor(list.length / perPage)
    let lastPage = divResult
    const modResult = list.length % perPage

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
      clusterID: stateClusterId || '',
      selected: undefined,
      selectedClusterList: [],
    })

    setState((prev) => ({
      ...prev,
      startIdx: newStartIdx,
      page: lastPage,
      expandSectionToggleMap: new Set(),
    }))
  }, [clusterDetailsContainerControl, state.clusterID, state.clusterList, state.perPage])

  const handleNextClick = useCallback(
    (_event: SyntheticEvent<HTMLButtonElement>, currentPage: number): void => {
      const { handleClusterDetailsContainerUpdate } = clusterDetailsContainerControl
      const { perPage, startIdx, clusterID: stateClusterId } = state
      const newStartIdx = startIdx + perPage

      handleClusterDetailsContainerUpdate({
        page: currentPage,
        startIdx: newStartIdx,
        clusterSearchToggle: false,
        expandSectionToggleMap: new Set(),
        clusterID: stateClusterId || '',
        selected: undefined,
        selectedClusterList: [],
      })

      setState((prev) => ({
        ...prev,
        startIdx: newStartIdx,
        page: currentPage,
        expandSectionToggleMap: new Set(),
      }))
    },
    [clusterDetailsContainerControl, state.clusterID, state.perPage, state.startIdx]
  )

  const handlePreviousClick = useCallback(
    (_event: SyntheticEvent<HTMLButtonElement>, currentPage: number): void => {
      const { handleClusterDetailsContainerUpdate } = clusterDetailsContainerControl
      const { perPage, startIdx, clusterID: stateClusterId } = state
      const newStartIdx = startIdx - perPage

      handleClusterDetailsContainerUpdate({
        page: currentPage,
        startIdx: newStartIdx,
        clusterSearchToggle: false,
        expandSectionToggleMap: new Set(),
        clusterID: stateClusterId || '',
        selected: undefined,
        selectedClusterList: [],
      })

      setState((prev) => ({
        ...prev,
        startIdx: newStartIdx,
        page: currentPage,
        expandSectionToggleMap: new Set(),
      }))
    },
    [clusterDetailsContainerControl, state.clusterID, state.perPage, state.startIdx]
  )

  const handlePageInput = useCallback(
    (_event: KeyboardEvent<HTMLInputElement>, newPage: number): void => {
      const { handleClusterDetailsContainerUpdate } = clusterDetailsContainerControl
      const { perPage, clusterID: stateClusterId } = state
      const newStartIdx = (newPage - 1) * perPage

      handleClusterDetailsContainerUpdate({
        page: newPage,
        startIdx: newStartIdx,
        clusterSearchToggle: false,
        expandSectionToggleMap: new Set(),
        clusterID: stateClusterId || '',
        selected: undefined,
        selectedClusterList: [],
      })

      setState((prev) => ({
        ...prev,
        startIdx: newStartIdx,
        page: newPage,
        expandSectionToggleMap: new Set(),
      }))
    },
    [clusterDetailsContainerControl, state.clusterID, state.perPage]
  )

  const handleExpandSectionToggle = useCallback(
    (itemNum: number): void => {
      const { handleClusterDetailsContainerUpdate } = clusterDetailsContainerControl
      const {
        page,
        startIdx,
        clusterSearchToggle,
        expandSectionToggleMap,
        clusterID: stateClusterId,
        selected,
        selectedClusterList,
      } = state

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
        clusterID: stateClusterId || '',
        selected,
        selectedClusterList,
      })

      setState((prev) => ({
        ...prev,
        expandSectionToggleMap: newExpandSectionToggleMap,
      }))
    },
    [clusterDetailsContainerControl, state]
  )

  const renderConsoleURLLink = useCallback(
    (consoleURL: string | undefined, resource: ResourceAction, tf: TFunction): JSX.Element | null => {
      return consoleURL ? (
        <div className="sectionContent borderLeft">
          <span
            className="link sectionLabel"
            id="linkForNodeAction"
            tabIndex={0}
            role="button"
            onClick={() => processActionLink(resource)}
            onKeyDown={(event) => handleKeyPress(resource, event)}
          >
            {tf('Open cluster console')}
            <svg width="12px" height="12px" style={{ marginLeft: '8px', stroke: '#0066CC' }}>
              <use href="#drawerShapes_carbonLaunch" className="label-icon" />
            </svg>
          </span>
        </div>
      ) : null
    },
    [handleKeyPress, processActionLink]
  )

  const renderCPUData = useCallback(
    (
      cc: string | undefined,
      ac: string | undefined,
      divClass: string,
      labelClass: string,
      tf: TFunction,
      valueClass: string
    ): JSX.Element | null => {
      const showData = ac && ac !== ''

      return showData ? (
        <div className={divClass}>
          <span className={labelClass}>{tf('CPU')}: </span>
          <span className={valueClass}>
            {getPercentage(
              inflateKubeValue(typeof ac === 'string' ? ac : String(ac || 0)),
              inflateKubeValue(typeof cc === 'string' ? cc : String(cc || 0))
            )}
            %
          </span>
        </div>
      ) : null
    },
    []
  )

  const renderMemoryData = useCallback(
    (
      cm: string | undefined,
      am: string | undefined,
      divClass: string,
      labelClass: string,
      tf: TFunction,
      valueClass: string
    ): JSX.Element | null => {
      const showData = am && am !== ''

      return showData ? (
        <div className={divClass}>
          <span className={labelClass}>{tf('Memory')}: </span>
          <span className={valueClass}>
            {getPercentage(
              inflateKubeValue(typeof am === 'string' ? am : String(am || 0)),
              inflateKubeValue(typeof cm === 'string' ? cm : String(cm || 0))
            )}
            %
          </span>
        </div>
      ) : null
    },
    []
  )

  const calculateClusterStatus = useCallback((clusterData: ClusterData): string => {
    let status: string
    const clusterAccepted = clusterData.HubAcceptedManagedCluster
    const clusterJoined = clusterData.ManagedClusterJoined
    const clusterAvailable = clusterData.ManagedClusterConditionAvailable

    if (clusterAccepted !== 'True') {
      status = 'notaccepted'
    } else if (clusterJoined !== 'True') {
      status = 'pendingimport'
    } else {
      status = clusterAvailable && clusterAvailable === 'True' ? 'ok' : 'offline'
    }

    return status
  }, [])

  const mapClusterStatusToIcon = useCallback((status: string): ClusterStatusIcon => {
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
  }, [])

  const renderClusterStatusIcon = useCallback((icon: ClusterStatusIcon): JSX.Element => {
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
  }, [])

  const {
    selected,
    clusterList: stateClusterList,
    page,
    perPage,
    startIdx,
    t,
    expandSectionToggleMap,
    selectedClusterList,
  } = state

  const titleId = 'cluster-select-id-1'
  const findClusterMsg = 'Find cluster'
  const clusterItems: JSX.Element[] = []
  const divClass = 'sectionContent borderLeft'
  const labelClass = 'label sectionLabel'
  const valueClass = 'value'
  const solidLineStyle = '1px solid #D2D2D2'

  const displayClusterList = selected ? selectedClusterList : stateClusterList

  for (let i = startIdx; i < displayClusterList.length && i < page * perPage; i++) {
    const cluster = displayClusterList[i]
    const { metadata = {}, capacity = {}, allocatable = {}, consoleURL } = cluster

    const status = cluster.status || calculateClusterStatus(cluster) || 'unknown'
    const statusIcon = mapClusterStatusToIcon(status)
    const clusterName = cluster.name || (metadata as { name?: string })?.name || ''
    const clusterNamespace =
      cluster.namespace || cluster._clusterNamespace || (metadata as { namespace?: string })?.namespace || ''
    const creationTimestamp =
      cluster.creationTimestamp || (metadata as { creationTimestamp?: string })?.creationTimestamp
    const cc = cluster.cpu ? cluster.cpu.toString() : capacity.cpu
    const cm = cluster.memory ? cluster.memory.toString() : capacity.memory
    const am = allocatable.memory || ''
    const ac = allocatable.cpu || ''

    const resource: ResourceAction = {
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
        <AccordionItem isExpanded={expandSectionToggleMap.has(toggleItemNum)}>
          <AccordionToggle onClick={() => handleExpandSectionToggle(toggleItemNum)} id={clusterName}>
            {renderClusterStatusIcon(statusIcon)}
            <span style={{ paddingRight: '10px' }} />
            {clusterName}
          </AccordionToggle>
          <AccordionContent>
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
            {renderConsoleURLLink(consoleURL, resource, t)}
            <div className={divClass}>
              <span className={labelClass}>{t('Status')}: </span>
              <span className={valueClass}>{status.toLowerCase()}</span>
            </div>
            {renderCPUData(cc, ac, divClass, labelClass, t, valueClass)}
            {renderMemoryData(cm, am, divClass, labelClass, t, valueClass)}
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
        onSelect={handleSelection}
        selections={selected}
        aria-label={findClusterMsg}
        aria-labelledby={titleId}
        placeholderText={findClusterMsg}
        onClear={handleSelectionClear}
      >
        {clusterList.map((cluster) => (
          <SelectOption key={cluster.name || cluster.metadata?.name} value={cluster.name || cluster.metadata?.name} />
        ))}
      </AcmSelectBase>

      <div className="spacer" />

      {clusterList.length > 5 && (
        <Pagination
          itemCount={displayClusterList.length}
          perPage={perPage}
          page={page}
          widgetId="pagination-options-menu-top"
          onFirstClick={handleFirstClick}
          onLastClick={handleLastClick}
          onNextClick={handleNextClick}
          onPreviousClick={handlePreviousClick}
          onPageInput={handlePageInput}
        />
      )}

      <div className="spacer" />

      <Accordion>{clusterItems}</Accordion>

      {clusterList.length > 5 && (
        <Pagination
          itemCount={displayClusterList.length}
          perPage={perPage}
          page={page}
          widgetId="pagination-options-menu-bottom"
          onFirstClick={handleFirstClick}
          onLastClick={handleLastClick}
          onNextClick={handleNextClick}
          onPreviousClick={handlePreviousClick}
          onPageInput={handlePageInput}
        />
      )}
    </div>
  )
}

export default ClusterDetailsContainer
