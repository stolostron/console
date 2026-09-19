/* Copyright Contributors to the Open Cluster Management project */

import { act, render, waitFor } from '@testing-library/react'
import { createElement, ReactElement, type ComponentProps } from 'react'
import { MutableSnapshot, RecoilRoot } from 'recoil'
import { settingsState } from '../atoms'
import { PluginDataContext, defaultContext, PluginData } from '../lib/PluginDataContext'
import { installFakeEventSource } from '../lib/test-event-source'
import { LoadDataAbstract } from './LoadDataAbstract'

let mockIsActive = true
jest.mock('../lib/usePageActivity', () => ({
  usePageActivity: () => ({ isActive: mockIsActive, deadline: null, pageInUse: true }),
}))

jest.mock('../resources/utils', () => ({
  getBackendUrl: () => '',
}))

function createTestContext(overrides: Partial<PluginData> = {}): PluginData {
  return {
    ...defaultContext,
    loadStarted: true,
    loadCompleted: true,
    startLoading: true,
    mounted: true,
    ...overrides,
  }
}

function Wrapper({ ctx, children }: { ctx: PluginData; children: ReactElement }) {
  return createElement(
    PluginDataContext.Provider,
    { value: ctx },
    createElement(
      RecoilRoot,
      {
        initializeState: (snapshot: MutableSnapshot) => {
          snapshot.set(settingsState, { EVENT_STREAM_IDLE_TIMEOUT: '1', EVENT_STREAM_IDLE_GRACE_PERIOD: '0' })
        },
      } as ComponentProps<typeof RecoilRoot>,
      children
    )
  )
}

describe('LoadDataAbstract', () => {
  let fake: ReturnType<typeof installFakeEventSource>

  beforeEach(() => {
    mockIsActive = true
    fake = installFakeEventSource()
  })

  afterEach(() => {
    fake.restore()
  })

  it('does not drive overlay flags by default', async () => {
    const setIsStreamIdle = jest.fn()
    const setIsReconnecting = jest.fn()
    const ctx = createTestContext({ setIsStreamIdle, setIsReconnecting })
    const { rerender } = render(
      <Wrapper ctx={ctx}>
        <LoadDataAbstract path="/events/rbac" />
      </Wrapper>
    )
    await waitFor(() => expect(fake.sources.length).toBe(1))

    mockIsActive = false
    rerender(
      <Wrapper ctx={ctx}>
        <LoadDataAbstract path="/events/rbac" />
      </Wrapper>
    )

    expect(setIsStreamIdle).not.toHaveBeenCalled()
    expect(setIsReconnecting).not.toHaveBeenCalled()
    expect(fake.sources[0].close).toHaveBeenCalled()
  })

  it('drives overlay flags when driveAppLifecycle is set', async () => {
    const setIsStreamIdle = jest.fn()
    const ctx = createTestContext({ setIsStreamIdle })
    const { rerender } = render(
      <Wrapper ctx={ctx}>
        <LoadDataAbstract path="/events" driveAppLifecycle />
      </Wrapper>
    )
    await waitFor(() => expect(fake.sources.length).toBe(1))

    mockIsActive = false
    rerender(
      <Wrapper ctx={ctx}>
        <LoadDataAbstract path="/events" driveAppLifecycle />
      </Wrapper>
    )

    expect(setIsStreamIdle).toHaveBeenCalledWith(true)
  })

  it('applies resources[] watch events into the Recoil setter', async () => {
    const setState = jest.fn()
    const ctx = createTestContext()
    render(
      <Wrapper ctx={ctx}>
        <LoadDataAbstract
          path="/events/rbac"
          resources={[{ apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole', setState }]}
        />
      </Wrapper>
    )
    await waitFor(() => expect(fake.sources.length).toBe(1))

    const object = {
      kind: 'ClusterRole',
      apiVersion: 'rbac.authorization.k8s.io/v1',
      metadata: { name: 'kubevirt.io:admin', uid: 'uid-1' },
    }
    act(() => {
      fake.sources[0].emit({ type: 'ADDED', object })
      fake.sources[0].emit({ type: 'EOP' })
    })

    expect(setState).toHaveBeenCalledWith([object])
  })
})
