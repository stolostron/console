/* Copyright Contributors to the Open Cluster Management project */

import nock from 'nock'

/**
 * Mock the hypershift-status backend endpoint for testing
 */
export function nockHypershiftStatus(isEnabled: boolean, statusCode = 200) {
  return nock(process.env.JEST_DEFAULT_HOST as string)
    .persist()
    .get('/hypershift-status')
    .query(true) // Accept any query parameters
    .reply(
      statusCode,
      {
        statusCode: 200,
        body: { isHypershiftEnabled: isEnabled },
      },
      {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
      }
    )
}
