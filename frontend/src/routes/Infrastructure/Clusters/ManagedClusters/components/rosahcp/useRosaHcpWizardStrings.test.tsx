/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react'
import { useRosaHcpWizardStrings } from './useRosaHcpWizardStrings'
import enCatalog from '../../../../../../../public/locales/en/translation.json'

const catalogValues = new Set(Object.values(enCatalog))

const visitStrings = (node: unknown, seen: string[]): void => {
  if (typeof node === 'string') {
    seen.push(node)
    return
  }
  if (typeof node === 'function' || node === null || typeof node !== 'object') {
    return
  }
  Object.values(node).forEach((value) => visitStrings(value, seen))
}

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

  test('covers every visible string and interpolated validator message', () => {
    const { result } = renderHook(() => useRosaHcpWizardStrings())
    const strings = result.current
    const visibleStrings: string[] = []
    visitStrings(strings, visibleStrings)

    expect(visibleStrings.length).toBeGreaterThan(200)
    visibleStrings.forEach((sentence) => {
      expect(catalogValues.has(sentence)).toBe(true)
    })

    const validators = strings.validators
    expect(validators?.operatorRolesPrefix?.invalidFormat?.('Custom operator roles prefix', 'Bad_Name')).toBe(
      "Custom operator roles prefix 'Bad_Name' isn't valid, must consist of lower-case alphanumeric characters or '-', start with an alphabetic character, and end with an alphanumeric character. For example, 'my-name', or 'abc-123'."
    )
    expect(validators?.operatorRolesPrefix?.tooLong?.('Custom operator roles prefix', 32)).toBe(
      'Custom operator roles prefix may not exceed 32 characters.'
    )
    expect(validators?.securityGroups?.maxExceeded?.(3)).toBe('A maximum of 3 security groups can be selected.')
    expect(validators?.replicas?.maxNodes?.(180)).toBe('Input cannot be more than 180.')
    expect(validators?.cidr?.invalidNotation?.('10.0.0.1/16')).toBe(
      "IP address range '10.0.0.1/16' isn't valid CIDR notation. It must follow the RFC-4632 format: '192.168.0.0/16'."
    )
    expect(validators?.awsMachineCidr?.maskTooLarge?.(16)).toBe("The subnet mask can't be larger than '/16'.")
    expect(validators?.awsMachineCidr?.maskTooSmallMultiAz?.(25)).toBe("The subnet mask can't be smaller than '/25'.")
    expect(validators?.awsMachineCidr?.maskTooSmallSingleAz?.(25)).toBe("The subnet mask can't be smaller than '/25'.")
    expect(validators?.serviceCidr?.maskTooSmall?.(24, 256)).toBe(
      "The subnet mask can't be smaller than '/24', which provides up to 256 services."
    )
    expect(validators?.serviceCidr?.subnetMaskBetweenOneAnd?.(24)).toBe('Subnet mask must be between /1 and /24.')
    expect(validators?.podCidr?.maskTooSmall?.(23)).toBe("The subnet mask can't be smaller than /23.")
    expect(validators?.podCidr?.notEnoughNodes?.(26)).toBe(
      'The subnet mask of /26 does not allow for enough nodes. Try changing the host prefix or the pod subnet range.'
    )
    expect(validators?.subnetCidrs?.machineDoesNotIncludeStartIp?.('10.0.0.0', 'private-1')).toBe(
      'The Machine CIDR does not include the starting IP (10.0.0.0) of private-1'
    )
    expect(validators?.subnetCidrs?.serviceOverlaps?.('private-1', '10.0.0.0/16')).toBe(
      "The Service CIDR overlaps with private-1 CIDR '10.0.0.0/16'"
    )
    expect(validators?.subnetCidrs?.serviceIncludesStartIp?.('10.0.0.0', 'private-1')).toBe(
      'The Service CIDR includes the starting IP (10.0.0.0) of private-1'
    )
    expect(validators?.subnetCidrs?.podOverlaps?.('private-1', '10.0.0.0/16')).toBe(
      "The Pod CIDR overlaps with private-1 CIDR '10.0.0.0/16'"
    )
    expect(validators?.subnetCidrs?.podIncludesStartIp?.('10.0.0.0', 'private-1')).toBe(
      'The Pod CIDR includes the starting IP (10.0.0.0) of private-1'
    )
    expect(validators?.hostPrefix?.invalidMaskFormat?.('16')).toBe(
      "The value '16' isn't a valid subnet mask. It must follow the RFC-4632 format: '/16'."
    )
    expect(validators?.hostPrefix?.maskTooLarge?.(23, 512)).toBe(
      "The subnet mask can't be larger than '/23', which provides up to 512 Pod IP addresses."
    )
    expect(validators?.hostPrefix?.maskTooSmall?.(26, 62)).toBe(
      "The subnet mask can't be smaller than '/26', which provides up to 62 Pod IP addresses."
    )
  })
})
