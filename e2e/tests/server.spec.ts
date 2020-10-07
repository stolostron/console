import { setup, request } from '../setup'

setup()

describe(`AWS Provider`, function () {
    it(`should create the providerConnection`, async function () {
        /**/
    })

    it(`should create the cluster`, async function () {
        /**/
    })

    it(`should delete the cluster`, async function () {
        /**/
    })

    it(`should delete the providerConnection`, async function () {
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
