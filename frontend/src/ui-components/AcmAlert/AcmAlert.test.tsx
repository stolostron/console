/* Copyright Contributors to the Open Cluster Management project */

import { act, render, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Fragment } from 'react'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmAlert, AcmAlertContext, AcmAlertGroup, AcmAlertProvider, replaceAlertById } from './AcmAlert'
import type { AcmAlertInfoWithId } from './AcmAlert'
import { AcmToast, AcmToastContext, AcmToastGroup, AcmToastProvider } from './AcmToast'

describe('replaceAlertById', () => {
  test('returns the same array when no alert matches the id', () => {
    const alerts: AcmAlertInfoWithId[] = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ]
    const result = replaceAlertById(alerts, { id: 'c', title: 'C' })
    expect(result).toBe(alerts)
    expect(result).toEqual([
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ])
  })

  test('replaces the alert with matching id and returns a new array', () => {
    const alerts: AcmAlertInfoWithId[] = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ]
    const result = replaceAlertById(alerts, { id: 'b', title: 'B updated', message: 'msg' })
    expect(result).not.toBe(alerts)
    expect(result).toEqual([
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B updated', message: 'msg' },
    ])
  })

  test('does not mutate the original array', () => {
    const alerts: AcmAlertInfoWithId[] = [{ id: 'x', title: 'X' }]
    replaceAlertById(alerts, { id: 'x', title: 'Y' })
    expect(alerts[0].title).toBe('X')
  })
})

