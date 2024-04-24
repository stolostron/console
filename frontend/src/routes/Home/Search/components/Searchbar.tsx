/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  Popper,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from '@patternfly/react-core'
import { ArrowRightIcon, ExportIcon } from '@patternfly/react-icons'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon'
import TimesIcon from '@patternfly/react-icons/dist/js/icons/times-icon'
import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from '../../../../lib/acm-i18next'
import { SavedSearch } from '../../../../resources/userpreference'
import { useSharedAtoms } from '../../../../shared-recoil'
import { AcmButton, AcmChip, AcmChipGroup, AcmToastContext } from '../../../../ui-components'
import { operators } from '../search-helper'
import { SearchResultItemsQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'
import { generateSearchResultExport } from '../SearchResults/utils'
import { transformBrowserUrlToSearchString } from '../urlQuery'

type SearchbarTag = {
  id: string
  name: string
}

export type DropdownSuggestionsProps = {
  id: string | number
  name: string
  kind?: 'filter' | 'value' | 'label'
  disabled?: boolean
}

type SearchbarProps = {
  queryString: string
  saveSearchTooltip: string | undefined
  setSaveSearch: Dispatch<SetStateAction<SavedSearch | undefined>>
  suggestions: DropdownSuggestionsProps[]
  currentQueryCallback: (query: string) => void
  toggleInfoModal: () => void
  updateBrowserUrl: (history: any, currentQuery: string) => void
  savedSearchQueries: SavedSearch[]
  searchResultData: SearchResultItemsQuery | undefined
  refetchSearch: any
}

export const convertStringToTags = (searchText: string) => {
  if (searchText !== null && searchText !== '') {
    const queryItems = searchText.split(' ')
    const tags = queryItems.map((item) => {
      return {
        id: item,
        name: item,
      }
    })
    return tags
  }
  return []
}

const stripOperators = (text: string) => {
  if (operators.some((op: string) => text.startsWith(op))) {
    const idx = operators.findIndex((op: string) => text.startsWith(op))
    return text.substring(operators[idx].length)
  }
  return text
}

export function Searchbar(props: SearchbarProps) {
  const {
    currentQueryCallback,
    saveSearchTooltip,
    setSaveSearch,
    suggestions,
    toggleInfoModal,
    updateBrowserUrl,
    queryString,
    savedSearchQueries,
    searchResultData,
    refetchSearch,
  } = props
  const [t] = useTranslation()
  const history = useHistory()
  const searchDefinitions = useSearchDefinitions()
  const toast = useContext(AcmToastContext)
  const [inputValue, setInputValue] = useState('')
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const [menuItems, setMenuItems] = useState<React.ReactElement[]>([])
  const [currentQuery, setCurrentQuery] = useState(queryString)
  const [searchbarTags, setSearchbarTags] = useState<SearchbarTag[]>(convertStringToTags(currentQuery))
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const { useSavedSearchLimit } = useSharedAtoms()
  const savedSearchLimit = useSavedSearchLimit()

  /** refs used to detect when clicks occur inside vs outside of the textInputGroup and menu popper */
  const menuRef = useRef<HTMLDivElement>() as React.MutableRefObject<HTMLDivElement>
  const textInputGroupRef = useRef<HTMLDivElement>() as React.MutableRefObject<HTMLDivElement>

  // rerender component with new props after initial load
  useEffect(() => {
    setCurrentQuery(queryString)
    setSearchbarTags(convertStringToTags(queryString))
  }, [queryString])

  const disableSaveSearch = useMemo(() => {
    return (
      savedSearchQueries.find((savedQuery: SavedSearch) => savedQuery.searchText === currentQuery) !== undefined ||
      savedSearchQueries.length >= savedSearchLimit
    )
  }, [currentQuery, savedSearchLimit, savedSearchQueries])

  /** callback for updating the inputValue state in this component so that the input can be controlled */
  const handleInputChange = (input: any) => {
    // **Note: PatternFly change the fn signature
    // From: (value: string, event: React.FormEvent<HTMLInputElement>) => void
    // To: (_event: React.FormEvent<HTMLInputElement>, value: string) => void
    // both cases need to be handled for backwards compatibility
    const value = typeof input === 'string' ? input : (input.target as HTMLInputElement).value
    const delimiters = [' ', ':', ',']
    if (delimiters.indexOf(value) < 0) {
      // Delimiters are only used to enter chips - do not allow for entry in input
      setInputValue(value)
    }
  }

  /** callback for removing a chip from the chip selections */
  const deleteChip = (chipToDeleteIndex: number) => {
    if (chipToDeleteIndex >= 0) {
      const newSearchbarTags = searchbarTags
      // need to check if there are 2+ values @ tag[idx] - if there are we only delete the last one
      const tagToDelete = newSearchbarTags[chipToDeleteIndex]
      if (tagToDelete.name.includes(',')) {
        const values = tagToDelete.name.split(',')
        values.splice(values.length - 1, 1)
        tagToDelete.name = values.join(',')
      } else {
        newSearchbarTags.splice(chipToDeleteIndex, 1)
      }
      setCurrentQuery(newSearchbarTags.map((tag) => tag.name).join(' '))
      currentQueryCallback(newSearchbarTags.map((tag) => tag.name).join(' '))
      setSearchbarTags(newSearchbarTags)
    }
  }

  /** callback for clearing all selected chips and the text input */
  const clearChipsAndInput = () => {
    setCurrentQuery('')
    currentQueryCallback('')
    setSearchbarTags([])
    setInputValue('')
  }

  const handleMarkText = (name: string, input: string) => {
    const preIndex = name.toLowerCase().indexOf(input.toLowerCase())
    const pre = name.substring(0, preIndex)
    const markText = name.substring(preIndex, preIndex + input.length)
    const mark = (
      <mark
        style={{
          color: 'var(--pf-global--link--Color)',
          textDecoration: 'underline',
          background: 'none',
          fontWeight: 600,
        }}
      >
        {markText}
      </mark>
    )
    const post = name.substring(pre.length + input.length)

    return (
      <p>
        {pre}
        {mark}
        {post}
      </p>
    )
  }

  // ^ - start of string
  // [a-z0-9-_./:()=+]* - 1 or more of: any char a-z, 0-9 & special chars: -_./:()=+
  const handlePartialRegex = (replacedSpecialChars: string) =>
    new RegExp(`^${replacedSpecialChars.replaceAll('*', '[a-z0-9-_./:=+]*')}`)

  useEffect(() => {
    const parsedInputValue = stripOperators(inputValue)
    function handleSuggestionMark(currentValue: DropdownSuggestionsProps) {
      if (parsedInputValue.includes('*')) {
        const replacedSpecialChars = parsedInputValue.replace(/[/,!?_\-.<>:;"'[\]{}\\+=()!&@^#%$]/g, '\\$&') // insert \ before all special characters so Regex doesn't break in processing
        const regex = handlePartialRegex(replacedSpecialChars)
        const regexMatch = currentValue.name.toLowerCase().match(regex)?.[0] ?? ''
        if (regexMatch === '') {
          // If match is null -> return item without marks
          return currentValue.name
        }
        return handleMarkText(currentValue.name, regexMatch)
      }
      if (inputValue !== '' && currentValue.name.toLowerCase().includes(parsedInputValue.toLowerCase())) {
        return handleMarkText(currentValue.name, parsedInputValue)
      }
      return currentValue.name
    }

    /** add a heading to the menu */
    const headingItem = (
      // eslint-disable-next-line jsx-a11y/aria-role
      <MenuItem role={'search-suggestion-item'} isDisabled itemId={'heading'} key={'heading'}>
        {suggestions[0].name}
      </MenuItem>
    )

    //todo - include a debounce
    let filteredMenuItems = []
    /** in the menu only show items that include the text in the input */
    filteredMenuItems = suggestions
      .filter((item, index) => {
        if (parsedInputValue.includes('*')) {
          const replacedSpecialChars = parsedInputValue.replace(/[/,!?_\-.<>:;"'[\]{}\\+=()!&@^#%$]/g, '\\$&') // insert \ before all special characters so Regex doesn't break in processing
          const regex = handlePartialRegex(replacedSpecialChars)
          return (
            index !== 0 && // filter the headerItem suggestion
            (!inputValue || item.name.toLowerCase().match(regex))
          )
        }
        return (
          index !== 0 && // filter the headerItem suggestion
          (!inputValue || item.name.toLowerCase().includes(parsedInputValue.toLowerCase()))
        )
      })
      .map((currentValue) => (
        <MenuItem
          isDisabled={currentValue.disabled}
          role={'menuitem'}
          itemId={`${currentValue.kind}-${currentValue.id}`}
          key={`${currentValue.kind}-${currentValue.id}`}
        >
          {handleSuggestionMark(currentValue)}
        </MenuItem>
      ))

    /** in the menu show a disabled "no result" when all menu items are filtered out */
    if (filteredMenuItems.length === 0) {
      const noResultItem = (
        // eslint-disable-next-line jsx-a11y/aria-role
        <MenuItem role={'search-suggestion-item'} isDisabled itemId={'no-matching-filters'} key={'no-matching-filters'}>
          {t('No matching filters')}
        </MenuItem>
      )
      setMenuItems([noResultItem])
      return
    }

    const divider = <Divider key="divider" />

    setMenuItems([headingItem, divider, ...filteredMenuItems])
  }, [inputValue, suggestions, t])

  const addChip = (newChipText: string, newChipId?: string) => {
    if (!newChipId && newChipText === '') {
      // don't allow blank tags to be added to searchbar
      return
    }

    let newQueryString = ''
    let newQueryTags: {
      id: string
      name: string
    }[] = []
    if (newChipId?.startsWith('filter')) {
      newQueryString = `${currentQuery === '' ? '' : `${currentQuery} `}${newChipText}:`
      newQueryTags = convertStringToTags(newQueryString)
    } else if (newChipId?.startsWith('value') || currentQuery.endsWith(':')) {
      const opIdx = operators.findIndex((op: string) => inputValue.startsWith(op))
      if (opIdx > -1 && newChipText !== inputValue) {
        newChipText = `${operators[opIdx]}${newChipText}`
      }
      newQueryTags = convertStringToTags(`${currentQuery}${newChipText}`)
      if (newQueryTags.length > 1) {
        const lastTag = newQueryTags[newQueryTags.length - 1]
        newQueryTags.forEach((t, idx) => {
          if (idx !== newQueryTags.length - 1 && lastTag && t.name.split(':')[0] === lastTag.name.split(':')[0]) {
            t.name = `${t.name},${lastTag.name.split(':')[1]}`
            newQueryTags.pop()
          }
          return t
        })
      }
      newQueryString = newQueryTags.map((t) => t.name).join(' ')
    } else if (
      operators.some((operator: string) => currentQuery.endsWith(operator)) &&
      !isNaN(parseInt(newChipText, 10))
    ) {
      // case for user adding a number after operator
      newQueryTags = convertStringToTags(`${currentQuery}${newChipText}`)
      newQueryString = newQueryTags.map((t) => t.name).join(' ')
    } else {
      // adding a keyword - not an item from dropdown suggestions
      newQueryString = `${currentQuery === '' ? '' : `${currentQuery} `}${newChipText}`
      newQueryTags = convertStringToTags(newQueryString)
    }
    setCurrentQuery(newQueryString)
    currentQueryCallback(newQueryString)
    setSearchbarTags(newQueryTags)
    setInputValue('') // reset input after chip addition
    focusTextInput()
  }

  /** allow the user to focus on the menu and navigate using the arrow keys */
  const handleArrowKey = () => {
    if (menuRef.current) {
      const firstElement = menuRef.current.querySelector<HTMLButtonElement>('li > button:not(:disabled)')
      firstElement && firstElement.focus()
    }
  }

  /** reopen the menu if it's closed and any un-designated keys are hit */
  const handleDefault = () => {
    if (!menuIsOpen) {
      setMenuIsOpen(true)
    }
  }

  function handleAddition() {
    const parsedInputValue = stripOperators(inputValue)
    const suggestionMatch = suggestions
      .filter((suggestion) => suggestion.name.toLowerCase() === parsedInputValue.toLowerCase())
      .map((suggestion) => {
        return {
          id: `${suggestion.kind}-${suggestion.id}`,
          name: suggestion.name,
        }
      })
    if (suggestionMatch.length > 0) {
      addChip(suggestionMatch[0].name, suggestionMatch[0].id)
    } else {
      addChip(inputValue)
    }
  }

  /** enable keyboard only usage while focused on the text input */
  const handleTextInputKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      // Enter either adds a chip ro runs the search
      case 'Enter':
        if (currentQuery !== '' && !currentQuery.endsWith(':') && inputValue === '') {
          // User has a valid search so run the search query
          updateBrowserUrl(history, currentQuery)
          setMenuIsOpen(false)
          focusRunSearchButton()
        } else {
          handleAddition()
        }
        break
      case ',':
        if (currentQuery.endsWith(':')) {
          // only allow comma delimiter if user is adding a value
          handleAddition()
        }
        break
      case ':':
        if (!currentQuery.endsWith(':')) {
          // only allow colon delimiter if user is adding a filter
          handleAddition()
        }
        break
      case ' ':
        handleAddition()
        break
      case 'Backspace':
        if (inputValue === '') {
          const index = searchbarTags.length - 1
          deleteChip(index)
        }
        break
      case 'ArrowUp':
      case 'ArrowDown':
        handleArrowKey()
        break
      default:
        handleDefault()
    }
  }

  /** apply focus to the text input */
  const focusTextInput = () => {
    textInputGroupRef.current?.querySelector('input')?.focus()
  }

  /** apply focus to the run search button */
  const focusRunSearchButton = () => {
    const runSearchButton = document.querySelector('#run-search-button') as HTMLButtonElement
    runSearchButton?.focus()
  }

  /** add the text of the selected item as a new chip */
  const onSelect = (event: React.MouseEvent<Element, MouseEvent> | undefined, itemId?: string | number) => {
    const selectedText = (event?.currentTarget as HTMLElement).innerText
    addChip(selectedText, itemId?.toString())
    event?.stopPropagation()
    focusTextInput()
  }

  /** close the menu when a click occurs outside of the menu or text input group */
  const handleClick = (event?: MouseEvent | undefined) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event?.target as HTMLElement) &&
      !textInputGroupRef.current?.contains(event?.target as HTMLElement)
    ) {
      setMenuIsOpen(false)
    }
  }

  /** show the search icon only when there are no chips to prevent the chips from being displayed behind the icon */
  const showSearchIcon = !searchbarTags.length

  /** only show the clear button when there is something that can be cleared */
  const showClearButton = !!inputValue || !!searchbarTags.length

  const inputGroup = (
    <div ref={textInputGroupRef}>
      <TextInputGroup>
        <TextInputGroupMain
          icon={showSearchIcon && <SearchIcon />}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setMenuIsOpen(true)}
          onKeyDown={handleTextInputKeyDown}
          aria-label={t('Search input')}
        >
          <AcmChipGroup aria-label={t('Search filters')}>
            {searchbarTags.map((searchbarTag, idx) => (
              <AcmChip
                key={searchbarTag.id}
                onClick={() => deleteChip(idx)}
                closeBtnAriaLabel={t('delete-chip')}
                textMaxWidth={'100%'}
              >
                {searchbarTag.name}
              </AcmChip>
            ))}
          </AcmChipGroup>
        </TextInputGroupMain>
        {showClearButton && (
          <TextInputGroupUtilities>
            <Button variant="plain" onClick={clearChipsAndInput} aria-label={t('Clear button for chips and input')}>
              <TimesIcon />
            </Button>
          </TextInputGroupUtilities>
        )}
        <Divider orientation={{ default: 'vertical' }} />
        <Button
          id="run-search-button"
          isInline
          variant="plain"
          onClick={() => {
            // If run search is pressed but the query hasn't changed - we are refetching
            if (transformBrowserUrlToSearchString(window.location.search).presetSearchQuery === currentQuery) {
              refetchSearch() // if refetching we dont need to update browser url
            } else if (currentQuery !== '' && !currentQuery.endsWith(':')) {
              updateBrowserUrl(history, currentQuery)
            }
            setMenuIsOpen(false)
          }}
          isDisabled={currentQuery === '' || currentQuery.endsWith(':')}
        >
          <ArrowRightIcon />
        </Button>
        <Divider orientation={{ default: 'vertical' }} />
        <Button isInline variant="plain" onClick={toggleInfoModal} aria-label={t('Search help modal toggle')}>
          <HelpIcon color={'var(--pf-global--active-color--100)'} />
        </Button>
        <Divider orientation={{ default: 'vertical' }} />
        <AcmButton
          onClick={() =>
            setSaveSearch({
              id: '',
              name: '',
              description: '',
              searchText: currentQuery,
            })
          }
          isDisabled={currentQuery === '' || currentQuery.endsWith(':') || disableSaveSearch}
          tooltip={saveSearchTooltip}
          variant="plain"
        >
          {t('Save search')}
        </AcmButton>
        <Divider orientation={{ default: 'vertical' }} />
        <Dropdown
          onSelect={(event) => {
            event?.stopPropagation()
            setIsExportMenuOpen(false)
          }}
          className="export-dropdownMenu"
          toggle={
            <DropdownToggle
              toggleIndicator={null}
              onToggle={(value, event) => {
                event.stopPropagation()
                setIsExportMenuOpen(value)
              }}
              aria-label="export-search-result"
              id="export-search-result"
            >
              <ExportIcon />
            </DropdownToggle>
          }
          isOpen={isExportMenuOpen}
          isPlain
          dropdownItems={[
            <DropdownItem
              style={{ width: '10rem' }}
              key={'item.text'}
              onClick={() => generateSearchResultExport(searchResultData, searchDefinitions, toast, t)}
              isDisabled={window.location.search === ''}
            >
              {t('Export as CSV')}
            </DropdownItem>,
          ]}
          position={'right'}
        />
      </TextInputGroup>
    </div>
  )

  const menu = (
    <div style={{ maxWidth: '33%' }} ref={menuRef}>
      <Menu isScrollable onSelect={onSelect}>
        <MenuContent maxMenuHeight={'400px'}>
          <MenuList>{menuItems}</MenuList>
        </MenuContent>
      </Menu>
    </div>
  )

  return (
    <Popper
      trigger={inputGroup}
      popper={menu}
      appendTo={() => textInputGroupRef?.current}
      isVisible={menuIsOpen}
      onDocumentClick={handleClick}
    />
  )
}
