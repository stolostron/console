/* Copyright Contributors to the Open Cluster Management project */

import React, { useCallback, useState } from 'react'
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

import type {
  ArgoAppDetailsContainerProps,
  ArgoAppDetailsContainerState,
  ArgoStatusIcon,
  ArgoResourceAction,
  NodeLike,
  ArgoApp,
} from '../types'
import { TFunction } from 'react-i18next'

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
function ArgoAppDetailsContainer(props: ArgoAppDetailsContainerProps): JSX.Element {
  const { argoAppList, t, argoAppDetailsContainerControl, hubClusterName } = props

  const [state, setState] = useState<ArgoAppDetailsContainerState>(() => ({
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
  }))

  const toggleLinkLoading = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      isLoading: !prev.isLoading,
    }))
  }, [])

  const processActionLink = useCallback(
    (resource: ArgoResourceAction): void => {
      processResourceActionLink(resource, toggleLinkLoading, t, hubClusterName || '')
    },
    [hubClusterName, t, toggleLinkLoading]
  )

  const handleExpandSectionToggle = useCallback(
    (itemNum: number): void => {
      const { handleArgoAppDetailsContainerUpdate } = argoAppDetailsContainerControl
      const { page, startIdx, argoAppSearchToggle, expandSectionToggleMap, selected, selectedArgoAppList, isLoading } =
        state

      const nextMap = new Set(expandSectionToggleMap)
      if (!nextMap.has(itemNum)) {
        nextMap.add(itemNum)
      } else {
        nextMap.delete(itemNum)
      }

      handleArgoAppDetailsContainerUpdate({
        page,
        startIdx,
        argoAppSearchToggle,
        expandSectionToggleMap: nextMap,
        selected,
        selectedArgoAppList,
        isLoading,
      })

      setState((prev) => ({
        ...prev,
        expandSectionToggleMap: nextMap,
      }))
    },
    [argoAppDetailsContainerControl, state]
  )

  const handleSelection = useCallback(
    (selection: string | string[] | null): void => {
      const { handleArgoAppDetailsContainerUpdate } = argoAppDetailsContainerControl
      const { isLoading } = state

      const selectedVal =
        selection == null ? undefined : Array.isArray(selection) ? selection[0] : selection

      let selectedApp: ArgoApp | undefined
      let newArgoAppList: ArgoApp[]

      if (selectedVal) {
        selectedApp = argoAppList.find((app) => app.name === selectedVal)
        newArgoAppList = selectedApp ? [selectedApp] : []
      } else {
        newArgoAppList = argoAppList
      }

      handleArgoAppDetailsContainerUpdate({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: selectedVal,
        selectedArgoAppList: newArgoAppList,
        isLoading,
      })

      setState((prev) => ({
        ...prev,
        selected: selectedVal,
        argoAppList: newArgoAppList,
        startIdx: 0,
        page: 1,
        expandSectionToggleMap: new Set(),
        argoAppSearchToggle: false,
        selectedArgoAppList: newArgoAppList,
      }))
    },
    [argoAppDetailsContainerControl, argoAppList, state.isLoading]
  )

  const handleSelectionClear = useCallback((): void => {
    const { handleArgoAppDetailsContainerUpdate } = argoAppDetailsContainerControl
    const { isLoading } = state

    handleArgoAppDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: undefined,
      selectedArgoAppList: [],
      isLoading,
    })

    setState((prev) => ({
      ...prev,
      selected: undefined,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
      argoAppList,
    }))
  }, [argoAppDetailsContainerControl, argoAppList, state.isLoading])

  const handleFirstClick = useCallback((): void => {
    const { handleArgoAppDetailsContainerUpdate } = argoAppDetailsContainerControl
    const { isLoading } = state

    handleArgoAppDetailsContainerUpdate({
      page: 1,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selected: undefined,
      selectedArgoAppList: [],
      isLoading,
    })

    setState((prev) => ({
      ...prev,
      startIdx: 0,
      page: 1,
      expandSectionToggleMap: new Set(),
    }))
  }, [argoAppDetailsContainerControl, state.isLoading])

  const handleLastClick = useCallback((): void => {
    const { handleArgoAppDetailsContainerUpdate } = argoAppDetailsContainerControl
    const { argoAppList: list, perPage, isLoading } = state

    let divResult = Math.floor(list.length / perPage)
    let lastPage = divResult
    const modResult = list.length % perPage

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

    setState((prev) => ({
      ...prev,
      startIdx: newStartIdx,
      page: lastPage,
      expandSectionToggleMap: new Set(),
    }))
  }, [argoAppDetailsContainerControl, state.argoAppList, state.isLoading, state.perPage])

  const handleNextClick = useCallback(
    (_event: React.SyntheticEvent<HTMLButtonElement>, currentPage: number): void => {
      const { handleArgoAppDetailsContainerUpdate } = argoAppDetailsContainerControl
      const { perPage, startIdx, isLoading } = state
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

      setState((prev) => ({
        ...prev,
        startIdx: newStartIdx,
        page: currentPage,
        expandSectionToggleMap: new Set(),
      }))
    },
    [argoAppDetailsContainerControl, state.isLoading, state.perPage, state.startIdx]
  )

  const handlePreviousClick = useCallback(
    (_event: React.SyntheticEvent<HTMLButtonElement>, currentPage: number): void => {
      const { handleArgoAppDetailsContainerUpdate } = argoAppDetailsContainerControl
      const { perPage, startIdx, isLoading } = state
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

      setState((prev) => ({
        ...prev,
        startIdx: newStartIdx,
        page: currentPage,
        expandSectionToggleMap: new Set(),
      }))
    },
    [argoAppDetailsContainerControl, state.isLoading, state.perPage, state.startIdx]
  )

  const handlePageInput = useCallback(
    (_event: React.FormEvent, newPage: number): void => {
      const { handleArgoAppDetailsContainerUpdate } = argoAppDetailsContainerControl
      const { perPage, isLoading } = state
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

      setState((prev) => ({
        ...prev,
        startIdx: newStartIdx,
        page: newPage,
        expandSectionToggleMap: new Set(),
      }))
    },
    [argoAppDetailsContainerControl, state.isLoading, state.perPage]
  )

  const handleKeyPress = useCallback(
    (resource: ArgoResourceAction, _event: React.KeyboardEvent): void => {
      if (_event.key === 'Enter') {
        processActionLink(resource)
      }
    },
    [processActionLink]
  )

  const renderURLLink = useCallback(
    (resource: ArgoResourceAction, isExternal: boolean, tf: TFunction): JSX.Element => {
      return (
        <span
          className="link sectionLabel"
          id="linkForNodeAction"
          tabIndex={0}
          role="button"
          onClick={() => processActionLink(resource)}
          onKeyDown={(event) => handleKeyPress(resource, event)}
        >
          {resource.action === 'open_argo_editor' ? tf('Launch Argo editor') : tf('View resource YAML')}
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
    },
    [handleKeyPress, processActionLink]
  )

  const mapArgoStatusToStatusIcon = useCallback((status: string): ArgoStatusIcon => {
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
  }, [])

  const renderArgoAppStatusIcon = useCallback((icon: ArgoStatusIcon): JSX.Element => {
    const fillMap = new Map<ArgoStatusIcon, string>([
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

  const renderErrorMessage = useCallback((name: string, status: string, tf: TFunction): JSX.Element | null => {
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
          <span>{tf('Health status')}: </span>
        </span>
        <span className="value">
          {tf(
            'The health status for application {{0}} is {{1}}. Use the Launch Argo editor action above to view the application details.',
            [name, status]
          )}
        </span>
      </div>
    )
  }, [])

  const { selected, argoAppList: stateArgoList, page, perPage, startIdx, expandSectionToggleMap, selectedArgoAppList } =
    state

  const titleId = 'app-select-id-1'
  const findAppMsg = 'Find application'
  const appItems: JSX.Element[] = []
  const divClass = 'sectionContent borderLeft'
  const labelClass = 'label sectionLabel'
  const valueClass = 'value'
  const solidLineStyle = '1px solid #D2D2D2'

  const displayArgoAppList = selected ? selectedArgoAppList : stateArgoList

  const argoEditorLinkStyle: React.CSSProperties = {
    display: 'block',
  }

  for (let i = startIdx; i < displayArgoAppList.length && i < page * perPage; i++) {
    const { name, cluster, namespace, destinationName, destinationNamespace, healthStatus } = displayArgoAppList[i]
    const statusIcon = mapArgoStatusToStatusIcon(healthStatus)

    const parentDivStyle: React.CSSProperties =
      i === startIdx
        ? {
            borderTop: solidLineStyle,
            borderBottom: solidLineStyle,
          }
        : { borderBottom: solidLineStyle }

    const toggleItemNum = i % perPage

    const argoEditorResource: ArgoResourceAction = {
      action: 'open_argo_editor',
      cluster: cluster,
      namespace: namespace,
      name: name,
    }

    const outerArgoEditorLinkStyle = expandSectionToggleMap.has(toggleItemNum)
      ? { display: 'none' }
      : argoEditorLinkStyle

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

    const editLink = createEditLink(searchResultToNode, hubClusterName || '')

    const appResourceYaml: ArgoResourceAction = {
      action: 'show_resource_yaml',
      editLink,
    }

    appItems.push(
      <div className="appDetailItem" style={parentDivStyle} key={`${name}${i}`}>
        <AccordionItem isExpanded={expandSectionToggleMap.has(toggleItemNum)}>
          <AccordionToggle onClick={() => handleExpandSectionToggle(toggleItemNum)} id={name}>
            {renderArgoAppStatusIcon(statusIcon)}
            <span style={{ paddingRight: '10px' }} />
            {name}
          </AccordionToggle>
          <AccordionContent>
            <span style={argoEditorLinkStyle}>{renderURLLink(argoEditorResource, true, t)}</span>
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

            <div className={divClass}>{renderURLLink(appResourceYaml, false, t)}</div>
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

            {renderErrorMessage(name, healthStatus, t)}
          </AccordionContent>
        </AccordionItem>

        <span style={outerArgoEditorLinkStyle}>{renderURLLink(argoEditorResource, true, t)}</span>
      </div>
    )
  }

  return (
    <div className="appDetails">
      <AcmSelectBase
        variant={SelectVariant.typeahead}
        aria-label={findAppMsg}
        aria-labelledby={titleId}
        onSelect={handleSelection}
        selections={selected}
        placeholderText={findAppMsg}
        onClear={handleSelectionClear}
      >
        {argoAppList.map((app) => (
          <SelectOption key={app.name} value={app.name} />
        ))}
      </AcmSelectBase>

      <div className="spacer" />

      {argoAppList.length > 5 && (
        <Pagination
          itemCount={displayArgoAppList.length}
          perPage={perPage}
          page={page}
          widgetId="argoappdetails-pagination-options-menu-top"
          onFirstClick={handleFirstClick}
          onLastClick={handleLastClick}
          onNextClick={handleNextClick}
          onPreviousClick={handlePreviousClick}
          onPageInput={handlePageInput}
        />
      )}

      <div className="spacer" />

      <Accordion>{appItems}</Accordion>

      {argoAppList.length > 5 && (
        <Pagination
          itemCount={displayArgoAppList.length}
          perPage={perPage}
          page={page}
          widgetId="argoappdetails-pagination-options-menu-bottom"
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

export default ArgoAppDetailsContainer
