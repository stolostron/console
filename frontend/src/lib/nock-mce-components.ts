/* Copyright Contributors to the Open Cluster Management project */

import nock from 'nock'

/**
 * Mock the multiclusterengine/components backend endpoint for testing
 */
export function nockMultiClusterEngineComponents(
  components: { name: string; enabled: boolean }[] = [],
  statusCode = 200
) {
  return nock(process.env.JEST_DEFAULT_HOST as string)
    .persist()
    .get('/multiclusterengine/components')
    .reply(statusCode, components, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    })
}
