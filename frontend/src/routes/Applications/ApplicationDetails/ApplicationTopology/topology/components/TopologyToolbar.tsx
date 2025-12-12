/* Copyright Contributors to the Open Cluster Management project */
import {
  Alert,
  Badge,
  Button,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarToggleGroup,
} from '@patternfly/react-core'
import '../css/topology-toolbar.css'
import { FC, Ref, useEffect, useState } from 'react'
import { FilterIcon } from '@patternfly/react-icons'
import { TopologyProps } from '../Topology'
import LegendView from '../../components/LegendView'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import noop from 'lodash/noop'
import ChannelControl from '../../components/ChannelControl'
import { NavigationPath } from '../../../../../../NavigationPath'
import { useQuerySearchDisabledManagedClusters } from '../../../../../../lib/search'
import { useQuery } from '../../../../../../lib/useQuery'
//import { TopologyContext } from './TopologyContext'

const TopologyToolbar: FC<TopologyProps> = (topologyProps) => {
  const { t } = useTranslation()
  const { channelControl, setDrawerContent, elements, hubClusterName } = topologyProps
  const [isSearchDisabled, setIsSearchDisabled] = useState<boolean>(false)
  const [hasMultipleClusters] = useState<boolean>(false)
  const [hasMultipleApplications] = useState<boolean>(false)
  const clusterNodes = elements.nodes.filter((node) => node.type === 'cluster')
  const clusterNames = clusterNodes.map((clusterNode) => clusterNode.name)
  const queryDisabled = useQuerySearchDisabledManagedClusters()
  const { data, startPolling } = useQuery(queryDisabled)
  //   const options = useContext(TopologyContext)

  useEffect(startPolling, [startPolling])
  useEffect(() => {
    const clustersWithSearchDisabled = data?.[0]?.data?.searchResult?.[0]?.items || []
    const clusterWithDisabledSearch = new Set(clustersWithSearchDisabled.map((item: { name: string }) => item.name))
    const found = clusterNames.some((r) => clusterWithDisabledSearch.has(r))
    if (found) {
      setIsSearchDisabled(true)
    }
  }, [data, clusterNames])

  const [isStatusExpanded, setIsStatusExpanded] = useState(false)
  const [isRiskExpanded, setIsRiskExpanded] = useState(false)
  const [filters, setFilters] = useState({
    risk: ['Low'],
    status: ['New', 'Pending'],
  })

  // const onSelect = (type: string, event: MouseEvent | ChangeEvent, selection: string) => {
  //   const checked = (event.target as HTMLInputElement).checked
  //   setFilters((prev) => {
  //     if (type === 'risk' || type === 'status') {
  //       const prevSelections = prev[type]
  //       return {
  //         ...prev,
  //         [type]: checked
  //           ? [...prevSelections, selection]
  //           : prevSelections.filter((value: string) => value !== selection),
  //       }
  //     }
  //     return prev
  //   })
  // }

  // const onStatusSelect = (event: MouseEvent | ChangeEvent, selection: string) => {
  //   onSelect('status', event, selection)
  // }

  // const onRiskSelect = (event: MouseEvent | ChangeEvent, selection: string) => {
  //   onSelect('risk', event, selection)
  // }

  const onDelete = (type: string, id: string) => {
    if (type === 'Clusters') {
      setFilters({ risk: filters.risk.filter((fil: string) => fil !== id), status: filters.status })
    } else if (type === 'Applications') {
      setFilters({ risk: filters.risk, status: filters.status.filter((fil: string) => fil !== id) })
    } else {
      setFilters({ risk: [], status: [] })
    }
  }

  const onDeleteGroup = (type: string) => {
    if (type === 'Clusters') {
      setFilters({ risk: [], status: filters.status })
    } else if (type === 'Applications') {
      setFilters({ risk: filters.risk, status: [] })
    }
  }

  const onStatusToggle = () => {
    setIsStatusExpanded(!isStatusExpanded)
  }

  const onRiskToggle = () => {
    setIsRiskExpanded(!isRiskExpanded)
  }

  const statusMenuItems = (
    <SelectList>
      <SelectOption hasCheckbox key="statusNew" value="New" isSelected={filters.status.includes('New')}>
        New
      </SelectOption>
      <SelectOption hasCheckbox key="statusPending" value="Pending" isSelected={filters.status.includes('Pending')}>
        Pending
      </SelectOption>
      <SelectOption hasCheckbox key="statusRunning" value="Running" isSelected={filters.status.includes('Running')}>
        Running
      </SelectOption>
      <SelectOption
        hasCheckbox
        key="statusCancelled"
        value="Cancelled"
        isSelected={filters.status.includes('Cancelled')}
      >
        Cancelled
      </SelectOption>
    </SelectList>
  )

  const riskMenuItems = (
    <SelectList>
      <SelectOption hasCheckbox key="riskLow" value="Low" isSelected={filters.risk.includes('Low')}>
        Low
      </SelectOption>
      <SelectOption hasCheckbox key="riskMedium" value="Medium" isSelected={filters.risk.includes('Medium')}>
        Medium
      </SelectOption>
      <SelectOption hasCheckbox key="riskHigh" value="High" isSelected={filters.risk.includes('High')}>
        High
      </SelectOption>
    </SelectList>
  )

  const toggleGroupItems = (
    <>
      <ToolbarGroup variant="filter-group">
        {hasMultipleClusters && (
          <ToolbarFilter
            chips={filters.status}
            deleteChip={(category, chip) => onDelete(category as string, chip as string)}
            deleteChipGroup={(category) => onDeleteGroup(category as string)}
            categoryName="Applications"
          >
            <Select
              aria-label="Applications"
              role="menu"
              toggle={(toggleRef: Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef} onClick={onStatusToggle} isExpanded={isStatusExpanded}>
                  Applications
                  {filters.status.length > 0 && <Badge isRead>{filters.status.length}</Badge>}
                </MenuToggle>
              )}
              //onSelect={onStatusSelect}
              selected={filters.status}
              isOpen={isStatusExpanded}
              onOpenChange={(isOpen) => setIsStatusExpanded(isOpen)}
            >
              {statusMenuItems}
            </Select>
          </ToolbarFilter>
        )}
        {hasMultipleApplications && (
          <ToolbarFilter
            chips={filters.risk}
            deleteChip={(category, chip) => onDelete(category as string, chip as string)}
            categoryName="Clusters"
          >
            <Select
              aria-label="Clusters"
              role="menu"
              toggle={(toggleRef: Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef} onClick={onRiskToggle} isExpanded={isRiskExpanded}>
                  Clusters
                  {filters.risk.length > 0 && <Badge isRead>{filters.risk.length}</Badge>}
                </MenuToggle>
              )}
              // onSelect={onRiskSelect}
              selected={filters.risk}
              isOpen={isRiskExpanded}
              onOpenChange={(isOpen) => setIsRiskExpanded(isOpen)}
            >
              {riskMenuItems}
            </Select>
          </ToolbarFilter>
        )}
      </ToolbarGroup>
    </>
  )

  const toolbarItems = (
    <Flex direction={{ default: 'column' }} style={{ width: '100%' }}>
      <Flex direction={{ default: 'row' }} id="row1" style={{ width: '100%' }}>
        {(hasMultipleClusters || hasMultipleApplications) && (
          <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
            {toggleGroupItems}
          </ToolbarToggleGroup>
        )}
        <FlexItem>
          {channelControl?.allChannels?.length > 1 && (
            <ChannelControl channelControl={channelControl} t={t} setDrawerContent={setDrawerContent} />
          )}
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }} />
        {isSearchDisabled && (
          <Alert
            variant="warning"
            title={t(
              'Currently, search is disabled on some of your managed clusters. Some data might be missing from the topology view.'
            )}
          >
            <Button
              variant="link"
              className={'abc'}
              style={{ padding: '0' }}
              onClick={() =>
                window.open(
                  `${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20addon%3Asearch-collector%3Dfalse%20name%3A!${hubClusterName}"}`,
                  '_blank'
                )
              }
            >
              {t('View clusters with search add-on disabled.')}
            </Button>
          </Alert>
        )}
        <FlexItem className="how-to-read-text-container" id="abcd">
          <span
            className="how-to-read-text"
            tabIndex={0}
            onClick={() => {
              if (typeof setDrawerContent === 'function') {
                setDrawerContent(t('How to read topology'), false, false, false, false, <LegendView t={t} />, false)
              }
            }}
            onKeyDown={noop}
            role="button"
          >
            {t('How to read topology')}
            <svg className="how-to-read-icon">
              <use href={'#drawerShapes__sidecar'} />
            </svg>
          </span>
        </FlexItem>
      </Flex>
    </Flex>
  )

  return (
    <Toolbar
      className="pf-m-toggle-group-container"
      style={{
        padding: 0,
        rowGap: '14px',
        width: '100%',
      }}
      collapseListedFiltersBreakpoint="xl"
      clearAllFilters={() => onDelete('', '')}
    >
      <ToolbarContent>{toolbarItems}</ToolbarContent>
    </Toolbar>
  )
}

export default TopologyToolbar
