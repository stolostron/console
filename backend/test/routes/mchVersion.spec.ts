/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

describe(`mchVersion Route`, function () {
    it(`should return the version of the MultiClusterHub`, async function () {
        nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
            status: 200,
        })
        nock(process.env.CLUSTER_API_URL)
            .get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs')
            .reply(200, {
                items: [
                    {
                        status: {
                            currentVersion: '2.5.1',
                        },
                    },
                ],
            })
        const res = await request('GET', '/mchVersion')
        expect(res.statusCode).toEqual(200)
        const { mchVersion } = await parseResponseJsonBody(res)
        expect(mchVersion).toEqual('2.5.1')
    })
})
