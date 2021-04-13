/* Copyright Contributors to the Open Cluster Management project */

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'

export const waitTimeout = 5 * 1000

const options = { timeout: waitTimeout }

// By Text

export async function waitForText(text: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByText(text).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(screen.getByText(text)).toBeDefined(), options)
    }
}

export async function waitForNotText(text: string) {
    await waitFor(() => expect(screen.queryAllByText(text)).toHaveLength(0), options)
}

export async function waitForInputByText(text: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByText(text).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(screen.getAllByText(text)[index]).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect(
                    (screen.getAllByText(text)[index] as HTMLInputElement).getAttribute('aria-disabled')
                ).not.toEqual('true'),
            options
        )
    } else {
        await waitFor(() => expect(screen.getByText(text)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByText(text)).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect((screen.getByText(text) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual('true'),
            options
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

export async function clickByPlaceholderText(text: string) {
    userEvent.click(screen.getByPlaceholderText(text))
}

// By Role

export async function waitForRole(text: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByRole(text).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(screen.getByRole(text)).toBeDefined(), options)
    }
}

export async function waitForNotRole(text: string) {
    await waitFor(() => expect(screen.queryAllByRole(text)).toHaveLength(0), options)
}

export async function waitForInputByRole(text: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByRole(text).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(screen.getAllByRole(text)[index]).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect(
                    (screen.getAllByRole(text)[index] as HTMLInputElement).getAttribute('aria-disabled')
                ).not.toEqual('true'),
            options
        )
    } else {
        await waitFor(() => expect(screen.getByRole(text)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByRole(text)).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect((screen.getByRole(text) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual('true'),
            options
        )
    }
}

export async function clickByRole(text: string, index?: number) {
    await waitForInputByRole(text, index)
    if (index !== undefined) {
        userEvent.click(screen.getAllByRole(text)[index])
    } else {
        userEvent.click(screen.getByRole(text))
    }
}

export async function typeByRole(text: string, type: string, index?: number) {
    await waitForInputByRole(text, index)
    if (index !== undefined) {
        userEvent.type(screen.getAllByRole(text)[index], type)
    } else {
        userEvent.type(screen.getByRole(text), type)
    }
}

// By TestId

export async function waitForTestId(text: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByTestId(text).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(screen.getByTestId(text)).toBeDefined(), options)
    }
}

export async function waitForNotTestId(text: string) {
    await waitFor(() => expect(screen.queryAllByTestId(text)).toHaveLength(0), options)
}

export async function waitForInputByTestId(text: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByTestId(text).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(screen.getAllByTestId(text)[index]).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect(
                    (screen.getAllByTestId(text)[index] as HTMLInputElement).getAttribute('aria-disabled')
                ).not.toEqual('true'),
            options
        )
    } else {
        await waitFor(() => expect(screen.getByTestId(text)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByTestId(text)).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect((screen.getByTestId(text) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual(
                    'true'
                ),
            options
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

// By Label Text

export async function waitForLabelText(text: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByLabelText(text).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(screen.getByLabelText(text)).toBeDefined(), options)
    }
}

export async function waitForNotLabelText(text: string) {
    await waitFor(() => expect(screen.queryAllByLabelText(text)).toHaveLength(0), options)
}

export async function waitForInputByLabelText(text: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByLabelText(text).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(screen.getAllByLabelText(text)[index]).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect(
                    (screen.getAllByLabelText(text)[index] as HTMLInputElement).getAttribute('aria-disabled')
                ).not.toEqual('true'),
            options
        )
    } else {
        await waitFor(() => expect(screen.getByLabelText(text)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByLabelText(text)).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect((screen.getByLabelText(text) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual(
                    'true'
                ),
            options
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

// Other

export async function waitForCalled(jestMock: jest.Mock) {
    await waitFor(() => expect(jestMock).toHaveBeenCalled(), options)
}

// Nocks

export function nocksAreDone(nocks: Scope[]) {
    for (const nock of nocks) {
        if (!nock.isDone()) return false
    }
    return true
}

export async function waitForNocks(nocks: Scope[]) {
    const timeout = options.timeout * nocks.length
    const timeoutMsg = (error: Error) => {
        error.message = `!!!!!!!!!!! Test timed out in waitForNocks()--waited ${timeout / 1000} seconds !!!!!!!!!!!!!`
        error.stack = ''
        return error
    }
    await waitFor(() => expect(nocksAreDone(nocks)).toBeTruthy(), { timeout, onTimeout: timeoutMsg })
}

export async function waitForNock(nock: Scope) {
    await waitFor(() => expect(nock.isDone()).toBeTruthy(), options)
}

export async function selectAllRows() {
    await clickByRole('checkbox', 0)
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
