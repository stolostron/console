/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmAutoRefreshSelect } from './AcmAutoRefreshSelect'
import { act } from 'react-dom/test-utils'

describe('AcmAutoRefreshSelect', () => {
  const refetch = jest.fn()

  beforeEach(() => {
    refetch.mockReset()
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(<AcmAutoRefreshSelect refetch={refetch} pollInterval={30000} />)
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders', async () => {
    const { getByTestId, container } = render(<AcmAutoRefreshSelect refetch={refetch} pollInterval={30000} />)
    expect(getByTestId('refresh-dropdown')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
    userEvent.click(getByTestId('refresh-toggle'))
    await waitFor(() => expect(getByTestId('refresh-30s')).toBeInTheDocument())
    userEvent.click(getByTestId('refresh-30s'))
    expect(refetch).toHaveBeenCalled()
    expect(await axe(container)).toHaveNoViolations()
    userEvent.hover(getByTestId('refresh-dropdown'))
  })

  test('should use default poll interval when localStorage is empty', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    })

    render(<AcmAutoRefreshSelect refetch={refetch} />)

    expect(window.localStorage.getItem).toHaveBeenCalledTimes(1)
    expect(window.localStorage.setItem).toHaveBeenCalledTimes(1)
    expect(window.localStorage.setItem).toHaveBeenCalledWith('acm-page-refresh-interval', '60000')
  })

  test('should use poll interval from localStorage', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => '60000'),
        setItem: jest.fn(),
      },
    })

    render(<AcmAutoRefreshSelect refetch={refetch} />)

    expect(window.localStorage.getItem).toHaveReturnedWith('60000')
    expect(screen.getByText('Refresh every 1m')).toBeInTheDocument()
  })

  test('refetch is called at the expected interval of 1 second', async () => {
    render(<AcmAutoRefreshSelect refetch={refetch} refreshIntervals={[1, 30, 60]} pollInterval={1000} />)

    expect(refetch).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Refresh every 1s')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(refetch).toHaveBeenCalledTimes(2)
  })

  test('uses custom refreshIntervalCookie if passed as prop', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'test-cookie'),
        setItem: jest.fn(),
      },
    })
    render(<AcmAutoRefreshSelect refetch={refetch} refreshIntervalCookie={'test-cookie'} />)

    expect(window.localStorage.getItem).toHaveReturnedWith('test-cookie')
    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  test('uses custom initPollInterval if value passed as prop', async () => {
    const INITIAL_POLL_INTERVAL = 30
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => INITIAL_POLL_INTERVAL * 1000),
        setItem: jest.fn(() => INITIAL_POLL_INTERVAL * 1000),
      },
    })
    render(<AcmAutoRefreshSelect refetch={refetch} initPollInterval={INITIAL_POLL_INTERVAL} />)

    expect(screen.getByText('Refresh every 30s')).toBeInTheDocument()
    expect(window.localStorage.getItem).toHaveReturnedWith(30000)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  test('selected poll interval is saved to local storage', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(() => 'test-cookie'),
      },
    })
    const { getByTestId } = render(
      <AcmAutoRefreshSelect refetch={refetch} refreshIntervalCookie={'test-cookie'} initPollInterval={30} />
    )
    userEvent.click(getByTestId('refresh-toggle'))
    await waitFor(() => expect(getByTestId('refresh-30s')).toBeInTheDocument())
    userEvent.click(getByTestId('refresh-30s'))
    expect(refetch).toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(window.localStorage.setItem).toHaveBeenCalledWith('test-cookie', '30000')
  })

  test('refetch is not fired when the browser is hidden', async () => {
    let eventCallback: unknown = null

    jest.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    jest
      .spyOn(document, 'addEventListener')
      .mockImplementation((eventName: string, callback: EventListenerOrEventListenerObject) => {
        if (eventName == 'visibilitychange') {
          eventCallback = callback
        }
      })

    render(<AcmAutoRefreshSelect refetch={refetch} refreshIntervals={[1, 30, 60]} pollInterval={100} />)
    expect(refetch).toHaveBeenCalledTimes(1) // initial fetch only
    jest.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    await act(async () => {
      expect(eventCallback).not.toBeNull()
      if (typeof eventCallback === 'function') {
        eventCallback()
      }
    })
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(refetch).toHaveBeenCalledTimes(1) // still initial fetch only
  })

  test('refetch is fired when the browser is unhidden', async () => {
    let eventCallback: unknown = null

    jest.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    jest
      .spyOn(document, 'addEventListener')
      .mockImplementation((eventName: string, callback: EventListenerOrEventListenerObject) => {
        if (eventName == 'visibilitychange') {
          eventCallback = callback
        }
      })

    render(<AcmAutoRefreshSelect refetch={refetch} refreshIntervals={[1, 30, 60]} pollInterval={100} />)
    expect(refetch).toHaveBeenCalledTimes(1) // initial fetch only
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(refetch).toHaveBeenCalledTimes(1) // still initial fetch only
    jest.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    await act(async () => {
      expect(eventCallback).not.toBeNull()
      if (typeof eventCallback === 'function') {
        eventCallback()
      }
    })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(refetch).toHaveBeenCalledTimes(3) // unhide + interval refetch
  })

  test('refetch is not fired when disabled and the browser is unhidden', async () => {
    let eventCallback: unknown = null

    jest.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    jest
      .spyOn(document, 'addEventListener')
      .mockImplementation((eventName: string, callback: EventListenerOrEventListenerObject) => {
        if (eventName == 'visibilitychange') {
          eventCallback = callback
        }
      })

    render(<AcmAutoRefreshSelect refetch={refetch} refreshIntervals={[1, 30, 60]} pollInterval={0} />)
    expect(refetch).toHaveBeenCalledTimes(1) // initial fetch only
    jest.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    await act(async () => {
      expect(eventCallback).not.toBeNull()
      if (typeof eventCallback === 'function') {
        eventCallback()
      }
    })
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(refetch).toHaveBeenCalledTimes(1) // still initial fetch only
  })

  test('refresh button fires refetch', () => {
    const { getByTestId } = render(<AcmAutoRefreshSelect refetch={refetch} pollInterval={30000} />)
    const refreshIcon = getByTestId('refresh-icon')
    expect(refreshIcon).toBeInTheDocument()
    userEvent.click(refreshIcon)
    expect(refetch).toHaveBeenCalled()
    fireEvent.keyPress(refreshIcon, { key: 'Enter', code: 13, charCode: 13 })
    expect(refetch).toHaveBeenCalled()
  })
})
