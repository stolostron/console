/* Copyright Contributors to the Open Cluster Management project */

import type { FC } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { SearchInput, TreeView, type TreeViewDataItem } from '@patternfly/react-core'
import { useTranslation } from '~/lib/acm-i18next'
import type { PulseColor, ResourceKindDecoratorProps } from '../types'
import {
  filterNavigatorGroups,
  pulseToDrawerIcon,
  type ResourceNavigatorGroup,
  type ResourceNavigatorItem,
} from '../helpers/resourceNavigatorHelpers'
import './ResourceNavigator.css'

/**
 * Decorator component that renders an icon for the details view header
 * Displays a circular background with a resource type icon
 */
export const ResourceKindDecorator: FC<ResourceKindDecoratorProps> = ({ shape, className, size = 58 }) => {
  return (
    <div className="resource-kind-decorator__icon-container">
      <svg width={size} height={size} viewBox="0 0 58 58" style={{ display: 'block' }}>
        <circle cx="29" cy="29" r="25" className={'pf-topology__node__background'} stroke="#a7a7a7" strokeWidth="1" />
        <use href={`#nodeIcon_${shape}`} className={`${className} detailsIcon`} />
      </svg>
    </div>
  )
}

function ClusterIcon() {
  return (
    <svg
      viewBox="0 0 10 10"
      width="1.275em"
      height="1.275em"
      fill="var(--pf-t--global--icon--color--regular)"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="m7.9852 6.7568c-0.2187 0.0011364-0.43304 0.0613-0.62039 0.17414l-1.1711-1.1714c0.34117-0.51205 0.34117-1.179 0-1.691l0.78225-0.78225c0.40859 0.19681 0.89955 0.070194 1.162-0.29966 0.26245-0.36986 0.21985-0.87509-0.10084-1.1958-0.32068-0.32068-0.82591-0.36329-1.1958-0.10084-0.36986 0.26245-0.49647 0.75341-0.29966 1.162l-0.78225 0.78225c-0.51205-0.34117-1.179-0.34117-1.691 0l-1.1714-1.1714c0.11279-0.18726 0.17295-0.40149 0.17414-0.62009 0-0.67848-0.55002-1.2285-1.2285-1.2285s-1.2285 0.55002-1.2285 1.2285 0.55002 1.2285 1.2285 1.2285c0.2187-0.00114 0.43304-0.0613 0.62039-0.17414l1.1711 1.1714c-0.34117 0.51205-0.34117 1.179 0 1.691l-1.1714 1.1714c-0.18727-0.11277-0.40149-0.17293-0.62009-0.17414-0.67848 0-1.2285 0.55002-1.2285 1.2285s0.55002 1.2285 1.2285 1.2285 1.2285-0.55002 1.2285-1.2285c-0.0011364-0.2187-0.0613-0.43304-0.17414-0.62039l1.1714-1.1711c0.16334 0.10887 0.34614 0.1852 0.53839 0.22482v1.0089c-0.42308 0.14958-0.67686 0.58221-0.60098 1.0245 0.075883 0.44228 0.45936 0.76557 0.90811 0.76557s0.83222-0.32329 0.90811-0.76557c0.075883-0.44228-0.1779-0.87491-0.60098-1.0245v-1.0089c0.19225-0.039617 0.37505-0.11595 0.53839-0.22482l1.1714 1.1714c-0.11279 0.18726-0.17295 0.40149-0.17414 0.62009 0 0.67848 0.55002 1.2285 1.2285 1.2285s1.2285-0.55002 1.2285-1.2285-0.55002-1.2285-1.2285-1.2285zm-3.0712-2.7641c0.50886 0 0.92138 0.41251 0.92138 0.92138s-0.41251 0.92138-0.92138 0.92138-0.92138-0.41251-0.92138-0.92138c5.079e-4 -0.50865 0.41272-0.92087 0.92138-0.92138zm-3.6855-2.1499c0-0.33924 0.27501-0.61425 0.61425-0.61425s0.61425 0.27501 0.61425 0.61425-0.27501 0.61425-0.61425 0.61425c-0.3391-3.386e-4 -0.61391-0.27515-0.61425-0.61425zm0.61425 6.7568c-0.33924 0-0.61425-0.27501-0.61425-0.61425s0.27501-0.61425 0.61425-0.61425 0.61425 0.27501 0.61425 0.61425c-3.386e-4 0.3391-0.27515 0.61391-0.61425 0.61425zm6.1425 0c-0.33924 0-0.61425-0.27501-0.61425-0.61425s0.27501-0.61425 0.61425-0.61425 0.61425 0.27501 0.61425 0.61425c-5.074e-4 0.33903-0.27522 0.61374-0.61425 0.61425z"
      />
    </svg>
  )
}

export type ResourceNavigatorProps = {
  groups: ResourceNavigatorGroup[]
  selectedItemId?: string
  onSelectItem: (item: ResourceNavigatorItem) => void
}

function StatusIcon({ pulse }: Readonly<{ pulse?: PulseColor }>) {
  return (
    <svg className="resource-navigator__status-icon" viewBox="0 0 12 12" fill={pulse ?? 'orange'} aria-hidden>
      <use href={`#drawerShapes_${pulseToDrawerIcon(pulse)}`} width="100%" height="100%" />
    </svg>
  )
}

export function ResourceNavigator({ groups, selectedItemId, onSelectItem }: Readonly<ResourceNavigatorProps>) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')

  const filteredGroups = useMemo(() => filterNavigatorGroups(groups, searchValue), [groups, searchValue])

  const itemLookupRef = useRef<Map<string, ResourceNavigatorItem>>(new Map())

  const treeData = useMemo<TreeViewDataItem[]>(() => {
    const lookup = new Map<string, ResourceNavigatorItem>()
    const data = filteredGroups.map<TreeViewDataItem>((group) => ({
      id: group.groupId,
      name: group.groupTitle,
      icon: <ClusterIcon />,
      expandedIcon: <ClusterIcon />,
      defaultExpanded: true,
      children: group.items.map<TreeViewDataItem>((item) => {
        lookup.set(item.id, item)
        return {
          id: item.id,
          name: item.name,
          icon: <StatusIcon pulse={item.pulse} />,
        }
      }),
    }))
    itemLookupRef.current = lookup
    return data
  }, [filteredGroups])

  const activeItems = useMemo<TreeViewDataItem[]>(() => {
    if (!selectedItemId) return []
    for (const group of treeData) {
      const found = group.children?.find((child) => child.id === selectedItemId)
      if (found) return [found]
    }
    return []
  }, [treeData, selectedItemId])

  const handleSelect = useCallback(
    (_event: React.MouseEvent, item: TreeViewDataItem) => {
      if (item.id && itemLookupRef.current.has(item.id)) {
        onSelectItem(itemLookupRef.current.get(item.id)!)
      }
    },
    [onSelectItem]
  )

  return (
    <div className="resource-navigator__container">
      <SearchInput
        placeholder={t('Search')}
        value={searchValue}
        onChange={(_event, value) => setSearchValue(value)}
        onClear={() => setSearchValue('')}
        style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}
        aria-label={t('Search')}
      />
      <div className="resource-navigator__scroll">
        <TreeView
          aria-label={t('Resources')}
          className="resource-navigator"
          data={treeData}
          activeItems={activeItems}
          onSelect={handleSelect}
          hasGuides
          hasSelectableNodes
        />
      </div>
    </div>
  )
}
