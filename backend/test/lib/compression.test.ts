/* Copyright Contributors to the Open Cluster Management project */
import { createDictionary, deflateResource, inflateResource, isTimestamp } from '../../src/lib/compression'
import type { IResource } from '../../src/resources/resource'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asResource = (obj: Record<string, any>) => obj as unknown as IResource

describe('isTimestamp', () => {
  it('detects UTC timestamps with Z suffix', () => {
    expect(isTimestamp('2026-05-27T20:18:12Z')).toBe(true)
  })

  it('detects timestamps with milliseconds', () => {
    expect(isTimestamp('2026-05-27T20:18:12.000Z')).toBe(true)
  })

  it('detects timestamps with timezone offset', () => {
    expect(isTimestamp('2026-05-27T20:18:12+05:30')).toBe(true)
    expect(isTimestamp('2026-05-27T20:18:12-04:00')).toBe(true)
  })

  it('rejects non-timestamp strings of similar length', () => {
    expect(isTimestamp('this-is-not-a-timest')).toBe(false)
    expect(isTimestamp('abcdefghijklmnopqrst')).toBe(false)
    expect(isTimestamp('192.168.1.1:8080/api')).toBe(false)
  })

  it('rejects strings of wrong length', () => {
    expect(isTimestamp('short')).toBe(false)
    expect(isTimestamp('2026-05-27')).toBe(false)
    expect(isTimestamp('a-very-long-string-that-is-definitely-not-a-timestamp')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isTimestamp('')).toBe(false)
  })
})

describe('compressResource timestamp handling', () => {
  it('does not add timestamp values to the dictionary', async () => {
    const dict = createDictionary()
    const resource = asResource({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: {
        name: 'test-app',
        uid: 'test-uid',
      },
      status: {
        reconciledAt: '2026-05-27T20:18:12Z',
        operationState: {
          startedAt: '2026-05-27T20:18:10Z',
          finishedAt: '2026-05-27T20:18:12Z',
        },
      },
    })

    await deflateResource(resource, dict)
    const dictEntries = dict.arr

    expect(dictEntries).not.toContain('2026-05-27T20:18:12Z')
    expect(dictEntries).not.toContain('2026-05-27T20:18:10Z')
  })

  it('still adds non-timestamp short strings to the dictionary', async () => {
    const dict = createDictionary()
    const resource = asResource({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: {
        name: 'test-app',
        uid: 'test-uid',
      },
      status: {
        health: {
          status: 'Healthy',
        },
        sync: {
          status: 'Synced',
        },
      },
    })

    await deflateResource(resource, dict)
    const dictEntries = dict.arr

    expect(dictEntries).toContain('Healthy')
    expect(dictEntries).toContain('Synced')
  })

  it('round-trips resources with timestamp values correctly', async () => {
    const dict = createDictionary()
    const resource = asResource({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: {
        name: 'test-app',
        uid: 'test-uid',
      },
      status: {
        reconciledAt: '2026-05-27T20:18:12Z',
        health: {
          status: 'Healthy',
        },
      },
    })

    const compressed = await deflateResource(resource, dict)
    const inflated = structuredClone(await inflateResource(compressed, dict)) as unknown as {
      apiVersion: string
      metadata: { name: string }
      status: { reconciledAt: string; health: { status: string } }
    }

    expect(inflated.status.reconciledAt).toBe('2026-05-27T20:18:12Z')
    expect(inflated.status.health.status).toBe('Healthy')
    expect(inflated.apiVersion).toBe('argoproj.io/v1alpha1')
    expect(inflated.metadata.name).toBe('test-app')
  })

  it('does not grow the dictionary on repeated compression with changing timestamps', async () => {
    const dict = createDictionary()
    const makeResource = (ts: string) =>
      asResource({
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: { name: 'test-app', uid: 'uid-1' },
        status: { reconciledAt: ts },
      })

    await deflateResource(makeResource('2026-05-27T10:00:00Z'), dict)
    const sizeAfterFirst = dict.arr.length

    await deflateResource(makeResource('2026-05-27T10:03:00Z'), dict)
    await deflateResource(makeResource('2026-05-27T10:06:00Z'), dict)
    await deflateResource(makeResource('2026-05-27T10:09:00Z'), dict)
    const sizeAfterFourth = dict.arr.length

    expect(sizeAfterFourth).toBe(sizeAfterFirst)
  })
})
