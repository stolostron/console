/* Copyright Contributors to the Open Cluster Management project */

import { useMemo, useState } from 'react'
import { Nav, NavExpandable, NavItem, SearchInput } from '@patternfly/react-core'
import { useTranslation } from '~/lib/acm-i18next'
import {
  filterNavigatorGroups,
  pulseToDrawerIcon,
  type ResourceNavigatorGroup,
  type ResourceNavigatorItem,
} from '../helpers/resourceNavigatorHelpers'
import './ResourceNavigator.css'

export type ResourceNavigatorProps = {
  groups: ResourceNavigatorGroup[]
  selectedItemId?: string
  onSelectItem: (item: ResourceNavigatorItem) => void
}

export function ResourceNavigator({ groups, selectedItemId, onSelectItem }: Readonly<ResourceNavigatorProps>) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')

  const filteredGroups = useMemo(() => filterNavigatorGroups(groups, searchValue), [groups, searchValue])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <SearchInput
        placeholder={t('Search')}
        value={searchValue}
        onChange={(_event, value) => setSearchValue(value)}
        onClear={() => setSearchValue('')}
        style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}
        aria-label={t('Search')}
      />
      <div className="resource-navigator__scroll">
        <Nav aria-label={t('Resources')} className="resource-navigator">
          {filteredGroups.map((group) => (
            <NavExpandable key={group.groupId} title={group.groupTitle} isExpanded>
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  className={item.id === selectedItemId ? 'resource-navigator__item--selected' : undefined}
                  isActive={item.id === selectedItemId}
                  onClick={() => onSelectItem(item)}
                >
                  <span className="resource-navigator__item-row">
                    <svg
                      className="resource-navigator__status-icon"
                      viewBox="0 0 12 12"
                      fill={item.pulse ?? 'orange'}
                      aria-hidden
                    >
                      <use href={`#drawerShapes_${pulseToDrawerIcon(item.pulse)}`} width="100%" height="100%" />
                    </svg>
                    <span>{item.name}</span>
                  </span>
                </NavItem>
              ))}
            </NavExpandable>
          ))}
        </Nav>
      </div>
    </div>
  )
}
