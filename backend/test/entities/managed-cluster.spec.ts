import { request, setup } from '../setup'
import * as nock from 'nock'
import { V1ObjectMeta } from '@kubernetes/client-node'
import { managedClusterService } from '../../src/entities/managed-cluster'
import { managedClusterInfoService } from '../../src/entities/managed-cluster-info'

setup()

describe(`graphql query managedClusters`, function () {
    it(`should return the managedClusters`, async function () {
        const metadata: V1ObjectMeta = { name: 'name', namespace: 'namespace', labels: { abc: 'def' } }
        nock(process.env.CLUSTER_API_URL)
            .get(
                `/apis` +
                    `/${managedClusterService.options.group}` +
                    `/${managedClusterService.options.version}` +
                    `/${managedClusterService.options.plural}`
            )
            .reply(200, {
                items: [
                    {
                        metadata,
                        status: { conditions: [{ type: 'ManagedClusterConditionAvailable', status: true }] },
                    },
                ],
            })
            .get(
                `/apis` +
                    `/${managedClusterInfoService.options.group}` +
                    `/${managedClusterInfoService.options.version}` +
                    `/namespaces/${metadata.name}` +
                    `/${managedClusterInfoService.options.plural}/${metadata.name}`
            )

            .reply(200, { metadata })

        const result = await request.post(`cluster-management/graphql`, {
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

        expect(result.status).toEqual(200)
        expect(result.data).toMatchObject({
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
        })
    })
})
