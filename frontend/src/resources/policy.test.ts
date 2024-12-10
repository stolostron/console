/* Copyright Contributors to the Open Cluster Management project */
import { generateSeverity } from '../test-helpers/generateSeverity'
import { Policy, PolicySeverity, getPolicySeverity } from './policy'

const testPolicy = <Policy>{
  spec: {
    disabled: false,
    remediationAction: 'inform',
  },
}

describe('getPolicySeverity', () => {
  it('should return high with no policy templates', async () => {
    const policy = { ...testPolicy }
    expect(getPolicySeverity(policy)).toEqual(PolicySeverity.High)
  })
  it('should return low', async () => {
    const policy = { ...testPolicy }
    policy.spec['policy-templates'] = [generateSeverity('low'), generateSeverity('low')]
    expect(getPolicySeverity(policy)).toEqual(PolicySeverity.Low)
  })
  it('should return medium', async () => {
    const policy = { ...testPolicy }
    policy.spec['policy-templates'] = [generateSeverity('low'), generateSeverity('medium')]
    expect(getPolicySeverity(policy)).toEqual(PolicySeverity.Medium)
  })
  it('should return high', async () => {
    const policy = { ...testPolicy }
    policy.spec['policy-templates'] = [generateSeverity('high'), generateSeverity('medium')]
    expect(getPolicySeverity(policy)).toEqual(PolicySeverity.High)
  })
  it('should return critical', async () => {
    const policy = { ...testPolicy }
    policy.spec['policy-templates'] = [generateSeverity('critical'), generateSeverity('high')]
    expect(getPolicySeverity(policy)).toEqual(PolicySeverity.Critical)
  })
  it('should return high with only unknown severity', async () => {
    const policy = { ...testPolicy }
    policy.spec['policy-templates'] = [generateSeverity('super-critical')]
    expect(getPolicySeverity(policy)).toEqual(PolicySeverity.High)
  })
  it('should return medium with medium but containing an unknown severity', async () => {
    const policy = { ...testPolicy }
    policy.spec['policy-templates'] = [generateSeverity('medium'), generateSeverity('not-all-that-important')]
    expect(getPolicySeverity(policy)).toEqual(PolicySeverity.Medium)
  })
  it('should return critical with all severities specified', async () => {
    const policy = { ...testPolicy }
    policy.spec['policy-templates'] = [
      generateSeverity('low'),
      generateSeverity('medium'),
      generateSeverity('high'),
      generateSeverity('critical'),
    ]
    expect(getPolicySeverity(policy)).toEqual(PolicySeverity.Critical)
  })
})
