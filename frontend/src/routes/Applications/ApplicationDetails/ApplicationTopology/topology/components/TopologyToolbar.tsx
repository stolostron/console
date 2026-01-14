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
import { FC, Ref, useEffect, useMemo, useState } from 'react'
import { FilterIcon } from '@patternfly/react-icons'
import { TopologyProps } from '../Topology'
import LegendView from '../../components/LegendView'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import noop from 'lodash/noop'
import ChannelControl from '../../components/ChannelControl'
import { NavigationPath } from '../../../../../../NavigationPath'
import { useQuerySearchDisabledManagedClusters } from '../../../../../../lib/search'
import { useQuery } from '../../../../../../lib/useQuery'

export type ToolbarControl = {
  allClusters: string[] | undefined
  activeClusters: string[] | undefined
  setActiveClusters: (clusters: string[] | undefined) => void
  setAllClusters: (clusters: string[] | undefined) => void
  allApplications: string[] | undefined
  activeApplications: string[] | undefined
  setAllApplications: (applications: string[] | undefined) => void
  setActiveApplications: (applications: string[] | undefined) => void
  allTypes: string[] | undefined
  activeTypes: string[] | undefined
  setAllTypes: (types: string[] | undefined) => void
  setActiveTypes: (types: string[] | undefined) => void
}

export function useToolbarControl(): ToolbarControl {
  const [allClusters, setAllClusters] = useState<string[]>()
  const [activeClusters, setActiveClusters] = useState<string[] | undefined>()

  const [allApplications, setAllApplications] = useState<string[]>()
  const [activeApplications, setActiveApplications] = useState<string[] | undefined>()

  const [allTypes, setAllTypes] = useState<string[]>()
  const [activeTypes, setActiveTypes] = useState<string[] | undefined>()

  return useMemo(
    () => ({
      allClusters,
      setAllClusters,
      activeClusters,
      setActiveClusters,
      allApplications,
      setAllApplications,
      activeApplications,
      setActiveApplications,
      allTypes,
      setAllTypes,
      activeTypes,
      setActiveTypes,
    }),
    [allClusters, activeClusters, allApplications, activeApplications, allTypes, activeTypes]
  )
}

