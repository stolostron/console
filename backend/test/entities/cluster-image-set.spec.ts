import * as nock from 'nock'
import { request, setup } from '../setup'

setup()

describe(`graphql query clusterimagesetss`, function () {
    it(`should return the clusterimagesets`, async function () {
        nock(process.env.CLUSTER_API_URL)
            .get('/apis/hive.openshift.io/v1/clusterimagesets')
            .reply(200, { items: [{ metadata: { name: 'name' } }] })

        await expect(
            request.post(`graphql`, {
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
        ).resolves.toMatchObject({
            status: 200,
            data: { data: { clusterImageSets: [{ metadata: { name: 'name' } }] } },
        })
    })
})
