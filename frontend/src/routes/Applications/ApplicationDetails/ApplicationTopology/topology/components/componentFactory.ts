/* Copyright Contributors to the Open Cluster Management project */
import { ComponentType } from 'react'
import {
  ModelKind,
  withPanZoom,
  GraphComponent,
  GraphElement,
  ComponentFactory,
  withDragNode,
  withSelection,
  WithSelectionProps,
} from '@patternfly/react-topology'

import StyledNode from './StyledNode'
import StyledEdge from './StyledEdge'

const defaultComponentFactory: ComponentFactory = (
  kind: ModelKind
): ComponentType<{ element: GraphElement }> | undefined => {
  switch (kind) {
    case ModelKind.graph:
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Fixed in next pf topology
      return withPanZoom()(GraphComponent)
    case ModelKind.node:
      return withDragNode()(withSelection()(StyledNode as any as ComponentType<WithSelectionProps>))
    case ModelKind.edge:
      return StyledEdge as any as ComponentType<{ element: GraphElement }>
    default:
      return undefined
  }
}

export default defaultComponentFactory
