/* Copyright Contributors to the Open Cluster Management project */

import { act, ByRoleMatcher, ByRoleOptions, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'

export const waitTimeout = 5 * 1000

const waitForOptions = { timeout: waitTimeout }

// By Text

export async function waitForText(text: string, multipleAllowed?: boolean) {
  if (multipleAllowed) {
    await waitFor(() => expect(screen.queryAllByText(text).length).toBeGreaterThan(0), waitForOptions)
  } else {
    await waitFor(() => expect(screen.getByText(text)).toBeDefined(), waitForOptions)
  }
}

export async function waitForNotText(text: string) {
  await waitFor(() => expect(screen.queryAllByText(text)).toHaveLength(0), waitForOptions)
}

export async function waitForInputByText(text: string, index?: number) {
  if (index !== undefined) {
    await waitFor(() => expect(screen.getAllByText(text).length).toBeGreaterThan(index), waitForOptions)
    await waitFor(() => expect(screen.getAllByText(text)[index]).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () =>
        expect((screen.getAllByText(text)[index] as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual(
          'true'
        ),
      waitForOptions
    )
  } else {
    await waitFor(() => expect(screen.getByText(text)).toBeDefined(), waitForOptions)
    await waitFor(() => expect(screen.getByText(text)).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () => expect((screen.getByText(text) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual('true'),
      waitForOptions
    )
  }
}

export async function waitForInputByTitle(title: string, index?: number) {
  if (index !== undefined) {
    await waitFor(() => expect(screen.getAllByTitle(title).length).toBeGreaterThan(index), waitForOptions)
    await waitFor(() => expect(screen.getAllByTitle(title)[index]).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () =>
        expect((screen.getAllByTitle(title)[index] as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual(
          'true'
        ),
      waitForOptions
    )
  } else {
    await waitFor(() => expect(screen.getByTitle(title)).toBeDefined(), waitForOptions)
    await waitFor(() => expect(screen.getByTitle(title)).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () => expect((screen.getByTitle(title) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual('true'),
      waitForOptions
    )
  }
}

export async function clickByText(text: string, index?: number) {
  await waitForInputByText(text, index)
  if (index !== undefined) {
    userEvent.click(screen.getAllByText(text)[index])
  } else {
    userEvent.click(screen.getByText(text))
  }
}

export async function clickByTitle(title: string, index?: number) {
  await waitForInputByTitle(title, index)
  if (index !== undefined) {
    userEvent.click(screen.getAllByTitle(title)[index])
  } else {
    userEvent.click(screen.getByTitle(title))
  }
}

export async function typeByText(text: string, type: string, index?: number) {
  await waitForInputByText(text, index)
  if (index !== undefined) {
    userEvent.type(screen.getAllByText(text)[index], type)
  } else {
    userEvent.type(screen.getByText(text), type)
  }
}

// By Placeholder text

export async function typeByPlaceholderText(text: string, type: string, index?: number) {
  if (index !== undefined) {
    userEvent.type(screen.getAllByPlaceholderText(text)[index], type)
  } else {
    userEvent.type(screen.getByPlaceholderText(text), type)
  }
}

export async function clickByPlaceholderText(text: string, index?: number) {
  if (index !== undefined) {
    userEvent.click(screen.getAllByPlaceholderText(text)[index])
  } else {
    userEvent.click(screen.getByPlaceholderText(text))
  }
}

// By Role

export async function waitForRole(role: ByRoleMatcher, options?: ByRoleOptions, multipleAllowed?: boolean) {
  if (multipleAllowed) {
    await waitFor(() => expect(screen.queryAllByRole(role, options).length).toBeGreaterThan(0), waitForOptions)
  } else {
    await waitFor(() => expect(screen.getByRole(role, options)).toBeDefined(), waitForOptions)
  }
}

export async function waitForNotRole(role: ByRoleMatcher, options?: ByRoleOptions) {
  await waitFor(() => expect(screen.queryAllByRole(role, options)).toHaveLength(0), waitForOptions)
}

export async function waitForInputByRole(role: ByRoleMatcher, options?: ByRoleOptions, index?: number) {
  if (index !== undefined) {
    await waitFor(() => expect(screen.getAllByRole(role, options).length).toBeGreaterThan(index), waitForOptions)
    await waitFor(() => expect(screen.getAllByRole(role, options)[index]).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () =>
        expect(
          (screen.getAllByRole(role, options)[index] as HTMLInputElement).getAttribute('aria-disabled')
        ).not.toEqual('true'),
      waitForOptions
    )
  } else {
    await waitFor(() => expect(screen.getByRole(role, options)).toBeDefined(), waitForOptions)
    await waitFor(() => expect(screen.getByRole(role, options)).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () =>
        expect((screen.getByRole(role, options) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual('true'),
      waitForOptions
    )
  }
}

export async function clickByRole(role: ByRoleMatcher, options?: ByRoleOptions, index?: number) {
  await waitForInputByRole(role, options, index)
  if (index !== undefined) {
    userEvent.click(screen.getAllByRole(role, options)[index])
  } else {
    userEvent.click(screen.getByRole(role, options))
  }
}

export async function typeByRole(type: string, role: ByRoleMatcher, options?: ByRoleOptions, index?: number) {
  await waitForInputByRole(role, options, index)
  if (index !== undefined) {
    userEvent.type(screen.getAllByRole(role, options)[index], type)
  } else {
    userEvent.type(screen.getByRole(role, options), type)
  }
}

// By TestId

export async function waitForTestId(text: string, multipleAllowed?: boolean) {
  if (multipleAllowed) {
    await waitFor(() => expect(screen.queryAllByTestId(text).length).toBeGreaterThan(0), waitForOptions)
  } else {
    await waitFor(() => expect(screen.getByTestId(text)).toBeDefined(), waitForOptions)
  }
}

export async function waitForNotTestId(text: string) {
  await waitFor(() => expect(screen.queryAllByTestId(text)).toHaveLength(0), waitForOptions)
}

export async function waitForInputByTestId(text: string, index?: number) {
  if (index !== undefined) {
    await waitFor(() => expect(screen.getAllByTestId(text).length).toBeGreaterThan(index), waitForOptions)
    await waitFor(() => expect(screen.getAllByTestId(text)[index]).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () =>
        expect((screen.getAllByTestId(text)[index] as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual(
          'true'
        ),
      waitForOptions
    )
  } else {
    await waitFor(() => expect(screen.getByTestId(text)).toBeDefined(), waitForOptions)
    await waitFor(() => expect(screen.getByTestId(text)).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () => expect((screen.getByTestId(text) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual('true'),
      waitForOptions
    )
  }
}

export async function clickByTestId(text: string, index?: number) {
  await waitForInputByTestId(text, index)
  if (index !== undefined) {
    userEvent.click(screen.getAllByTestId(text)[index])
  } else {
    userEvent.click(screen.getByTestId(text))
  }
}

export async function typeByTestId(id: string, type: string, index?: number) {
  await waitForInputByTestId(id, index)
  if (index !== undefined) {
    userEvent.type(screen.getAllByTestId(id)[index], type)
  } else {
    userEvent.type(screen.getByTestId(id), type)
  }
}

export async function clearByTestId(id: string, index?: number) {
  await waitForInputByTestId(id, index)
  if (index !== undefined) {
    userEvent.clear(screen.getAllByTestId(id)[index])
  } else {
    userEvent.clear(screen.getByTestId(id))
  }
}

// By Label Text

export async function waitForLabelText(text: string, multipleAllowed?: boolean) {
  if (multipleAllowed) {
    await waitFor(() => expect(screen.queryAllByLabelText(text).length).toBeGreaterThan(0), waitForOptions)
  } else {
    await waitFor(() => expect(screen.getByLabelText(text)).toBeDefined(), waitForOptions)
  }
}

export async function waitForNotLabelText(text: string) {
  await waitFor(() => expect(screen.queryAllByLabelText(text)).toHaveLength(0), waitForOptions)
}

export async function waitForInputByLabelText(text: string, index?: number) {
  if (index !== undefined) {
    await waitFor(() => expect(screen.getAllByLabelText(text).length).toBeGreaterThan(index), waitForOptions)
    await waitFor(() => expect(screen.getAllByLabelText(text)[index]).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () =>
        expect((screen.getAllByLabelText(text)[index] as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual(
          'true'
        ),
      waitForOptions
    )
  } else {
    await waitFor(() => expect(screen.getByLabelText(text)).toBeDefined(), waitForOptions)
    await waitFor(() => expect(screen.getByLabelText(text)).not.toBeDisabled(), waitForOptions)
    await waitFor(
      () => expect((screen.getByLabelText(text) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual('true'),
      waitForOptions
    )
  }
}

export async function clickByLabel(text: string, index?: number) {
  await waitForInputByLabelText(text, index)
  if (index !== undefined) {
    userEvent.click(screen.getAllByLabelText(text)[index])
  } else {
    userEvent.click(screen.getByLabelText(text))
  }
}

export async function typeByLabel(text: string, type: string, index?: number) {
  await waitForInputByLabelText(text, index)
  if (index !== undefined) {
    userEvent.type(screen.getAllByLabelText(text)[index], type)
  } else {
    userEvent.type(screen.getByLabelText(text), type)
  }
}

// By Selector
export async function waitForSelector(container: HTMLElement, selector: string) {
  await waitFor(() => expect(container.querySelector(selector)))
}

export async function waitForNoSelector(container: HTMLElement, selector: string) {
  await waitFor(() => expect(container.querySelector(selector)).toHaveLength(0), waitForOptions)
}

export async function waitForValueBySelector(container: HTMLElement, selector: string, value: string | number) {
  await waitFor(() => expect(container.querySelector(selector)).toHaveValue(value))
}

export async function clickBySelector(container: HTMLElement, selector: string) {
  const elem = await waitFor(() => container.querySelector<HTMLButtonElement>(selector))
  elem?.click()
}

// Other

export async function wait(ms = 0) {
  await act(() => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  })
}

export async function waitForCalled(jestMock: jest.Mock) {
  await waitFor(() => expect(jestMock).toHaveBeenCalled(), waitForOptions)
}

// Nocks

export function nocksAreDone(nocks: Scope[]) {
  for (const nock of nocks) {
    if (!nock.isDone()) return false
  }
  return true
}

export async function waitForNocks(nocks: Scope[]) {
  const timeout = waitForOptions.timeout * nocks.length * 3
  const timeoutMsg = (error: Error) => {
    error.message = `!!!!!!!!!!! Test timed out in waitForNocks()--waited ${timeout / 1000} seconds !!!!!!!!!!!!!`
    error.stack = ''
    return error
  }
  await waitFor(() => expect(nocksAreDone(nocks)).toBeTruthy(), { timeout, onTimeout: timeoutMsg })
}

export async function waitForNock(nock: Scope) {
  await waitFor(() => expect(nock.isDone()).toBeTruthy(), waitForOptions)
}

export async function selectAllRows() {
  await clickByRole('checkbox', {}, 0)
}

export async function selectTableRow(row: number) {
  await clickByLabel(`Select row ${row - 1}`)
}

export async function clickBulkAction(text: string) {
  await clickByText('Actions')
  await clickByText(text)
}

export async function clickRowAction(row: number, text: string) {
  await clickByLabel('Actions', row - 1)
  await clickByText(text)
}

export async function selectByText(placeholdText: string, text: string) {
  await clickByPlaceholderText(placeholdText)
  await clickByText(text)
}

export async function clickHostAction(text: string) {
  await clickByText('ai:Add hosts')
  await clickByText(text)
}
