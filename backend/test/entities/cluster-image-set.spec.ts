import * as nock from 'nock'
import { request, setup } from '../setup'

setup()

describe(`graphql query clusterimagesetss`, function () {
    it(`should return the clusterimagesets`, async function () {
        nock(process.env.CLUSTER_API_URL)
            .get('/apis/hive.openshift.io/v1/clusterimagesets')
            .reply(200, { items: [{ metadata: { name: 'name' } }] })

        const result = await request.post(`cluster-management/graphql`, {
            query: /* GraphQL */ `
                query {
                    clusterImageSets {
                        metadata {
                            name
                        }
                    }
                }
            `,
        })

        expect(result.status).toEqual(200)
        expect(result.data).toMatchObject({
            data: { clusterImageSets: [{ metadata: { name: 'name' } }] },
        })
    })
})
