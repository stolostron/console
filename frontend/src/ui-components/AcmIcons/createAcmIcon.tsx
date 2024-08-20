/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'

export interface IconDefinition {
  name?: string
  width: number
  height: number
  svgPaths: JSX.Element
  xOffset?: number
  yOffset?: number
  className?: string
  color?: string
}

export interface SVGIconProps extends Omit<React.HTMLProps<SVGElement>, 'ref'> {
  title?: string
  className?: string
}

let currentId = 0

/**
 * Factory to create Icon class components for consumers
 */
export function createAcmIcon({
  name,
  xOffset = 0,
  yOffset = 0,
  width,
  height,
  svgPaths,
  className: baseClassName,
  color,
}: IconDefinition): React.ComponentClass<SVGIconProps> {
  return class SVGIcon extends React.Component<SVGIconProps> {
    static displayName = name

    id = `acm-ui-icon-title-${currentId++}`

    render() {
      const { title, className, ...props } = this.props
      const classes = `pf-v5-svg${baseClassName ? ` ${baseClassName}` : ''}${className ? ` ${className}` : ''}`

      const hasTitle = Boolean(title)
      const viewBox = [xOffset, yOffset, width, height].join(' ')

      return (
        <svg
          className={classes}
          viewBox={viewBox}
          fill={color ?? 'currentColor'}
          aria-labelledby={hasTitle ? this.id : undefined}
          aria-hidden={hasTitle ? undefined : true}
          role="img"
          width="1em"
          height="1em"
          {...(props as Omit<React.SVGProps<SVGElement>, 'ref'>)} // Lie.
        >
          {hasTitle && <title id={this.id}>{title}</title>}
          {svgPaths}
        </svg>
      )
    }
  }
}
