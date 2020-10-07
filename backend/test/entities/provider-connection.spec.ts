import { request, setup } from '../setup'
import * as nock from 'nock'
import { V1Secret } from '@kubernetes/client-node'

setup()

describe(`graphql query providerConnections`, function () {
    it(`should return the providerConnections`, async function () {
        const providerConnections: V1Secret[] = [{ metadata: { name: 'name', namespace: 'namespace' } }]
        // nock.recorder.rec()
        nock(process.env.CLUSTER_API_URL)
            .get('/api/v1/secrets')
            .query({ labelSelector: 'cluster.open-cluster-management.io/cloudconnection=' })
            .reply(200, {
                items: providerConnections,
            })
        const result = await request.post(`graphql`, {
            query: /* GraphQL */ `
                query {
                    providerConnections {
                        metadata {
                            name
                            namespace
                        }
                    }
                }
            `,
        })
        expect(result.status).toBe(200)
        expect(result.data).toMatchObject({ data: { providerConnections } })
    })
})

describe(`graphql mutation createProviderConnections`, function () {
    it(`should create the providerConnection`, async function () {
        nock(process.env.CLUSTER_API_URL)
            .post('/api/v1/namespaces/default/secrets', {
                apiVersion: 'v1',
                kind: 'Secret',
                metadata: {
                    labels: {
                        'cluster.open-cluster-management.io/cloudconnection': '',
                        'cluster.open-cluster-management.io/provider': 'aws',
                    },
                    name: 'andy',
                    namespace: 'default',
                },
                stringData: {
                    metadata:
                        'awsAccessKeyID: string\nawsSecretAccessKeyID: string\nbaseDomain: string\npullSecret: string\nsshPrivatekey: string\nsshPublickey: string\n',
                },
                type: 'Opaque',
            })
            .reply(200)
        const result = await request.post(`graphql`, {
            query: /* GraphQL */ `
                mutation {
                    createProviderConnection(
                        input: {
                            name: "andy"
                            namespace: "default"
                            providerID: "aws"
                            data: {
                                awsAccessKeyID: "string"
                                awsSecretAccessKeyID: "string"
                                baseDomain: "string"
                                pullSecret: "string"
                                sshPrivatekey: "string"
                                sshPublickey: "string"
                            }
                        }
                    )
                }
            `,
        })
        expect(result.status).toBe(200)
    })
})

describe(`graphql mutation deleteProviderConnection`, function () {
    it(`should delete the providerConnection`, async function () {
        nock(process.env.CLUSTER_API_URL).delete('/api/v1/namespaces/namespace/secrets/name').reply(200)
        const result = await request.post(`graphql`, {
            query: /* GraphQL */ `
                mutation {
                    deleteProviderConnection(name: "name", namespace: "namespace")
                }
            `,
        })
        expect(result.status).toBe(200)
    })
})
