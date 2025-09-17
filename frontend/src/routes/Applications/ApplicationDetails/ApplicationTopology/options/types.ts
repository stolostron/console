/* Copyright Contributors to the Open Cluster Management project */

// Shared types for the Application Topology options module

export type TFunction = (key: string, args?: unknown[]) => string

export interface IconDefinition {
  icon: string
  classType: string
  width: number
  height: number
  dx: number
  dy: number
}

export interface ShapeDefinition {
  shape: string
  className: string
  nodeRadius?: number
}

export type DefaultShapesMap = Record<string, ShapeDefinition>

export interface TooltipItem {
  name?: string
  value: string | number
  href?: string
  target?: string
  rel?: string
}

export interface NodeLayout {
  uid?: string
  type?: string
  label?: string
  compactLabel?: string
  isMajorHub?: boolean
  isMinorHub?: boolean
  [key: string]: unknown
}

export interface TopologyNode {
  id?: string
  uid: string
  name?: string
  type: string
  namespace?: string
  clusterName?: string | null
  cluster?: unknown
  specs: any
  layout?: NodeLayout
  [key: string]: unknown
}

export interface NodeGroup {
  nodes: TopologyNode[]
}

export type NodeGroupsMap = Record<string, NodeGroup>

export interface AvailableFilter {
  name: string
  availableSet: Set<any> | Map<string, any>
}

export type AvailableFilters = Record<string, AvailableFilter | string[]>

export interface GetAllFiltersResult {
  availableFilters: AvailableFilters
  otherTypeFilters: string[]
  activeFilters: Record<string, any>
}
