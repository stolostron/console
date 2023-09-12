/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { request } from '../mock-request'

describe('metrics route', function () {
  it('Should response with successful metrics GET', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .post('/apis/authentication.k8s.io/v1/tokenreviews')
      .reply(200, {
        status: {
          user: {
            username: 'kube:admin',
          },
        },
      })
    nock(process.env.CLUSTER_API_URL)
      .get('/metrics')
      .reply(200, `# HELP acm_console_page_count Capture ACM page visit counts\n# TYPE acm_console_page_count counter`)

    const res = await request('GET', '/metrics')
    expect(res.statusCode).toEqual(200)
  })

  it('Should response with successful metrics GET request with page param', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .post('/apis/authentication.k8s.io/v1/tokenreviews')
      .reply(200, {
        status: {
          user: {
            username: 'kube:admin',
          },
        },
      })
    nock(process.env.CLUSTER_API_URL).post('/metrics?overview-classic').reply(200)

    const res = await request('POST', '/metrics?overview-classic')
    // POST increases the metric count - no response to validate
    expect(res.statusCode).toEqual(200)
  })
})
