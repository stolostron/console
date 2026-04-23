/* Copyright Contributors to the Open Cluster Management project */

// Test the pure helper functions used in the debug panel.
// The component itself is conditional on DEBUG_EVENT_STREAM_IDLE and not tested here.

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

describe('computeIdleFrac', () => {
  it('returns 1 when fully idle', () => {
    expect(computeIdleFrac(true, null, true, Date.now(), 60000)).toBe(1)
  })

  it('returns 0 when page is in use', () => {
    expect(computeIdleFrac(false, Date.now() + 30000, true, Date.now(), 60000)).toBe(0)
  })

  it('returns 0 when deadline is null and not fully idle', () => {
    expect(computeIdleFrac(false, null, false, Date.now(), 60000)).toBe(0)
  })

  it('returns fraction based on deadline when not in use', () => {
    const now = 1000000
    const deadline = now + 30000
    const result = computeIdleFrac(false, deadline, false, now, 60000)
    expect(result).toBeCloseTo(0.5, 5)
  })

  it('returns 1 when deadline has passed', () => {
    const now = 1000000
    const deadline = now - 1000
    const result = computeIdleFrac(false, deadline, false, now, 60000)
    expect(result).toBe(1)
  })

  it('returns 0 at the start of countdown', () => {
    const now = 1000000
    const deadline = now + 60000
    const result = computeIdleFrac(false, deadline, false, now, 60000)
    expect(result).toBeCloseTo(0, 5)
  })
})

describe('computeGraceFrac', () => {
  it('returns 0 when idleStart is null', () => {
    expect(computeGraceFrac(null, false, Date.now(), 60000)).toBe(0)
  })

  it('returns 1 when reconnecting', () => {
    expect(computeGraceFrac(Date.now(), true, Date.now(), 60000)).toBe(1)
  })

  it('returns fraction based on elapsed time', () => {
    const start = 1000000
    const now = start + 30000
    const result = computeGraceFrac(start, false, now, 60000)
    expect(result).toBeCloseTo(0.5, 5)
  })

  it('clamps to 1 when grace period has fully elapsed', () => {
    const start = 1000000
    const now = start + 120000
    const result = computeGraceFrac(start, false, now, 60000)
    expect(result).toBe(1)
  })

  it('returns 0 at the start of grace period', () => {
    const start = 1000000
    const result = computeGraceFrac(start, false, start, 60000)
    expect(result).toBe(0)
  })

  it('returns 1 when gracePeriodMs is 0 (disabled)', () => {
    expect(computeGraceFrac(1000000, false, 1000000, 0)).toBe(1)
  })

  it('returns 1 when gracePeriodMs is negative', () => {
    expect(computeGraceFrac(1000000, false, 1000000, -1)).toBe(1)
  })
})

describe('computeState', () => {
  it('returns RECONNECTING when reconnecting', () => {
    expect(computeState(true, false, true, 0)).toBe('RECONNECTING')
  })

  it('returns RECONNECTING even when stream is idle', () => {
    expect(computeState(true, true, false, 1)).toBe('RECONNECTING')
  })

  it('returns IDLE (stopped) when stream idle and grace elapsed', () => {
    expect(computeState(false, true, false, 1)).toBe('IDLE (stopped)')
  })

  it('returns IDLE (grace) when stream idle but grace not elapsed', () => {
    expect(computeState(false, true, false, 0.5)).toBe('IDLE (grace)')
  })

  it('returns COUNTING DOWN when page not in use', () => {
    expect(computeState(false, false, false, 0)).toBe('COUNTING DOWN')
  })

  it('returns ACTIVE when page is in use', () => {
    expect(computeState(false, false, true, 0)).toBe('ACTIVE')
  })
})