describe('AcmAlert', () => {
  test('renders alerts in alert group', async () => {
    const { getByText, queryAllByText, getByRole, container } = render(
      <AcmAlertProvider>
        <AcmAlertGroup isInline canClose />
        <AcmAlertContext.Consumer>
          {(context) => (
            <Fragment>
              <AcmButton onClick={() => context.addAlert({ title: 'Info', type: 'info' })}>Add Info</AcmButton>
              <AcmButton onClick={() => context.addAlert({ title: 'Error', type: 'danger' })}>Add Error</AcmButton>
              <AcmButton onClick={() => context.addAlert({ title: 'Warning', type: 'warning' })}>Add Warning</AcmButton>
              <AcmButton onClick={() => context.clearAlerts()}>Clear Alerts</AcmButton>
              <AcmButton onClick={() => context.clearAlerts((a) => a.type === 'warning')}>Clear Warnings</AcmButton>
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

  describe('modifyAlert', () => {
    test('updates an existing alert title and message when modifyAlert is called', async () => {
      let addAlertReturn: AcmAlertInfoWithId | null = null
      const { getByText, queryByText } = render(
        <AcmAlertProvider>
          <AcmAlertGroup isInline canClose />
          <AcmAlertContext.Consumer>
            {(context) => (
              <Fragment>
                <AcmButton
                  onClick={() => {
                    addAlertReturn = context.addAlert({
                      title: 'Original title',
                      message: 'Original message',
                      type: 'info',
                    })
                  }}
                >
                  Add Alert
                </AcmButton>
                <AcmButton
                  onClick={() => {
                    if (addAlertReturn) {
                      context.modifyAlert({
                        ...addAlertReturn,
                        title: 'Updated title',
                        message: 'Updated message',
                        type: 'warning',
                      })
                    }
                  }}
                >
                  Modify Alert
                </AcmButton>
              </Fragment>
            )}
          </AcmAlertContext.Consumer>
        </AcmAlertProvider>
      )

      getByText('Add Alert').click()
      await waitFor(() => expect(queryByText('Original title')).toBeInTheDocument())
      expect(queryByText('Original message')).toBeInTheDocument()

      getByText('Modify Alert').click()
      await waitFor(() => expect(queryByText('Updated title')).toBeInTheDocument())
      await waitFor(() => expect(queryByText('Updated message')).toBeInTheDocument())
      expect(queryByText('Original title')).not.toBeInTheDocument()
      expect(queryByText('Original message')).not.toBeInTheDocument()
    })

    test('modifyAlert returns the passed alertInfo', async () => {
      let addAlertReturn: AcmAlertInfoWithId | null = null
      let modifyReturn: AcmAlertInfoWithId | null = null
      const { getByText } = render(
        <AcmAlertProvider>
          <AcmAlertGroup isInline canClose />
          <AcmAlertContext.Consumer>
            {(context) => (
              <Fragment>
                <AcmButton
                  onClick={() => {
                    addAlertReturn = context.addAlert({ title: 'Alert' })
                  }}
                >
                  Add
                </AcmButton>
                <AcmButton
                  onClick={() => {
                    if (addAlertReturn) {
                      const updated = { ...addAlertReturn, title: 'Modified' }
                      modifyReturn = context.modifyAlert(updated)
                    }
                  }}
                >
                  Modify
                </AcmButton>
              </Fragment>
            )}
          </AcmAlertContext.Consumer>
        </AcmAlertProvider>
      )

      getByText('Add').click()
      await waitFor(() => expect(addAlertReturn).not.toBeNull())
      getByText('Modify').click()
      await waitFor(() =>
        expect(modifyReturn).toEqual(expect.objectContaining({ id: addAlertReturn!.id, title: 'Modified' }))
      )
    })
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
              <AcmButton onClick={() => context.addAlert({ title: 'Info', type: 'info' })}>Add Info</AcmButton>
              <AcmButton onClick={() => context.addAlert({ title: 'Error', type: 'danger' })}>Add Error</AcmButton>
              <AcmButton onClick={() => context.addAlert({ title: 'Warning', type: 'warning' })}>Add Warning</AcmButton>
              <AcmButton onClick={() => context.addAlert({ title: 'Expiring', type: 'info', autoClose: true })}>
                Add Expiring
              </AcmButton>
              <AcmButton onClick={() => context.clearAlerts()}>Clear Alerts</AcmButton>
              <AcmButton onClick={() => context.clearAlerts((a) => a.type === 'warning')}>Clear Warnings</AcmButton>
            </Fragment>
          )}
        </AcmToastContext.Consumer>
      </AcmToastProvider>
    )

    expect(queryAllByText('Info')).toHaveLength(0)
    await act(async () => {
      getByText('Add Info').click()
    })
    await waitFor(() => expect(queryAllByText('Info')).toHaveLength(1), { timeout: 1000 })

    expect(queryAllByText('Error')).toHaveLength(0)
    await act(async () => {
      getByText('Add Error').click()
    })
    await waitFor(() => expect(queryAllByText('Error')).toHaveLength(1), { timeout: 1000 })
    await act(async () => {
      getByText('Add Error').click()
    })
    await waitFor(() => expect(queryAllByText('Error')).toHaveLength(2), { timeout: 1000 })

    expect(queryAllByText('Warning')).toHaveLength(0)
    await act(async () => {
      getByText('Add Warning').click()
    })
    await waitFor(() => expect(queryAllByText('Warning')).toHaveLength(1), { timeout: 1000 })

    await act(async () => {
      expect(queryAllByText('Expiring')).toHaveLength(0)
      getByText('Add Expiring').click()
      await waitFor(() => expect(queryAllByText('Expiring')).toHaveLength(1))
      await waitFor(() => expect(queryAllByText('Expiring')).toHaveLength(0), { timeout: 5500 })
    })

    expect(await axe(container)).toHaveNoViolations()

    await act(async () => {
      getByText('Clear Warnings').click()
    })
    await waitFor(() => expect(queryAllByText('Warning')).toHaveLength(0), { timeout: 1000 })
    await waitFor(() => expect(queryAllByText('Info')).toHaveLength(1), { timeout: 1000 })
    await waitFor(() => expect(queryAllByText('Error')).toHaveLength(2), { timeout: 1000 })

    await act(async () => {
      getByRole('button', { name: 'Close Info alert: alert: Info' }).click()
    })
    await waitFor(() => expect(queryAllByText('Info')).toHaveLength(0), { timeout: 1000 })

    await act(async () => {
      getByText('Clear Alerts').click()
    })
    await waitFor(() => expect(queryAllByText('Error')).toHaveLength(0), { timeout: 1000 })

    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  test('renders alert', async () => {
    const { queryAllByText } = render(<AcmToast title="TITLE" message="MESSAGE" variant="info" />)
    await waitFor(() => expect(queryAllByText('TITLE')).toHaveLength(1))
    await waitFor(() => expect(queryAllByText('MESSAGE')).toHaveLength(1))
  })
})
