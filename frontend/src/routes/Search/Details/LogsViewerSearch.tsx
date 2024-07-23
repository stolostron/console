/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2023 Red Hat, Inc.
import { SearchInput, SearchInputProps } from '@patternfly/react-core'
import { LogViewerContext, LogViewerToolbarContext } from '@patternfly/react-log-viewer'
import React, { useContext, useEffect, useState } from 'react'

const NUMBER_INDEX_DELTA = 1
const DEFAULT_INDEX = 0
const DEFAULT_MATCH = 0
const DEFAULT_FOCUS = -1
const DEFAULT_SEARCH_INDEX = 0

interface searchedKeyWordType {
  rowIndex: number
  matchIndex: number
}

export interface LogViewerSearchProps extends SearchInputProps {
  /** Place holder text inside of searchbar */
  placeholder: string
  /** Minimum number of characters required for searching */
  minSearchChars: number
}

export const searchForKeyword = (searchedInput: string, parsedData: string[], itemCount: number) => {
  const searchResults: searchedKeyWordType[] = []

  const regex = new RegExp(searchedInput, 'ig')
  parsedData.forEach((row, index) => {
    const rawRow = row.replace(
      // Using same regex as patternfly/react-log-viewer - https://github.com/patternfly/react-log-viewer/blob/9a8a6e8bc91b1de4a64f96d5a8ae9e54a19c8413/packages/module/src/LogViewer/utils/utils.tsx#L53
      /* eslint-disable-next-line no-control-regex */
      new RegExp(`[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]`, 'g'),
      ''
    )
    if (regex.test(rawRow) && index < itemCount) {
      const numMatches = rawRow.match(regex)?.length ?? 0
      for (let i = 1; i <= numMatches; i++) {
        searchResults.push({ rowIndex: index, matchIndex: i })
      }
    }
  })

  if (searchResults.length > 0) {
    return [...searchResults]
  } else if (searchResults.length <= 0) {
    return [{ rowIndex: -1, matchIndex: 0 }]
  }
  return []
}

export const LogViewerSearch: React.FunctionComponent<LogViewerSearchProps> = ({
  placeholder = 'Search',
  minSearchChars = 1,
  ...props
}) => {
  const [indexAdjuster, setIndexAdjuster] = useState(0)
  const {
    searchedWordIndexes,
    scrollToRow,
    setSearchedInput,
    setCurrentSearchedItemCount,
    setRowInFocus,
    setSearchedWordIndexes,
    currentSearchedItemCount,
    searchedInput,
    itemCount,
  } = useContext(LogViewerToolbarContext)

  const { parsedData } = useContext(LogViewerContext)

  const defaultRowInFocus = { rowIndex: DEFAULT_FOCUS, matchIndex: DEFAULT_MATCH }
  const hasFoundResults = searchedWordIndexes.length > 0 && searchedWordIndexes[0]?.rowIndex !== -1

  /* Defaulting the first focused row that contain searched keywords */
  useEffect(() => {
    if (hasFoundResults) {
      setIndexAdjuster(1)
    } else {
      setIndexAdjuster(0)
    }
  }, [hasFoundResults, searchedWordIndexes])

  /* Updating searchedResults context state given changes in searched input */
  useEffect(() => {
    let foundKeywordIndexes: searchedKeyWordType[] = []
    const adjustedSearchedInput = searchedInput.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

    if (adjustedSearchedInput !== '' && adjustedSearchedInput.length >= minSearchChars) {
      foundKeywordIndexes = searchForKeyword(adjustedSearchedInput, parsedData, itemCount || parsedData.length)

      if (foundKeywordIndexes.length !== 0) {
        setSearchedWordIndexes(foundKeywordIndexes)
        scrollToRow(foundKeywordIndexes[DEFAULT_SEARCH_INDEX])
        setCurrentSearchedItemCount(DEFAULT_INDEX)
      }
    }

    if (!adjustedSearchedInput) {
      setRowInFocus(defaultRowInFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedInput])

  /* Clearing out the search input */
  const handleClear = (): void => {
    setSearchedInput('')
    setCurrentSearchedItemCount(DEFAULT_INDEX)
    setSearchedWordIndexes([])
    setRowInFocus(defaultRowInFocus)
  }

  /* Moving focus over to next row containing searched word */
  const handleNextSearchItem = (): void => {
    const adjustedSearchedItemCount = (currentSearchedItemCount + NUMBER_INDEX_DELTA) % searchedWordIndexes.length

    setCurrentSearchedItemCount(adjustedSearchedItemCount)
    scrollToRow(searchedWordIndexes[adjustedSearchedItemCount])
  }

  /* Moving focus over to next row containing searched word */
  const handlePrevSearchItem = (): void => {
    let adjustedSearchedItemCount = currentSearchedItemCount - NUMBER_INDEX_DELTA

    if (adjustedSearchedItemCount < DEFAULT_INDEX) {
      adjustedSearchedItemCount += searchedWordIndexes.length
    }

    setCurrentSearchedItemCount(adjustedSearchedItemCount)
    scrollToRow(searchedWordIndexes[adjustedSearchedItemCount])
  }

  return (
    <SearchInput
      placeholder={placeholder}
      value={searchedInput}
      resultsCount={`${currentSearchedItemCount + indexAdjuster} / ${hasFoundResults ? searchedWordIndexes.length : 0}`}
      {...props}
      onChange={(event, input) => {
        // Handle breaking change from Patternfly. onChange param indexes were swapped 4.12 -> 4.13. Need to determine which param is the string value.
        if (typeof input === 'string') {
          setSearchedInput(input)
        } else if (typeof event === 'string') {
          setSearchedInput(event)
        }
      }}
      onNextClick={() => {
        handleNextSearchItem()
      }}
      onPreviousClick={() => {
        handlePrevSearchItem()
      }}
      onClear={() => {
        handleClear()
      }}
    />
  )
}
