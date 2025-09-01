/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

describe('hypershift-status Route', function () {
  const mockAuth = () => nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, { status: 200 })

  const mockMCE = (hypershiftEnabled = true, localHostingEnabled = true) =>
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/multicluster.openshift.io/v1/multiclusterengines')
      .reply(200, {
        items: [
          {
            spec: {
              overrides: {
                components: [
                  { name: 'hypershift', enabled: hypershiftEnabled },
                  { name: 'hypershift-local-hosting', enabled: localHostingEnabled },
                ],
              },
            },
          },
        ],
      })

  const mockAddons = (addonStatus = 'True') =>
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/addon.open-cluster-management.io/v1alpha1/namespaces/local-cluster/managedclusteraddons')
      .reply(200, {
        items: [
          {
            metadata: { name: 'hypershift-addon' },
            status: { conditions: [{ reason: 'ManagedClusterAddOnLeaseUpdated', status: addonStatus }] },
          },
        ],
      })

  it('should return hypershift enabled when all conditions are met', async function () {
    mockAuth()
    mockMCE(true, true)
    mockAddons('True')

    const res = await request('GET', '/hypershift-status?hubName=local-cluster')
    expect(res.statusCode).toEqual(200)
    const { body } = await parseResponseJsonBody(res)
    expect(body).toEqual({ isHypershiftEnabled: true })
  })

  it('should return hypershift disabled when components are disabled', async function () {
    mockAuth()
    mockMCE(false, true)
    mockAddons('True')

    const res = await request('GET', '/hypershift-status?hubName=local-cluster')
    expect(res.statusCode).toEqual(200)
    const { body } = await parseResponseJsonBody(res)
    expect(body).toEqual({ isHypershiftEnabled: false })
  })

  it('should return hypershift disabled when addon is unhealthy', async function () {
    mockAuth()
    mockMCE(true, true)
    mockAddons('False')

    const res = await request('GET', '/hypershift-status?hubName=local-cluster')
    expect(res.statusCode).toEqual(200)
    const { body } = await parseResponseJsonBody(res)
    expect(body).toEqual({ isHypershiftEnabled: false })
  })

  it('should handle API errors gracefully', async function () {
    mockAuth()
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/multicluster.openshift.io/v1/multiclusterengines')
      .replyWithError('API server error')

    const res = await request('GET', '/hypershift-status?hubName=local-cluster')
    expect(res.statusCode).toEqual(500)
  })
})
