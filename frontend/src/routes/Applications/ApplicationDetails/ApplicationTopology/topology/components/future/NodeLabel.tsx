/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { css } from '@patternfly/react-styles'
import styles from '@patternfly/react-topology/dist/esm/css/topology-components'
import { truncateMiddle } from './truncate-middle'
import NodeShadows, { NODE_SHADOW_FILTER_ID_DANGER, NODE_SHADOW_FILTER_ID_HOVER } from './NodeShadows'
import { BadgeLocation, LabelPosition, NodeStatus } from './types'
import {
  WithContextMenuProps,
  WithDndDragProps,
  createSvgIdUrl,
  useCombineRefs,
  useHover,
  useSize,
} from '@patternfly/react-topology'

type NodeLabelProps = {
  children?: string
  className?: string
  paddingX?: number
  paddingY?: number
  x?: number
  y?: number
  position?: LabelPosition
  cornerRadius?: number
  status?: NodeStatus
  secondaryLabel?: string
  truncateLength?: number // Defaults to 13
  labelIconClass?: string // Icon to show in label
  labelIcon?: React.ReactNode
  labelIconPadding?: number
  dragRef?: WithDndDragProps['dndDragRef']
  hover?: boolean
  dragging?: boolean
  edgeDragging?: boolean
  dropTarget?: boolean
  actionIcon?: React.ReactElement
  actionIconClassName?: string
  onActionIconClick?: (e: React.MouseEvent) => void
  badge?: string
  badgeColor?: string
  badgeTextColor?: string
  badgeBorderColor?: string
  badgeClassName?: string
  badgeLocation?: BadgeLocation
} & Partial<WithContextMenuProps>

/**
 * Renders a `<text>` component with a `<rect>` box behind.
 */
const NodeLabel: React.FunctionComponent<NodeLabelProps> = ({
  children,
  className,
  paddingX = 0,
  paddingY = 0,
  cornerRadius = 4,
  x = 0,
  y = 0,
  position = LabelPosition.bottom,
  secondaryLabel,
  status,
  labelIconClass,
  labelIcon,
  truncateLength,
  dragRef,
  hover,
  dragging,
  edgeDragging,
  dropTarget,
  ...other
}) => {
  const [labelHover, labelHoverRef] = useHover()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Fixed in next pf topology
  const refs = useCombineRefs(dragRef, typeof truncateLength === 'number' ? labelHoverRef : undefined)

  const [textSize, textRef] = useSize([children, truncateLength, className, labelHover])
  const [secondaryTextSize, secondaryTextRef] = useSize([secondaryLabel, truncateLength, className, labelHover])

  const { width, height, backgroundHeight, startX, startY, iconSpace } = React.useMemo(() => {
    if (!textSize) {
      return {
        width: 0,
        height: 0,
        backgroundHeight: 0,
        startX: 0,
        startY: 0,
        badgeStartX: 0,
        badgeStartY: 0,
        actionStartX: 0,
        contextStartX: 0,
        iconSpace: 0,
        badgeSpace: 0,
      }
    }
    const height = textSize.height + paddingY * 2
    const iconSpace = labelIconClass || labelIcon ? (height + paddingY * 0.5) / 2 : 0
    const primaryWidth = iconSpace + paddingX + textSize.width + paddingX
    const secondaryWidth = secondaryLabel && secondaryTextSize ? secondaryTextSize.width + 2 * paddingX : 0
    const width = Math.max(primaryWidth, secondaryWidth)
    const startX = position === LabelPosition.right ? x + iconSpace : x - width / 2 + iconSpace / 2
    const startY = position === LabelPosition.right ? y - height / 2 : y
    const backgroundHeight =
      height + (secondaryLabel && secondaryTextSize ? secondaryTextSize.height + paddingY * 2 : 0)

    return {
      width,
      height,
      backgroundHeight,
      startX,
      startY,
      iconSpace,
    }
  }, [textSize, paddingX, paddingY, labelIconClass, labelIcon, secondaryLabel, secondaryTextSize, position, x, y])

  let filterId
  if (status === 'danger') {
    filterId = NODE_SHADOW_FILTER_ID_DANGER
  } else if (hover || dragging || edgeDragging || dropTarget) {
    filterId = NODE_SHADOW_FILTER_ID_HOVER
  }

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Fixed in next pf topology
    <g className={className} ref={refs} transform={`translate(${startX}, ${startY})`}>
      <NodeShadows />
      {textSize && (
        <rect
          className={css(styles.topologyNodeLabelBackground)}
          key={`rect-${filterId}`} // update key to force remount on filter update
          filter={filterId && createSvgIdUrl(filterId)}
          x={0}
          y={0}
          width={width}
          height={backgroundHeight}
          rx={cornerRadius}
          ry={cornerRadius}
        />
      )}
      {textSize && secondaryLabel && (
        <>
          <line
            className={css(styles.topologyNodeSeparator)}
            x1={0}
            y1={height}
            x2={width}
            y2={height}
            shapeRendering="crispEdges"
          />
          <text
            className="pf-m-secondary"
            /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
            /* @ts-ignore: Fixed in next pf topology */
            ref={secondaryTextRef}
            x={width / 2}
            y={height + paddingY + (secondaryTextSize?.height ?? 0) / 2}
            dy="0.35em"
            textAnchor="middle"
          >
            {truncateLength && truncateLength > 0 && !labelHover
              ? truncateMiddle(secondaryLabel, { length: truncateLength })
              : secondaryLabel}
          </text>
        </>
      )}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
      /* @ts-ignore: Fixed in next pf topology */}
      <text {...other} ref={textRef} x={iconSpace + paddingX} y={height / 2} dy="0.35em">
        {truncateLength && truncateLength > 0 && !labelHover
          ? truncateMiddle(children || '', { length: truncateLength })
          : children}
      </text>
    </g>
  )
}

export default NodeLabel
