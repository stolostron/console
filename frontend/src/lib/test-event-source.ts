/* Copyright Contributors to the Open Cluster Management project */

export type FakeEventSource = {
  url: string
  withCredentials: boolean
  readyState: number
  onmessage: ((ev: MessageEvent) => void) | null
  onerror: (() => void) | null
  close: jest.Mock
  emit: (data: unknown) => void
  triggerError: (readyState?: number) => void
}

export function installFakeEventSource(): { sources: FakeEventSource[]; restore: () => void } {
  const sources: FakeEventSource[] = []
  const OriginalEventSource = global.EventSource
  global.EventSource = class {
    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSED = 2
    url: string
    withCredentials: boolean
    readyState = 1
    onmessage: ((ev: MessageEvent) => void) | null = null
    onerror: (() => void) | null = null
    close = jest.fn()
    constructor(url: string | URL, init?: EventSourceInit) {
      this.url = url.toString()
      this.withCredentials = !!init?.withCredentials
      const self = this as unknown as FakeEventSource
      self.emit = (data: unknown) => {
        this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent)
      }
      self.triggerError = (readyState = EventSource.CLOSED) => {
        this.readyState = readyState
        this.onerror?.()
      }
      sources.push(self)
    }
  } as unknown as typeof EventSource

  return {
    sources,
    restore: () => {
      global.EventSource = OriginalEventSource
    },
  }
}
