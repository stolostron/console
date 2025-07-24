/* Copyright Contributors to the Open Cluster Management project */
import { K8sVerb, ResourceLink, Timestamp, useAccessReview } from '@openshift-console/dynamic-plugin-sdk'
import { css } from '@patternfly/react-styles'
// References translations directly from OpenShift console - not from plugins
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { Trans, useTranslation } from 'react-i18next'
import { getFirstTime, getLastTime, NodeModel, referenceFor, resourcePathFromModel, typeFilter } from './utils'
import { FC, useEffect } from 'react'
import { Link } from 'react-router-dom-v5-compat'

import { EventComponentProps } from './EventStreamList'

const Inner: FC<EventComponentProps> = ({ event, cache, list, index }) => {
  const { t } = useTranslation()

  const canGetNodes = useAccessReview({
    group: NodeModel.apiGroup,
    resource: NodeModel.plural,
    verb: 'list' as K8sVerb,
  })

  useEffect(() => {
    // Actions contents will render after the initial row height calculation,
    // so recompute the row height.
    cache.clear(index, 0)
    list?.recomputeRowHeights(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { involvedObject: obj, source, message, reason, series, reportingComponent } = event

  const tooltipMsg = `${reason} (${obj.kind})`
  const isWarning = typeFilter('warning', event)
  const firstTime = getFirstTime(event)
  const lastTime = getLastTime(event)
  const count = series ? series.count || 0 : event.count || 0

  // Events in v1beta1 apiVersion store the information about the reporting component
  // in the 'source.component' field. Events in v1 apiVersion are storing the information
  // in the `reportingComponent` field.
  // Unfortunatelly we cannot determine which field to use based on the apiVersion since
  // v1beta1 is internally converted to v1.
  const component = source.component ? source.component : reportingComponent

  return (
    <div
      className={css('co-sysevent', {
        'co-sysevent--warning': isWarning,
      })}
      data-test={isWarning ? 'event-warning' : 'event'}
    >
      <div className="co-sysevent__icon-box">
        <i className="co-sysevent-icon" title={tooltipMsg} />
        <div className="co-sysevent__icon-line" />
      </div>
      <div className="co-sysevent__box" role="gridcell">
        <div className="co-sysevent__header">
          <div className="co-sysevent__subheader">
            <ResourceLink
              className="co-sysevent__resourcelink"
              kind={referenceFor(obj)}
              namespace={obj.namespace}
              name={obj.name}
            />
            {obj.namespace && (
              <ResourceLink className="co-sysevent__resourcelink hidden-xs" kind="Namespace" name={obj.namespace} />
            )}
            {lastTime && <Timestamp className="co-sysevent__timestamp" timestamp={lastTime} />}
          </div>
          <div className="co-sysevent__details">
            <small className="co-sysevent__source">
              {component !== 'kubelet' &&
                t('public~Generated from {{ sourceComponent }}', {
                  sourceComponent: component,
                })}
              {component === 'kubelet' && canGetNodes && (
                <Trans ns="public">
                  Generated from {{ sourceComponent: component }} on{' '}
                  <Link to={resourcePathFromModel(NodeModel, source.host)}>{{ sourceHost: source.host }}</Link>
                </Trans>
              )}
              {component === 'kubelet' &&
                !canGetNodes &&
                t('public~Generated from {{ sourceComponent }} on {{ sourceHost }}', {
                  sourceComponent: component,
                  sourceHost: source.host,
                })}
            </small>
            <div className="co-sysevent__count-and-actions">
              {count > 1 && firstTime && (
                <Trans ns="public">
                  <small className="co-sysevent__count pf-v6-u-text-color-subtle">
                    {{ eventCount: count }} times in the last{' '}
                    <Timestamp timestamp={firstTime} simple={true} omitSuffix={true} />
                  </small>
                </Trans>
              )}
              {count > 1 && !firstTime && (
                <Trans ns="public">
                  <small className="co-sysevent__count pf-v6-u-text-color-subtle">{{ eventCount: count }} times</small>
                </Trans>
              )}
            </div>
          </div>
        </div>
        <div className="co-sysevent__message">{message}</div>
      </div>
    </div>
  )
}

export default Inner
