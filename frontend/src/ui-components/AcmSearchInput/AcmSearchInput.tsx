/* Copyright Contributors to the Open Cluster Management project */

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  Form,
  Panel,
  PanelMain,
  PanelMainBody,
  Popper,
  SearchInputProps,
  SelectOption,
} from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmSelect } from '../AcmSelect'
import { PlusCircleIcon, TimesCircleIcon } from '@patternfly/react-icons'
import { AcmTextInput } from '../AcmTextInput'
import { SearchInput } from './PFSearchInput'

export enum SearchOperator {
  Equals = '=',
}

export interface SearchableColumn {
  columnId: string
  availableOperators: SearchOperator[]
  columnDisplayName?: string
}

export interface SearchConstraint {
  columnId?: string
  operator?: SearchOperator
  value?: string
}

export interface AcmSearchInputProps extends SearchInputProps {
  placeholder?: string
  spellCheck?: boolean
  resultsCount?: string | number
  style?: React.CSSProperties
  useAdvancedSearchPopper?: boolean
  searchableColumns?: SearchableColumn[]
  canAddConstraints?: boolean
  disableAddConstraint?: boolean
  pendingConstraints?: SearchConstraint[]
  setActiveConstraints?: (constraints: SearchConstraint[]) => void
  fuzzySearchOnChange?: (value: string) => void
  fuzzySearchOnClear?: () => void
  fuzzySearchValue?: string
}

