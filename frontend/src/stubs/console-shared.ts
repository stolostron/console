/* Copyright Contributors to the Open Cluster Management project */

/**
 * Stub for @console/shared when running standalone (not inside OpenShift Console).
 * These are placeholder components; the real implementations come from the console when running as a plugin.
 */

import type { ReactNode } from 'react'

const Passthrough = ({ children }: { children?: ReactNode }) => (children ?? null)

export const PaneBody = Passthrough

export const StatusPopupSection = Passthrough
export const StatusPopupItem = Passthrough
export const Overview = Passthrough
export const OverviewGrid = Passthrough
export const InventoryItem = Passthrough
export const InventoryItemTitle = Passthrough
export const InventoryItemBody = Passthrough
export const InventoryItemStatus = Passthrough
export const InventoryItemLoading = Passthrough
export const DocumentTitle = Passthrough
export const Timestamp = Passthrough
export const ActionServiceProvider = Passthrough
export const ErrorBoundaryFallbackPage = Passthrough
export const QueryBrowser = Passthrough
export const useAnnotationsModal = () => ({ isOpen: false, toggle: () => {} })
export const useDeleteModal = () => ({ isOpen: false, toggle: () => {} })
export const useLabelsModal = () => ({ isOpen: false, toggle: () => {} })
export const useActiveNamespace = () => ['default']
export const useUserSettings = () => ({})
export const useQuickStartContext = () => ({})

export default Passthrough
