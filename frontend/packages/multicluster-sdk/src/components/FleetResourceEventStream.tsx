/* Copyright Contributors to the Open Cluster Management project */
import { FC, useEffect, useRef, useState } from 'react'

// References translations directly from OpenShift console - not from plugins
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useTranslation } from 'react-i18next'
import { ResourceEventStream } from '@openshift-console/dynamic-plugin-sdk'
import { FleetK8sResourceCommon } from '../types'

import * as _ from 'lodash'
import { fleetWatch, useFleetK8sAPIPath, useHubClusterName } from '../api'
import { EventModel, sortEvents } from '../internal/FleetResourceEventStream/utils'
import { EventKind, MAX_MESSAGES } from '../internal/FleetResourceEventStream/constants'
import { EmptyState, PageSection, Spinner } from '@patternfly/react-core'

import { css } from '@patternfly/react-styles'
import TogglePlay from '../internal/FleetResourceEventStream/TogglePlay'
import { EventStreamList } from '../internal/FleetResourceEventStream/EventStreamList'
import EventComponent from '../internal/FleetResourceEventStream/EventComponent'

/**
 * A multicluster-aware ResourceEventStream component that displays real-time Kubernetes events
 * for resources on managed clusters. Provides equivalent functionality to the OpenShift console's
 * ResourceEventStream for resources on managed clusters.
 *
 * For managed cluster resources, this component establishes a websocket connection to stream
 * events from the specified cluster. For hub cluster resources or when no cluster is specified,
 * it falls back to the standard OpenShift console ResourceEventStream component.
 *
 * @see {@link https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#resourceeventstream} OpenShift Console Dynamic Plugin SDK ResourceEventStream
 *
 * @component
 *
 * @param {Object} props - Component properties
 * @param {FleetK8sResourceCommon} props.resource - The Kubernetes resource to show events for.
 *   Must include standard K8s metadata (name, namespace, uid, kind) and an optional cluster property.
 *
 * @example
 * // Display events for a resource on a managed cluster
 * <FleetResourceEventStream
 *   resource={{
 *     metadata: { name: 'my-pod', namespace: 'default', uid: '123' },
 *     kind: 'Pod',
 *     cluster: 'managed-cluster-1'
 *   }}
 * />
 *
 * @example
 * // Display events for a hub cluster resource (falls back to OpenShift console component)
 * <FleetResourceEventStream
 *   resource={{
 *     metadata: { name: 'my-deployment', namespace: 'openshift-gitops', uid: '456' },
 *     kind: 'Deployment'
 *     // No cluster property - uses hub cluster
 *   }}
 * />
 *
 * @example
 * // Display events for a cluster-scoped resource on a managed cluster
 * <FleetResourceEventStream
 *   resource={{
 *     metadata: { name: 'my-node', uid: '789' },
 *     kind: 'Node',
 *     cluster: 'edge-cluster-2'
 *   }}
 * />
 *
 * @returns {JSX.Element} A rendered event stream component showing real-time Kubernetes events
 *
 * @remarks
 * **Behavior:**
 * - When `resource.cluster` is set and differs from hub cluster: Uses fleet websocket connection
 * - When `resource.cluster` is undefined or equals hub cluster: Falls back to OpenShift console ResourceEventStream
 * - Automatically handles connection lifecycle (open, close, error, reconnect)
 * - Supports both namespaced and cluster-scoped resources
 * - Displays up to 50 most recent events with real-time streaming
 * - Provides play/pause controls for event streaming
 *
 * **Event Filtering:**
 * Events are filtered by `involvedObject.uid`, `involvedObject.name`, and `involvedObject.kind`
 * to show only events related to the specified resource.
 *
 * **Error Handling:**
 * - Shows loading spinner during initial connection
 * - Displays error states for connection failures
 * - Shows empty state when no events exist
 * - Automatically attempts reconnection on websocket errors
 *
 * @see {@link FleetK8sResourceCommon} for resource type definition
 * @see {@link https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk} OpenShift Console Dynamic Plugin SDK
 */

export const FleetResourceEventStream: FC<{ resource: FleetK8sResourceCommon }> = ({ resource }) => {
  const [active, setActive] = useState(true)
  const [hubCluster] = useHubClusterName()
  const { t } = useTranslation('public')
  const [sortedEvents, setSortedEvents] = useState<EventKind[]>([])
  const [error, setError] = useState<boolean | string>(false)
  const [loading, setLoading] = useState(true)
  const ws = useRef<WebSocket>()
  const [backendAPIPath, loaded] = useFleetK8sAPIPath(resource?.cluster)

  const fieldSelector = `involvedObject.uid=${resource?.metadata?.uid},involvedObject.name=${resource?.metadata?.name},involvedObject.kind=${resource?.kind}`
  const namespace = resource?.metadata?.namespace

  // handle websocket setup and teardown when dependent props change
  useEffect(() => {
    if (!resource.cluster || resource.cluster === hubCluster || !loaded) return

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
      // create new WebSocket connection
      ws.current = fleetWatch(EventModel, watchURLOptions, backendAPIPath as string)

      if (ws.current === undefined) return

      ws.current.onmessage = (message: any) => {
        if (!active) return

        try {
          const eventdataParsed = JSON.parse(message.data)

          if (!eventdataParsed) return

          const eventType = eventdataParsed.type
          const object = eventdataParsed.object as EventKind

          setSortedEvents((currentSortedEvents) => {
            const topEvents = currentSortedEvents.slice(0, MAX_MESSAGES)

            const uid = object?.metadata?.uid || ''

            const eventAlreadyExists = topEvents.find((e) => e?.metadata?.uid === uid)
            switch (eventType) {
              case 'ADDED':
              case 'MODIFIED':
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
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onopen = () => {
        setActive(true)
        setError(false)
        setLoading(false)
      }

      ws.current.onclose = (evt: CloseEvent) => {
        ws.current = undefined
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
  }, [namespace, fieldSelector, active, t, resource.cluster, hubCluster, loaded, backendAPIPath])

  // return early after all hooks are called, otherwise the component will render twice
  if (!resource.cluster || resource.cluster === hubCluster) return <ResourceEventStream resource={resource} />

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
          ? t('public~Error connecting to event stream: {{ error }}', {
              error,
            })
          : t('public~Error connecting to event stream')}
      </span>
    )
    sysEventStatus = (
      <EmptyState title={t('public~Error loading events')} id="empty-state">
        {t('public~An error occurred during event retrieval. Attempting to reconnect...')}
      </EmptyState>
    )
  } else if (loading) {
    statusBtnTxt = <span>{t('public~Loading events...')}</span>
    sysEventStatus = <Spinner id="spinner" />
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