const TopologyToolbar: FC<TopologyProps> = (topologyProps) => {
  const { t } = useTranslation()
  const { channelControl, setDrawerContent, elements, hubClusterName, toolbarControl } = topologyProps
  const [isSearchDisabled, setIsSearchDisabled] = useState<boolean>(false)
  const clusterNodes = elements.nodes.filter((node) => node.type === 'cluster')
  const clusterNames = clusterNodes.map((clusterNode) => clusterNode.name)
  const queryDisabled = useQuerySearchDisabledManagedClusters()
  const { data, startPolling } = useQuery(queryDisabled)
  useEffect(startPolling, [startPolling])
  useEffect(() => {
    const clustersWithSearchDisabled = data?.[0]?.data?.searchResult?.[0]?.items || []
    const clusterWithDisabledSearch = new Set(clustersWithSearchDisabled.map((item: { name: string }) => item.name))
    const found = clusterNames.some((r) => clusterWithDisabledSearch.has(r))
    if (found) {
      setIsSearchDisabled(true)
    }
  }, [data, clusterNames])

  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({})

  const { hasToolbarSelection, hasChannelSelection } = useMemo(() => {
    return {
      hasToolbarSelection:
        (toolbarControl.allClusters?.length ?? 0) > 0 ||
        (toolbarControl.allApplications?.length ?? 0) > 0 ||
        (toolbarControl.allTypes?.length ?? 0) > 0,
      hasChannelSelection: (channelControl?.allChannels?.length ?? 0) > 1,
    }
  }, [toolbarControl.allClusters, toolbarControl.allApplications, toolbarControl.allTypes, channelControl?.allChannels])

  const filterConfigs = useMemo(
    () => [
      {
        key: 'Clusters',
        allItems: toolbarControl.allClusters,
        activeItems: toolbarControl.activeClusters,
        setActive: toolbarControl.setActiveClusters,
        emptyLabel: t('No clusters'),
        allLabel: t('All clusters'),
      },
      {
        key: 'Applications',
        allItems: toolbarControl.allApplications,
        activeItems: toolbarControl.activeApplications,
        setActive: toolbarControl.setActiveApplications,
        emptyLabel: t('Applications'),
        allLabel: t('All applications'),
      },
      {
        key: 'Types',
        allItems: toolbarControl.allTypes,
        activeItems: toolbarControl.activeTypes,
        setActive: toolbarControl.setActiveTypes,
        emptyLabel: t('No types'),
        allLabel: t('All types'),
      },
    ],
    [toolbarControl, t]
  )

  const onSelect = (
    selection: string,
    allValue: string,
    activeItems: string[] | undefined,
    setActive: (items: string[] | undefined) => void
  ) => {
    if (selection === allValue) {
      setActive(undefined)
    } else if (activeItems?.includes(selection)) {
      setActive(activeItems.filter((item) => item !== selection))
    } else {
      setActive([...(activeItems || []), selection])
    }
    setDrawerContent?.('Close', false, true, true, true, undefined, true)
  }

  const onDelete = (type: string, id: string) => {
    const config = filterConfigs.find((c) => c.key === type)
    if (config) {
      config.setActive(config.activeItems?.filter((item) => item !== id))
    } else {
      filterConfigs.forEach((c) => c.setActive(undefined))
    }
    setDrawerContent?.('Close', false, true, true, true, undefined, true)
  }

  const onDeleteGroup = (type: string) => {
    filterConfigs.find((c) => c.key === type)?.setActive(undefined)
    setDrawerContent?.('Close', false, true, true, true, undefined, true)
  }

  const toggleGroupItems = (
    <ToolbarGroup variant="filter-group">
      {filterConfigs.map((config, index) => {
        const allValue = `all-${config.key.toLowerCase()}`
        const isExpanded = expandedFilters[config.key] ?? false
        const count = config.allItems?.length ?? 0
        const activeCount = config.activeItems?.length ?? 0

        const toggleLabel =
          count === 0
            ? config.emptyLabel
            : count === 1
              ? config.allItems![0]
              : activeCount > 0
                ? t(config.key)
                : config.allLabel

        return (
          <ToolbarFilter
            key={config.key}
            labels={config.activeItems?.map((item) => ({ key: item, node: item }))}
            deleteLabel={(category, label) => onDelete(category as string, label as string)}
            deleteLabelGroup={(category) => onDeleteGroup(category as string)}
            categoryName={config.key}
          >
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem style={index > 0 ? { marginLeft: '20px' } : undefined}>
                {t(config.key)} ({count}):
              </FlexItem>
              <FlexItem>
                <Select
                  aria-label={config.key}
                  role="menu"
                  toggle={(toggleRef: Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setExpandedFilters((prev) => ({ ...prev, [config.key]: !isExpanded }))}
                      isExpanded={isExpanded}
                      isDisabled={count <= 1}
                    >
                      {toggleLabel}
                      {count !== 1 && activeCount > 0 && <Badge isRead>{activeCount}</Badge>}
                    </MenuToggle>
                  )}
                  onSelect={(_e, selection) =>
                    onSelect(selection as string, allValue, config.activeItems, config.setActive)
                  }
                  selected={config.activeItems}
                  isOpen={isExpanded}
                  onOpenChange={(open) => setExpandedFilters((prev) => ({ ...prev, [config.key]: open }))}
                >
                  <SelectList>
                    {count > 1 && (
                      <SelectOption hasCheckbox value={allValue} isSelected={!activeCount}>
                        {config.allLabel}
                      </SelectOption>
                    )}
                    {config.allItems?.map((item) => (
                      <SelectOption
                        hasCheckbox
                        key={`${config.key}-${item}`}
                        value={item}
                        isSelected={config.activeItems?.includes(item)}
                      >
                        {item}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </FlexItem>
            </Flex>
          </ToolbarFilter>
        )
      })}
    </ToolbarGroup>
  )

  const toolbarItems = (
    <Flex direction={{ default: 'column' }} style={{ width: '100%' }}>
      <Flex direction={{ default: 'row' }} id="row1" style={{ width: '100%' }}>
        {hasToolbarSelection && (
          <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
            {toggleGroupItems}
          </ToolbarToggleGroup>
        )}
        <FlexItem>
          {hasChannelSelection && (
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
        <FlexItem className="how-to-read-text-container">
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
