/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import * as _ from 'lodash'
import { List as VirtualList, CellMeasurerCache } from 'react-virtualized'
import { CSSTransition } from 'react-transition-group'
import { css } from '@patternfly/react-styles'
import { EventKind } from './constants'
import PropTypes from 'prop-types'

// Keep track of seen events so we only animate new ones.
const seen = new Set()
const timeout = { enter: 150 }

const measurementCache = new CellMeasurerCache({
  fixedWidth: true,
})

class SysEvent extends React.Component<SysEventProps> {
  static propTypes: any
  shouldComponentUpdate(nextProps: SysEventProps) {
    if (this.props.event.lastTimestamp !== nextProps.event.lastTimestamp) {
      // Timestamps can be modified because events can be combined.
      return true
    }
    if (_.isEqual(this.props.style, nextProps.style)) {
      return false
    }
    return true
  }

  componentWillUnmount() {
    // TODO (kans): this is not correct, but don't memory leak :-/
    seen.delete(this.props.event?.metadata?.uid)
  }

  render() {
    const { EventComponent, index, style, event, className, list } = this.props

    let shouldAnimate: boolean = false
    const key = event.metadata?.uid
    // Only animate events if they're at the start of the list (first 6) and we haven't seen them before.
    if (!seen.has(key) && index < 6) {
      seen.add(key)
      shouldAnimate = true
    }

    return (
      <div className={css('co-sysevent--transition', className)} style={style} role="row">
        <CSSTransition mountOnEnter={true} appear={shouldAnimate} in exit={false} timeout={timeout} classNames="slide">
          {(status) => (
            <div className={`slide-${status}`}>
              <EventComponent event={event} list={list} cache={measurementCache} index={index} />
            </div>
          )}
        </CSSTransition>
      </div>
    )
  }
}

SysEvent.propTypes = {
  EventComponent: PropTypes.elementType.isRequired,
  event: PropTypes.shape({
    lastTimestamp: PropTypes.string,
    metadata: PropTypes.shape({
      uid: PropTypes.string,
    }),
  }).isRequired,
  onLoad: PropTypes.func,
  onEntered: PropTypes.func,
  style: PropTypes.object,
  index: PropTypes.number.isRequired,
  className: PropTypes.string,
  list: PropTypes.object,
}

export const EventStreamList: React.FC<EventStreamListProps> = ({ events, className, EventComponent }) => {
  const [list] = React.useState<VirtualList | null>(null)
  const onResize = React.useCallback(() => measurementCache.clearAll(), [])
  React.useEffect(() => {
    onResize()
    list?.recomputeRowHeights()
  }, [list, events, onResize])

  return (
    events.length > 0 && (
      <>
        {events.map((event, index) => (
          <SysEvent
            className={className}
            event={event}
            list={list}
            EventComponent={EventComponent}
            key={event.metadata?.uid}
            index={index}
          />
        ))}
      </>
    )
  )
}

type EventStreamListProps = {
  events: EventKind[]
  EventComponent: React.ComponentType<EventComponentProps>
  className?: string
}

export type EventComponentProps = {
  event: EventKind
  list?: VirtualList | null
  cache: CellMeasurerCache
  index: number
}

type SysEventProps = {
  EventComponent: React.ComponentType<EventComponentProps>
  event: EventKind
  onLoad?: () => void
  onEntered?: () => void
  style?: React.CSSProperties
  index: number
  className?: string
  list?: VirtualList | null
}
