/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { parsePipedJsonBody } from '../../src/lib/body-parser'
import { request } from '../mock-request'
import { getProxyAgent } from '../../src/lib/agent'

describe('Upgrade risks prediction Route', function () {
  it('should return the upgrade risks', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)
    nock(process.env.CLUSTER_API_URL)
      .get('/api/v1/namespaces/openshift-config/secrets')
      .reply(200, {
        statusCode: 200,
        body: {
          apiVersion: 'v1',
          kind: 'SecretList',
          items: [
            {
              kind: 'Secret',
              apiVersion: 'v1',
              metadata: {
                name: 'pull-secret',
                namespace: 'openshift-config',
              },
              data: {
                '.dockerconfigjson': 'test',
              },
              type: 'kubernetes.io/dockerconfigjson',
            },
          ],
        },
      })
    nock('https://console.redhat.com')
      .post('/api/insights-results-aggregator/v2/upgrade-risks-prediction')
      .reply(200, {
        statusCode: 200,
        body: {
          predictions: [
            {
              cluster_id: 'id-1234-abcd',
              prediction_status: 'ok',
              upgrade_recommended: true,
              upgrade_risks_predictors: {
                alerts: [],
                operator_conditions: [],
              },
              last_checked_at: '2024-03-25T20:33:03.156633+00:00',
            },
          ],
          status: 'ok',
        },
      })
    const res = await request('POST', '/upgrade-risks-prediction', { clusterIds: ['id-1234-abcd'] })
    expect(res.statusCode).toEqual(200)
    expect(JSON.stringify(await parsePipedJsonBody(res))).toEqual(
      JSON.stringify([
        {
          statusCode: 200,
          body: {
            statusCode: 200,
            body: {
              predictions: [
                {
                  cluster_id: 'id-1234-abcd',
                  prediction_status: 'ok',
                  upgrade_recommended: true,
                  upgrade_risks_predictors: { alerts: [], operator_conditions: [] },
                  last_checked_at: '2024-03-25T20:33:03.156633+00:00',
                },
              ],
              status: 'ok',
            },
          },
        },
      ])
    )
  })

  it('should use proxy agent when HTTPS_PROXY is set', function () {
    // Set HTTPS_PROXY environment variable to trigger proxy agent creation
    const originalHttpsProxy = process.env.HTTPS_PROXY
    process.env.HTTPS_PROXY = 'https://proxy.example.com:8080'

    try {
      // Call getProxyAgent to trigger the code path that creates HttpsProxyAgent
      const proxyAgent = getProxyAgent()
      expect(proxyAgent).toBeDefined()
      expect(proxyAgent).not.toBeNull()
    } finally {
      // Restore original environment variable
      if (originalHttpsProxy) {
        process.env.HTTPS_PROXY = originalHttpsProxy
      } else {
        delete process.env.HTTPS_PROXY
      }
    }
  })
})
