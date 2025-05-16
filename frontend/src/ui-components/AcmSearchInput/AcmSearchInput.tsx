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
  SearchInput,
  SearchInputProps,
  Tooltip,
  SelectOption,
} from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmSelect } from '../AcmSelect'
import { PlusCircleIcon, TimesCircleIcon } from '@patternfly/react-icons'
import { AcmTextInput } from '../AcmTextInput'

export enum SearchOperator {
  Equals = '=',
  NotEquals = '!=',
  GreaterThan = '>',
  LessThan = '<',
  GreaterThanOrEqualTo = '>=',
  LessThanOrEqualTo = '<=',
}

export interface SearchableColumn {
  columnId: string
  availableOperators: SearchOperator[]
  columnDisplayName?: string
  displayOperator?: boolean
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
  pendingConstraints: SearchConstraint[]
  setPendingConstraints: (constraints: SearchConstraint[]) => void
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
    pendingConstraints = [{ operator: undefined, value: '', columnId: '' }],
    setPendingConstraints,
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

  const onClear = useCallback(() => {
    fuzzySearchOnClear?.()
    setActiveConstraints?.([])
    setPendingConstraints([{ operator: undefined, value: '', columnId: '' }])
  }, [fuzzySearchOnClear, setActiveConstraints, setPendingConstraints])

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
      return (
        <SelectOption
          key={columnId}
          value={columnId}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          {columnDisplayName ?? columnId}
        </SelectOption>
      )
    })
  }

  const getAvailableOperators = (columnName?: string) => {
    const operators = searchableColumns?.find((column) => column.columnId == columnName)?.availableOperators ?? []
    return operators.map((operation) => {
      return (
        <SelectOption
          key={operation}
          value={operation}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          {operation}
        </SelectOption>
      )
    })
  }

  const activeConstraints = pendingConstraints.filter(
    (constraint) => constraint.columnId && constraint.value && constraint.operator
  ).length
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
      areUtilitiesDisplayed={!!activeConstraints}
    />
  )

  const advancedSearchForm = (
    <div ref={advancedSearchPaneRef}>
      <Panel variant="raised" style={{ minWidth: '50em' }}>
        <PanelMain>
          <PanelMainBody>
            <Form>
              <AcmTextInput
                label={t('Fuzzy search')}
                type="text"
                id="fuzzy-search-input"
                placeholder={placeholder}
                value={fuzzySearchValue}
                validation={() => 'Required'}
                onChange={(value) => {
                  onChange(value)
                }}
              />
              {pendingConstraints?.map((constraint, index) => {
                return (
                  <Flex alignItems={{ default: 'alignItemsFlexStart' }} key={`${constraint.columnId}-${index}`}>
                    <FlexItem style={{ width: '28%' }}>
                      <AcmSelect
                        label={t('Column')}
                        id="search-column"
                        value={constraint.columnId}
                        placeholder={t('Select a column')}
                        onChange={(columnId) => {
                          const newConstraintArray = [...pendingConstraints]
                          newConstraintArray[index].columnId = columnId
                          setPendingConstraints(newConstraintArray)
                          setActiveConstraints?.(newConstraintArray)
                        }}
                      >
                        {getAvailableColumnNames()}
                      </AcmSelect>
                    </FlexItem>
                    <FlexItem style={{ minWidth: '13%' }}>
                      <Tooltip
                        content={t('Select a column name to choose an operator')}
                        trigger={!constraint.columnId ? 'mouseenter' : ''}
                        position="bottom"
                      >
                        <AcmSelect
                          label={t('Operator')}
                          id={`search-operator`}
                          value={constraint.operator}
                          placeholder={t('Select an operator')}
                          onChange={(operator) => {
                            const newConstraintArray = [...pendingConstraints]
                            newConstraintArray[index].operator = operator as SearchOperator
                            setPendingConstraints(newConstraintArray)
                            setActiveConstraints?.(newConstraintArray)
                          }}
                          isDisabled={!constraint.columnId}
                        >
                          {getAvailableOperators(constraint.columnId)}
                        </AcmSelect>
                      </Tooltip>
                    </FlexItem>
                    <FlexItem style={{ width: '28%' }}>
                      <AcmTextInput
                        label={t('Value')}
                        placeholder={t('Enter a value')}
                        id="search-value"
                        value={constraint.value}
                        onChange={(_event, newValue) => {
                          const newConstraintArray = [...pendingConstraints]
                          newConstraintArray[index].value = newValue
                          setPendingConstraints(newConstraintArray)
                          setActiveConstraints?.(newConstraintArray)
                        }}
                      />
                    </FlexItem>
                    <FlexItem>
                      <Button
                        id="remove-constraint"
                        style={{ marginTop: '2em' }}
                        variant={ButtonVariant.link}
                        onClick={(event) => {
                          const newConstraintArray = [...pendingConstraints]
                          newConstraintArray.splice(index, 1)
                          setPendingConstraints(newConstraintArray)
                          setActiveConstraints?.(newConstraintArray)
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
                  isDisabled={disableAddConstraint}
                  variant={ButtonVariant.link}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (pendingConstraints) {
                      setPendingConstraints([...pendingConstraints, { operator: undefined, value: '', columnId: '' }])
                    }
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
