/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { getSize, IconSize, SVGIconProps } from '@patternfly/react-icons/dist/js/createIcon'
import { ReactNode } from 'react'

export function createAcmIcon(iconDefinition: {
  name?: string
  width: number
  height: number
  xOffset?: number
  yOffset?: number
  svgPaths: ReactNode
  className?: string
  color?: string
}) {
  return (props: SVGIconProps) => {
    const { size, color, title, noVerticalAlign, ...otherProps } = props
    const hasTitle = Boolean(title)
    const heightWidth = getSize(size ?? IconSize.sm)
    const baseAlign = -0.125 * Number.parseFloat(heightWidth)
    const style = noVerticalAlign ? undefined : { verticalAlign: `${baseAlign}em` }
    const viewBox = [
      iconDefinition.xOffset ?? 0,
      iconDefinition.yOffset ?? 0,
      iconDefinition.width,
      iconDefinition.height,
    ].join(' ')
    return (
      <svg
        style={style}
        className={iconDefinition.className}
        fill={iconDefinition.color ?? color ?? 'currentColor'}
        height={heightWidth}
        width={heightWidth}
        viewBox={viewBox}
        aria-labelledby={hasTitle ? props.id : undefined}
        aria-hidden={hasTitle ? undefined : true}
        role="presentation"
        {...(otherProps as Omit<React.SVGProps<SVGElement>, 'ref'>)} // Lie.
      >
        {hasTitle && <title id={props.id}>{title}</title>}
        {iconDefinition.svgPaths}
      </svg>
    )
  }
}
