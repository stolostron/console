/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2023 Red Hat, Inc.
import { searchedKeyWordType } from '@patternfly/react-log-viewer/src/LogViewer/utils/utils'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../../lib/nock-util'
import { LogViewerSearch, searchForKeyword } from './LogsViewerSearch'

describe('LogsViewerSearch', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
  })

  it('should render logs viewer search & search for word test', async () => {
    const Search = () => {
      const [searchedInput, setSearchedInput] = useState<string>('')
      const [rowInFocus, setRowInFocus] = useState<searchedKeyWordType>({
        rowIndex: 0,
        matchIndex: 0,
      })
      const [searchedWordIndexes, setSearchedWordIndexes] = useState<searchedKeyWordType[]>([])
      const [currentSearchedItemCount, setCurrentSearchedItemCount] = useState<number>()
      jest.mock('react', () => ({
        useContext: jest.fn(),
      }))
      const useContextMock = jest.spyOn(React, 'useContext')
      useContextMock.mockReturnValue({
        parsedData: ['firstLine', 'secondLine', 'thirdLine'],
        searchedWordIndexes,
        rowInFocus,
        searchedInput,
        itemCount: 0,
        currentSearchedItemCount,
        scrollToRow: () => {},
        setRowInFocus,
        setSearchedInput,
        setSearchedWordIndexes,
        setCurrentSearchedItemCount,
      })
      return (
        <RecoilRoot>
          <LogViewerSearch placeholder={'Search'} minSearchChars={1} />
        </RecoilRoot>
      )
    }
    render(<Search />)

    await waitFor(() => expect(screen.getByPlaceholderText('Search')).toBeInTheDocument())

    // Should find and type in searchbar
    const searchbar = screen.getByRole('textbox', { name: /search input/i })
    await waitFor(() => expect(searchbar).toBeInTheDocument())
    userEvent.type(searchbar, 'second')
    await waitFor(() => expect(searchbar.textContent === 'second'))

    screen.logTestingPlaygroundURL()
    // should click previous
    const previousBtn = screen.getByRole('button', { name: /previous/i })
    await waitFor(() => expect(previousBtn).toBeInTheDocument())
    userEvent.click(previousBtn)

    // should click next
    const nextBtn = screen.getByRole('button', { name: /next/i })
    await waitFor(() => expect(nextBtn).toBeInTheDocument())
    userEvent.click(nextBtn)

    // should click clear
    const clearBtn = screen.getByRole('button', { name: /reset/i })
    await waitFor(() => expect(clearBtn).toBeInTheDocument())
    userEvent.click(clearBtn)
  })

  it('should correctly return LogViewerSearch searchForKeyword fn with match', async () => {
    const result = searchForKeyword('test', ['logs', 'testLogs', 'testing'], 2)

    await waitFor(() => expect(result).toEqual([{ rowIndex: 1, matchIndex: 1 }]))
  })

  it('should correctly return LogViewerSearch searchForKeyword fn without match', async () => {
    const result = searchForKeyword('a', ['logs', 'testLogs', 'testing'], 2)

    await waitFor(() => expect(result).toEqual([{ rowIndex: -1, matchIndex: 0 }]))
  })
})
