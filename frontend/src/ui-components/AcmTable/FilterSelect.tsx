/* Copyright Contributors to the Open Cluster Management project */

import {
  Badge,
  MenuToggle,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
  SelectProps,
  TextInput,
} from '@patternfly/react-core'
import { FilterIcon } from '@patternfly/react-icons'
import { useMemo, useState } from 'react'
import { HighlightSearchText } from '../../components/HighlightSearchText'
import { useTranslation } from '../../lib/acm-i18next'
import { IValidFilters, TableFilterOptions } from './AcmTableTypes'
import { filterLabelMargin, filterOption, filterOptionBadge } from './filterStyles'

type FilterSelectProps = {
  label?: string
  onSelect: (filterId: string, value: string) => void
  selectedFilters: string[]
  validFilters: IValidFilters<any>[]
  onToggleEquality?: (filterId: string, option: TableFilterOptions) => void
  hasFilter?: boolean
}

export const FilterSelect = ({
  label,
  onSelect,
  selectedFilters,
  validFilters,
  onToggleEquality,
  hasFilter = false,
  ...selectProps
}: FilterSelectProps & Omit<SelectProps, 'toggle'>) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [filterValue, setFilterValue] = useState<string>('')

  const filteredValidFilters = useMemo(() => {
    const onlyValidFilters = validFilters.map((filter) => ({
      ...filter,
      options: filter.options.filter(({ option }) => option.value.toLowerCase().includes(filterValue.toLowerCase())),
    }))
    // remove empty groups
    return onlyValidFilters.filter((filter) => filter.options.length > 0)
  }, [filterValue, validFilters])

  const optionToFilterMap = useMemo(() => {
    const map = new Map(
      validFilters.flatMap((filter) => {
        return filter.options.map(({ option }) => {
          return [option.value, filter.filter.id] as const
        })
      })
    )
    return map
  }, [validFilters])

  const selectedCount = useMemo(
    () =>
      selectedFilters.filter((filter) => validFilters.some((f) => f.options.some((o) => o.option.value === filter)))
        .length,
    [selectedFilters, validFilters]
  )

  return (
    <Select
      aria-label="acm-table-filter-select-key"
      onOpenChange={(isOpen) => {
        setIsOpen(isOpen)
      }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          id={`acm-table-filter-select-${label}`}
        >
          <FilterIcon className={filterLabelMargin} />
          <span className={filterLabelMargin}>{label ?? t('Filter')}</span>
          {selectedCount > 0 && <Badge isRead>{selectedCount}</Badge>}
        </MenuToggle>
      )}
      isOpen={isOpen}
      selected={selectedFilters}
      onSelect={(_event, selection) => {
        const option = selection as string
        onSelect(optionToFilterMap.get(option) ?? '', option)
      }}
      {...selectProps}
    >
      <SelectList>
        {hasFilter && <TextInput aria-label={t('Search')} onChange={(_event, value) => setFilterValue(value)} />}
        {filteredValidFilters.length === 0 && <SelectOption>{t('No results found')}</SelectOption>}
        {filteredValidFilters.map((filter) => (
          <SelectGroup key={filter.filter.id} label={filter.filter.label}>
            {filter.options.map((option) => (
              <FilterSelectOption
                key={`${filter.filter.id}-${option.option.value}`}
                filterId={filter.filter.id}
                option={option}
                supportsInequality={filter.filter.supportsInequality}
                toggleEquality={onToggleEquality}
                search={filterValue}
                selectedFilters={selectedFilters}
              />
            ))}
          </SelectGroup>
        ))}
      </SelectList>
    </Select>
  )
}

type FilterSelectOptionProps = {
  filterId: string
  option: TableFilterOptions
  supportsInequality?: boolean
  toggleEquality?: (filterId: string, option: TableFilterOptions) => void
  search?: string
  selectedFilters: string[]
}

const FilterSelectOption = ({
  filterId,
  option,
  supportsInequality,
  toggleEquality,
  search,
  selectedFilters,
}: FilterSelectOptionProps) => (
  <SelectOption
    id={`${filterId}-${option.option.value}`}
    hasCheckbox
    value={option.option.value}
    isSelected={selectedFilters.includes(option.option.value)}
  >
    <div className={filterOption}>
      <HighlightSearchText
        text={(option.option.label as string) ?? '-'}
        supportsInequality={supportsInequality}
        toggleEquality={() => toggleEquality?.(filterId, option)}
        searchText={search}
      />
      <Badge className={filterOptionBadge} isRead>
        {option.count}
      </Badge>
    </div>
  </SelectOption>
)