export function AcmSearchInput(props: Readonly<AcmSearchInputProps>) {
  const {
    searchableColumns,
    canAddConstraints,
    disableAddConstraint,
    pendingConstraints = [{ operator: SearchOperator.Equals, value: '', columnId: '' }],
    fuzzySearchValue,
    fuzzySearchOnChange,
    fuzzySearchOnClear,
    setActiveConstraints,
    placeholder,
    useAdvancedSearchPopper,
    spellCheck,
    resultsCount,
    style,
  } = props

  const { t } = useTranslation()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const advancedSearchPaneRef = useRef<HTMLDivElement | null>(null)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [searchConstraints, setSearchConstraints] = useState<SearchConstraint[]>(pendingConstraints || [])

  const onClear = useCallback(() => {
    fuzzySearchOnClear?.()
    setSearchConstraints([{ operator: SearchOperator.Equals, value: '', columnId: '' }])
    setActiveConstraints?.([{ operator: SearchOperator.Equals, value: '', columnId: '' }])
  }, [fuzzySearchOnClear, setActiveConstraints])

  const onChange = useCallback(
    (value: any) => {
      fuzzySearchOnChange?.(value)
    },
    [fuzzySearchOnChange]
  )

  // clicking outside the menu should close it
  const handleClickOutside = (event: any) => {
    if (!isAdvancedSearchOpen || !advancedSearchPaneRef.current) return

    const isClickOutside =
      !searchInputRef.current?.contains(event.target) && !advancedSearchPaneRef.current.contains(event.target)

    if (isClickOutside) {
      setIsAdvancedSearchOpen(false)
    }
  }

  useEffect(() => {
    window.addEventListener('click', handleClickOutside)
    return () => {
      window.removeEventListener('click', handleClickOutside)
    }
  })

  const getAvailableColumnNames = () => {
    return searchableColumns?.map(({ columnId, columnDisplayName }) => {
      const isDisabled = !!searchConstraints.find(
        (constraint) => constraint.columnId === columnId && constraint.operator === SearchOperator.Equals
      )
      return (
        <SelectOption
          key={columnId}
          value={columnId}
          isDisabled={isDisabled}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          {columnDisplayName ?? columnId}
        </SelectOption>
      )
    })
  }

  const activeConstraints = searchConstraints.filter(
    (constraint) => constraint.columnId && constraint.value && constraint.operator
  ).length
  const showResultCount = !!fuzzySearchValue || !!activeConstraints
  const searchInput = (
    <SearchInput
      placeholder={placeholder}
      spellCheck={spellCheck}
      resultsCount={resultsCount}
      ref={searchInputRef}
      id="custom-advanced-search"
      style={style}
      onChange={(_event, value) => onChange(value)}
      onToggleAdvancedSearch={
        useAdvancedSearchPopper
          ? (e, isOpen) => {
              e.stopPropagation()
              setIsAdvancedSearchOpen(isOpen!)
            }
          : undefined
      }
      isAdvancedSearchOpen={isAdvancedSearchOpen}
      onClear={onClear}
      value={fuzzySearchValue}
      enableUtilities={showResultCount}
    />
  )

  const advancedSearchForm = (
    <div ref={advancedSearchPaneRef}>
      <Panel variant="raised" style={{ minWidth: '35em', overflow: 'scroll', maxHeight: '40em' }}>
        <PanelMain>
          <PanelMainBody>
            <Form>
              <AcmTextInput
                label={t('Fuzzy search')}
                type="text"
                id="fuzzy-search-input"
                placeholder={placeholder}
                value={fuzzySearchValue}
                onChange={(value) => {
                  onChange(value)
                }}
              />
              {searchConstraints?.map((constraint, index) => {
                return (
                  <Flex alignItems={{ default: 'alignItemsFlexStart' }} key={`${constraint.columnId}-${index}`}>
                    <FlexItem style={{ width: '35%' }}>
                      <AcmSelect
                        label={t('Column')}
                        id="search-column"
                        value={constraint.columnId}
                        placeholder={t('Select a column')}
                        onChange={(columnId) => {
                          const newConstraintArray = [...searchConstraints]
                          newConstraintArray[index].columnId = columnId
                          setSearchConstraints(newConstraintArray)
                          setActiveConstraints && setActiveConstraints(newConstraintArray)
                        }}
                      >
                        {getAvailableColumnNames()}
                      </AcmSelect>
                    </FlexItem>
                    <FlexItem style={{ width: '35%' }}>
                      <AcmTextInput
                        label={t('Value')}
                        placeholder={t('Enter a value')}
                        id="search-value"
                        value={constraint.value}
                        onChange={(newValue) => {
                          const newConstraintArray = [...searchConstraints]
                          newConstraintArray[index].value = newValue
                          setSearchConstraints(newConstraintArray)
                          setActiveConstraints && setActiveConstraints(newConstraintArray)
                        }}
                      />
                    </FlexItem>
                    <FlexItem>
                      <Button
                        id="remove-constraint"
                        style={{ marginTop: '2em' }}
                        variant={ButtonVariant.link}
                        onClick={(event) => {
                          const newConstraintArray = [...searchConstraints]
                          newConstraintArray.splice(index, 1)
                          setSearchConstraints(newConstraintArray)
                          setActiveConstraints && setActiveConstraints(newConstraintArray)
                          event?.stopPropagation()
                        }}
                        aria-label={t('Remove constraint')}
                        icon={<TimesCircleIcon id="remove-constraint-icon" />}
                      />
                    </FlexItem>
                  </Flex>
                )
              })}
              {canAddConstraints && (
                <Button
                  isDisabled={disableAddConstraint || searchConstraints?.length > 1}
                  variant={ButtonVariant.link}
                  onClick={(event) => {
                    event.stopPropagation()
                    searchConstraints &&
                      setSearchConstraints([
                        ...searchConstraints,
                        { operator: SearchOperator.Equals, value: '', columnId: '' },
                      ])
                  }}
                  icon={<PlusCircleIcon />}
                >
                  {t('Add a search constraint')}
                </Button>
              )}
              <ActionGroup>
                <Button
                  variant="primary"
                  type="submit"
                  onClick={(event) => {
                    event.preventDefault()
                    setIsAdvancedSearchOpen(false)
                  }}
                >
                  {t('Close')}
                </Button>
                {!!onClear && (
                  <Button variant="link" type="reset" onClick={onClear}>
                    {t('Reset')}
                  </Button>
                )}
              </ActionGroup>
            </Form>
          </PanelMainBody>
        </PanelMain>
      </Panel>
    </div>
  )
  return (
    <Popper
      trigger={searchInput}
      popper={advancedSearchForm}
      isVisible={isAdvancedSearchOpen}
      enableFlip={false}
      appendTo={() => document.querySelector('#custom-advanced-search')!}
      zIndex={1}
    />
  )
}
