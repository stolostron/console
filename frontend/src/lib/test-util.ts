import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'

export const waitTimeout = 30 * 1000

export async function waitForText(text: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByText(text).length).toBeGreaterThan(0), { timeout: waitTimeout })
    } else {
        await waitFor(() => expect(screen.getByText(text)).toBeInTheDocument(), { timeout: waitTimeout })
    }
}

export async function waitForRole(role: string, multipleAllowed?: boolean) {
    if (multipleAllowed) {
        await waitFor(() => expect(screen.queryAllByRole(role).length).toBeGreaterThan(0), { timeout: waitTimeout })
    } else {
        await waitFor(() => expect(screen.getByRole(role)).toBeInTheDocument(), { timeout: waitTimeout })
    }
}

export async function waitForLabelText(text: string) {
    await waitFor(() => expect(screen.getByLabelText(text)).toBeInTheDocument(), { timeout: waitTimeout })
}

export async function waitForNotText(text: string) {
    await waitFor(() => expect(screen.queryAllByText(text)).toHaveLength(0), { timeout: waitTimeout })
}

export async function waitForNotRole(role: string) {
    await waitFor(() => expect(screen.queryAllByRole(role)).toHaveLength(0), { timeout: waitTimeout })
}

export async function waitForAllText(text: string) {
    await waitFor(() => expect(screen.getAllByText(text)).toBeTruthy(), { timeout: waitTimeout })
}

export async function waitForCalled(jestMock: jest.Mock) {
    await waitFor(() => expect(jestMock).toHaveBeenCalled(), { timeout: waitTimeout })
}

export async function clickByText(text: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByText(text).length).toBeGreaterThan(index), {
            timeout: waitTimeout,
        })
        screen.getAllByText(text)[index].click()
    } else {
        await waitForText(text)
        screen.getByText(text).click()
    }
}

export async function typeByText(text: string, type: string) {
    await waitForText(text)
    userEvent.type(screen.getByText('type.to.confirm'), type)
}

export async function clickByLabel(label: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.getAllByLabelText(label).length).toBeGreaterThan(index), {
            timeout: waitTimeout,
        })
        screen.getAllByLabelText(label)[index].click()
    } else {
        await waitForLabelText(label)
        screen.getByLabelText(label).click()
    }
}

export async function clickByRole(label: string, index?: number) {
    if (index !== undefined) {
        await waitFor(() => expect(screen.queryAllByRole(label).length).toBeGreaterThan(index), {
            timeout: waitTimeout,
        })
        userEvent.click(screen.queryAllByRole(label)[index])
    } else {
        await waitForRole(label)
        screen.getByRole(label).click()
    }
}

export function nocksAreDone(nocks: Scope[]) {
    for (const nock of nocks) {
        if (!nock.isDone()) return false
    }
    return true
}

export async function waitForNocks(nocks: Scope[]) {
    await waitFor(() => expect(nocksAreDone(nocks)).toBeTruthy(), { timeout: waitTimeout, interval: 50 })
}

export async function waitForNock(nock: Scope) {
    await waitFor(() => expect(nock.isDone()).toBeTruthy(), { timeout: waitTimeout, interval: 50 })
}
