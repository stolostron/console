/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BulkActionModal } from './BulkActionModal'

function makeRequestResult<T = unknown>(impl: () => Promise<T>) {
  const abort = jest.fn()
  const promise = impl()
  return { abort, promise }
}

describe('BulkActionModal - actionOneByOne loop', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('invokes actionFn sequentially with fake timers when actionOneByOne is true', async () => {
    jest.useFakeTimers()
    try {
      const close = jest.fn()
      const funcTimeout = 100
      const actionFn = jest
        .fn()
        .mockImplementation(() => makeRequestResult(() => new Promise<void>((res) => setTimeout(res, funcTimeout))))

      render(
        <BulkActionModal
          open
          title="Delete things"
          description="desc"
          action="Delete"
          processing="Deleting"
          items={items}
          keyFn={(i: { id: string }) => i.id}
          emptyState={<div />}
          actionFn={actionFn}
          actionOneByOne
          close={close}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      // First call starts immediately
      expect(actionFn).toHaveBeenCalledTimes(1)

      // Resolve first -> then second starts
      await act(async () => {
        jest.advanceTimersByTime(funcTimeout)
      })
      await waitFor(() => expect(actionFn).toHaveBeenCalledTimes(2))

      // Resolve second -> then third starts
      await act(async () => {
        jest.advanceTimersByTime(funcTimeout)
      })
      await waitFor(() => expect(actionFn).toHaveBeenCalledTimes(3))

      // Resolve third and allow the modal's 500ms completion delay to elapse
      await act(async () => {
        jest.advanceTimersByTime(funcTimeout)
        jest.advanceTimersByTime(500)
      })
      await waitFor(() => expect(close).toHaveBeenCalled())
    } finally {
      jest.useRealTimers()
    }
  })

  it('collects errors and shows error state without closing when any item rejects', async () => {
    const close = jest.fn()
    const actionFn = jest
      .fn()
      .mockImplementationOnce(() => makeRequestResult(async () => Promise.resolve(undefined)))
      .mockImplementationOnce(() => makeRequestResult(async () => Promise.resolve(undefined)))
      .mockImplementationOnce(() => makeRequestResult(async () => Promise.reject(new Error('boom'))))

    render(
      <BulkActionModal
        open
        title="Delete things"
        description="desc"
        action="Delete"
        processing="Deleting"
        items={items}
        keyFn={(i: { id: string }) => i.id}
        emptyState={<div />}
        actionFn={actionFn}
        actionOneByOne
        close={close}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    await waitFor(() => expect(actionFn).toHaveBeenCalledTimes(items.length))
    // Error path renders an inline alert with "there were errors" text
    expect(await screen.findByText(/there were errors/i)).toBeInTheDocument()
    expect(close).not.toHaveBeenCalled()
  })
})
