/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

describe(`apiPath Route`, function () {
    it(`should serve resource names`, async function () {
        nock(process.env.CLUSTER_API_URL).get('/.well-known/oauth-authorization-server').reply(200, {
            token_endpoint: 'https://oauth-openshift.apps.cs-aws-411-d62fs.dev02.red-chesterfield.com/oauth/token',
        })
        nock(process.env.CLUSTER_API_URL).get('/').reply(200, {
            status: 200,
            paths,
        })

        nock(process.env.CLUSTER_API_URL).get(paths[0]).reply(200, response)

        nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
            status: 200,
            paths: response,
        })

        const res = await request('GET', '/apiPaths')
        expect(res.statusCode).toEqual(200)
        expect(JSON.stringify(await parseResponseJsonBody(res))).toEqual(JSON.stringify(buildPathObjectResult))
    })
})

const response = {
    kind: 'APIResourceList',
    apiVersion: 'v1',
    groupVersion: 'action.open-cluster-management.io/v1beta1',
    resources: [
        {
            name: 'managedclusteractions',
            singularName: 'managedclusteraction',
            namespaced: true,
            kind: 'ManagedClusterAction',
            verbs: ['delete', 'deletecollection', 'get', 'list', 'patch', 'create', 'update', 'watch'],
            storageVersionHash: 'hCDRbHn7Sxc=',
        },
    ],
}
const paths = ['/apis/action.open-cluster-management.io/v1beta1']

const buildPathObjectResult = {
    'action.open-cluster-management.io/v1beta1': { ManagedClusterAction: { pluralName: 'managedclusteractions' } },
}
