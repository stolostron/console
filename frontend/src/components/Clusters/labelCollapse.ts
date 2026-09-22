/* Copyright Contributors to the Open Cluster Management project */

/** UX guidance: show around 3–5 labels by default (max 5). */
export const DEFAULT_MAX_VISIBLE_LABELS = 5

/**
 * Builds the AcmLabels `collapse` list: preferred-hidden keys first, then any
 * remaining keys beyond `maxVisible` (order of `keys` is preserved).
 */
export function getOverflowLabelKeys(
  keys: string[],
  preferCollapse: string[] = [],
  maxVisible: number = DEFAULT_MAX_VISIBLE_LABELS
): string[] {
  const preferredKeys = [...new Set(preferCollapse)]
  const visibleKeys = keys.filter((key) => !preferredKeys.includes(key))
  if (visibleKeys.length <= maxVisible) {
    return preferredKeys
  }
  return [...preferredKeys, ...visibleKeys.slice(maxVisible)]
}

/**
 * Collapses label keys beyond `maxVisible`.
 * Keys are sorted the same way as AcmLabels so the first N remain visible.
 */
export function getCollapsedLabelKeys(
  labels: Record<string, string>,
  maxVisible: number = DEFAULT_MAX_VISIBLE_LABELS
): string[] {
  const keys = Object.keys(labels).sort((a, b) => a.localeCompare(b))
  return getOverflowLabelKeys(keys, [], maxVisible)
}
