/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react'
import { useRosaHcpWizardStrings } from './useRosaHcpWizardStrings'

describe('useRosaHcpWizardStrings', () => {
  test('translates visible copy and leaves hidden or unread keys unset', () => {
    const { result } = renderHook(() => useRosaHcpWizardStrings())
    const strings = result.current

    expect(strings.wizard?.next).toBe('Next')
    expect(strings.wizard?.back).toBe('Back')
    expect(strings.wizard?.stepLabels?.additionalSetup).toBe('Additional setup')
    expect(strings.wizard?.stepLabels?.clusterWideProxy).toBeUndefined()
    expect(strings.wizard?.stepLabels?.clusterUpdatesOptional).toBeUndefined()
    expect(strings.clusterWideProxy).toBeUndefined()
    expect(strings.clusterUpdates).toBeUndefined()
    expect(strings.networking?.proxyCheckboxLabel).toBeUndefined()
    expect(strings.networking?.proxyCheckboxHelp).toBeUndefined()
    expect(strings.networking?.proxyNextStepInfo).toBeUndefined()
    expect(strings.review?.updateStrategy).toBeUndefined()
    expect(strings.review?.strategyIndividual).toBeUndefined()
    expect(strings.review?.strategyAutomatic).toBeUndefined()
    expect(strings.review?.editStep).toBe('Edit step')
    expect(strings.yamlEditor?.description).toBeUndefined()
    expect(strings.rosaLogin?.instructions).toBeUndefined()
    expect(strings.rosaLogin?.instructionsService).toContain('<CLIENT_ID>')
    expect(strings.ocmRole?.linkExistingLead).toBe(' If a role exists but is not linked, link it with:')
    expect(strings.userRole?.userRoleLabel).toBe('User role ')
    expect(strings.machinePools?.intro).toBe(
      'Create a machine pool.  Additional machine pools can be created after cluster creation.'
    )
    expect(strings.autoscaling?.learnMoreAutoscaling).toBe('Learn more about autoscaling with ROSA.')
    expect(strings.autoscaling?.title).toBeUndefined()
    expect(strings.validators?.commonRequired).toBe('This field is required')
    expect(strings.validators?.noProxyDomains).toBeUndefined()
    expect(strings.validators?.url).toBeUndefined()
    expect(strings.validators?.ca).toBeUndefined()
    expect(strings.validators?.proxyConfigureAtLeastOne).toBeUndefined()
    expect(strings.validators?.serviceCidr?.subnetMaskBetween).toBeUndefined()
    expect(strings.validators?.securityGroups?.maxExceeded?.(4)).toBe('A maximum of 4 security groups can be selected.')
    expect(strings.validators?.operatorRolesPrefix?.tooLong?.('Prefix', 32)).toBe(
      'Prefix may not exceed 32 characters.'
    )
    expect(strings.validators?.disjointSubnets?.overlap?.('Service CIDR', false)).toBe(
      'This subnet overlaps with the subnet in the Service CIDR field.'
    )
    expect(strings.validators?.disjointSubnets?.overlap?.('Service CIDR, Pod CIDR', true)).toBe(
      'This subnet overlaps with the subnets in the Service CIDR, Pod CIDR fields.'
    )
  })
})
