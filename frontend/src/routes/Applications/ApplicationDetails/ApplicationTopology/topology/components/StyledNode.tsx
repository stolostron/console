/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { Tooltip, TooltipPosition } from '@patternfly/react-core'
import { OutlinedListAltIcon, PencilAltIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { useTopologyRefresh } from '../contexts/TopologyRefreshContext'
import {
  getTopologyNodeActionVisibility,
  getTopologyNodeDataFromElement,
  showApplicationPickerOnAppSet,
} from '../../helpers/topologyNodeActions'
import type { TopologyNode } from '../../types'
import {
  Decorator,
  DefaultNode,
  TopologyQuadrant,
  ScaleDetailsLevel,
  getDefaultShapeDecoratorCenter,
  ShapeProps,
  Node,
  observer,
  useCombineRefs,
  useHover,
  WithContextMenuProps,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology'

const DEFAULT_DECORATOR_RADIUS = 12
const ACTION_DECORATOR_RADIUS = DEFAULT_DECORATOR_RADIUS + 2
const ACTION_ICON_SIZE = 16

const stopDecoratorPointerEvent = (event: React.MouseEvent | React.PointerEvent): void => {
  event.stopPropagation()
}

import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon'

import CustomEllipse from './CustomEllipse'

type StyledNodeProps = {
  element: Node
  getCustomShape?: (node: Node) => React.FunctionComponent<ShapeProps>
  getShapeDecoratorCenter?: (quadrant: TopologyQuadrant, node: Node) => { x: number; y: number }
  showLabel?: boolean // Defaults to true
  labelIcon?: React.ComponentClass<SVGIconProps>
  showStatusDecorator?: boolean // Defaults to false
  regrouping?: boolean
  dragging?: boolean
} & WithContextMenuProps &
  WithCreateConnectorProps &
  WithDragNodeProps &
  WithSelectionProps

const CustomShape: React.FunctionComponent<ShapeProps> = (props) => {
  const data = props.element.getData() as { specs?: { resourceCount?: number }; status?: string }
  const isMulti = (data?.specs?.resourceCount ?? 0) > 1
  const shouldPulse = data?.status === 'danger'
  return <CustomEllipse {...props} isMulti={isMulti} shouldPulse={shouldPulse} />
}

const getCustomShape = (): React.FunctionComponent<ShapeProps> => CustomShape

const StyledNode: React.FunctionComponent<StyledNodeProps> = ({
  element,
  onContextMenu,
  contextMenuOpen,
  showLabel,
  dragging,
  regrouping,
  ...rest
}) => {
  const { dragNodeRef, getShapeDecoratorCenter, ...defaultNodeRest } = rest
  const { t } = useTranslation()
  const { refreshResources, onViewLogs, onEditYaml, onEditApplications } = useTopologyRefresh()
  const data = element.getData()
  const [hover, hoverRef] = useHover<SVGEllipseElement>()
  const [decoratorHover, setDecoratorHover] = React.useState(false)
  const isNodeHovered = hover || decoratorHover
  const combinedNodeRef = useCombineRefs<SVGEllipseElement>(
    hoverRef,
    (dragNodeRef ?? null) as React.Ref<SVGEllipseElement>
  )

  let detailsLevel = ScaleDetailsLevel.high
  const scale = element.getGraph().getScale()
  if (scale < 0.3) {
    detailsLevel = ScaleDetailsLevel.low
  } else if (scale < 0.6) {
    detailsLevel = ScaleDetailsLevel.medium
  }

  const passedData = React.useMemo(() => {
    const newData = { ...data }
    Object.keys(newData).forEach((key) => {
      if (newData[key] === undefined) {
        delete newData[key]
      }
    })
    return newData
  }, [data])

  const LabelIcon = passedData.labelIcon
  const { width, height } = element.getDimensions()

  return (
    <DefaultNode
      element={element}
      raiseLabelOnHover={false}
      nodeStatus={data.status}
      scaleLabel={detailsLevel !== ScaleDetailsLevel.low}
      scaleNode={isNodeHovered && detailsLevel === ScaleDetailsLevel.low}
      showLabel={isNodeHovered || (detailsLevel !== ScaleDetailsLevel.low && showLabel)}
      showStatusBackground={!isNodeHovered && detailsLevel === ScaleDetailsLevel.low}
      showStatusDecorator={detailsLevel === ScaleDetailsLevel.high && passedData.showStatusDecorator}
      hover={isNodeHovered}
      dragNodeRef={combinedNodeRef}
      {...defaultNodeRest}
      {...passedData}
      getCustomShape={getCustomShape}
      dragging={dragging}
      regrouping={regrouping}
      onContextMenu={data.showContextMenu ? onContextMenu : undefined}
      contextMenuOpen={contextMenuOpen}
      labelIcon={LabelIcon && <LabelIcon noVerticalAlign />}
      attachments={
        detailsLevel !== ScaleDetailsLevel.low &&
        renderDecorators(element, passedData, getShapeDecoratorCenter, refreshResources, t, isNodeHovered, {
          onViewLogs,
          onEditYaml,
          onEditApplications,
          setDecoratorHover,
        })
      }
    >
      {(isNodeHovered || detailsLevel !== ScaleDetailsLevel.low) && (
        <use href={`#nodeIcon_${data.shape}`} width={width} height={height} />
      )}
    </DefaultNode>
  )
}

const renderDecorators = (
  element: Node,
  data: {
    statusIcon?: { icon: string; classType: string; width: number; height: number }
    specs?: any
  },
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node
  ) => {
    x: number
    y: number
  },
  refreshResources?: () => void,
  translate?: (key: string) => string,
  isHovered?: boolean,
  nodeActions?: {
    onViewLogs?: (node: TopologyNode) => void
    onEditYaml?: (node: TopologyNode) => void
    onEditApplications?: (node: TopologyNode) => void
    setDecoratorHover?: (hovered: boolean) => void
  }
): React.ReactNode => {
  const { statusIcon, specs } = data
  const topologyNode = getTopologyNodeDataFromElement(element)
  const { showLogs, showEditYaml } = getTopologyNodeActionVisibility(topologyNode.type, topologyNode.specs)
  const showAppPicker = showApplicationPickerOnAppSet(topologyNode)

  return (
    <>
      {statusIcon &&
        renderStatusDecorator(
          element,
          TopologyQuadrant.upperLeft,
          statusIcon,
          getShapeDecoratorCenter,
          refreshResources,
          translate
        )}
      {specs?.resourceCount > 1 && renderCountDecorator(element, specs?.resourceCount)}
      {isHovered &&
        renderNodeActionDecorators(
          element,
          getShapeDecoratorCenter,
          translate,
          topologyNode,
          showLogs,
          showEditYaml,
          showAppPicker,
          nodeActions
        )}
    </>
  )
}

const ACTION_ICON_OFFSET = 2

const getActionIconArtwork = (type: 'logs' | 'edit' | 'argoApp'): React.ReactNode => {
  const offset = `translate(${ACTION_ICON_OFFSET}, ${ACTION_ICON_OFFSET})`
  switch (type) {
    case 'logs':
      return (
        <g transform={offset}>
          <OutlinedListAltIcon width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} aria-hidden />
        </g>
      )
    case 'edit':
      return (
        <g transform={offset}>
          <PencilAltIcon width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} aria-hidden />
        </g>
      )
    case 'argoApp':
      return (
        <g transform={offset}>
          <use
            href="#nodeStatusIcon_argoApp"
            width={ACTION_ICON_SIZE}
            height={ACTION_ICON_SIZE}
            className="pf-topology-node-action-decorator"
          />
        </g>
      )
  }
}

