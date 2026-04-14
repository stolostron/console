/* Copyright Contributors to the Open Cluster Management project */

/**
 * Numerically compares two version strings segment by segment.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 * Handles two-part (4.16) and three-part (4.16.3) versions correctly,
 * treating missing segments as 0 (e.g., "5.0" is equivalent to "5.0.0").
 */
export function compareVersions(a: string | undefined, b: string | undefined): number {
  if (!a && !b) return 0
  if (!a) return -1
  if (!b) return 1

  const aParts = a.split('.').map((s) => Number.parseInt(s, 10) || 0)
  const bParts = b.split('.').map((s) => Number.parseInt(s, 10) || 0)
  const len = Math.max(aParts.length, bParts.length)

  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Determines if upgrading from currentVersion to targetVersion is a minor or major version upgrade.
 *
 * @param currentVersion - The current cluster version (e.g., "4.13.10")
 * @param targetVersion - The target version to upgrade to (e.g., "4.14.2")
 * @returns true if this is a minor or major version upgrade, false if it's only a patch upgrade
 *
 * Examples:
 * - isMinorOrMajorUpgrade("4.13.10", "4.14.2") → true (minor upgrade: 4.13 → 4.14)
 * - isMinorOrMajorUpgrade("4.13.10", "5.0.0") → true (major upgrade: 4 → 5)
 * - isMinorOrMajorUpgrade("4.13.10", "4.13.50") → false (patch upgrade: 4.13.10 → 4.13.50)
 */
export function isMinorOrMajorUpgrade(currentVersion: string | undefined, targetVersion: string): boolean {
  if (!currentVersion) {
    return false
  }

  const current = currentVersion.split('.')
  const target = targetVersion.split('.')

  // Need at least major.minor to determine upgrade type
  if (current.length < 2 || target.length < 2) {
    return false
  }

  // Major version change: 4.x.x → 5.x.x
  if (target[0] !== current[0]) {
    return true
  }

  // Minor version change: 4.13.x → 4.14.x
  if (target[1] !== current[1]) {
    return true
  }

  // Same major.minor = patch upgrade only
  return false
}
