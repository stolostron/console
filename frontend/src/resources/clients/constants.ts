/* Copyright Contributors to the Open Cluster Management project */

export const ManagedByConsoleLabelKey = 'open-cluster-management.io/managed-by'
export const ManagedByConsoleLabelValue = 'console'
export const ManagedByConsoleLabel: Record<string, string> = { [ManagedByConsoleLabelKey]: ManagedByConsoleLabelValue }

/** System label for Placements created by fine-grained RBAC (aligns with MTV / GitOps). */
export const PlacementManagedBySystemLabelKey = 'cluster.open-cluster-management.io/placement-managed-by-system'
export const PlacementManagedBySystemLabelValue = 'true'
export const PlacementManagedBySystemLabel: Record<string, string> = {
  [PlacementManagedBySystemLabelKey]: PlacementManagedBySystemLabelValue,
}