const renderNodeActionDecorators = (
  element: Node,
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node,
    radius?: number
  ) => {
    x: number
    y: number
  },
  translate?: (key: string) => string,
  topologyNode?: TopologyNode,
  showLogs?: boolean,
  showEditYaml?: boolean,
  showAppPicker?: boolean,
  nodeActions?: {
    onViewLogs?: (node: TopologyNode) => void
    onEditYaml?: (node: TopologyNode) => void
    onEditApplications?: (node: TopologyNode) => void
    setDecoratorHover?: (hovered: boolean) => void
  }
): React.ReactNode => {
  if (!topologyNode) {
    return null
  }
  const setDecoratorHover = nodeActions?.setDecoratorHover
  const decorators: React.ReactNode[] = []
  if (showLogs && nodeActions?.onViewLogs) {
    decorators.push(
      renderActionDecorator(
        element,
        TopologyQuadrant.lowerLeft,
        getActionIconArtwork('logs'),
        translate?.('Logs') ?? 'Logs',
        () => nodeActions.onViewLogs?.(topologyNode),
        getShapeDecoratorCenter,
        setDecoratorHover
      )
    )
  }
  if (showAppPicker && nodeActions?.onEditApplications) {
    decorators.push(
      renderActionDecorator(
        element,
        TopologyQuadrant.lowerLeft,
        getActionIconArtwork('argoApp'),
        translate?.('Edit Application YAML') ?? 'Edit Application YAML',
        () => nodeActions.onEditApplications?.(topologyNode),
        getShapeDecoratorCenter,
        setDecoratorHover
      )
    )
  }
  if (showEditYaml && nodeActions?.onEditYaml) {
    decorators.push(
      renderActionDecorator(
        element,
        TopologyQuadrant.lowerRight,
        getActionIconArtwork('edit'),
        translate?.('Edit YAML') ?? 'Edit YAML',
        () => nodeActions.onEditYaml?.(topologyNode),
        getShapeDecoratorCenter,
        setDecoratorHover
      )
    )
  }
  return <>{decorators}</>
}

