/* Copyright Contributors to the Open Cluster Management project */

import {
  classifyCondition,
  compareConditionKeys,
  compareStatusKeys,
  isNegativePolarityCondition,
  prepareResourceForYaml,
  getStatusDecorationsFromMappings,
  STATUS_FAILURE_CLASS,
  STATUS_SUCCESS_CLASS,
  STATUS_FAILURE_EMPHASIS_CLASS,
  STATUS_SUCCESS_EMPHASIS_CLASS,
} from './statusDecorations'
import type { Monaco } from '@monaco-editor/react'

class MockRange {
  constructor(
    public startLineNumber: number,
    public startColumn: number,
    public endLineNumber: number,
    public endColumn: number
  ) {}
}

function createMonaco(): Monaco {
  return { Range: MockRange as unknown as Monaco['Range'] } as Monaco
}

describe('classifyCondition', () => {
  it('treats Ready True as success and Ready False as failure', () => {
    expect(classifyCondition({ type: 'Ready', status: 'True' })).toBe('success')
    expect(classifyCondition({ type: 'Ready', status: 'False', reason: 'NotReady' })).toBe('failure')
  })

  it('inverts negative polarity conditions like Degraded', () => {
    expect(isNegativePolarityCondition('Degraded')).toBe(true)
    expect(classifyCondition({ type: 'Degraded', status: 'True' })).toBe('failure')
    expect(classifyCondition({ type: 'Degraded', status: 'False' })).toBe('success')
  })

  it('treats Progressing True as success', () => {
    expect(classifyCondition({ type: 'Progressing', status: 'True' })).toBe('success')
  })

  it('treats AsExpected False as success', () => {
    expect(classifyCondition({ type: 'ValidConfiguration', status: 'False', reason: 'AsExpected' })).toBe('success')
  })

  it('returns neutral for Unknown', () => {
    expect(classifyCondition({ type: 'Ready', status: 'Unknown' })).toBe('neutral')
  })
})

describe('key ordering', () => {
  it('orders condition keys type, status, reason, message then others', () => {
    const keys = ['message', 'foo', 'type', 'reason', 'status'].sort(compareConditionKeys)
    expect(keys).toEqual(['type', 'status', 'reason', 'message', 'foo'])
  })

  it('orders status keys with other keys first then conditions and containerStatuses', () => {
    const keys = ['conditions', 'replicas', 'unavailableReplicas', 'containerStatuses', 'availableReplicas'].sort(
      compareStatusKeys
    )
    expect(keys).toEqual(['availableReplicas', 'replicas', 'unavailableReplicas', 'conditions', 'containerStatuses'])
  })
})

describe('prepareResourceForYaml', () => {
  it('reorders status and condition keys', () => {
    const prepared = prepareResourceForYaml({
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { labels: { a: '1' }, name: 'd', namespace: 'ns' },
      status: {
        conditions: [
          {
            message: 'ok',
            lastTransitionTime: '2026-01-01T00:00:00Z',
            type: 'Available',
            reason: 'MinimumReplicasAvailable',
            status: 'True',
          },
        ],
        replicas: 1,
        unavailableReplicas: 0,
      },
    }) as {
      metadata: Record<string, unknown>
      status: { conditions: Record<string, unknown>[]; [key: string]: unknown }
    }

    expect(Object.keys(prepared.metadata)).toEqual(['name', 'namespace', 'labels'])
    expect(Object.keys(prepared.status)).toEqual(['replicas', 'unavailableReplicas', 'conditions'])
    expect(Object.keys(prepared.status.conditions[0])).toEqual([
      'type',
      'status',
      'reason',
      'message',
      'lastTransitionTime',
    ])
  })
})

describe('getStatusDecorationsFromMappings', () => {
  const monaco = createMonaco()

  it('decorates successful and failed conditions and unavailableReplicas', () => {
    const mappings = {
      Deployment: [
        {
          status: {
            $r: 10,
            $l: 20,
            $v: {
              unavailableReplicas: { $r: 11, $l: 1, $v: 2 },
              conditions: {
                $r: 12,
                $l: 10,
                $v: [
                  {
                    $r: 13,
                    $l: 4,
                    $v: {
                      type: { $r: 13, $l: 1, $v: 'Available' },
                      status: { $r: 14, $l: 1, $v: 'True' },
                      reason: { $r: 15, $l: 1, $v: 'MinimumReplicasAvailable' },
                      message: { $r: 16, $l: 1, $v: 'Deployment has minimum availability.' },
                    },
                  },
                  {
                    $r: 17,
                    $l: 4,
                    $v: {
                      type: { $r: 17, $l: 1, $v: 'Degraded' },
                      status: { $r: 18, $l: 1, $v: 'True' },
                      reason: { $r: 19, $l: 1, $v: 'Error' },
                      message: { $r: 20, $l: 1, $v: 'Something failed' },
                    },
                  },
                ],
              },
              containerStatuses: {
                $r: 21,
                $l: 8,
                $v: [
                  {
                    $r: 22,
                    $l: 7,
                    $v: {
                      lastState: {
                        $r: 23,
                        $l: 6,
                        $v: {
                          terminated: {
                            $r: 24,
                            $l: 5,
                            $v: {
                              reason: { $r: 25, $l: 1, $v: 'Error' },
                              exitCode: { $r: 26, $l: 1, $v: 24 },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    }

    const decorations = getStatusDecorationsFromMappings(monaco, mappings as never)
    const classes = decorations.map((d) => d.options.inlineClassName)
    expect(classes).toContain(STATUS_SUCCESS_CLASS)
    expect(classes).toContain(STATUS_SUCCESS_EMPHASIS_CLASS)
    expect(classes).toContain(STATUS_FAILURE_CLASS)
    expect(classes).toContain(STATUS_FAILURE_EMPHASIS_CLASS)
    expect(classes.filter((c) => c === STATUS_FAILURE_CLASS).length).toBeGreaterThanOrEqual(3)
  })

  it('skips unavailableReplicas when zero', () => {
    const mappings = {
      Deployment: [
        {
          status: {
            $r: 10,
            $l: 2,
            $v: {
              unavailableReplicas: { $r: 11, $l: 1, $v: 0 },
            },
          },
        },
      ],
    }
    expect(getStatusDecorationsFromMappings(monaco, mappings as never)).toEqual([])
  })
})
