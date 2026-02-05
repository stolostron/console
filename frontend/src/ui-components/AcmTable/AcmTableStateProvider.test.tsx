/* Copyright Contributors to the Open Cluster Management project */

import { SortByDirection } from '@patternfly/react-table'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import {
  AcmTableStateContext,
  AcmTableStateProvider,
  DEFAULT_ITEMS_PER_PAGE,
  DEFAULT_SORT,
  getItemWithExpiration,
  setItemWithExpiration,
} from './AcmTableStateProvider'

const TEST_KEY = 'test-table-state'

// Consumer component that reads context and allows triggering setters
// Uses id for test queries (project config: testIdAttribute: 'id')
function TestConsumer() {
  const ctx = useContext(AcmTableStateContext)
  return (
    <div>
      <span id="search">{ctx.search ?? ''}</span>
      <span id="page">{String(ctx.page ?? 1)}</span>
      <span id="perPage">{String(ctx.perPage ?? DEFAULT_ITEMS_PER_PAGE)}</span>
      <span id="sort">{JSON.stringify(ctx.sort ?? DEFAULT_SORT)}</span>
      <button type="button" onClick={() => ctx.setSearch?.('my-query')} id="set-search">
        Set search
      </button>
      <button type="button" onClick={() => ctx.setPage?.(3)} id="set-page">
        Set page
      </button>
      <button type="button" onClick={() => ctx.setSort?.({ index: 2, direction: SortByDirection.desc })} id="set-sort">
        Set sort
      </button>
      <button type="button" onClick={() => ctx.setSort?.(DEFAULT_SORT)} id="set-sort-default">
        Set default sort
      </button>
    </div>
  )
}

function renderProvider(localStorageKey: string = TEST_KEY) {
  return render(
    <MemoryRouter>
      <AcmTableStateProvider localStorageKey={localStorageKey}>
        <TestConsumer />
      </AcmTableStateProvider>
    </MemoryRouter>
  )
}

