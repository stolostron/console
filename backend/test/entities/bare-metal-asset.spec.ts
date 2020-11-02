import * as nock from 'nock'
import { BareMetalAsset, bareMetalAssetService } from '../../src/entities/bare-metal-asset'
import { request, setup } from '../setup'

setup()

describe(`graphql query bareMetalAssets`, function () {
    it(`should return the bareMetalAssets`, async function () {
        const bareMetalAsset: Partial<BareMetalAsset> = {
            spec: { bmc: { address: 'address', credentialsName: 'credentials' } },
        }
        nock(process.env.CLUSTER_API_URL)
            .get(
                `/apis` +
                    `/${bareMetalAssetService.options.group}` +
                    `/${bareMetalAssetService.options.version}` +
                    `/${bareMetalAssetService.options.plural}`
            )
            .reply(200, { items: [bareMetalAsset] })

        const result = await request.post(`cluster-management/graphql`, {
            query: /* GraphQL */ `
                query {
                    bareMetalAssets {
                        spec {
                            bmc {
                                address
                                credentialsName
                            }
                        }
                    }
                }
            `,
        })

        expect(result.status).toEqual(200)
        expect(result.data).toMatchObject({ data: { bareMetalAssets: [bareMetalAsset] } })
    })
})
