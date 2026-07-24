/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@patternfly/react-styles'
import styles from '@patternfly/react-topology/dist/esm/css/topology-components'
import * as React from 'react'
import { useAnchor, ShapeProps, EllipseAnchor } from '@patternfly/react-topology'
import CustomEllipseAnchor from './CustomEllipseAnchor'

const PULSE_DURATION = '2.5s'
const PULSE_KEY_TIMES = '0;0.3;1'
const PULSE_KEY_SPLINES = '0.0 0.0 0.2 1; 0.0 0.0 0.2 1'

type CustomEllipseProps = ShapeProps & {
  isMulti?: boolean
  shouldPulse?: boolean
}

const CustomEllipse: React.FunctionComponent<CustomEllipseProps> = ({
  className = css(styles.topologyNodeBackground),
  width,
  height,
  filter,
  dndDropRef,
  isMulti = false,
  shouldPulse = false,
}) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Unreachable code error
  useAnchor(shouldPulse || !isMulti ? EllipseAnchor : CustomEllipseAnchor)

  const rx = Math.max(0, width / 2 - 1)
  const ry = Math.max(0, height / 2 - 1)
  const cx = width / 2
  const cy = height / 2

  if (shouldPulse) {
    const pulseStartRadius = rx
    const pulseExpand = Math.round(Math.max(8, Math.round(pulseStartRadius * 0.5)) * 0.75)
    const pulseMidRadius = pulseStartRadius + Math.round(pulseExpand * 0.85)
    const pulseMaxRadius = pulseStartRadius + pulseExpand
    return (
      <g>
        <circle cx={cx} cy={cy} r={pulseStartRadius} fill="red" opacity={0.8}>
          <animate
            attributeName="r"
            values={`${pulseStartRadius};${pulseMidRadius};${pulseMaxRadius}`}
            dur={PULSE_DURATION}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes={PULSE_KEY_TIMES}
            keySplines={PULSE_KEY_SPLINES}
          />
          <animate
            attributeName="opacity"
            values="0.8;0.15;0"
            dur={PULSE_DURATION}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes={PULSE_KEY_TIMES}
            keySplines={PULSE_KEY_SPLINES}
          />
        </circle>
        <ellipse className={className} ref={dndDropRef} cx={cx} cy={cy} rx={rx} ry={ry} filter={filter} />
      </g>
    )
  }

  if (!isMulti) {
    return <ellipse className={className} ref={dndDropRef} cx={cx} cy={cy} rx={rx} ry={ry} filter={filter} />
  }

  return (
    <g>
      <ellipse className={className} ref={dndDropRef} cx={width / 2 + 14} cy={cy} rx={rx} ry={ry} filter={filter} />
      <ellipse className={className} ref={dndDropRef} cx={width / 2 + 7} cy={cy} rx={rx} ry={ry} filter={filter} />
      <ellipse className={className} ref={dndDropRef} cx={cx} cy={cy} rx={rx} ry={ry} filter={filter} />
    </g>
  )
}

export default CustomEllipse
