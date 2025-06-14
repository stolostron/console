/* Copyright Contributors to the Open Cluster Management project */
import { FC, useEffect, useRef, useState } from 'react'

import { useTranslation } from 'react-i18next'

import * as _ from 'lodash'
import { fleetWatch, useFleetK8sAPIPath, useHubClusterName } from '../../api'
import { EventModel, sortEvents } from './utils'
import { EventKind, MAX_MESSAGES } from './constants'
import { EmptyState, PageSection, Spinner } from '@patternfly/react-core'

import { css } from '@patternfly/react-styles'
import TogglePlay from './TogglePlay'
import { EventStreamList } from './EventStreamList'
import EventComponent from './EventComponent'

const ResourceEventStream: FC<{ resource: K8sResourceCommon }> = ({ resource }) => {
  const [active, setActive] = useState(true)

  const hubCluster = useHubClusterName()

  const { t } = useTranslation('public')
  const [sortedEvents, setSortedEvents] = useState<EventKind[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const ws = useRef<WebSocket>()

  const [backendAPIPath, loaded] = useFleetK8sAPIPath(resource?.cluster)

  const fieldSelector = `involvedObject.uid=${resource?.metadata?.uid},involvedObject.name=${resource?.metadata?.name},involvedObject.kind=${resource?.kind}`
  const namespace = resource?.metadata?.namespace

  // Handle websocket setup and teardown when dependent props change
  useEffect(() => {
    if (!resource.cluster || resource.cluster === hubCluster || !loaded) return

    ws.current?.close()

    const watchURLOptions = {
      cluster: resource.cluster,
      ...(namespace ? { ns: namespace } : {}),
      ...(fieldSelector
        ? {
            fieldSelector,
          }
        : {}),
    }

    if (!ws.current) {
      ws.current = fleetWatch(EventModel, watchURLOptions, backendAPIPath as string)

      if (ws.current === undefined) return

      ws.current.onmessage = (message: any) => {
        if (!active) return

        const eventdataParsed = JSON.parse(message.data)

        if (!eventdataParsed) return

        const eventType = eventdataParsed.type
        const object = eventdataParsed.object as EventKind

        setSortedEvents((currentSortedEvents) => {
          const topEvents = currentSortedEvents.slice(0, MAX_MESSAGES)

          const uid = object?.metadata?.uid || ''

          switch (eventType) {
            case 'ADDED':
            case 'MODIFIED':
              const eventAlreadyExists = topEvents.find((e) => e?.metadata?.uid === uid)

              if (
                eventAlreadyExists &&
                eventAlreadyExists?.count !== undefined &&
                object?.count !== undefined &&
                eventAlreadyExists.count > object.count
              ) {
                // We already have a more recent version of this message stored, so skip this one
                return topEvents
              }

              return sortEvents([...topEvents, object])
            case 'DELETED':
              return topEvents.filter((e) => e?.metadata?.uid !== uid)
            default:
              // eslint-disable-next-line no-console
              console.error(`UNHANDLED EVENT: ${eventType}`)
              return topEvents
          }
        })
      }

      ws.current.onopen = () => {
        setActive(true)
        setError(false)
        setLoading(false)
      }

      ws.current.onclose = (evt: CloseEvent) => {
        setActive(false)
        if (evt?.wasClean === false) {
          setError(evt.reason || t('public~Connection did not close cleanly.'))
        }
      }

      ws.current.onerror = () => {
        setActive(false)
        setError(true)
      }
    }

    return () => {
      ws.current?.close()
    }
  }, [namespace, fieldSelector, active, t])

  const count = sortedEvents.length
  const noEvents = count === 0
  const noMatches = count > 0 && count === 0
  let sysEventStatus, statusBtnTxt

  if (noEvents || (noMatches && resource)) {
    sysEventStatus = <EmptyState title={t('public~No events')}></EmptyState>
  }
  if (noMatches && !resource) {
    sysEventStatus = (
      <EmptyState title={t('public~No matching events')}>
        {count >= MAX_MESSAGES
          ? t('public~{{count}}+ event exist, but none match the current filter', {
              count: MAX_MESSAGES,
            })
          : t('public~{{count}} event exist, but none match the current filter', {
              count,
            })}
      </EmptyState>
    )
  }

  if (error) {
    statusBtnTxt = (
      <span className="co-sysevent-stream__connection-error">
        {_.isString(error)
          ? t('public~Error connecting to event stream: { error }', {
              error,
            })
          : t('public~Error connecting to event stream')}
      </span>
    )
    sysEventStatus = (
      <EmptyState title={t('public~Error loading events')}>
        {t('public~An error occurred during event retrieval. Attempting to reconnect...')}
      </EmptyState>
    )
  } else if (loading) {
    statusBtnTxt = <span>{t('public~Loading events...')}</span>
    sysEventStatus = <Spinner />
  } else if (active) {
    statusBtnTxt = <span>{t('public~Streaming events...')}</span>
  } else {
    statusBtnTxt = <span>{t('public~Event stream is paused.')}</span>
  }

  const klass = css('co-sysevent-stream__timeline', {
    'co-sysevent-stream__timeline--empty': !count,
  })
  const messageCount =
    count < MAX_MESSAGES
      ? t('public~Showing {{count}} event', { count })
      : t('public~Showing most recent {{count}} event', { count })

  const toggleStream = () => {
    setActive((prev) => !prev)
  }

  if (!resource.cluster || resource.cluster === hubCluster) return <ResourceEventStream resource={resource} />

  return (
    <>
      <PageSection>
        <div className="co-sysevent-stream">
          <div className="co-sysevent-stream__status">
            <div className="co-sysevent-stream__timeline__btn-text">{statusBtnTxt}</div>
            <div className="co-sysevent-stream__totals pf-v6-u-text-color-subtle" data-test="event-totals">
              {messageCount}
            </div>
          </div>

          <div className={klass}>
            <TogglePlay active={active} onClick={toggleStream} className="co-sysevent-stream__timeline__btn" />
            <div className="co-sysevent-stream__timeline__end-message">{t('public~Older events are not stored.')}</div>
          </div>
          {count > 0 && <EventStreamList events={sortedEvents} EventComponent={EventComponent} />}
          {sysEventStatus}
        </div>
      </PageSection>
    </>
  )
}

export default ResourceEventStream
