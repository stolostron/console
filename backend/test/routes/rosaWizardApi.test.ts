/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parsePipedJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

const SSO_HOST = 'https://sso.redhat.com'
const SSO_PATH = '/auth/realms/redhat-external/protocol/openid-connect/token'
const API_HOST = 'https://api.openshift.com'

const mockPayload = {
  service_account_id: Buffer.from('test-client-id').toString('base64'),
  service_account_secret: Buffer.from('test-client-secret').toString('base64'),
}

const mockOrg = {
  organization: {
    created_at: '2024-01-01T00:00:00Z',
    ebs_account_id: 'ebs-123',
    external_id: 'ext-123',
    id: 'org-abc-123',
    kind: 'Organization',
    name: 'Test Org',
  },
  service_account: true,
  username: 'test-user',
}

function nockAuth() {
  return nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)
}

function nockSsoToken() {
  return nock(SSO_HOST).post(SSO_PATH).reply(200, { access_token: 'mock-ocm-token' })
}

function nockCurrentAccount() {
  return nock(API_HOST).get('/api/accounts_mgmt/v1/current_account').reply(200, mockOrg)
}

describe('rosaWizardApi routes', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('POST /aws-account-ids', () => {
    test('should return organization labels', async () => {
      const labelsResponse = {
        items: [
          {
            id: '1',
            key: 'sts_ocm_role',
            value: 'arn:aws:iam::123456789012:role/OCM-Role',
          },
        ],
      }

      nockAuth()
      nockSsoToken()
      nockCurrentAccount()
      nock(API_HOST).get('/api/accounts_mgmt/v1/organizations/org-abc-123/labels').reply(200, labelsResponse)

      const res = await request('POST', '/aws-account-ids', mockPayload)
      expect(res.statusCode).toEqual(200)

      const body = await parsePipedJsonBody(res)
      expect(body).toEqual(labelsResponse)
    })

    test('should return 401 when not authenticated', async () => {
      nock(process.env.CLUSTER_API_URL).get('/apis').reply(401)

      const res = await request('POST', '/aws-account-ids', mockPayload)
      expect(res.statusCode).toEqual(401)
    })
  })

  describe('POST /aws-billing-accounts', () => {
    test('should return organization quota cost', async () => {
      const quotaResponse = {
        items: [
          {
            quota_id: 'cluster|byoc|moa|marketplace',
            cloud_accounts: [{ cloud_account_id: '111111111111', cloud_provider_id: 'aws' }],
          },
        ],
      }

      nockAuth()
      nockSsoToken()
      nockCurrentAccount()
      nock(API_HOST)
        .get(
          '/api/accounts_mgmt/v1/organizations/org-abc-123/quota_cost?fetchRelatedResources=true&fetchCloudAccounts=true'
        )
        .reply(200, quotaResponse)

      const res = await request('POST', '/aws-billing-accounts', mockPayload)
      expect(res.statusCode).toEqual(200)

      const body = await parsePipedJsonBody(res)
      expect(body).toEqual(quotaResponse)
    })

    test('should return 401 when not authenticated', async () => {
      nock(process.env.CLUSTER_API_URL).get('/apis').reply(401)

      const res = await request('POST', '/aws-billing-accounts', mockPayload)
      expect(res.statusCode).toEqual(401)
    })
  })
})
