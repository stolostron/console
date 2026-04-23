/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { useContext, useEffect, useRef, useState } from 'react'
import { usePageActivity } from '../lib/usePageActivity'
import { PluginDataContext } from '~/lib/PluginDataContext'
// This component is rendered in the PluginDataContextProvider, so can use recoil directly
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useEventStreamIdleGracePeriod, useEventStreamIdleTimeout } from '~/atoms'

const panelClass = css({
  position: 'fixed',
  bottom: 8,
  right: 8,
  zIndex: 100000,
  background: 'rgba(0,0,0,0.85)',
  color: '#0f0',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '8px 12px',
  borderRadius: 6,
  lineHeight: 1.6,
  pointerEvents: 'none',
  whiteSpace: 'pre',
})

function fmt(ms: number) {
  const s = ms / 1000
  return s >= 60 ? `${(s / 60).toFixed(1)}m` : `${s.toFixed(1)}s`
}

function bar(fraction: number, width = 20) {
  const clamped = Math.max(0, Math.min(1, fraction))
  const filled = Math.round(clamped * width)
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']'
}

function computeIdleFrac(
  fullyIdle: boolean,
  deadline: number | null,
  pageInUse: boolean,
  now: number,
  timeoutMs: number
): number {
  if (fullyIdle) return 1
  if (!pageInUse && deadline) {
    const remaining = Math.max(0, deadline - now)
    return 1 - remaining / timeoutMs
  }
  return 0
}

function computeGraceFrac(idleStart: number | null, isReconnecting: boolean, now: number, gracePeriodMs: number) {
  if (!idleStart) return 0
  if (isReconnecting) return 1
  if (gracePeriodMs <= 0) return 1
  return Math.min(1, (now - idleStart) / gracePeriodMs)
}

function computeState(isReconnecting: boolean, isStreamIdle: boolean, pageInUse: boolean, graceFrac: number) {
  if (isReconnecting) return 'RECONNECTING'
  if (isStreamIdle && graceFrac >= 1) return 'IDLE (stopped)'
  if (isStreamIdle) return 'IDLE (grace)'
  if (!pageInUse) return 'COUNTING DOWN'
  return 'ACTIVE'
}

export function EventStreamIdleDebugPanel() {
  const ctx = useContext(PluginDataContext)
  const idleTimeoutMs = useEventStreamIdleTimeout()
  const gracePeriodMs = useEventStreamIdleGracePeriod()

  const { isActive, deadline, pageInUse } = usePageActivity(idleTimeoutMs, ctx.mounted)
  const [tick, setTick] = useState(0)

  const idleStartRef = useRef<number | null>(null)
  const prevIsStreamIdleRef = useRef(ctx.isStreamIdle)

  if (ctx.isStreamIdle && !prevIsStreamIdleRef.current) {
    idleStartRef.current = Date.now()
  }
  if (!ctx.isStreamIdle && prevIsStreamIdleRef.current) {
    idleStartRef.current = null
  }
  prevIsStreamIdleRef.current = ctx.isStreamIdle

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [])

  const now = Date.now()
  const fullyIdle = ctx.isStreamIdle || ctx.isReconnecting || !isActive
  const idleFrac = computeIdleFrac(fullyIdle, deadline, pageInUse, now, idleTimeoutMs)
  const graceFrac = computeGraceFrac(idleStartRef.current, ctx.isReconnecting, now, gracePeriodMs)
  const state = computeState(ctx.isReconnecting, ctx.isStreamIdle, pageInUse, graceFrac)
  const elapsed = idleFrac >= 1 ? idleTimeoutMs : idleFrac * idleTimeoutMs

  const lines = [
    `state: ${state}`,
    ``,
    `idleTimeout: ${fmt(idleTimeoutMs)}  gracePeriod: ${fmt(gracePeriodMs)}`,
    ``,
    `idle   ${bar(idleFrac)} ${(idleFrac * 100).toFixed(0).padStart(3)}%  ${fmt(elapsed)}`,
    `grace  ${bar(graceFrac)} ${(graceFrac * 100).toFixed(0).padStart(3)}%  ${idleStartRef.current ? fmt(now - idleStartRef.current) : '-'}`,
    ``,
    `isActive:       ${isActive}`,
    `doc.hidden:     ${document.hidden}`,
    `doc.hasFocus:   ${document.hasFocus()}`,
    `mounted:        ${ctx.mounted}`,
    `isStreamIdle:   ${ctx.isStreamIdle}`,
    `isReconnecting: ${ctx.isReconnecting}`,
    `loadStarted:    ${ctx.loadStarted}`,
    `loadCompleted:  ${ctx.loadCompleted}`,
    `tick:           ${tick}`,
  ]

  return <div className={panelClass}>{lines.join('\n')}</div>
}
