/* Copyright Contributors to the Open Cluster Management project */

import { validateName } from './validation'

// Mock translation function
const mockT = (key: string) => key

describe('Project validation functions', () => {
  describe('validateName', () => {
    it.each(['', '   ', '  \t  '])('should return error for empty name: "%s"', (emptyName) =>
      expect(validateName(emptyName, mockT)).toBe('Name is required')
    )

    it.each([64, 100, 255, 300])('should return error for name that is %s characters or longer', (length) =>
      expect(validateName('a'.repeat(length), mockT)).toBe('Name must be less than 64 characters')
    )

    it.each([
      'my-name',
      '123-abc',
      'a',
      '1',
      'test123',
      'abc-123-def',
      'project1',
      'web-app',
      '2048-game',
      'api-v2',
      'frontend-ui',
    ])('should return undefined for valid RFC 1123 name: "%s"', (validName) =>
      expect(validateName(validName, mockT)).toBeUndefined()
    )

    it('should return undefined for maximum valid length name', () => {
      const maxValidName = 'a'.repeat(63)
      expect(validateName(maxValidName, mockT)).toBeUndefined()
    })

    it.each(['MyName', 'TEST', 'Project-Name', 'API-V2', 'WebApp', 'Frontend-UI'])(
      'should return error for invalid RFC 1123 name with uppercase characters: "%s"',
      (invalidName) =>
        expect(validateName(invalidName, mockT)).toBe(
          "Name must be a lowercase RFC 1123 label: lowercase alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name', or '123-abc')"
        )
    )

    it('should return error for invalid RFC 1123 names - starting with hyphen', () =>
      expect(validateName('-myname', mockT)).toBe(
        "Name must be a lowercase RFC 1123 label: lowercase alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name', or '123-abc')"
      ))

    it('should return error for invalid RFC 1123 names - ending with hyphen', () =>
      expect(validateName('myname-', mockT)).toBe(
        "Name must be a lowercase RFC 1123 label: lowercase alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name', or '123-abc')"
      ))

    it.each([
      'my_name',
      'my.name',
      'my@name',
      'my name',
      'project#1',
      'web$app',
      'api+v2',
      'frontend/ui',
      'backend\\service',
      'data*base',
    ])('should return error for invalid RFC 1123 name with special characters: "%s"', (invalidName) =>
      expect(validateName(invalidName, mockT)).toBe(
        "Name must be a lowercase RFC 1123 label: lowercase alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name', or '123-abc')"
      )
    )

    it('should return error for invalid RFC 1123 names - only hyphen', () =>
      expect(validateName('-', mockT)).toBe(
        "Name must be a lowercase RFC 1123 label: lowercase alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name', or '123-abc')"
      ))
  })
})
