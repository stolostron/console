/* Copyright Contributors to the Open Cluster Management project */

import { validateName, validateDisplayName, validateDescription } from './validation'

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

  describe('validateDisplayName', () => {
    it('should allow empty display name', () => {
      expect(validateDisplayName('', mockT)).toBeUndefined()
    })

    it('should return error for display name that is 255 characters or longer', () => {
      const longDisplayName = 'a'.repeat(255)
      expect(validateDisplayName(longDisplayName, mockT)).toBe('Display name must be less than 255 characters')
      
      const evenLongerDisplayName = 'a'.repeat(300)
      expect(validateDisplayName(evenLongerDisplayName, mockT)).toBe('Display name must be less than 255 characters')
    })

    it('should return undefined for valid display names', () => {
      expect(validateDisplayName('Valid Display Name', mockT)).toBeUndefined()
      expect(validateDisplayName('a', mockT)).toBeUndefined()
      
      const maxValidDisplayName = 'a'.repeat(254)
      expect(validateDisplayName(maxValidDisplayName, mockT)).toBeUndefined()
    })
  })

  describe('validateDescription', () => {
    it('should allow empty description', () => {
      expect(validateDescription('', mockT)).toBeUndefined()
    })

    it('should return error for description that is 255 characters or longer', () => {
      const longDescription = 'a'.repeat(255)
      expect(validateDescription(longDescription, mockT)).toBe('Description must be less than 255 characters')
      
      const evenLongerDescription = 'a'.repeat(300)
      expect(validateDescription(evenLongerDescription, mockT)).toBe('Description must be less than 255 characters')
    })

    it('should return undefined for valid descriptions', () => {
      expect(validateDescription('A valid description', mockT)).toBeUndefined()
      expect(validateDescription('a', mockT)).toBeUndefined()
      
      const maxValidDescription = 'a'.repeat(254)
      expect(validateDescription(maxValidDescription, mockT)).toBeUndefined()
    })
  })
})
