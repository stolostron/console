/* Copyright Contributors to the Open Cluster Management project */

import { validateIdentityIdentifier } from './utils'

describe('validateIdentityIdentifier', () => {
  const errorMessage = 'Identifier is required'

  it('returns error when value is empty string', () => {
    expect(validateIdentityIdentifier('', errorMessage)).toBe(errorMessage)
  })

  it('returns error when value is only whitespace', () => {
    expect(validateIdentityIdentifier('   ', errorMessage)).toBe(errorMessage)
  })

  it('returns undefined for a valid identifier', () => {
    expect(validateIdentityIdentifier('user@example.com', errorMessage)).toBeUndefined()
  })

  it('returns undefined for an identifier with surrounding whitespace', () => {
    expect(validateIdentityIdentifier('  user  ', errorMessage)).toBeUndefined()
  })

  it('uses the provided error message', () => {
    const custom = 'Custom required message'
    expect(validateIdentityIdentifier('', custom)).toBe(custom)
  })
})
