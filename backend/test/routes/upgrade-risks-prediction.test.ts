/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { parsePipedJsonBody } from '../../src/lib/body-parser'
import { request } from '../mock-request'

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
})
