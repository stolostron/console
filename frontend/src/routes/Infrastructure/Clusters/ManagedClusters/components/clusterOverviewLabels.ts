/* Copyright Contributors to the Open Cluster Management project */

/** UX guidance: show around 3–5 labels by default (max 5). */
export const DEFAULT_MAX_VISIBLE_LABELS = 5

/**
 * Returns label keys that should be collapsed behind an "N more" control.
 * Keys are sorted the same way as AcmLabels so the first N remain visible.
 */
export function getCollapsedLabelKeys(
  labels: Record<string, string>,
  maxVisible: number = DEFAULT_MAX_VISIBLE_LABELS
): string[] {
  const keys = Object.keys(labels).sort((a, b) => a.localeCompare(b))
  if (keys.length <= maxVisible) {
    return []
  }
  return keys.slice(maxVisible)
}
