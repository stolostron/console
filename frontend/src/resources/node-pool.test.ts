/* Copyright Contributors to the Open Cluster Management project */
import { getNodePoolStatus, hasReadyNodePoolWithUpdate, NodePoolConditionType } from './node-pool'

function makeNodePool(conditions: { type: string; status: string; reason?: string; message?: string }[]) {
  return { status: { conditions } }
}

describe('getNodePoolStatus', () => {
  describe('Ready status', () => {
    it('returns ok when Ready condition is True with no errors or warnings', () => {
      const result = getNodePoolStatus(makeNodePool([{ type: 'Ready', status: 'True', reason: 'AsExpected' }]))
      expect(result.type).toBe('ok')
      expect(result.isReady).toBe(true)
      expect(result.statusText).toBe('Ready')
    })

    it('returns ok when Ready is True alongside informational conditions', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'AutoscalingEnabled', status: 'False', reason: 'AsExpected' },
          { type: 'AutorepairEnabled', status: 'True', reason: 'AsExpected' },
        ])
      )
      expect(result.type).toBe('ok')
      expect(result.isReady).toBe(true)
    })
  })

  describe('Pending status', () => {
    it('returns pending when no conditions exist', () => {
      const result = getNodePoolStatus({ status: { conditions: [] } })
      expect(result.type).toBe('pending')
      expect(result.isReady).toBe(false)
      expect(result.statusText).toBe('Pending')
    })

    it('returns pending when status is undefined', () => {
      const result = getNodePoolStatus({})
      expect(result.type).toBe('pending')
      expect(result.isReady).toBe(false)
    })

    it('returns pending when conditions is undefined', () => {
      const result = getNodePoolStatus({ status: {} })
      expect(result.type).toBe('pending')
      expect(result.isReady).toBe(false)
    })

    it('returns pending when Ready is False and no error conditions', () => {
      const result = getNodePoolStatus(makeNodePool([{ type: 'Ready', status: 'False', reason: 'AsExpected' }]))
      expect(result.type).toBe('pending')
      expect(result.isReady).toBe(false)
    })

    it('returns pending when Ready is Unknown', () => {
      const result = getNodePoolStatus(makeNodePool([{ type: 'Ready', status: 'Unknown', reason: 'Initializing' }]))
      expect(result.type).toBe('pending')
      expect(result.isReady).toBe(false)
    })

    it('returns pending when no Ready condition is present and no errors', () => {
      const result = getNodePoolStatus(
        makeNodePool([{ type: 'AutoscalingEnabled', status: 'False', reason: 'AsExpected' }])
      )
      expect(result.type).toBe('pending')
      expect(result.isReady).toBe(false)
    })
  })

  describe('Error status - individual error conditions', () => {
    const errorConditions = [
      NodePoolConditionType.ValidGeneratedPayload,
      NodePoolConditionType.ValidReleaseImage,
      NodePoolConditionType.ValidPlatformImage,
      NodePoolConditionType.ValidMachineConfig,
      NodePoolConditionType.ValidArchPlatform,
      NodePoolConditionType.ValidPlatformConfig,
      NodePoolConditionType.AWSSecurityGroupAvailable,
      NodePoolConditionType.ReconciliationActive,
    ]

    it.each(errorConditions)('returns error when %s is False', (conditionType) => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'False', reason: 'SomeReason' },
          { type: conditionType, status: 'False', reason: 'ValidationFailed', message: `${conditionType} failed` },
        ])
      )
      expect(result.type).toBe('error')
      expect(result.isReady).toBe(false)
      expect(result.statusText).toContain(conditionType)
    })

    it('uses message for statusText when available', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'ValidReleaseImage', status: 'False', reason: 'InvalidImage', message: 'Release image not found' },
        ])
      )
      expect(result.type).toBe('error')
      expect(result.statusText).toBe('Release image not found')
    })

    it('falls back to reason when message is empty', () => {
      const result = getNodePoolStatus(
        makeNodePool([{ type: 'ValidReleaseImage', status: 'False', reason: 'InvalidImage', message: '' }])
      )
      expect(result.type).toBe('error')
      expect(result.statusText).toBe('InvalidImage')
    })

    it('falls back to condition type when both message and reason are empty', () => {
      const result = getNodePoolStatus(
        makeNodePool([{ type: 'ValidReleaseImage', status: 'False', reason: '', message: '' }])
      )
      expect(result.type).toBe('error')
      expect(result.statusText).toBe('ValidReleaseImage')
    })

    it('does not treat error condition as error when status is True', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'ValidReleaseImage', status: 'True', reason: 'AsExpected' },
        ])
      )
      expect(result.type).toBe('ok')
    })
  })

  describe('Warning status', () => {
    it('returns warning when AllMachinesReady is False while Ready is True', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          {
            type: 'AllMachinesReady',
            status: 'False',
            reason: 'MachineNotReady',
            message: '2 of 3 machines ready',
          },
        ])
      )
      expect(result.type).toBe('warning')
      expect(result.isReady).toBe(false)
      expect(result.statusText).toBe('2 of 3 machines ready')
    })

    it('does not return warning for AllMachinesReady:False when Ready is also False (pending)', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'False', reason: 'NotReady' },
          { type: 'AllMachinesReady', status: 'False', reason: 'MachineNotReady' },
        ])
      )
      expect(result.type).toBe('pending')
    })

    it('returns warning when AllNodesHealthy is False', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'AllNodesHealthy', status: 'False', reason: 'NodeUnhealthy', message: 'Node xyz is unhealthy' },
        ])
      )
      expect(result.type).toBe('warning')
      expect(result.statusText).toBe('Node xyz is unhealthy')
    })

    it('returns warning when SupportedVersionSkew is False', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          {
            type: 'SupportedVersionSkew',
            status: 'False',
            reason: 'UnsupportedSkew',
            message: 'Version skew exceeds supported range',
          },
        ])
      )
      expect(result.type).toBe('warning')
      expect(result.statusText).toBe('Version skew exceeds supported range')
    })

    it('returns warning when ReachedIgnitionEndpoint is False', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          {
            type: 'ReachedIgnitionEndpoint',
            status: 'False',
            reason: 'NotReached',
            message: 'Ignition endpoint not reached',
          },
        ])
      )
      expect(result.type).toBe('warning')
      expect(result.statusText).toBe('Ignition endpoint not reached')
    })
  })

  describe('Updating status', () => {
    it('returns updating when UpdatingVersion is True', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          {
            type: 'UpdatingVersion',
            status: 'True',
            reason: 'UpdatingVersion',
            message: 'Updating to version 4.14.0',
          },
        ])
      )
      expect(result.type).toBe('updating')
      expect(result.isReady).toBe(false)
      expect(result.statusText).toBe('Updating to version 4.14.0')
    })

    it('returns updating when UpdatingConfig is True', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          {
            type: 'UpdatingConfig',
            status: 'True',
            reason: 'UpdatingConfig',
            message: 'Applying new machine config',
          },
        ])
      )
      expect(result.type).toBe('updating')
      expect(result.isReady).toBe(false)
      expect(result.statusText).toBe('Applying new machine config')
    })

    it('uses fallback text when UpdatingVersion has no message', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'UpdatingVersion', status: 'True', reason: 'UpdatingVersion' },
        ])
      )
      expect(result.type).toBe('updating')
      expect(result.statusText).toBe('Updating version')
    })

    it('uses fallback text when UpdatingConfig has no message', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'UpdatingConfig', status: 'True', reason: 'UpdatingConfig' },
        ])
      )
      expect(result.type).toBe('updating')
      expect(result.statusText).toBe('Updating config')
    })

    it('does not return updating when UpdatingVersion is False', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'UpdatingVersion', status: 'False', reason: 'AsExpected' },
        ])
      )
      expect(result.type).toBe('ok')
    })
  })

  describe('Priority ordering', () => {
    it('error takes precedence over warning', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'ValidReleaseImage', status: 'False', reason: 'InvalidImage', message: 'Bad image' },
          { type: 'AllNodesHealthy', status: 'False', reason: 'NodeUnhealthy', message: 'Unhealthy node' },
        ])
      )
      expect(result.type).toBe('error')
      expect(result.statusText).toBe('Bad image')
    })

    it('error takes precedence over updating', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'ValidMachineConfig', status: 'False', reason: 'InvalidConfig', message: 'Bad config' },
          { type: 'UpdatingVersion', status: 'True', reason: 'Updating', message: 'Updating' },
        ])
      )
      expect(result.type).toBe('error')
    })

    it('warning takes precedence over updating', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'AllNodesHealthy', status: 'False', reason: 'NodeUnhealthy', message: 'Unhealthy' },
          { type: 'UpdatingVersion', status: 'True', reason: 'Updating', message: 'Updating' },
        ])
      )
      expect(result.type).toBe('warning')
    })

    it('warning takes precedence over ready', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'SupportedVersionSkew', status: 'False', reason: 'Skew', message: 'Skew detected' },
        ])
      )
      expect(result.type).toBe('warning')
      expect(result.isReady).toBe(false)
    })

    it('updating takes precedence over ready', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'UpdatingConfig', status: 'True', reason: 'Updating', message: 'Config update' },
        ])
      )
      expect(result.type).toBe('updating')
    })

    it('updating takes precedence over pending', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'False', reason: 'NotReady' },
          { type: 'UpdatingVersion', status: 'True', reason: 'Updating', message: 'Version update' },
        ])
      )
      expect(result.type).toBe('updating')
    })
  })

  describe('Multiple simultaneous conditions', () => {
    it('reports first error condition found in priority order', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          {
            type: 'ValidGeneratedPayload',
            status: 'False',
            reason: 'PayloadError',
            message: 'Payload generation failed',
          },
          { type: 'ValidReleaseImage', status: 'False', reason: 'ImageError', message: 'Image not found' },
        ])
      )
      expect(result.type).toBe('error')
      expect(result.statusText).toBe('Payload generation failed')
    })

    it('handles multiple warning conditions — reports first match', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'AllMachinesReady', status: 'False', reason: 'Partial', message: 'Partial machines' },
          { type: 'AllNodesHealthy', status: 'False', reason: 'Unhealthy', message: 'Unhealthy nodes' },
        ])
      )
      expect(result.type).toBe('warning')
      expect(result.statusText).toBe('Partial machines')
    })

    it('handles both UpdatingVersion and UpdatingConfig — reports version first', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'UpdatingVersion', status: 'True', reason: 'Updating', message: 'Version update' },
          { type: 'UpdatingConfig', status: 'True', reason: 'Updating', message: 'Config update' },
        ])
      )
      expect(result.type).toBe('updating')
      expect(result.statusText).toBe('Version update')
    })

    it('preserves all conditions in result regardless of status type', () => {
      const conditions = [
        { type: 'Ready', status: 'True', reason: 'AsExpected' },
        { type: 'AutoscalingEnabled', status: 'False', reason: 'Disabled' },
        { type: 'ValidReleaseImage', status: 'True', reason: 'Valid' },
      ]
      const result = getNodePoolStatus(makeNodePool(conditions))
      expect(result.conditions).toHaveLength(3)
      expect(result.conditions).toEqual(conditions)
    })
  })

  describe('Edge cases', () => {
    it('handles null conditions array', () => {
      const result = getNodePoolStatus({ status: { conditions: null as unknown as undefined } })
      expect(result.type).toBe('pending')
      expect(result.isReady).toBe(false)
    })

    it('handles condition with missing reason and message fields', () => {
      const result = getNodePoolStatus(makeNodePool([{ type: 'Ready', status: 'True' }]))
      expect(result.type).toBe('ok')
      expect(result.isReady).toBe(true)
    })

    it('ignores unrecognized condition types', () => {
      const result = getNodePoolStatus(
        makeNodePool([
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'SomeNewCondition', status: 'False', reason: 'Unknown' },
        ])
      )
      expect(result.type).toBe('ok')
    })
  })
})

