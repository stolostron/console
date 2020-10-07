/* eslint-disable @typescript-eslint/require-await */
import { setup, request } from '../setup'
import { ManagedCluster } from '../../backend/src/entities/managed-cluster'
import { ProviderConnection } from '../../backend/src/entities/provider-connection'

setup()

const managedClusterName = 'aws-e2e-test-cluster'
const providerConnectionName = 'aws-e2e-test-connection'

describe(`AWS Provider`, function () {
    it(`provider connection should not already exist`, async function () {
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
                (providerConnection) => providerConnection.metadata.name === providerConnectionName
            )
        ).toBeFalsy()
    })

    it(`provider connection should create`, async function () {
        expect(false).toBeTruthy()
    })

    it(`managed cluster should not already exist`, async function () {
        const result = await request.post<{ data: { managedClusters: ManagedCluster[] } }>(`graphql`, {
            query: /* GraphQL */ `
                query {
                    managedClusters {
                        metadata {
                            name
                        }
                    }
                }
            `,
        })
        expect(result.status).toEqual(200)
        const managedClusters = result.data.data.managedClusters
        expect(
            managedClusters.find((managedCluster) => managedCluster.metadata.name === managedClusterName)
        ).toBeFalsy()
    })

    it(`managed cluster should create`, async function () {
        expect(false).toBeTruthy()
    })

    it(`managed cluster should become ready`, async function () {
        expect(false).toBeTruthy()
    })

    it(`managed cluster addons should become ready`, async function () {
        expect(false).toBeTruthy()
    })

    it(`managed cluster should delete`, async function () {
        expect(false).toBeTruthy()
    })

    it(`provider connection should delete`, async function () {
        const result = await request.post(`graphql`, {
            query: /* GraphQL */ `
                mutation {
                    deleteProviderConnection(name: "my-aws-connection", namespace: "default")
                }
            `,
        })
        expect(result.status).toBe(200)
    })
})
