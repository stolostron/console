/* Copyright Contributors to the Open Cluster Management project */

import { act, render, waitFor } from '@testing-library/react'
import { createElement, ReactElement, type ComponentProps } from 'react'
import { MutableSnapshot, RecoilRoot, useRecoilValue } from 'recoil'
import { settingsState, vmClusterRolesState } from '../atoms'
import { PluginDataContext, defaultContext, PluginData } from '../lib/PluginDataContext'
import { installFakeEventSource } from '../lib/test-event-source'
import { ClusterRole } from '../resources'
import { LoadRbacData } from './LoadRbacData'

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

function RolesProbe() {
  const roles = useRecoilValue(vmClusterRolesState)
  return createElement('div', { id: 'roles' }, String(roles.length))
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

const sampleRole: ClusterRole = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: { name: 'kubevirt.io:admin', uid: 'uid-1' },
  rules: [],
}

describe('LoadRbacData', () => {
  let fake: ReturnType<typeof installFakeEventSource>

  beforeEach(() => {
    mockIsActive = true
    fake = installFakeEventSource()
  })

  afterEach(() => {
    fake.restore()
  })

  it('opens /events/rbac with credentials and applies ADDED into the atom', async () => {
    const ctx = createTestContext()
    render(
      <Wrapper ctx={ctx}>
        <>
          <LoadRbacData />
          <RolesProbe />
        </>
      </Wrapper>
    )

    await waitFor(() => expect(fake.sources.length).toBe(1))
    expect(fake.sources[0].url).toBe('/events/rbac')
    expect(fake.sources[0].withCredentials).toBe(true)

    act(() => {
      fake.sources[0].emit({ type: 'START' })
      fake.sources[0].emit({ type: 'ADDED', object: sampleRole })
      fake.sources[0].emit({ type: 'EOP' })
      fake.sources[0].emit({ type: 'LOADED' })
    })

    await waitFor(() => {
      expect(document.getElementById('roles')?.textContent).toBe('1')
    })
  })

  it('removes DELETED roles from the atom', async () => {
    const ctx = createTestContext()
    render(
      <Wrapper ctx={ctx}>
        <>
          <LoadRbacData />
          <RolesProbe />
        </>
      </Wrapper>
    )
    await waitFor(() => expect(fake.sources.length).toBe(1))
    act(() => {
      fake.sources[0].emit({ type: 'ADDED', object: sampleRole })
      fake.sources[0].emit({ type: 'EOP' })
    })
    await waitFor(() => expect(document.getElementById('roles')?.textContent).toBe('1'))
    act(() => {
      fake.sources[0].emit({ type: 'DELETED', object: sampleRole })
      fake.sources[0].emit({ type: 'EOP' })
    })
    await waitFor(() => expect(document.getElementById('roles')?.textContent).toBe('0'))
  })

  it('closes the stream when idle with no grace period and does not drive overlay flags', async () => {
    const setIsStreamIdle = jest.fn()
    const setIsReconnecting = jest.fn()
    const ctx = createTestContext({ setIsStreamIdle, setIsReconnecting })
    const { rerender } = render(
      <Wrapper ctx={ctx}>
        <LoadRbacData />
      </Wrapper>
    )
    await waitFor(() => expect(fake.sources.length).toBe(1))
    mockIsActive = false
    rerender(
      <Wrapper ctx={ctx}>
        <LoadRbacData />
      </Wrapper>
    )
    expect(fake.sources[0].close).toHaveBeenCalled()
    expect(setIsStreamIdle).not.toHaveBeenCalled()
    expect(setIsReconnecting).not.toHaveBeenCalled()
  })
})
