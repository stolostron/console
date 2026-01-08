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

  const [isClustersExpanded, setIsClustersExpanded] = useState(false)
  const [isApplicationsExpanded, setIsApplicationsExpanded] = useState(false)
  const [isTypesExpanded, setIsTypesExpanded] = useState(false)

  const { hasToolbarSelection, hasChannelSelection } = useMemo(() => {
    return {
      hasToolbarSelection:
        (toolbarControl.allClusters?.length ?? 0) > 0 ||
        (toolbarControl.allApplications?.length ?? 0) > 0 ||
        (toolbarControl.allTypes?.length ?? 0) > 0,
      hasChannelSelection: (channelControl?.allChannels?.length ?? 0) > 1,
    }
  }, [toolbarControl.allClusters, toolbarControl.allApplications, toolbarControl.allTypes, channelControl?.allChannels])

  const onApplicationsSelect = (selection: string) => {
    if (selection === 'all-applications') {
      toolbarControl.setActiveApplications(undefined)
    } else if (toolbarControl.activeApplications?.includes(selection)) {
      toolbarControl.setActiveApplications(toolbarControl.activeApplications.filter((app) => app !== selection))
    } else {
      toolbarControl.setActiveApplications([...(toolbarControl.activeApplications || []), selection])
    }
    setDrawerContent?.('Close', false, true, true, true, undefined, true)
  }

  const onClustersSelect = (selection: string) => {
    if (selection === 'all-clusters') {
      toolbarControl.setActiveClusters(undefined)
    } else if (toolbarControl.activeClusters?.includes(selection)) {
      toolbarControl.setActiveClusters(toolbarControl.activeClusters.filter((cluster) => cluster !== selection))
    } else {
      toolbarControl.setActiveClusters([...(toolbarControl.activeClusters || []), selection])
    }
    setDrawerContent?.('Close', false, true, true, true, undefined, true)
  }

  const onTypesSelect = (selection: string) => {
    if (selection === 'all-types') {
      toolbarControl.setActiveTypes(undefined)
    } else if (toolbarControl.activeTypes?.includes(selection)) {
      toolbarControl.setActiveTypes(toolbarControl.activeTypes.filter((type) => type !== selection))
    } else {
      toolbarControl.setActiveTypes([...(toolbarControl.activeTypes || []), selection])
    }
    setDrawerContent?.('Close', false, true, true, true, undefined, true)
  }

  const onDelete = (type: string, id: string) => {
    if (type === 'Clusters') {
      toolbarControl.setActiveClusters(toolbarControl.activeClusters?.filter((cluster) => cluster !== id))
    } else if (type === 'Applications') {
      toolbarControl.setActiveApplications(toolbarControl.activeApplications?.filter((app) => app !== id))
    } else if (type === 'Types') {
      toolbarControl.setActiveTypes(toolbarControl.activeTypes?.filter((t) => t !== id))
    } else {
      toolbarControl.setActiveClusters(undefined)
      toolbarControl.setActiveApplications(undefined)
      toolbarControl.setActiveTypes(undefined)
    }
    setDrawerContent?.('Close', false, true, true, true, undefined, true)
  }

  const onDeleteGroup = (type: string) => {
    if (type === 'Clusters') {
      toolbarControl.setActiveClusters(undefined)
    } else if (type === 'Applications') {
      toolbarControl.setActiveApplications(undefined)
    } else if (type === 'Types') {
      toolbarControl.setActiveTypes(undefined)
    }
    setDrawerContent?.('Close', false, true, true, true, undefined, true)
  }

  const onClustersToggle = () => {
    setIsClustersExpanded(!isClustersExpanded)
  }

  const onApplicationsToggle = () => {
    setIsApplicationsExpanded(!isApplicationsExpanded)
  }

  const onTypesToggle = () => {
    setIsTypesExpanded(!isTypesExpanded)
  }

  const createMenuItems = (
    allItems: string[] | undefined,
    activeItems: string[] | undefined,
    prefix: string,
    allValue: string,
    allLabel: string
  ) => (
    <SelectList>
      {(allItems?.length ?? 0) > 1 && (
        <SelectOption hasCheckbox key={`${prefix}-all`} value={allValue} isSelected={!activeItems?.length}>
          {t(allLabel)}
        </SelectOption>
      )}
      {allItems?.map((item) => (
        <SelectOption hasCheckbox key={`${prefix}-${item}`} value={item} isSelected={activeItems?.includes(item)}>
          {item}
        </SelectOption>
      ))}
    </SelectList>
  )

  const clustersMenuItems = createMenuItems(
    toolbarControl.allClusters,
    toolbarControl.activeClusters,
    'cluster',
    'all-clusters',
    'All clusters'
  )
  const applicationsMenuItems = createMenuItems(
    toolbarControl.allApplications,
    toolbarControl.activeApplications,
    'application',
    'all-applications',
    'All applications'
  )
  const typesMenuItems = createMenuItems(
    toolbarControl.allTypes,
    toolbarControl.activeTypes,
    'type',
    'all-types',
    'All types'
  )

  const toggleGroupItems = (
    <>
      <ToolbarGroup variant="filter-group">
        <ToolbarFilter
          labels={toolbarControl.activeClusters?.map((cluster) => ({ key: cluster, node: cluster }))}
          deleteLabel={(category, label) => onDelete(category as string, label as string)}
          deleteLabelGroup={(category) => onDeleteGroup(category as string)}
          categoryName="Clusters"
        >
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem>
              {t('Clusters')} ({toolbarControl.allClusters?.length ?? 0}):
            </FlexItem>
            <FlexItem>
              <Select
                aria-label="Clusters"
                role="menu"
                toggle={(toggleRef: Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onClustersToggle}
                    isExpanded={isClustersExpanded}
                    isDisabled={(toolbarControl.allClusters?.length ?? 0) <= 1}
                  >
                    {toolbarControl.allClusters?.length === 0
                      ? t('No clusters')
                      : toolbarControl.allClusters?.length === 1
                        ? toolbarControl.allClusters[0]
                        : t('All clusters')}
                    {toolbarControl.allClusters?.length !== 1 && !!toolbarControl.activeClusters?.length && (
                      <Badge isRead>{toolbarControl.activeClusters?.length ?? 0}</Badge>
                    )}
                  </MenuToggle>
                )}
                onSelect={(_e, selection) => {
                  onClustersSelect(selection as string)
                }}
                selected={toolbarControl.activeClusters}
                isOpen={isClustersExpanded}
                onOpenChange={(isOpen) => setIsClustersExpanded(isOpen)}
              >
                {clustersMenuItems}
              </Select>
            </FlexItem>
          </Flex>
        </ToolbarFilter>
        <ToolbarFilter
          labels={toolbarControl.activeApplications?.map((application) => ({ key: application, node: application }))}
          deleteLabel={(category, label) => onDelete(category as string, label as string)}
          deleteLabelGroup={(category) => onDeleteGroup(category as string)}
          categoryName="Applications"
        >
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem style={{ marginLeft: '20px' }}>
              {t('Applications')} ({toolbarControl.allApplications?.length ?? 0}):
            </FlexItem>
            <FlexItem>
              <Select
                aria-label="Applications"
                role="menu"
                toggle={(toggleRef: Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onApplicationsToggle}
                    isExpanded={isApplicationsExpanded}
                    isDisabled={(toolbarControl.allApplications?.length ?? 0) <= 1}
                  >
                    {toolbarControl.allApplications?.length === 1
                      ? toolbarControl.allApplications[0]
                      : toolbarControl.allApplications?.length
                        ? t('Applications')
                        : t('All applications')}
                    {toolbarControl.allApplications?.length !== 1 && !!toolbarControl.activeApplications?.length && (
                      <Badge isRead>{toolbarControl.activeApplications?.length ?? 0}</Badge>
                    )}
                  </MenuToggle>
                )}
                onSelect={(_e, selection) => {
                  onApplicationsSelect(selection as string)
                }}
                selected={toolbarControl.activeApplications}
                isOpen={isApplicationsExpanded}
                onOpenChange={(isOpen) => setIsApplicationsExpanded(isOpen)}
              >
                {applicationsMenuItems}
              </Select>
            </FlexItem>
          </Flex>
        </ToolbarFilter>
        <ToolbarFilter
          labels={toolbarControl.activeTypes?.map((type) => ({ key: type, node: type }))}
          deleteLabel={(category, label) => onDelete(category as string, label as string)}
          deleteLabelGroup={(category) => onDeleteGroup(category as string)}
          categoryName="Types"
        >
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem style={{ marginLeft: '20px' }}>
              {t('Types')} ({toolbarControl.allTypes?.length ?? 0}):
            </FlexItem>
            <FlexItem>
              <Select
                aria-label="Types"
                role="menu"
                toggle={(toggleRef: Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onTypesToggle}
                    isExpanded={isTypesExpanded}
                    isDisabled={(toolbarControl.allTypes?.length ?? 0) <= 1}
                  >
                    {!toolbarControl.allTypes?.length
                      ? t('No types')
                      : toolbarControl.activeTypes?.length
                        ? t('Types')
                        : t('All types')}
                    {!!toolbarControl.activeTypes?.length && (
                      <Badge isRead>{toolbarControl.activeTypes?.length ?? 0}</Badge>
                    )}
                  </MenuToggle>
                )}
                onSelect={(_e, selection) => {
                  onTypesSelect(selection as string)
                }}
                selected={toolbarControl.activeTypes}
                isOpen={isTypesExpanded}
                onOpenChange={(isOpen) => setIsTypesExpanded(isOpen)}
              >
                {typesMenuItems}
              </Select>
            </FlexItem>
          </Flex>
        </ToolbarFilter>
      </ToolbarGroup>
    </>
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
