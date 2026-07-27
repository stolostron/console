/* Copyright Contributors to the Open Cluster Management project */

import nock from 'nock'
import { getOcmServiceToken } from '../../src/lib/getServiceToken'

const SSO_HOST = 'https://sso.redhat.com'
const SSO_PATH = '/auth/realms/redhat-external/protocol/openid-connect/token'

describe('getOcmServiceToken', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  test('should exchange client credentials for an access token', async () => {
    const clientId = Buffer.from('my-client-id').toString('base64')
    const clientSecret = Buffer.from('my-client-secret').toString('base64')

    nock(SSO_HOST)
      .post(SSO_PATH, (body: string) => {
        const params = new URLSearchParams(body)
        return (
          params.get('grant_type') === 'client_credentials' &&
          params.get('client_id') === 'my-client-id' &&
          params.get('client_secret') === 'my-client-secret'
        )
      })
      .reply(200, { access_token: 'mock-access-token' })

    const token = await getOcmServiceToken(clientId, clientSecret)
    expect(token).toBe('mock-access-token')
  })

  test('should base64-decode the client_id and client_secret', async () => {
    const rawId = 'decoded-id'
    const rawSecret = 'decoded-secret'
    const clientId = Buffer.from(rawId).toString('base64')
    const clientSecret = Buffer.from(rawSecret).toString('base64')

    nock(SSO_HOST)
      .post(SSO_PATH, (body: string) => {
        const params = new URLSearchParams(body)
        return params.get('client_id') === rawId && params.get('client_secret') === rawSecret
      })
      .reply(200, { access_token: 'token-123' })

    const token = await getOcmServiceToken(clientId, clientSecret)
    expect(token).toBe('token-123')
  })

  test('should throw an error when the SSO request fails', async () => {
    const clientId = Buffer.from('id').toString('base64')
    const clientSecret = Buffer.from('secret').toString('base64')

    nock(SSO_HOST).post(SSO_PATH).reply(401, 'Invalid credentials')

    await expect(getOcmServiceToken(clientId, clientSecret)).rejects.toThrow(
      'Token exchange failed (401): Invalid credentials'
    )
  })

  test('should throw an error on server error response', async () => {
    const clientId = Buffer.from('id').toString('base64')
    const clientSecret = Buffer.from('secret').toString('base64')

    nock(SSO_HOST).post(SSO_PATH).reply(500, 'Internal Server Error')

    await expect(getOcmServiceToken(clientId, clientSecret)).rejects.toThrow('Token exchange failed (500)')
  })
})
