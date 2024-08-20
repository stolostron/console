/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@patternfly/react-styles'
import styles from '@patternfly/react-topology/dist/esm/css/topology-components'
import * as React from 'react'
import { useAnchor, EllipseAnchor } from '@patternfly/react-topology'

import { ShapeProps } from './future/shapeUtils'

type MultiEllipseProps = ShapeProps

const MultiEllipse: React.FunctionComponent<MultiEllipseProps> = ({
  className = css(styles.topologyNodeBackground),
  width,
  height,
  filter,
  dndDropRef,
}) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Unreachable code error
  useAnchor(EllipseAnchor)
  return (
    <g>
      <ellipse
        className={className}
        ref={dndDropRef}
        cx={width / 2 + 14}
        cy={height / 2}
        rx={Math.max(0, width / 2 - 1)}
        ry={Math.max(0, height / 2 - 1)}
        filter={filter}
      />
      <ellipse
        className={className}
        ref={dndDropRef}
        cx={width / 2 + 7}
        cy={height / 2}
        rx={Math.max(0, width / 2 - 1)}
        ry={Math.max(0, height / 2 - 1)}
        filter={filter}
      />
      <ellipse
        className={className}
        ref={dndDropRef}
        cx={width / 2}
        cy={height / 2}
        rx={Math.max(0, width / 2 - 1)}
        ry={Math.max(0, height / 2 - 1)}
        filter={filter}
      />
    </g>
  )
}

export default MultiEllipse
