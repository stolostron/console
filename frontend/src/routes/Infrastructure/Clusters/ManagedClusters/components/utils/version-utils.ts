/* Copyright Contributors to the Open Cluster Management project */

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
