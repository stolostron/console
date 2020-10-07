/* eslint-disable @typescript-eslint/require-await */
import { setup, request } from '../setup'
import { ManagedCluster } from '../../backend/src/entities/managed-cluster'
import { ProviderConnection } from '../../backend/src/entities/provider-connection'

setup()

describe(`gcp provider`, function () {
    it(`provider connection should not exist before create`, async function () {
        const result = await request.post<{ data: { providerConnections: ProviderConnection[] } }>(`graphql`, {
            query: /* GraphQL */ `
                query {
                    providerConnections {
                        metadata {
                            name
                        }
                    }
                }
            `,
        })
        expect(result.status).toEqual(200)
        const providerConnections = result.data.data.providerConnections
        expect(
            providerConnections.find(
                (providerConnection) => providerConnection.metadata.name === 'gcp-e2e-test-connection'
            )
        ).toBeFalsy()
    })

    it(`provider connection should create`, async function () {
        const result = await request.post(`graphql`, {
            query: /* GraphQL */ `
                mutation {
                    createProviderConnection(
                        input: {
                            name: "gcp-e2e-test-connection"
                            namespace: "default"
                            providerID: "gcp"
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
    })

    it(`provider connection should exist after create`, async function () {
        const result = await request.post<{ data: { providerConnections: ProviderConnection[] } }>(`graphql`, {
            query: /* GraphQL */ `
                query {
                    providerConnections {
                        metadata {
                            name
                        }
                    }
                }
            `,
        })
        expect(result.status).toEqual(200)
        const providerConnections = result.data.data.providerConnections
        expect(
            providerConnections.find(
                (providerConnection) => providerConnection.metadata.name === 'gcp-e2e-test-connection'
            )
        ).toBeTruthy()
    })

    // it(`managed cluster should not already exist`, async function () {
    //     const result = await request.post<{ data: { managedClusters: ManagedCluster[] } }>(`graphql`, {
    //         query: /* GraphQL */ `
    //             query {
    //                 managedClusters {
    //                     metadata {
    //                         name
    //                     }
    //                 }
    //             }
    //         `,
    //     })
    //     expect(result.status).toEqual(200)
    //     const managedClusters = result.data.data.managedClusters
    //     expect(
    //         managedClusters.find((managedCluster) => managedCluster.metadata.name === 'gcp-e2e-test-cluster')
    //     ).toBeFalsy()
    // })

    // it(`managed cluster should create`, async function () {
    //     expect(false).toBeTruthy()
    // })

    // it(`managed cluster should become ready`, async function () {
    //     expect(false).toBeTruthy()
    // })

    // it(`managed cluster addons should become ready`, async function () {
    //     expect(false).toBeTruthy()
    // })

    // it(`managed cluster should delete`, async function () {
    //     expect(false).toBeTruthy()
    // })

    it(`provider connection should delete`, async function () {
        const result = await request.post(`graphql`, {
            query: /* GraphQL */ `
                mutation {
                    deleteProviderConnection(name: "gcp-e2e-test-connection", namespace: "default")
                }
            `,
        })
        expect(result.status).toBe(200)
    })

    it(`provider connection should not exist after delete`, async function () {
        const result = await request.post<{ data: { providerConnections: ProviderConnection[] } }>(`graphql`, {
            query: /* GraphQL */ `
                query {
                    providerConnections {
                        metadata {
                            name
                        }
                    }
                }
            `,
        })
        expect(result.status).toEqual(200)
        const providerConnections = result.data.data.providerConnections
        expect(
            providerConnections.find(
                (providerConnection) => providerConnection.metadata.name === 'gcp-e2e-test-connection'
            )
        ).toBeFalsy()
    })
})
