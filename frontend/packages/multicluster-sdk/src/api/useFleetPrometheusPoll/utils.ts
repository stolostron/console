/* Copyright Contributors to the Open Cluster Management project */
import { PrometheusEndpoint } from '@openshift-console/dynamic-plugin-sdk'
import * as _ from 'lodash'
import {
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
  PROMETHEUS_BASE_PATH,
  PROMETHEUS_TENANCY_BASE_PATH,
} from './constants'

export type PrometheusURLProps = {
  endpoint: PrometheusEndpoint
  endTime?: number
  namespace?: string
  query?: string
  samples?: number
  timeout?: string
  timespan?: number
  cluster?: string
}

// Range vector queries require end, start, and step search params
const getRangeVectorSearchParams = (
  endTime: number = Date.now(),
  samples: number = DEFAULT_PROMETHEUS_SAMPLES,
  timespan: number = DEFAULT_PROMETHEUS_TIMESPAN
): URLSearchParams => {
  const params = new URLSearchParams()
  params.append('start', `${(endTime - timespan) / 1000}`)
  params.append('end', `${endTime / 1000}`)
  params.append('step', `${timespan / samples / 1000}`)
  return params
}

const getSearchParams = ({ endpoint, endTime, timespan, samples, ...params }: PrometheusURLProps): URLSearchParams => {
  const searchParams =
    endpoint === PrometheusEndpoint.QUERY_RANGE
      ? getRangeVectorSearchParams(endTime, samples, timespan)
      : new URLSearchParams()
  _.each(params, (value, key) => value && searchParams.append(key, value.toString()))
  return searchParams
}

export const getFleetPrometheusURL = (
  props: PrometheusURLProps,
  basePath: string = props.namespace ? PROMETHEUS_TENANCY_BASE_PATH : PROMETHEUS_BASE_PATH,
  cluster?: string
): string => {
  if (props.endpoint !== PrometheusEndpoint.RULES && !props.query) {
    return ''
  }

  const fleetEndpoint = cluster ? props.endpoint.replace('api/v1/', '') : props.endpoint
  const params = getSearchParams(props)
  return `${basePath}/${fleetEndpoint}?${params.toString()}`
}
