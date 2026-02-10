/* Copyright Contributors to the Open Cluster Management project */

import { watch } from 'node:fs'
import { stopFileWatches, watchFile } from '../../src/lib/fileWatch'

jest.mock('node:fs', () => ({
  ...jest.requireActual<typeof import('node:fs')>('node:fs'),
  watch: jest.fn(),
}))

const mockWatch = watch as jest.MockedFunction<typeof watch>

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('fileWatch', () => {
  let mockClose: jest.Mock
  let watchListener: (eventType: string, filename: string) => void

  beforeEach(() => {
    jest.useFakeTimers()
    mockClose = jest.fn()
    mockWatch.mockImplementation((_path: string, listener: (event: string, name: string) => void) => {
      watchListener = listener
      return { close: mockClose } as unknown as ReturnType<typeof watch>
    })
  })

  afterEach(() => {
    stopFileWatches()
    jest.useRealTimers()
    mockWatch.mockReset()
  })

  it('starts watching on first watchFile call and invokes onChange after debounce when file change is emitted', () => {
    const onChange = jest.fn()
    watchFile('/var/run/secrets/kubernetes.io/serviceaccount/token', onChange)

    expect(mockWatch).toHaveBeenCalledTimes(1)
    expect(mockWatch).toHaveBeenCalledWith('/var/run/secrets/kubernetes.io/serviceaccount/token', expect.any(Function))

    watchListener('change', 'token')
    expect(onChange).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('reuses same watcher for multiple callbacks on the same path', () => {
    const onChange1 = jest.fn()
    const onChange2 = jest.fn()
    watchFile('/some/path/ca.crt', onChange1)
    watchFile('/some/path/ca.crt', onChange2)

    expect(mockWatch).toHaveBeenCalledTimes(1)

    watchListener('change', 'ca.crt')
    jest.advanceTimersByTime(1000)
    expect(onChange1).toHaveBeenCalledTimes(1)
    expect(onChange2).toHaveBeenCalledTimes(1)
  })

  it('removes watch when persist is false (default) so next watchFile creates a new watcher', () => {
    const onChange = jest.fn()
    watchFile('/path/token', onChange)
    expect(mockWatch).toHaveBeenCalledTimes(1)

    watchListener('change', 'token')
    jest.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(mockClose).toHaveBeenCalledTimes(1)

    watchFile('/path/token', jest.fn())
    expect(mockWatch).toHaveBeenCalledTimes(2)
  })

  it('does not remove watch when persist is true', () => {
    const onChange = jest.fn()
    watchFile('/path/token', onChange, true)
    watchListener('change', 'token')
    jest.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(mockClose).not.toHaveBeenCalled()
  })

  it('creates separate watchers for different paths', () => {
    watchFile('/path/a', jest.fn())
    watchFile('/path/b', jest.fn())
    expect(mockWatch).toHaveBeenCalledTimes(2)
    expect(mockWatch).toHaveBeenCalledWith('/path/a', expect.any(Function))
    expect(mockWatch).toHaveBeenCalledWith('/path/b', expect.any(Function))
  })

  it('debounces rapid change events', () => {
    const onChange = jest.fn()
    watchFile('/path/token', onChange)

    watchListener('change', 'token')
    jest.advanceTimersByTime(500)
    watchListener('change', 'token')
    jest.advanceTimersByTime(500)
    expect(onChange).not.toHaveBeenCalled()
    jest.advanceTimersByTime(500)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('stopFileWatches closes all watchers and clears state', () => {
    const onChange = jest.fn()
    watchFile('/path/token', onChange)
    expect(mockClose).not.toHaveBeenCalled()

    stopFileWatches()
    expect(mockClose).toHaveBeenCalledTimes(1)

    stopFileWatches()
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('does not throw when watch throws (e.g. file missing)', () => {
    mockWatch.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    const onChange = jest.fn()

    expect(() => watchFile('/nonexistent/file', onChange)).not.toThrow()
    stopFileWatches()
  })
})

describe('fileWatch with real timers', () => {
  let mockClose: jest.Mock
  let watchListener: (eventType: string, filename: string) => void

  beforeEach(() => {
    mockClose = jest.fn()
    mockWatch.mockImplementation((_path: string, listener: (event: string, name: string) => void) => {
      watchListener = listener
      return { close: mockClose } as unknown as ReturnType<typeof watch>
    })
  })

  afterEach(() => {
    stopFileWatches()
    mockWatch.mockReset()
  })

  it('invokes onChange after debounce with real timers', async () => {
    jest.useRealTimers()
    const onChange = jest.fn()
    watchFile('/path/token', onChange)
    watchListener('change', 'token')
    await delay(1100)
    expect(onChange).toHaveBeenCalledTimes(1)
    jest.useFakeTimers()
  })
})

describe('watchServiceAccountFile path', () => {
  it('getServiceAccountToken triggers watchFile with path containing serviceaccount and token', async () => {
    const watchModule = await import('../../src/lib/fileWatch')
    const watchFileSpy = jest.spyOn(watchModule, 'watchFile')
    const tokenModule = await import('../../src/lib/serviceAccountToken')
    tokenModule.getServiceAccountToken()
    expect(watchFileSpy).toHaveBeenCalledWith(expect.stringContaining('serviceaccount'), expect.any(Function))
    expect(watchFileSpy.mock.calls[0][0]).toContain('token')
    watchFileSpy.mockRestore()
  })
})
