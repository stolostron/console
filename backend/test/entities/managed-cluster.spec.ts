import { request, setup } from '../setup'
import * as nock from 'nock'
import { V1ObjectMeta } from '@kubernetes/client-node'

setup()

describe(`graphql query managedClusters`, function () {
    it(`should return the managedClusters`, async function () {
        const metadata: V1ObjectMeta = { name: 'name', namespace: 'namespace', labels: { abc: 'def' } }
        nock(process.env.CLUSTER_API_URL)
            .get('/apis/cluster.open-cluster-management.io/v1/managedclusters')
            .reply(200, {
                items: [
                    {
                        metadata,
                        status: { conditions: [{ type: 'ManagedClusterConditionAvailable', status: true }] },
                    },
                ],
            })
            .get('/apis/internal.open-cluster-management.io/v1beta1/namespaces/name/managedclusterinfos/name')
            .reply(200, { metadata })
        await expect(
            request.post(`graphql`, {
                query: /* GraphQL */ `
                    query {
                        managedClusters {
                            metadata {
                                name
                                namespace
                                labels
                            }
                            displayStatus
                            info {
                                metadata {
                                    name
                                }
                            }
                        }
                    }
                `,
            })
        ).resolves.toMatchObject({
            status: 200,
            data: {
                data: {
                    managedClusters: [
                        {
                            metadata: {
                                name: metadata.name,
                                namespace: metadata.namespace,
                                labels: Object.keys(metadata.labels).map((key) => `${key}=${metadata.labels[key]}`),
                            },
                            displayStatus: 'Pending',
                            info: { metadata: { name: metadata.name } },
                        },
                    ],
                },
            },
        })
    })
})
