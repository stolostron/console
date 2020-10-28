import { request, setup } from '../setup'
import * as nock from 'nock'
import { V1Namespace } from '@kubernetes/client-node'

setup()

describe(`graphql query namespaces`, function () {
    it(`should return the namespaces`, async function () {
        const namespace: V1Namespace = { metadata: { name: 'name' } }

        nock(process.env.CLUSTER_API_URL)
            .get('/api/v1/namespaces')
            .reply(200, { items: [namespace] })

        const result = await request.post(`cluster-management/graphql`, {
            query: /* GraphQL */ `
                query {
                    namespaces {
                        metadata {
                            name
                        }
                    }
                }
            `,
        })

        expect(result.status).toEqual(200)
        expect(result.data).toMatchObject({
            data: { namespaces: [namespace] },
        })
    })
})