describe('hasReadyNodePoolWithUpdate', () => {
  function makePoolWithVersion(version: string | undefined, ready: boolean) {
    return {
      status: {
        conditions: [{ type: 'Ready', status: ready ? 'True' : 'False' }],
        version,
      },
    }
  }

  it('returns false when nodePools is undefined', () => {
    expect(hasReadyNodePoolWithUpdate(undefined, '4.15.0')).toBe(false)
  })

  it('returns false when nodePools is empty', () => {
    expect(hasReadyNodePoolWithUpdate([], '4.15.0')).toBe(false)
  })

  it('returns false when targetVersion is undefined', () => {
    expect(hasReadyNodePoolWithUpdate([makePoolWithVersion('4.14.0', true)], undefined)).toBe(false)
  })

  it('returns false when no pools are ready', () => {
    const pools = [makePoolWithVersion('4.13.0', false), makePoolWithVersion('4.12.0', false)]
    expect(hasReadyNodePoolWithUpdate(pools, '4.15.0')).toBe(false)
  })

  it('returns true when a ready pool has an older version than target', () => {
    const pools = [makePoolWithVersion('4.14.0', true)]
    expect(hasReadyNodePoolWithUpdate(pools, '4.15.0')).toBe(true)
  })

  it('returns false when a ready pool has the same version as target', () => {
    const pools = [makePoolWithVersion('4.15.0', true)]
    expect(hasReadyNodePoolWithUpdate(pools, '4.15.0')).toBe(false)
  })

  it('returns false when a ready pool has a newer version than target', () => {
    const pools = [makePoolWithVersion('4.16.0', true)]
    expect(hasReadyNodePoolWithUpdate(pools, '4.15.0')).toBe(false)
  })

  it('returns false when pool version is undefined', () => {
    const pools = [makePoolWithVersion(undefined, true)]
    expect(hasReadyNodePoolWithUpdate(pools, '4.15.0')).toBe(false)
  })

  it('returns true when mixed pools have one qualifying ready older version', () => {
    const pools = [
      makePoolWithVersion('4.15.0', true),
      makePoolWithVersion('4.13.0', false),
      makePoolWithVersion('4.14.2', true),
    ]
    expect(hasReadyNodePoolWithUpdate(pools, '4.15.0')).toBe(true)
  })

  it('compares versions numerically, not lexicographically', () => {
    const pools = [makePoolWithVersion('4.9.0', true)]
    expect(hasReadyNodePoolWithUpdate(pools, '4.10.0')).toBe(true)
  })

  it('handles two-part versions correctly', () => {
    const pools = [makePoolWithVersion('4.14', true)]
    expect(hasReadyNodePoolWithUpdate(pools, '4.15')).toBe(true)
    expect(hasReadyNodePoolWithUpdate(pools, '4.14')).toBe(false)
  })
})
