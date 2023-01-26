/* Copyright Contributors to the Open Cluster Management project */
import i18n from 'i18next'
import { getIPValidator } from './validation-types'

const t = i18n.t.bind(i18n)

const controlDataWithValidCIDRs = [
  {
    id: 'settings',
    active: [
      [
        {
          id: 'cidr',
          active: '10.0.0.0/16', // NOSONAR - CIDR used in test
          name: 'Subnet CIDR',
        },
      ],
      [
        {
          id: 'cidr',
          active: '10.1.0.0/16', // NOSONAR - CIDR used in test
        },
      ],
    ],
    type: 'group',
  },
]

const controlDataWithInvalidCIDR = [
  {
    id: 'settings',
    active: [
      [
        {
          id: 'cidr',
          active: '10.0.0.0/16', // NOSONAR - CIDR used in test
          name: 'Subnet CIDR',
        },
      ],
      [
        {
          id: 'cidr',
          active: 'invalid',
        },
      ],
    ],
    type: 'group',
  },
]

const controlDataWithOtherIPs = [
  {
    id: 'address1',
    name: 'First Address',
    active: '10.0.0.1', // NOSONAR - IP address used in test
  },
  {
    id: 'address2',
    name: 'Second Address',
    active: '10.0.0.1', // NOSONAR - IP address used in test
  },
]

const cidrValidationMessage =
  "The address must be contained in one of the subnets defined by the 'Subnet CIDR' values: 10.0.0.0/16, 10.1.0.0/16" // NOSONAR - CIDR used in test
const duplicateAddressMessage =
  'The address must be different from the address used for the following fields: First Address, Second Address'
describe('getIPValidator', () => {
  it('generates a required IP address validator by default', () => {
    const validator = getIPValidator()
    expect(validator.required).toEqual(true)
    expect(validator.contextTester).toBeDefined()
    const tester = validator.contextTester!
    expect(tester('foo', [], {}, t)).toEqual('Value must be valid IPv4 or IPv6 format.')
    expect(tester('10.5.6.7', [], {}, t)).toBeUndefined() // NOSONAR - IP address used in test
  })
  it('generates a validator that can check IPs are contained within subnets', () => {
    const validator = getIPValidator({ subnet: { groupID: 'settings', controlID: 'cidr' }, optional: true })
    expect(validator.required).toEqual(false)
    expect(validator.contextTester).toBeDefined()
    const tester = validator.contextTester!
    expect(tester('10.0.0.6', controlDataWithValidCIDRs, {}, t)).toBeUndefined() // NOSONAR - IP address used in test
    expect(tester('10.1.0.7', controlDataWithValidCIDRs, {}, t)).toBeUndefined() // NOSONAR - IP address used in test
    expect(tester('10.2.0.8', controlDataWithValidCIDRs, {}, t)).toEqual(cidrValidationMessage) // NOSONAR - IP address used in test
    expect(tester('10.2.0.8', controlDataWithInvalidCIDR, {}, t)).toBeUndefined()
    expect(tester('10.2.0.8', [], {}, t)).toBeUndefined()
  })
  it('generates a validator that can check for duplicate IPs', () => {
    const validator = getIPValidator({ differentFrom: ['address1', 'address2'] })
    expect(validator.required).toEqual(true)
    expect(validator.contextTester).toBeDefined()
    const tester = validator.contextTester!
    expect(tester('10.0.0.3', controlDataWithOtherIPs, {}, t)).toBeUndefined() // NOSONAR - IP address used in test
    expect(tester('10.0.0.1', controlDataWithOtherIPs, {}, t)).toEqual(duplicateAddressMessage) // NOSONAR - IP address used in test
  })
})
