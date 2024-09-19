import { useRef, useState, useEffect } from 'react'
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Panel,
  PanelMain,
  PanelMainBody,
  Popper,
  SearchInputProps,
  SelectOption,
  TextInput,
} from '@patternfly/react-core'
import { t } from 'i18next'
import { AcmSelect } from '../AcmSelect'
import { PlusCircleIcon, TimesCircleIcon } from '@patternfly/react-icons'
import { AcmTextInput } from '../AcmTextInput'
import { SearchInput } from './PFSearchInput'

export enum SearchOperator {
  Equals = '=',
}

export interface SearchableColumn {
  columnName: string
  availableOperators: SearchOperator[]
}

export interface SearchConstraint {
  columnName?: string
  operator?: SearchOperator
  value?: string
}

export interface AcmSearchInputProps extends SearchInputProps {
  placeholder?: string
  spellCheck?: boolean
  resultsCount?: string | number | undefined
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

export function AcmSearchInput(props: AcmSearchInputProps) {
  const {
    searchableColumns,
    canAddConstraints,
    disableAddConstraint,
    pendingConstraints = [{ operator: SearchOperator.Equals, value: '', columnName: '' }],
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

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const advancedSearchPaneRef = useRef<HTMLDivElement | null>(null)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [searchConstraints, setSearchConstraints] = useState<SearchConstraint[]>(pendingConstraints || [])

  const onClear = () => {
    fuzzySearchOnClear && fuzzySearchOnClear()
    setSearchConstraints([{ operator: SearchOperator.Equals, value: '', columnName: '' }])
    setActiveConstraints && setActiveConstraints([{ operator: SearchOperator.Equals, value: '', columnName: '' }])
  }

  const onChange = (value: any) => {
    fuzzySearchOnChange && fuzzySearchOnChange(value)
  }

  // clicking outside the menu should close it
  // constraints don't exist in the popper after click, we need to prevent closing the popper if we are editing them
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
    return searchableColumns?.map(({ columnName }) => {
      const isDisabled = !!searchConstraints.find(
        (constraint) => constraint.columnName === columnName && constraint.operator === SearchOperator.Equals
      )
      return (
        <SelectOption
          key={columnName}
          value={columnName}
          isDisabled={isDisabled}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          {columnName}
        </SelectOption>
      )
    })
  }

  const activeConstraints = searchConstraints.filter(
    (constraint) => constraint.columnName && constraint.value && constraint.operator
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
    <div ref={advancedSearchPaneRef} role="searchbox" aria-label="Advanced search form">
      <Panel variant="raised" style={{ minWidth: '35em', overflow: 'scroll', maxHeight: '40em' }}>
        <PanelMain>
          <PanelMainBody>
            <Form>
              <FormGroup label="Has the words" fieldId="has-words" key="has-words">
                <TextInput
                  type="text"
                  id="fuzzy-search-input"
                  placeholder={placeholder}
                  value={fuzzySearchValue}
                  onChange={(value) => {
                    onChange(value)
                  }}
                />
              </FormGroup>
              {searchConstraints &&
                searchConstraints.map((constraint, index) => {
                  return (
                    <Flex alignItems={{ default: 'alignItemsFlexStart' }} key={`${constraint.columnName}-${index}`}>
                      <FlexItem style={{ width: '35%' }}>
                        <AcmSelect
                          label={t('Column')}
                          id="search-column"
                          value={constraint.columnName}
                          placeholder={t('Select a column')}
                          onChange={(columnName) => {
                            const newConstraintArray = [...searchConstraints]
                            newConstraintArray[index].columnName = columnName
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
                          validation={() => ''}
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
                        { operator: SearchOperator.Equals, value: '', columnName: '' },
                      ])
                  }}
                  icon={<PlusCircleIcon />}
                >
                  {t('Add a search constraint').toString()}
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
                  Close
                </Button>
                {!!onClear && (
                  <Button variant="link" type="reset" onClick={onClear}>
                    Reset
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
