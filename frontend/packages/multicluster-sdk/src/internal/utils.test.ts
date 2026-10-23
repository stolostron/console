/* Copyright Contributors to the Open Cluster Management project */
import { PrometheusEndpoint } from '@openshift-console/dynamic-plugin-sdk'
import { getFleetPrometheusURL } from './utils'

describe('getFleetPrometheusURL', () => {
  it('returns empty string when query is missing and endpoint is not RULES', () => {
    expect(getFleetPrometheusURL({ endpoint: PrometheusEndpoint.QUERY })).toBe('')
  })

  it('builds a RULES URL without a query', () => {
    const url = getFleetPrometheusURL({ endpoint: PrometheusEndpoint.RULES }, '/observability')
    expect(url).toBe('/observability/rules?')
  })

  it('uses an explicit basePath when provided', () => {
    const url = getFleetPrometheusURL(
      {
        endpoint: PrometheusEndpoint.QUERY,
        query: 'up',
        cluster: 'local-cluster',
      },
      '/multicloud/observability'
    )

    expect(url).toBe('/multicloud/observability/query?query=up&cluster=local-cluster')
  })

  it('defaults to empty basePath when SERVER_FLAGS prometheus paths are undefined', () => {
    // setupTests only sets SERVER_FLAGS.basePath, so PROMETHEUS_* paths stay undefined.
    const url = getFleetPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY,
      query: 'up',
    })

    expect(url).toBe('/query?query=up')
  })

  it('defaults to empty basePath for namespaced queries when tenancy path is undefined', () => {
    const url = getFleetPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY,
      query: 'up',
      namespace: 'default',
    })

    expect(url).toBe('/query?query=up&namespace=default')
  })

  it('includes range vector params for QUERY_RANGE', () => {
    const endTime = 1_700_000_000_000
    const url = getFleetPrometheusURL(
      {
        endpoint: PrometheusEndpoint.QUERY_RANGE,
        query: 'up',
        endTime,
        timespan: 60_000,
        samples: 2,
      },
      '/prom'
    )

    expect(url).toContain('/prom/query_range?')
    expect(url).toContain('start=1699999940')
    expect(url).toContain('end=1700000000')
    expect(url).toContain('step=30')
    expect(url).toContain('query=up')
  })
})
