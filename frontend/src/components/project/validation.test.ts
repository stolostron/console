/* Copyright Contributors to the Open Cluster Management project */

import { validateName } from './validation'

// Mock translation function
const mockT = (key: string) => key

describe('Project validation functions', () => {
  describe('validateName', () => {
    it('should return error for empty name', () => {
      expect(validateName('', mockT)).toBe('Name is required')
      expect(validateName('   ', mockT)).toBe('Name is required')
    })

    it('should return error for name that is 255 characters or longer', () => {
      const longName = 'a'.repeat(255)
      expect(validateName(longName, mockT)).toBe('Name must be less than 255 characters')

      const evenLongerName = 'a'.repeat(300)
      expect(validateName(evenLongerName, mockT)).toBe('Name must be less than 255 characters')
    })

    it('should return undefined for valid names', () => {
      expect(validateName('valid-name', mockT)).toBeUndefined()
      expect(validateName('a', mockT)).toBeUndefined()

      const maxValidName = 'a'.repeat(254)
      expect(validateName(maxValidName, mockT)).toBeUndefined()
    })
  })
})
