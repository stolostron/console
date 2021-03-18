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

export async function typeByText(text: string, value: string, index?: number) {
    await waitForInputByText(text, index)
    if (index !== undefined) {
        userEvent.type(screen.getAllByText(text)[index], value)
    } else {
        userEvent.type(screen.getByText(text), value)
    }
}

// By Role

export async function waitForRole(role: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByRole(role).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(screen.getByRole(role)).toBeDefined(), options)
    }
}

export async function waitForNotRole(role: string) {
    await waitFor(() => expect(screen.queryAllByRole(role)).toHaveLength(0), options)
}

export async function waitForInputByRole(role: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByRole(role).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(screen.getAllByRole(role)[index]).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect(
                    (screen.getAllByRole(role)[index] as HTMLInputElement).getAttribute('aria-disabled')
                ).not.toEqual('true'),
            options
        )
    } else {
        await waitFor(() => expect(screen.getByRole(role)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByRole(role)).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect((screen.getByRole(role) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual('true'),
            options
        )
    }
}

export async function clickByRole(role: string, index?: number) {
    await waitForInputByRole(role, index)
    if (index !== undefined) {
        userEvent.click(screen.getAllByRole(role)[index])
    } else {
        userEvent.click(screen.getByRole(role))
    }
}

export async function typeByRole(role: string, value: string, index?: number) {
    await waitForInputByRole(role, index)
    if (index !== undefined) {
        userEvent.type(screen.getAllByRole(role)[index], value)
    } else {
        userEvent.type(screen.getByRole(role), value)
    }
}

// By TestId

export async function waitForTestId(testId: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByTestId(testId).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(screen.getByTestId(testId)).toBeDefined(), options)
    }
}

export async function waitForNotTestId(testId: string) {
    await waitFor(() => expect(screen.queryAllByTestId(testId)).toHaveLength(0), options)
}

export async function waitForInputByTestId(testId: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByTestId(testId).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(screen.getAllByTestId(testId)[index]).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect(
                    (screen.getAllByTestId(testId)[index] as HTMLInputElement).getAttribute('aria-disabled')
                ).not.toEqual('true'),
            options
        )
    } else {
        await waitFor(() => expect(screen.getByTestId(testId)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByTestId(testId)).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect((screen.getByTestId(testId) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual(
                    'true'
                ),
            options
        )
    }
}

export async function clickByTestId(testId: string, index?: number) {
    await waitForInputByTestId(testId, index)
    if (index !== undefined) {
        userEvent.click(screen.getAllByTestId(testId)[index])
    } else {
        userEvent.click(screen.getByTestId(testId))
    }
}

export async function typeByTestId(testId: string, value: string, index?: number) {
    await waitForInputByTestId(testId, index)
    if (index !== undefined) {
        userEvent.type(screen.getAllByTestId(testId)[index], value)
    } else {
        userEvent.type(screen.getByTestId(testId), value)
    }
}

// By Label Text

export async function waitForLabel(label: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByLabelText(label).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(screen.getByLabelText(label)).toBeDefined(), options)
    }
}

export async function waitForNotLabel(label: string) {
    await waitFor(() => expect(screen.queryAllByLabelText(label)).toHaveLength(0), options)
}

export async function waitForInputByLabel(label: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByLabelText(label).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(screen.getAllByLabelText(label)[index]).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect(
                    (screen.getAllByLabelText(label)[index] as HTMLInputElement).getAttribute('aria-disabled')
                ).not.toEqual('true'),
            options
        )
    } else {
        await waitFor(() => expect(screen.getByLabelText(label)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByLabelText(label)).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect((screen.getByLabelText(label) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual(
                    'true'
                ),
            options
        )
    }
}

export async function clickByLabel(label: string, index?: number) {
    await waitForInputByLabel(label, index)
    if (index !== undefined) {
        userEvent.click(screen.getAllByLabelText(label)[index])
    } else {
        userEvent.click(screen.getByLabelText(label))
    }
}

export async function typeByLabel(label: string, value: string, index?: number) {
    await waitForInputByLabel(label, index)
    if (index !== undefined) {
        userEvent.type(screen.getAllByLabelText(label)[index], value)
    } else {
        userEvent.type(screen.getByLabelText(label), value)
    }
}

// Container

// By Selector

export async function waitForSelector(container: HTMLElement, selector: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(container.querySelectorAll(selector).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(container.querySelector(selector)).toBeDefined(), options)
    }
}

export async function waitForNotSelector(container: HTMLElement, selector: string) {
    await waitFor(() => expect(container.querySelectorAll(selector)).toHaveLength(0), options)
}

export async function waitForInputBySelector(container: HTMLElement, selector: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(container.querySelectorAll(selector).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(container.querySelectorAll(selector)[index]).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect(
                    (container.querySelectorAll(selector)[index] as HTMLInputElement).getAttribute('aria-disabled')
                ).not.toEqual('true'),
            options
        )
    } else {
        await waitFor(() => expect(container.querySelector(selector)).toBeDefined(), options)
        await waitFor(() => expect(container.querySelector(selector)).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect(
                    (container.querySelector(selector) as HTMLInputElement).getAttribute('aria-disabled')
                ).not.toEqual('true'),
            options
        )
    }
}

export async function clickBySelector(container: HTMLElement, selector: string, index?: number) {
    await waitForInputBySelector(container, selector, index)
    if (index !== undefined) {
        userEvent.click(container.querySelectorAll(selector)[index])
    } else {
        userEvent.click(container.querySelector(selector)!)
    }
}

export async function typeBySelector(container: HTMLElement, selector: string, value: string, index?: number) {
    await waitForInputBySelector(container, selector, index)
    if (index !== undefined) {
        userEvent.type(container.querySelectorAll(selector)[index], value)
    } else {
        userEvent.type(container.querySelector(selector)!, value)
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
    await waitFor(() => expect(nocksAreDone(nocks)).toBeTruthy(), { timeout: options.timeout * nocks.length })
}

export async function waitForNock(nock: Scope) {
    await waitFor(() => expect(nock.isDone()).toBeTruthy(), options)
}
