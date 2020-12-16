import { request, setup } from './setup'

setup()

describe(`readinessProbe`, function () {
    it(`should return 200`, async function () {
        const result = await request.get(`/readinessProbe`)
        expect(result.status).toBe(200)
    })
})
