import { request, setup } from '../setup'
import * as nock from 'nock'
import { V1Secret } from '@kubernetes/client-node'

setup()

describe(`graphql query secrets`, function () {
    it(`should return the secrets`, async function () {
        const kubeSecrets: V1Secret[] = [{ metadata: { name: 'name', namespace: 'namespace' } }]
        nock(process.env.CLUSTER_API_URL).get('/api/v1/secrets').reply(200, {
            items: kubeSecrets,
        })
        const result = await request.post(`graphql`, {
            query: /* GraphQL */ `
                query {
                    secrets {
                        metadata {
                            name
                            namespace
                        }
                    }
                }
            `,
        })
        expect(result.status).toBe(200)
        expect(result.data).toMatchObject({ data: { secrets: kubeSecrets } })
    })
})

describe(`graphql mutation deleteSecret`, function () {
    it(`should delete the secret`, async function () {
        nock(process.env.CLUSTER_API_URL).delete('/api/v1/namespaces/namespace/secrets/name').reply(200)
        const result = await request.post(`graphql`, {
            query: /* GraphQL */ `
                mutation {
                    deleteSecret(name: "name", namespace: "namespace")
                }
            `,
        })
        expect(result.status).toBe(200)
    })
})