const ActionIconDecorator: React.FunctionComponent<{
  x: number
  y: number
  icon: React.ReactNode
  ariaLabel: string
  onClick: () => void
  setDecoratorHover?: (hovered: boolean) => void
}> = ({ x, y, icon, ariaLabel, onClick, setDecoratorHover }) => {
  const decoratorRef = React.useRef<SVGGElement>(null)

  const pointerIsolationProps = {
    className: 'pf-topology-node-action-decorator-hit',
    onMouseEnter: (event: React.MouseEvent) => {
      stopDecoratorPointerEvent(event)
      setDecoratorHover?.(true)
    },
    onMouseLeave: (event: React.MouseEvent) => {
      stopDecoratorPointerEvent(event)
      setDecoratorHover?.(false)
    },
    onMouseDown: stopDecoratorPointerEvent,
    onMouseUp: stopDecoratorPointerEvent,
    onMouseMove: stopDecoratorPointerEvent,
    onPointerDown: stopDecoratorPointerEvent,
    onPointerUp: stopDecoratorPointerEvent,
    onPointerMove: stopDecoratorPointerEvent,
    onClick: stopDecoratorPointerEvent,
  }

  const decorator = (
    <g {...pointerIsolationProps}>
      <Decorator
        x={x}
        y={y}
        radius={ACTION_DECORATOR_RADIUS}
        showBackground
        icon={icon}
        className="pf-topology-node-action-decorator"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        ariaLabel={ariaLabel}
        innerRef={decoratorRef}
      />
    </g>
  )

  return (
    <Tooltip triggerRef={decoratorRef} content={ariaLabel} position={TooltipPosition.top}>
      {decorator}
    </Tooltip>
  )
}

const renderActionDecorator = (
  element: Node,
  quadrant: TopologyQuadrant,
  icon: React.ReactNode,
  ariaLabel: string,
  onClick: () => void,
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node,
    radius?: number
  ) => {
    x: number
    y: number
  },
  setDecoratorHover?: (hovered: boolean) => void
): React.ReactNode => {
  const { x, y } = getShapeDecoratorCenter
    ? getShapeDecoratorCenter(quadrant, element)
    : getDefaultShapeDecoratorCenter(quadrant, element)
  return (
    <ActionIconDecorator
      x={x}
      y={y}
      icon={icon}
      ariaLabel={ariaLabel}
      onClick={onClick}
      setDecoratorHover={setDecoratorHover}
    />
  )
}

const StatusIconDecorator: React.FunctionComponent<{
  x: number
  y: number
  statusIcon: { icon: string; classType: string; width: number; height: number }
  refreshResources?: () => void
  translate?: (key: string) => string
}> = ({ x, y, statusIcon, refreshResources, translate }) => {
  const decoratorRef = React.useRef<SVGGElement>(null)
  const { icon, classType, width, height } = statusIcon
  const iconUse = <use href={`#nodeStatusIcon_${icon}`} width={width} height={height} className={classType} />
  const isSyncRefresh = icon === 'sync' && refreshResources
  const syncResourcesLabel = isSyncRefresh && translate ? translate('Sync resources') : undefined

  const decorator = (
    <Decorator
      x={x}
      y={y}
      radius={DEFAULT_DECORATOR_RADIUS}
      showBackground
      icon={iconUse}
      className={isSyncRefresh ? 'pf-topology-sync-resource-decorator' : undefined}
      onClick={isSyncRefresh ? () => refreshResources?.() : undefined}
      ariaLabel={syncResourcesLabel}
      innerRef={syncResourcesLabel ? decoratorRef : undefined}
    />
  )

  if (syncResourcesLabel) {
    return (
      <Tooltip triggerRef={decoratorRef} content={syncResourcesLabel} position={TooltipPosition.left}>
        {decorator}
      </Tooltip>
    )
  }

  return decorator
}

const renderStatusDecorator = (
  element: Node,
  quadrant: TopologyQuadrant,
  statusIcon: { icon: string; classType: string; width: number; height: number },
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node,
    radius?: number
  ) => {
    x: number
    y: number
  },
  refreshResources?: () => void,
  translate?: (key: string) => string
): React.ReactNode => {
  const { x, y } = getShapeDecoratorCenter
    ? getShapeDecoratorCenter(quadrant, element)
    : getDefaultShapeDecoratorCenter(quadrant, element)
  return (
    <StatusIconDecorator
      x={x}
      y={y}
      statusIcon={statusIcon}
      refreshResources={refreshResources}
      translate={translate}
    />
  )
}

const renderCountDecorator = (element: Node, resourceCount: number): React.ReactNode => {
  const { width, height } = element.getDimensions()
  const x = width
  const y = height / 2

  return (
    <g className="pf-topology__node__decorator" style={{ userSelect: 'none', pointerEvents: 'none' }}>
      <g transform={`translate(${x}, ${y})`}>
        <g transform={`translate(-16, -12)`}>
          <use href={'#nodeStatusIcon_clusterCount'} width={32} height={24} className={'resourceCountIcon'} />
        </g>
        <g transform={`translate(0, 1)`}>
          <text
            text-anchor="middle"
            pointer-events="none"
            dominant-baseline="middle"
            style={{ fontWeight: 'bold' }}
            className={'resourceCountIcon'}
          >
            {resourceCount}
          </text>
        </g>
      </g>
    </g>
  )
}

export default observer(StyledNode)
