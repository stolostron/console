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

        await expect(
            request.post(`graphql`, {
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
        ).resolves.toMatchObject({
            status: 200,
            data: { data: { namespaces: [{ metadata: { name: 'name' } }] } },
        })
    })
})
