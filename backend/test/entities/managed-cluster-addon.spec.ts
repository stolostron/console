import { request, setup } from '../setup'
import * as nock from 'nock'
import { V1ObjectMeta } from '@kubernetes/client-node'
import { managedClusterAddOnService } from '../../src/entities/managed-cluster-addon'


setup()

describe(`graphql query managedClusterAddOns`, function () {
    it(`should return the managedClusterAddOns`, async function () {
        const metadata: V1ObjectMeta = { name: 'name', namespace: 'namespace', labels: { abc: 'def' } }
        nock(process.env.CLUSTER_API_URL)
            .get(
                `/apis` +
                    `/${managedClusterAddOnService.options.group}` +
                    `/${managedClusterAddOnService.options.version}` +
                    `/${managedClusterAddOnService.options.plural}`
            )
            .reply(200, {
                items: [
                    {
                        metadata,
                        status: { conditions: [{ type: 'Available', status: true }] },
                    },
                ],
            })
            .get(
                `/apis` +
                    `/${managedClusterAddOnService.options.group}` +
                    `/${managedClusterAddOnService.options.version}` +
                    `/namespaces/${metadata.name}` +
                    `/${managedClusterAddOnService.options.plural}/${metadata.name}`
            )

            .reply(200, { metadata })

        const result = await request.post(`graphql`, {
            query: /* GraphQL */ `
                query {
                    managedClusterAddOns {
                        metadata {
                            name
                            namespace
                            labels
                        }
                        displayAddOnStatus
                    }
                }
            `,
        })

        expect(result.status).toEqual(200)
        expect(result.data).toMatchObject({
            data: {
                managedClusterAddOns: [
                    {
                        metadata: {
                            name: metadata.name,
                            namespace: metadata.namespace,
                            labels: Object.keys(metadata.labels).map((key) => `${key}=${metadata.labels[key]}`),
                        },
                        displayAddOnStatus: 'Available',
                        info: { metadata: { name: metadata.name } },
                    },
                ],
            },
        })
    })
})
