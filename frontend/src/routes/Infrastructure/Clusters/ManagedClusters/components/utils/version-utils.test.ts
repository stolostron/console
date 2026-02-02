/* Copyright Contributors to the Open Cluster Management project */

import { isMinorOrMajorUpgrade } from './version-utils'

describe('isMinorOrMajorUpgrade', () => {
  describe('minor version upgrades', () => {
    it('should return true for minor version upgrade (4.13.x → 4.14.x)', () => {
      expect(isMinorOrMajorUpgrade('4.13.10', '4.14.2')).toBe(true)
    })

    it('should return true for minor version upgrade with different patch versions', () => {
      expect(isMinorOrMajorUpgrade('4.13.50', '4.14.0')).toBe(true)
    })

    it('should return true for multiple minor version jump (4.13.x → 4.15.x)', () => {
      expect(isMinorOrMajorUpgrade('4.13.10', '4.15.5')).toBe(true)
    })
  })

  describe('major version upgrades', () => {
    it('should return true for major version upgrade (4.x.x → 5.x.x)', () => {
      expect(isMinorOrMajorUpgrade('4.13.10', '5.0.0')).toBe(true)
    })

    it('should return true for major version upgrade with different minor/patch', () => {
      expect(isMinorOrMajorUpgrade('4.14.20', '5.1.3')).toBe(true)
    })

    it('should return true for multiple major version jump', () => {
      expect(isMinorOrMajorUpgrade('3.11.5', '5.0.0')).toBe(true)
    })
  })

  describe('patch version upgrades', () => {
    it('should return false for patch upgrade (4.13.10 → 4.13.50)', () => {
      expect(isMinorOrMajorUpgrade('4.13.10', '4.13.50')).toBe(false)
    })

    it('should return false for patch upgrade with single increment', () => {
      expect(isMinorOrMajorUpgrade('4.14.5', '4.14.6')).toBe(false)
    })

    it('should return false for patch upgrade with large jump', () => {
      expect(isMinorOrMajorUpgrade('4.14.1', '4.14.99')).toBe(false)
    })
  })

  describe('same version', () => {
    it('should return false when versions are identical', () => {
      expect(isMinorOrMajorUpgrade('4.13.10', '4.13.10')).toBe(false)
    })

    it('should return false when major and minor match (same base version)', () => {
      expect(isMinorOrMajorUpgrade('4.14.0', '4.14.0')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should return false when currentVersion is undefined', () => {
      expect(isMinorOrMajorUpgrade(undefined, '4.14.2')).toBe(false)
    })

    it('should return false when currentVersion is empty string', () => {
      expect(isMinorOrMajorUpgrade('', '4.14.2')).toBe(false)
    })

    it('should return false when version has only one part', () => {
      expect(isMinorOrMajorUpgrade('4', '5')).toBe(false)
    })

    it('should return false when currentVersion has insufficient parts', () => {
      expect(isMinorOrMajorUpgrade('4', '4.14.2')).toBe(false)
    })

    it('should return false when targetVersion has insufficient parts', () => {
      expect(isMinorOrMajorUpgrade('4.13.10', '4')).toBe(false)
    })

    it('should handle version with extra segments', () => {
      expect(isMinorOrMajorUpgrade('4.13.10.1', '4.14.2.1')).toBe(true)
    })
  })

  describe('downgrade scenarios', () => {
    it('should return true for major version downgrade (treated as major change)', () => {
      expect(isMinorOrMajorUpgrade('5.0.0', '4.14.2')).toBe(true)
    })

    it('should return true for minor version downgrade (treated as minor change)', () => {
      expect(isMinorOrMajorUpgrade('4.14.5', '4.13.10')).toBe(true)
    })

    it('should return false for patch version downgrade', () => {
      expect(isMinorOrMajorUpgrade('4.13.50', '4.13.10')).toBe(false)
    })
  })
})
