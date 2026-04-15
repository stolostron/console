/* Copyright Contributors to the Open Cluster Management project */

import { compareVersions, isMinorOrMajorUpgrade } from './version-utils'

describe('compareVersions', () => {
  it('should return 0 for equal versions', () => {
    expect(compareVersions('4.14.2', '4.14.2')).toBe(0)
  })

  it('should return negative when a < b', () => {
    expect(compareVersions('4.13.10', '4.14.2')).toBeLessThan(0)
  })

  it('should return positive when a > b', () => {
    expect(compareVersions('4.14.2', '4.13.10')).toBeGreaterThan(0)
  })

  it('should compare major versions numerically', () => {
    expect(compareVersions('5.0.0', '4.99.99')).toBeGreaterThan(0)
    expect(compareVersions('4.99.99', '5.0.0')).toBeLessThan(0)
  })

  it('should compare minor versions numerically (not lexicographically)', () => {
    expect(compareVersions('4.9.0', '4.10.0')).toBeLessThan(0)
    expect(compareVersions('4.10.0', '4.9.0')).toBeGreaterThan(0)
  })

  it('should handle two-part versions', () => {
    expect(compareVersions('4.16', '4.16.3')).toBeLessThan(0)
    expect(compareVersions('5.0', '4.99')).toBeGreaterThan(0)
    expect(compareVersions('4.16', '4.16')).toBe(0)
  })

  it('should treat missing segments as 0', () => {
    expect(compareVersions('5.0', '5.0.0')).toBe(0)
  })

  it('should handle undefined and empty values', () => {
    expect(compareVersions(undefined, undefined)).toBe(0)
    expect(compareVersions(undefined, '4.14.2')).toBeLessThan(0)
    expect(compareVersions('4.14.2', undefined)).toBeGreaterThan(0)
    expect(compareVersions('', '4.14.2')).toBeLessThan(0)
  })

  describe('regression: string comparison bugs', () => {
    it('should order 4.9 < 4.10 (string comparison would get this wrong)', () => {
      expect(compareVersions('4.9.0', '4.10.0')).toBeLessThan(0)
      expect(compareVersions('4.9.5', '4.10.0')).toBeLessThan(0)
    })

    it('should not produce false positives from independent segment comparison', () => {
      // The old isVersionGreater compared each segment independently:
      // isVersionGreater("4.13.5", "4.14.3") returned true because 5 > 3 at patch,
      // even though 4.14.3 > 4.13.5 overall.
      expect(compareVersions('4.13.5', '4.14.3')).toBeLessThan(0)
      expect(compareVersions('4.14.3', '4.13.5')).toBeGreaterThan(0)
    })

    it('should compare patch versions correctly when major.minor are equal', () => {
      expect(compareVersions('4.14.3', '4.14.5')).toBeLessThan(0)
      expect(compareVersions('4.14.10', '4.14.9')).toBeGreaterThan(0)
    })

    it('should handle OCP 5.0 version comparisons', () => {
      expect(compareVersions('5.0.0', '4.17.5')).toBeGreaterThan(0)
      expect(compareVersions('4.17.5', '5.0.0')).toBeLessThan(0)
      expect(compareVersions('5.0.1', '5.0.0')).toBeGreaterThan(0)
    })
  })
})

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
