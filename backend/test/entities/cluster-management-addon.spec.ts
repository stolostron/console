import { request, setup } from '../setup'
import * as nock from 'nock'
import { V1Namespace } from '@kubernetes/client-node'
import {
    ClusterManagementAddOn,
    clusterManagementAddOnService,
    ClusterManagementAddOnSpec,
} from '../../src/entities/cluster-management-addon'

setup()

describe(`graphql query clusterManagementAddOns`, function () {
    it(`should return the clusterManagementAddOns`, async function () {
        const clusterManagementAddOn: Partial<ClusterManagementAddOn> = {
            spec: {
                addOnConfiguration: { crName: 'crName', crdName: 'crdName' },
                addOnMeta: { decription: 'decription', displayName: 'displayName' },
            } as ClusterManagementAddOnSpec,
        }

        nock(process.env.CLUSTER_API_URL)
            .get(
                `/apis` +
                    `/${clusterManagementAddOnService.options.group}` +
                    `/${clusterManagementAddOnService.options.version}` +
                    `/${clusterManagementAddOnService.options.plural}`
            )
            .reply(200, { items: [clusterManagementAddOn] })

        const result = await request.post(`cluster-management/graphql`, {
            query: /* GraphQL */ `
                query {
                    clusterManagementAddOns {
                        spec {
                            addOnConfiguration {
                                crName
                                crdName
                            }
                            addOnMeta {
                                decription
                                displayName
                            }
                        }
                    }
                }
            `,
        })

        expect(result.status).toEqual(200)
        expect(result.data).toMatchObject({
            data: { clusterManagementAddOns: [clusterManagementAddOn] },
        })
    })
})
