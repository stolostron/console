/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Fragment } from 'react'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmAlert, AcmAlertContext, AcmAlertGroup, AcmAlertProvider } from './AcmAlert'
import { AcmToast, AcmToastContext, AcmToastGroup, AcmToastProvider } from './AcmToast'

describe('AcmAlert', () => {
    test('renders alerts in alert group', async () => {
        const { getByText, queryAllByText, getByRole, container } = render(
            <AcmAlertProvider>
                <AcmAlertGroup isInline canClose />
                <AcmAlertContext.Consumer>
                    {(context) => (
                        <Fragment>
                            <AcmButton onClick={() => context.addAlert({ title: 'Info', type: 'info' })}>
                                Add Info
                            </AcmButton>
                            <AcmButton onClick={() => context.addAlert({ title: 'Error', type: 'danger' })}>
                                Add Error
                            </AcmButton>
                            <AcmButton onClick={() => context.addAlert({ title: 'Warning', type: 'warning' })}>
                                Add Warning
                            </AcmButton>
                            <AcmButton onClick={() => context.clearAlerts()}>Clear Alerts</AcmButton>
                            <AcmButton onClick={() => context.clearAlerts((a) => a.type === 'warning')}>
                                Clear Warnings
                            </AcmButton>
                        </Fragment>
                    )}
                </AcmAlertContext.Consumer>
            </AcmAlertProvider>
        )

        expect(queryAllByText('Info')).toHaveLength(0)
        getByText('Add Info').click()
        await waitFor(() => expect(queryAllByText('Info')).toHaveLength(1))

        expect(queryAllByText('Error')).toHaveLength(0)
        getByText('Add Error').click()
        await waitFor(() => expect(queryAllByText('Error')).toHaveLength(1))
        getByText('Add Error').click()
        await waitFor(() => expect(queryAllByText('Error')).toHaveLength(2))

        expect(queryAllByText('Warning')).toHaveLength(0)
        getByText('Add Warning').click()
        await waitFor(() => expect(queryAllByText('Warning')).toHaveLength(1))

        expect(await axe(container)).toHaveNoViolations()

        getByText('Clear Warnings').click()
        await waitFor(() => expect(queryAllByText('Warning')).toHaveLength(0))
        await waitFor(() => expect(queryAllByText('Info')).toHaveLength(1))
        await waitFor(() => expect(queryAllByText('Error')).toHaveLength(2))

        getByRole('button', { name: 'Close Info alert: alert: Info' }).click()
        await waitFor(() => expect(queryAllByText('Info')).toHaveLength(0))

        getByText('Clear Alerts').click()
        await waitFor(() => expect(queryAllByText('Error')).toHaveLength(0))
    })

    test('renders alert', async () => {
        const { queryAllByText } = render(<AcmAlert title="TITLE" message="MESSAGE" variant="info" />)
        await waitFor(() => expect(queryAllByText('TITLE')).toHaveLength(1))
        await waitFor(() => expect(queryAllByText('MESSAGE')).toHaveLength(1))
    })
})

describe('AcmToast', () => {
    test('renders a toast alert in alert group', async () => {
        const { getByText, queryAllByText, getByRole, container } = render(
            <AcmToastProvider>
                <AcmToastGroup />
                <AcmToastContext.Consumer>
                    {(context) => (
                        <Fragment>
                            <AcmButton onClick={() => context.addAlert({ title: 'Info', type: 'info' })}>
                                Add Info
                            </AcmButton>
                            <AcmButton onClick={() => context.addAlert({ title: 'Error', type: 'danger' })}>
                                Add Error
                            </AcmButton>
                            <AcmButton onClick={() => context.addAlert({ title: 'Warning', type: 'warning' })}>
                                Add Warning
                            </AcmButton>
                            <AcmButton
                                onClick={() => context.addAlert({ title: 'Expiring', type: 'info', autoClose: true })}
                            >
                                Add Expiring
                            </AcmButton>
                            <AcmButton onClick={() => context.clearAlerts()}>Clear Alerts</AcmButton>
                            <AcmButton onClick={() => context.clearAlerts((a) => a.type === 'warning')}>
                                Clear Warnings
                            </AcmButton>
                        </Fragment>
                    )}
                </AcmToastContext.Consumer>
            </AcmToastProvider>
        )

        expect(queryAllByText('Info')).toHaveLength(0)
        getByText('Add Info').click()
        await waitFor(() => expect(queryAllByText('Info')).toHaveLength(1))

        expect(queryAllByText('Error')).toHaveLength(0)
        getByText('Add Error').click()
        await waitFor(() => expect(queryAllByText('Error')).toHaveLength(1))
        getByText('Add Error').click()
        await waitFor(() => expect(queryAllByText('Error')).toHaveLength(2))

        expect(queryAllByText('Warning')).toHaveLength(0)
        getByText('Add Warning').click()
        await waitFor(() => expect(queryAllByText('Warning')).toHaveLength(1))

        await act(async () => {
            expect(queryAllByText('Expiring')).toHaveLength(0)
            getByText('Add Expiring').click()
            await waitFor(() => expect(queryAllByText('Expiring')).toHaveLength(1))
            await waitFor(() => expect(queryAllByText('Expiring')).toHaveLength(0), { timeout: 5500 })
        })

        expect(await axe(container)).toHaveNoViolations()

        getByText('Clear Warnings').click()
        await waitFor(() => expect(queryAllByText('Warning')).toHaveLength(0))
        await waitFor(() => expect(queryAllByText('Info')).toHaveLength(1))
        await waitFor(() => expect(queryAllByText('Error')).toHaveLength(2))

        getByRole('button', { name: 'Close Info alert: alert: Info' }).click()
        await waitFor(() => expect(queryAllByText('Info')).toHaveLength(0))

        getByText('Clear Alerts').click()
        await waitFor(() => expect(queryAllByText('Error')).toHaveLength(0))

        await new Promise((resolve) => setTimeout(resolve, 1000))
    })

    test('renders alert', async () => {
        const { queryAllByText } = render(<AcmToast title="TITLE" message="MESSAGE" variant="info" />)
        await waitFor(() => expect(queryAllByText('TITLE')).toHaveLength(1))
        await waitFor(() => expect(queryAllByText('MESSAGE')).toHaveLength(1))
    })
})
