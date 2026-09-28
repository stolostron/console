/* Copyright Contributors to the Open Cluster Management project */

import { SelectGroup, SelectOption } from '@patternfly/react-core'
import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { AcmSelectBase, SelectVariant } from './AcmSelectBase'
import { clickElement, typeElement, tab, clearElement } from '~/lib/test-util'

describe('AcmSelectBase', () => {
  describe('single variant', () => {
    const SingleSelect = ({
      onSelect = jest.fn(),
      onClear,
      selections,
    }: {
      onSelect?: (value: string | string[]) => void
      onClear?: () => void
      selections?: string
    }) => (
      <AcmSelectBase
        id="single-select"
        label="Color"
        variant={SelectVariant.single}
        selections={selections}
        onSelect={onSelect}
        onClear={onClear}
        placeholder="Select a color"
        aria-label="Select a color"
      >
        <SelectOption value="red">Red</SelectOption>
        <SelectOption value="green">Green</SelectOption>
      </AcmSelectBase>
    )

    it('renders and selects an option', async () => {
      const onSelect = jest.fn()
      const { container } = render(<SingleSelect onSelect={onSelect} />)

      // MenuToggle uses role=combobox on a button; known PatternFly pattern flagged by axe
      expect(await axe(container, { rules: { 'aria-allowed-role': { enabled: false } } })).toHaveNoViolations()

      await clickElement(screen.getByRole('combobox', { name: /select a color/i }))
      await waitFor(() => expect(screen.getByRole('option', { name: /red/i })).toBeVisible())
      await clickElement(screen.getByRole('option', { name: /red/i }))

      await waitFor(() => expect(onSelect).toHaveBeenCalledWith('red'))
    })

    it('displays the selected option label', () => {
      render(<SingleSelect selections="green" onClear={jest.fn()} />)
      expect(screen.getByText('Green')).toBeInTheDocument()
    })

    it('clears selection via clear button', async () => {
      const onClear = jest.fn()
      render(<SingleSelect selections="red" onClear={onClear} />)

      await clickElement(screen.getByRole('button', { name: /clear input value/i }))
      await waitFor(() => expect(onClear).toHaveBeenCalled())
    })

    it('opens the menu when the toggle is clicked', async () => {
      render(<SingleSelect />)
      await clickElement(screen.getByRole('combobox', { name: /select a color/i }))
      await waitFor(() => expect(screen.getByRole('option', { name: /red/i })).toBeVisible())
    })

    it('uses value without children as the display label', () => {
      render(
        <AcmSelectBase
          variant={SelectVariant.single}
          selections="bare"
          onClear={jest.fn()}
          placeholder="Pick one"
          aria-label="Pick one"
        >
          <SelectOption value="bare" />
        </AcmSelectBase>
      )
      expect(screen.getByText('bare')).toBeInTheDocument()
    })
  })

  describe('typeahead variant', () => {
    it('selects from options prop', async () => {
      const onSelect = jest.fn()
      render(
        <AcmSelectBase
          id="options-select"
          variant={SelectVariant.typeahead}
          selections=""
          onSelect={onSelect}
          onClear={jest.fn()}
          placeholder="Select from options"
          options={[
            { id: 'alpha', text: 'Alpha' },
            { id: 'beta', text: 'Beta' },
          ]}
        />
      )

      await clickElement(getTypeaheadInput('options-select'))
      await waitFor(() => expect(screen.getByText('Alpha')).toBeVisible())
      await clickElement(screen.getByText('Alpha'))

      await waitFor(() => expect(onSelect).toHaveBeenCalledWith('alpha'))
    })

    it('shows no results when there are no children or options', async () => {
      render(
        <AcmSelectBase
          id="empty-typeahead"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="Empty typeahead"
          onClear={jest.fn()}
        />
      )

      await clickElement(getTypeaheadInput('empty-typeahead'))
      await waitFor(() => expect(screen.getByText(/no results found/i)).toBeInTheDocument())
    })

    it('shows create option when isCreatable and filter has no matches', async () => {
      render(
        <AcmSelectBase
          id="creatable-select"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="Creatable"
          isCreatable
          onSelect={jest.fn()}
          onClear={jest.fn()}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      await typeElement(getTypeaheadInput('creatable-select'), 'custom-value')
      await waitFor(() => expect(screen.getByText(/create new custom-value/i)).toBeVisible())
    })

    it('shows no results found for filter when not creatable', async () => {
      render(
        <AcmSelectBase
          id="filter-select"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="Filter"
          onSelect={jest.fn()}
          onClear={jest.fn()}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      await typeElement(getTypeaheadInput('filter-select'), 'zzzz')
      await waitFor(() => expect(screen.getByText(/no results found for zzzz/i)).toBeVisible())
    })

    it('commits custom input on Enter via onTypeaheadInputCommit', async () => {
      const onTypeaheadInputCommit = jest.fn()
      render(
        <AcmSelectBase
          id="commit-select"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="Commit"
          isCreatable
          onTypeaheadInputCommit={onTypeaheadInputCommit}
          onClear={jest.fn()}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      await typeElement(getTypeaheadInput('commit-select'), 'custom{enter}')
      await waitFor(() => expect(onTypeaheadInputCommit).toHaveBeenCalledWith('custom'))
    })

    it('commits custom input on blur via onTypeaheadInputCommit', async () => {
      const onTypeaheadInputCommit = jest.fn()
      render(
        <AcmSelectBase
          id="blur-select"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="Blur commit"
          isCreatable
          onTypeaheadInputCommit={onTypeaheadInputCommit}
          onClear={jest.fn()}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      const input = getTypeaheadInput('blur-select')
      await typeElement(input, 'blurred')
      await tab()

      await waitFor(() => expect(onTypeaheadInputCommit).toHaveBeenCalledWith('blurred'))
    })

    it('clears via onSelect when backspacing with no onClear (ACM-43041)', async () => {
      const onSelect = jest.fn()
      render(
        <AcmSelectBase
          id="clear-select"
          variant={SelectVariant.typeahead}
          selections="red"
          placeholder="Clear via onSelect"
          onSelect={onSelect}
        >
          <SelectOption value="red">Red</SelectOption>
          <SelectOption value="green">Green</SelectOption>
        </AcmSelectBase>
      )

      await clearElement(getTypeaheadInput('clear-select'))
      await waitFor(() => expect(onSelect).toHaveBeenCalledWith(''))
    })

    it('clears via onTypeaheadInputCommit when backspacing with no onClear (ACM-43041)', async () => {
      const onTypeaheadInputCommit = jest.fn()
      render(
        <AcmSelectBase
          id="clear-commit-select"
          variant={SelectVariant.typeahead}
          selections="red"
          placeholder="Clear via commit"
          onTypeaheadInputCommit={onTypeaheadInputCommit}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      await clearElement(getTypeaheadInput('clear-commit-select'))
      await waitFor(() => expect(onTypeaheadInputCommit).toHaveBeenCalledWith(''))
    })

    it('clears via clear button using onSelect when onClear is absent', async () => {
      const onSelect = jest.fn()
      render(
        <AcmSelectBase
          id="clear-btn-select"
          variant={SelectVariant.typeahead}
          selections="red"
          placeholder="Clear button"
          onSelect={onSelect}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      await clickElement(screen.getByRole('button', { name: /clear input value/i }))
      await waitFor(() => expect(onSelect).toHaveBeenCalledWith(''))
    })

    it('navigates options with arrow keys and selects with Enter', async () => {
      const onSelect = jest.fn()
      render(
        <AcmSelectBase
          id="arrow-select"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="Arrow nav"
          onSelect={onSelect}
          onClear={jest.fn()}
        >
          <SelectOption value="red">Red</SelectOption>
          <SelectOption value="green">Green</SelectOption>
        </AcmSelectBase>
      )

      const input = getTypeaheadInput('arrow-select')
      await clickElement(input)
      await waitFor(() => expect(screen.getByRole('option', { name: /red/i })).toBeVisible())
      // First ArrowDown focuses the first option; Enter selects it
      await typeElement(input, '{arrowdown}{enter}')

      await waitFor(() => expect(onSelect).toHaveBeenCalledWith('red'))
    })

    it('closes the menu when clicking the empty input while open', async () => {
      render(
        <AcmSelectBase
          id="toggle-select"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="Toggle open"
          onClear={jest.fn()}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      const input = getTypeaheadInput('toggle-select')
      await clickElement(input)
      await waitFor(() => expect(screen.getByRole('option', { name: /red/i })).toBeVisible())

      await clickElement(input)
      await waitFor(() => expect(screen.queryByRole('option', { name: /red/i })).not.toBeInTheDocument())
    })

    it('renders a loading skeleton', () => {
      render(
        <AcmSelectBase variant={SelectVariant.typeahead} selections="" isLoading placeholder="Loading">
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('renders a footer when provided', async () => {
      render(
        <AcmSelectBase
          id="footer-select"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="With footer"
          onClear={jest.fn()}
          footer={<div>Footer content</div>}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      await clickElement(getTypeaheadInput('footer-select'))
      await waitFor(() => expect(screen.getByText('Footer content')).toBeVisible())
    })

    it('disables the menu toggle when isDisabled', () => {
      const { container } = render(
        <AcmSelectBase
          id="disabled-select"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="Disabled"
          isDisabled
          onClear={jest.fn()}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )
      expect(container.querySelector('.pf-m-disabled, [disabled], [aria-disabled="true"]')).toBeTruthy()
    })

    it('displays the selected option children while the menu is closed', () => {
      render(
        <AcmSelectBase
          id="display-select"
          variant={SelectVariant.typeahead}
          selections="red"
          placeholder="Display"
          onClear={jest.fn()}
        >
          <SelectOption value="red">Crimson Red</SelectOption>
        </AcmSelectBase>
      )
      expect(getTypeaheadInput('display-select')).toHaveValue('Crimson Red')
    })

    it('clears via onClear when backspacing (ACM-43041)', async () => {
      const onClear = jest.fn()
      render(
        <AcmSelectBase
          id="onclear-select"
          variant={SelectVariant.typeahead}
          selections="red"
          placeholder="OnClear"
          onClear={onClear}
          onSelect={jest.fn()}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      await clearElement(getTypeaheadInput('onclear-select'))
      await waitFor(() => expect(onClear).toHaveBeenCalled())
    })

    it('navigates upward with ArrowUp', async () => {
      const onSelect = jest.fn()
      render(
        <AcmSelectBase
          id="arrowup-select"
          variant={SelectVariant.typeahead}
          selections=""
          placeholder="Arrow up"
          onSelect={onSelect}
          onClear={jest.fn()}
        >
          <SelectOption value="red">Red</SelectOption>
          <SelectOption value="green">Green</SelectOption>
        </AcmSelectBase>
      )

      const input = getTypeaheadInput('arrowup-select')
      await clickElement(input)
      await waitFor(() => expect(screen.getByRole('option', { name: /red/i })).toBeVisible())
      // ArrowUp with no focus jumps to the last option
      await typeElement(input, '{arrowup}{enter}')
      await waitFor(() => expect(onSelect).toHaveBeenCalledWith('green'))
    })

    it('supports width auto without crashing on clear', async () => {
      const onClear = jest.fn()
      render(
        <AcmSelectBase
          id="width-select"
          variant={SelectVariant.typeahead}
          selections="red"
          placeholder="Width auto"
          width="auto"
          onClear={onClear}
        >
          <SelectOption value="red">Red</SelectOption>
        </AcmSelectBase>
      )

      await clickElement(screen.getByRole('button', { name: /clear input value/i }))
      await waitFor(() => expect(onClear).toHaveBeenCalled())
    })
  })

  describe('checkbox variant', () => {
    it('renders checkboxes and selects an option', async () => {
      const onSelect = jest.fn()
      const CheckboxSelect = () => {
        const [selections, setSelections] = useState<string[]>([])
        return (
          <AcmSelectBase
            variant={SelectVariant.checkbox}
            selections={selections}
            onSelect={(value) => {
              onSelect(value)
              setSelections((prev) =>
                prev.includes(String(value)) ? prev.filter((v) => v !== String(value)) : [...prev, String(value)]
              )
            }}
            onClear={jest.fn()}
            placeholder="Checkbox select"
            aria-label="Checkbox select"
          >
            <SelectGroup label="Colors">
              <SelectOption value="red">Red</SelectOption>
              <SelectOption value="green">Green</SelectOption>
            </SelectGroup>
          </AcmSelectBase>
        )
      }

      render(<CheckboxSelect />)
      await clickElement(screen.getByRole('combobox', { name: /checkbox select/i }))
      await waitFor(() => expect(screen.getByRole('checkbox', { name: /red/i })).toBeInTheDocument())
      await clickElement(screen.getByRole('checkbox', { name: /red/i }))
      await waitFor(() => expect(onSelect).toHaveBeenCalledWith('red'))
    })
  })

  describe('typeaheadMulti variant', () => {
    it('shows selected labels and removes one via close', async () => {
      const onSelect = jest.fn()
      render(
        <AcmSelectBase
          id="multi-select"
          variant={SelectVariant.typeaheadMulti}
          selections={['red', 'green']}
          onSelect={onSelect}
          onClear={jest.fn()}
          placeholder="Multi select"
        >
          <SelectOption value="red">Red</SelectOption>
          <SelectOption value="green">Green</SelectOption>
        </AcmSelectBase>
      )

      expect(screen.getByText('Red')).toBeInTheDocument()
      expect(screen.getByText('Green')).toBeInTheDocument()

      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      await clickElement(closeButtons[0])
      await waitFor(() => expect(onSelect).toHaveBeenCalled())
    })

    it('shows a badge count for checkbox multi selections', () => {
      render(
        <AcmSelectBase
          variant={SelectVariant.checkbox}
          selections={['red', 'green']}
          onClear={jest.fn()}
          placeholder="Multi checkbox"
          aria-label="Multi checkbox"
        >
          <SelectOption value="red">Red</SelectOption>
          <SelectOption value="green">Green</SelectOption>
        </AcmSelectBase>
      )
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('typeaheadCheckbox variant', () => {
    it('renders filtered checkbox options', async () => {
      const onSelect = jest.fn()
      render(
        <AcmSelectBase
          id="typeahead-checkbox"
          variant={SelectVariant.typeaheadCheckbox}
          selections={[]}
          onSelect={onSelect}
          onClear={jest.fn()}
          placeholder="Typeahead checkbox"
        >
          <SelectOption value="red">Red</SelectOption>
          <SelectOption value="green">Green</SelectOption>
        </AcmSelectBase>
      )

      await clickElement(getTypeaheadInput('typeahead-checkbox'))
      await waitFor(() => expect(screen.getByText('Green')).toBeVisible())
      await clickElement(screen.getByText('Green'))
      await waitFor(() => expect(onSelect).toHaveBeenCalledWith('green'))
    })
  })
})

function getTypeaheadInput(id: string) {
  const input = document.getElementById(id)
  if (!input) throw new Error(`Typeahead input not found: ${id}`)
  return input
}
