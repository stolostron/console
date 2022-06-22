/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

describe(`configure Route`, function () {
    it(`should return the oauth token endpoint of the MultiClusterHub`, async function () {
        nock(process.env.CLUSTER_API_URL).get('/.well-known').reply(200, {
            status: 200,
        })
        nock(process.env.CLUSTER_API_URL).get('/.well-known/oauth-authorization-server').reply(200, {
            token_endpoint: 'https://oauth-openshift.apps.cs-aws-411-d62fs.dev02.red-chesterfield.com/oauth/token',
        })
        const res = await request('GET', '/configure')
        expect(res.statusCode).toEqual(200)
        const { token_endpoint } = await parseResponseJsonBody(res)
        expect(token_endpoint).toEqual(
            'https://oauth-openshift.apps.cs-aws-411-d62fs.dev02.red-chesterfield.com/oauth/token'
        )
    })
})
