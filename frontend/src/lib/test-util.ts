import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'

export const waitTimeout = 5 * 1000

const options = { timeout: waitTimeout }

export async function waitForText(text: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByText(text).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(screen.getByText(text)).toBeDefined(), options)
    }
}

export async function waitForTestId(testId: string) {
    await waitFor(() => expect(screen.getByTestId(testId)).toBeDefined(), options)
}

export async function waitForRole(role: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByRole(role).length).toBeGreaterThan(0), options)
    } else {
        await waitFor(() => expect(screen.getByRole(role)).toBeDefined(), options)
    }
}

export async function waitForLabelText(text: string) {
    await waitFor(() => expect(screen.getByLabelText(text)).toBeDefined(), options)
}

export async function waitForNotText(text: string) {
    await waitFor(() => expect(screen.queryAllByText(text)).toHaveLength(0), options)
}

export async function waitForNotRole(role: string) {
    await waitFor(() => expect(screen.queryAllByRole(role)).toHaveLength(0), options)
}

export async function waitForAllText(text: string) {
    await waitFor(() => expect(screen.getAllByText(text)).toBeTruthy(), options)
}

export async function waitForCalled(jestMock: jest.Mock) {
    await waitFor(() => expect(jestMock).toHaveBeenCalled(), options)
}

export async function clickByText(text: string, index?: number) {
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
        userEvent.click(screen.getAllByText(text)[index])
    } else {
        await waitFor(() => expect(screen.getByText(text)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByText(text)).not.toBeDisabled(), options)
        await waitFor(
            () =>
                expect((screen.getByText(text) as HTMLInputElement).getAttribute('aria-disabled')).not.toEqual('true'),
            options
        )
        userEvent.click(screen.getByText(text))
    }
}

export async function clickByTestId(testID: string) {
    await waitFor(() => expect(screen.getByTestId(testID)).toBeDefined(), options)
    await waitFor(() => expect(screen.getByTestId(testID)).not.toBeDisabled(), options)
    userEvent.click(screen.getByTestId(testID))
}

export async function typeByText(text: string, type: string) {
    await waitFor(() => expect(screen.getByText(text)).toBeDefined(), options)
    await waitFor(() => expect(screen.getByText(text)).not.toBeDisabled(), options)
    userEvent.type(screen.getByText(text), type)
}

export async function typeByTestId(id: string, type: string) {
    await waitFor(() => expect(screen.getByTestId(id)).toBeDefined(), options)
    await waitFor(() => expect(screen.getByTestId(id)).not.toBeDisabled(), options)
    userEvent.type(screen.getByTestId(id), type)
}

export async function typeByLabel(text: string, type: string) {
    await waitFor(() => expect(screen.getByLabelText(text)).toBeDefined(), options)
    await waitFor(() => expect(screen.getByLabelText(text)).not.toBeDisabled(), options)
    userEvent.type(screen.getByLabelText(text), type)
}

export async function clickByLabel(label: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByLabelText(label).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(screen.getAllByLabelText(label)[index]).not.toBeDisabled(), options)
        userEvent.click(screen.getAllByLabelText(label)[index])
    } else {
        await waitFor(() => expect(screen.getByLabelText(label)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByLabelText(label)).not.toBeDisabled(), options)
        userEvent.click(screen.getByLabelText(label))
    }
}

export async function clickByRole(role: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.queryAllByRole(role).length).toBeGreaterThan(index), options)
        await waitFor(() => expect(screen.queryAllByRole(role)[index]).not.toBeDisabled(), options)
        userEvent.click(screen.queryAllByRole(role)[index])
    } else {
        await waitFor(() => expect(screen.getByRole(role)).toBeDefined(), options)
        await waitFor(() => expect(screen.getByRole(role)).not.toBeDisabled(), options)
        userEvent.click(screen.getByRole(role))
    }
}

export function nocksAreDone(nocks: Scope[]) {
    for (const nock of nocks) {
        if (!nock.isDone()) return false
    }
    return true
}

export async function waitForNocks(nocks: Scope[]) {
    await waitFor(() => expect(nocksAreDone(nocks)).toBeTruthy(), options)
}

export async function waitForNock(nock: Scope) {
    await waitFor(() => expect(nock.isDone()).toBeTruthy(), options)
}
