import { request, setup } from './setup'

setup()

describe(`ping`, function () {
    it(`should return 200`, async function () {
        const result = await request.get(`/ping`)
        expect(result.status).toBe(200)
    })
})
