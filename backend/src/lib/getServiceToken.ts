import type { HeadersInit } from 'node-fetch'
import { constants } from 'node:http2'
const { HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_ACCEPT } = constants
import { fetchRetry } from '../lib/fetch-retry'

type AccessToken = {
  access_token: string
}

function base64DecodeValue(value: string): string {
  return value ? Buffer.from(value, 'base64').toString('ascii') : undefined
}

export async function getOcmServiceToken(client_id: string, client_secret: string): Promise<string> {
  const ssoPath = 'https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token'

  const id = base64DecodeValue(client_id)
  const secret = base64DecodeValue(client_secret)

  const formData = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: id,
    client_secret: secret,
  })

  const headers: HeadersInit = {
    [HTTP2_HEADER_CONTENT_TYPE]: 'application/x-www-form-urlencoded',
    [HTTP2_HEADER_ACCEPT]: 'application/json',
  }

  const ssoResponse = await fetchRetry(ssoPath, {
    method: 'POST',
    headers,
    body: formData.toString(),
  })

  if (!ssoResponse.ok) {
    const errorText = await ssoResponse.text()
    throw new Error(`Token exchange failed (${ssoResponse.status}): ${errorText}`)
  }

  const bodyRes = (await ssoResponse.json()) as AccessToken

  const accessTokenSSO = bodyRes.access_token

  return accessTokenSSO
}