describe('AcmTableStateProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initial state and defaults', () => {
    test('renders children and provides default context when localStorage is empty', async () => {
      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('search')).toHaveTextContent('')
        expect(screen.getByTestId('page')).toHaveTextContent('1')
        expect(screen.getByTestId('perPage')).toHaveTextContent(String(DEFAULT_ITEMS_PER_PAGE))
        expect(screen.getByTestId('sort')).toHaveTextContent(JSON.stringify(DEFAULT_SORT))
      })
    })

    test('uses DEFAULT_SORT when no sort is stored in localStorage (ACM-29242 regression)', async () => {
      // Only set search and page; leave sort absent so it must fall back to DEFAULT_SORT
      setItemWithExpiration(`${TEST_KEY}-search`, 'stored-query')
      setItemWithExpiration(`${TEST_KEY}-page`, '2')

      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('search')).toHaveTextContent('stored-query')
        expect(screen.getByTestId('page')).toHaveTextContent('2')
        // Sort was not in storage; must be DEFAULT_SORT so table shows correct list when page is switched
        expect(screen.getByTestId('sort')).toHaveTextContent(JSON.stringify(DEFAULT_SORT))
      })
    })

    test('restores sort from localStorage when valid sort is stored', async () => {
      const storedSort = { index: 1, direction: SortByDirection.desc }
      setItemWithExpiration(`${TEST_KEY}-sort`, JSON.stringify(storedSort))

      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('sort')).toHaveTextContent(JSON.stringify(storedSort))
      })
    })
  })

  describe('setSort normalization (ACM-29242)', () => {
    test('setSort persists and applies DEFAULT_SORT when given default sort', async () => {
      renderProvider()

      await userEvent.click(screen.getByTestId('set-sort'))
      await waitFor(() => {
        expect(screen.getByTestId('sort')).toHaveTextContent(
          JSON.stringify({ index: 2, direction: SortByDirection.desc })
        )
      })

      const storedSort = getItemWithExpiration(`${TEST_KEY}-sort`)
      expect(storedSort).not.toBeNull()
      expect(JSON.parse(storedSort!)).toEqual({
        index: 2,
        direction: SortByDirection.desc,
      })

      // Reset to default sort (simulates table clearing sort)
      await userEvent.click(screen.getByTestId('set-sort-default'))
      await waitFor(() => {
        expect(screen.getByTestId('sort')).toHaveTextContent(JSON.stringify(DEFAULT_SORT))
      })

      // Persisted value must be DEFAULT_SORT so after page switch we still get correct list
      const storedAfterDefault = getItemWithExpiration(`${TEST_KEY}-sort`)
      expect(storedAfterDefault).not.toBeNull()
      expect(JSON.parse(storedAfterDefault!)).toEqual(DEFAULT_SORT)
    })

    test('setSort with custom sort persists it and rehydration restores it after remount', async () => {
      const { unmount: unmountFirst } = renderProvider()

      await userEvent.click(screen.getByTestId('set-sort'))
      await waitFor(() => {
        expect(screen.getByTestId('sort')).toHaveTextContent(
          JSON.stringify({ index: 2, direction: SortByDirection.desc })
        )
      })

      // Simulate page switch: unmount current tree then remount with same key (e.g. navigation)
      unmountFirst()
      renderProvider()

      // After "page switch", sort must be restored from storage so list is correct
      await waitFor(() => {
        expect(screen.getByTestId('sort')).toHaveTextContent(
          JSON.stringify({ index: 2, direction: SortByDirection.desc })
        )
      })
    })
  })

  describe('search and page persistence', () => {
    test('setSearch and setPage persist to localStorage and restore on remount', async () => {
      renderProvider()

      await userEvent.click(screen.getByTestId('set-search'))
      await userEvent.click(screen.getByTestId('set-page'))

      await waitFor(() => {
        expect(screen.getByTestId('search')).toHaveTextContent('my-query')
        expect(screen.getByTestId('page')).toHaveTextContent('3')
      })

      expect(getItemWithExpiration(`${TEST_KEY}-search`)).toBe('my-query')
      expect(getItemWithExpiration(`${TEST_KEY}-page`)).toBe('3')
    })

    test('when localStorageKey changes, state is rehydrated from new key', async () => {
      setItemWithExpiration(`${TEST_KEY}-search`, 'first-query')
      setItemWithExpiration(`${TEST_KEY}-sort`, JSON.stringify(DEFAULT_SORT))

      const otherKey = 'other-table-state'
      setItemWithExpiration(`${otherKey}-search`, 'second-query')
      setItemWithExpiration(`${otherKey}-sort`, JSON.stringify({ index: 1, direction: SortByDirection.desc }))

      const { rerender } = render(
        <MemoryRouter>
          <AcmTableStateProvider localStorageKey={TEST_KEY}>
            <TestConsumer />
          </AcmTableStateProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('search')).toHaveTextContent('first-query')
        expect(screen.getByTestId('sort')).toHaveTextContent(JSON.stringify(DEFAULT_SORT))
      })

      rerender(
        <MemoryRouter>
          <AcmTableStateProvider localStorageKey={otherKey}>
            <TestConsumer />
          </AcmTableStateProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('search')).toHaveTextContent('second-query')
        expect(screen.getByTestId('sort')).toHaveTextContent(
          JSON.stringify({ index: 1, direction: SortByDirection.desc })
        )
      })
    })
  })

  describe('exports', () => {
    test('DEFAULT_SORT has expected shape', () => {
      expect(DEFAULT_SORT).toEqual({
        index: 0,
        direction: SortByDirection.asc,
      })
    })

    test('DEFAULT_ITEMS_PER_PAGE is 10', () => {
      expect(DEFAULT_ITEMS_PER_PAGE).toBe(10)
    })
  })
})
