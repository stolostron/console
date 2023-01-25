/* Copyright Contributors to the Open Cluster Management project */
export type PointTuple = [number, number]

export interface Layout {
  layout(): void
  stop(): void
  destroy(): void
}

export interface Model {
  graph?: GraphModel
  nodes?: NodeModel[]
  edges?: EdgeModel[]
}

export enum AnchorEnd {
  target,
  source,
  both,
}

export enum TopologyQuadrant {
  upperLeft = 'upperLeft',
  upperRight = 'upperRight',
  lowerLeft = 'lowerLeft',
  lowerRight = 'lowerRight',
}

export enum NodeShape {
  circle = 'circle', // backward compatibility
  ellipse = 'ellipse',
  rect = 'rect',
  rhombus = 'rhombus',
  trapezoid = 'trapezoid',
  hexagon = 'hexagon',
  octagon = 'octagon',
  stadium = 'stadium',
}

export enum NodeStatus {
  default = 'default',
  info = 'info',
  success = 'success',
  warning = 'warning',
  danger = 'danger',
}

export enum EdgeStyle {
  default = 'default',
  solid = 'solid',
  dotted = 'dotted',
  dashed = 'dashed',
  dashedMd = 'dashedMd',
  dashedLg = 'dashedLg',
  dashedXl = 'dashedXl',
}

export enum EdgeAnimationSpeed {
  none = 'none',
  slow = 'slow',
  mediumSlow = 'mediumSlow',
  medium = 'medium',
  mediumFast = 'mediumFast',
  fast = 'fast',
}

export enum EdgeTerminalType {
  none = 'none',
  directional = 'directional',
  directionalAlt = 'directionalAlt',
  circle = 'circle',
  square = 'square',
  cross = 'cross',
}

export enum LabelPosition {
  right,
  bottom,
}

export enum BadgeLocation {
  inner,
  below,
}

export enum ModelKind {
  graph = 'graph',
  node = 'node',
  edge = 'edge',
}

export interface ElementModel {
  id: string
  type: string
  label?: string
  visible?: boolean
  children?: string[]
  data?: any
  style?: { [key: string]: any }
}

export interface NodeModel extends ElementModel {
  x?: number
  y?: number
  width?: number
  height?: number
  group?: boolean
  shape?: NodeShape
  status?: NodeStatus
  collapsed?: boolean
  labelPosition?: LabelPosition
}

export interface EdgeModel extends ElementModel {
  source?: string
  target?: string
  edgeStyle?: EdgeStyle
  animationSpeed?: EdgeAnimationSpeed
  bendpoints?: PointTuple[]
}

// Scale extent: [min scale, max scale]
export type ScaleExtent = [number, number]

export enum ScaleDetailsLevel {
  high = 'high',
  medium = 'medium',
  low = 'low',
}

export interface ScaleDetailsThresholds {
  low: number
  medium: number
}

type Never<Type> = { [K in keyof Type]?: never }
type EitherNotBoth<TypeA, TypeB> = (TypeA & Never<TypeB>) | (TypeB & Never<TypeA>)

interface ViewPaddingPixels {
  padding: number
}
interface ViewPaddingPercentage {
  paddingPercentage: number
}

export type ViewPaddingSettings = EitherNotBoth<ViewPaddingPixels, ViewPaddingPercentage>

export interface GraphModel extends ElementModel {
  layout?: string
  x?: number
  y?: number
  scale?: number
  scaleExtent?: ScaleExtent
  layers?: string[]
}
