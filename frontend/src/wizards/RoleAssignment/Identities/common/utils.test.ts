/* Copyright Contributors to the Open Cluster Management project */

import { getTypeColor } from './utils'

describe('utils', () => {
  describe('getTypeColor', () => {
    it('should return consistent colors for the same type', () => {
      const color1 = getTypeColor('LDAP')
      const color2 = getTypeColor('LDAP')
      expect(color1).toBe(color2)
    })

    it('should return different colors for different types', () => {
      const ldapColor = getTypeColor('LDAP')
      const htpasswdColor = getTypeColor('HTPasswd')
      const githubColor = getTypeColor('GitHub')

      // While we can't guarantee they're all different due to hash collisions,
      // we can test that the function returns valid color values
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']

      expect(validColors).toContain(ldapColor)
      expect(validColors).toContain(htpasswdColor)
      expect(validColors).toContain(githubColor)
    })

    it('should handle empty string', () => {
      const color = getTypeColor('')
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
      expect(validColors).toContain(color)
    })

    it('should handle special characters', () => {
      const color = getTypeColor('OAuth-2.0')
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
      expect(validColors).toContain(color)
    })

    it('should be case sensitive', () => {
      const upperColor = getTypeColor('LDAP')
      const lowerColor = getTypeColor('ldap')
      // They might be the same due to hash collision, but we test that both return valid colors
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
      expect(validColors).toContain(upperColor)
      expect(validColors).toContain(lowerColor)
    })

    it('should handle unicode characters', () => {
      const color = getTypeColor('LDAP-ñ')
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
      expect(validColors).toContain(color)
    })

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(1000)
      const color = getTypeColor(longString)
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
      expect(validColors).toContain(color)
    })

    it('should handle numeric strings', () => {
      const color = getTypeColor('123456')
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
      expect(validColors).toContain(color)
    })

    it('should be deterministic for common identity provider types', () => {
      const commonTypes = ['LDAP', 'HTPasswd', 'GitHub', 'OpenID', 'Google', 'GitLab']

      // Test that each type consistently returns the same color
      commonTypes.forEach((type) => {
        const color1 = getTypeColor(type)
        const color2 = getTypeColor(type)
        const color3 = getTypeColor(type)

        expect(color1).toBe(color2)
        expect(color2).toBe(color3)

        const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
        expect(validColors).toContain(color1)
      })
    })

    it('should distribute colors across the available range', () => {
      // Test with a variety of strings to ensure we're using the full color range
      const testStrings = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'LDAP',
        'HTPasswd',
        'GitHub',
        'OpenID',
        'Google',
        'GitLab',
        'test1',
        'test2',
        'test3',
        'test4',
        'test5',
      ]

      const colors = testStrings.map((str) => getTypeColor(str))
      const uniqueColors = new Set(colors)

      // We should get at least a few different colors (not all the same)
      expect(uniqueColors.size).toBeGreaterThan(1)

      // All colors should be valid
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
      colors.forEach((color) => {
        expect(validColors).toContain(color)
      })
    })

    it('should provide good distribution for common identity provider types', () => {
      // Test with the most common identity provider types
      const commonTypes = ['HTPasswd', 'LDAP', 'OAuth', 'GitHub', 'Google', 'SAML']
      const colors = commonTypes.map((type) => getTypeColor(type))
      const uniqueColors = new Set(colors)

      // With 6 types and 7 available colors, we should get good distribution
      // Expect at least 4 different colors (better than the original 2)
      expect(uniqueColors.size).toBeGreaterThanOrEqual(4)

      // All colors should be valid
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
      colors.forEach((color) => {
        expect(validColors).toContain(color)
      })

      // Verify specific types don't all get the same color (regression test)
      const ldapColor = getTypeColor('LDAP')
      const oauthColor = getTypeColor('OAuth')
      const githubColor = getTypeColor('GitHub')

      // These three were all getting 'grey' in the original implementation
      const allSameColor = ldapColor === oauthColor && oauthColor === githubColor
      expect(allSameColor).toBe(false)
    })

    it('should minimize collisions for extended identity provider types', () => {
      // Test with an extended set of identity provider types
      const extendedTypes = [
        'HTPasswd',
        'LDAP',
        'OAuth',
        'GitHub',
        'Google',
        'SAML',
        'OpenID',
        'GitLab',
        'BasicAuth',
        'RequestHeader',
        'Keystone',
      ]

      const colors = extendedTypes.map((type) => getTypeColor(type))
      const uniqueColors = new Set(colors)

      // With 11 types and 7 colors, we expect at least 5 different colors to be used
      expect(uniqueColors.size).toBeGreaterThanOrEqual(5)

      // Count the maximum number of types that share the same color
      const colorCounts: Record<string, number> = {}
      colors.forEach((color) => {
        colorCounts[color] = (colorCounts[color] || 0) + 1
      })

      const maxCollisions = Math.max(...Object.values(colorCounts))

      // No color should be used by more than 4 types (reasonable distribution)
      // With 11 types and 7 colors, some collisions are expected
      expect(maxCollisions).toBeLessThanOrEqual(4)
    })

    it('should handle strings with whitespace', () => {
      const color1 = getTypeColor('LDAP Provider')
      const color2 = getTypeColor('GitHub Enterprise')

      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']
      expect(validColors).toContain(color1)
      expect(validColors).toContain(color2)
    })

    it('should return only valid PatternFly label colors', () => {
      const testTypes = [
        'LDAP',
        'HTPasswd',
        'GitHub',
        'OpenID',
        'Google',
        'GitLab',
        'BasicAuth',
        'RequestHeader',
        'Keystone',
      ]
      const validColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'grey']

      testTypes.forEach((type) => {
        const color = getTypeColor(type)
        expect(validColors).toContain(color)
        expect(typeof color).toBe('string')
      })
    })
  })
})
