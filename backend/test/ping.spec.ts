import { request, setup } from './setup'

setup()

describe(`ping`, function () {
    it(`/readinessProbe should return 200`, async function () {
        const result = await request.get(`/readinessProbe`)
        expect(result.status).toBe(200)
    })

    it(`/livenessProbe should return 200`, async function () {
        const result = await request.get(`/livenessProbe`)
        expect(result.status).toBe(200)
    })
})
